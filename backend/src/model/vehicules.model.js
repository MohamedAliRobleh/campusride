import { pool } from "../DB/db.js";

export async function ajouterVehiculeEtMajConducteur({
  userId, marque, modele, annee, plaque, couleur, nb_places
}) {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Insérer véhicule
    const insertVehiculeQuery = `
      INSERT INTO vehicules (
        utilisateur_id,
        marque,
        modele,
        annee,
        plaque,
        couleur,
        nb_places,
        maj_le
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;

    const vehiculeRes = await client.query(insertVehiculeQuery, [
      userId,
      marque,
      modele,
      annee,
      plaque,
      couleur,
      nb_places
    ]);

    // Mettre à jour rôle
    const updateRoleQuery = `
      UPDATE utilisateurs
      SET role = 'CONDUCTEUR'
      WHERE id = $1
      RETURNING id, role;
    `;

    const userRes = await client.query(updateRoleQuery, [userId]);

    await client.query("COMMIT");

    return {
      vehicule: vehiculeRes.rows[0],
      user: userRes.rows[0]
    };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();
  }
}

export async function hasVehicule(userId) {

  const { rows } = await pool.query(
    "SELECT 1 FROM vehicules WHERE utilisateur_id = $1",
    [userId]
  );

  return rows.length > 0;
}

export async function getVehiculeByUserId(userId) {

  const { rows } = await pool.query(
    `
    SELECT
      id,
      utilisateur_id,
      marque,
      modele,
      annee,
      couleur,
      plaque,
      nb_places,
      photo_url,
      maj_le
    FROM vehicules
    WHERE utilisateur_id = $1
    `,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

export async function updateVehiculeByUserId(userId, data) {

  const {
    marque,
    modele,
    annee,
    plaque,
    couleur,
    nb_places
  } = data;

  const { rows } = await pool.query(
    `
    UPDATE vehicules
    SET
      marque = $1,
      modele = $2,
      annee = $3,
      plaque = $4,
      couleur = $5,
      nb_places = $6,
      maj_le = NOW()
    WHERE utilisateur_id = $7
    RETURNING *;
    `,
    [
      marque,
      modele,
      annee,
      plaque,
      couleur,
      nb_places,
      userId
    ]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

export async function updateVehiculePhoto(userId, photoUrl) {
  const { rows } = await pool.query(
    `UPDATE vehicules SET photo_url = $1, maj_le = NOW()
     WHERE utilisateur_id = $2 RETURNING photo_url;`,
    [photoUrl, userId]
  );
  return rows[0] ?? null;
}

export async function supprimerVehiculeEtRevertRole(userId) {

  // On ouvre une connexion dédiée
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Annuler les trajets PLANIFIE du conducteur et restaurer les places des passagers EN_ATTENTE/ACCEPTEE
    // 1. Remettre places_dispo pour chaque réservation active
    await client.query(
      `UPDATE trajets
       SET places_dispo = places_dispo + (
         SELECT COUNT(*) FROM reservations
         WHERE trajet_id = trajets.id AND statut IN ('EN_ATTENTE', 'ACCEPTEE')
       )
       WHERE conducteur_id = $1 AND statut = 'PLANIFIE'`,
      [userId]
    );

    // 2. Annuler les réservations EN_ATTENTE et ACCEPTEE liées à ces trajets
    await client.query(
      `UPDATE reservations SET statut = 'ANNULEE', reponse_le = NOW()
       WHERE trajet_id IN (
         SELECT id FROM trajets WHERE conducteur_id = $1 AND statut = 'PLANIFIE'
       ) AND statut IN ('EN_ATTENTE', 'ACCEPTEE')`,
      [userId]
    );

    // 3. Notifier les passagers affectés
    await client.query(
      `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
       SELECT r.passager_id, 'RESERVATION_ANNULEE',
              'Le conducteur a supprimé son véhicule. Votre réservation pour le trajet '
              || t.lieu_depart || ' → ' || t.destination || ' a été annulée.',
              NOW()
       FROM reservations r
       JOIN trajets t ON t.id = r.trajet_id
       WHERE t.conducteur_id = $1 AND t.statut = 'PLANIFIE' AND r.statut = 'ANNULEE'
         AND r.reponse_le >= NOW() - INTERVAL '5 seconds'`,
      [userId]
    );

    // 4. Annuler les trajets PLANIFIE eux-mêmes
    await client.query(
      `UPDATE trajets SET statut = 'ANNULE', maj_le = NOW()
       WHERE conducteur_id = $1 AND statut = 'PLANIFIE'`,
      [userId]
    );

    // Supprimer le véhicule
    await client.query(
      `DELETE FROM vehicules WHERE utilisateur_id = $1`,
      [userId]
    );

    // Remettre le rôle PASSAGER
    await client.query(
      `UPDATE utilisateurs SET role = 'PASSAGER' WHERE id = $1`,
      [userId]
    );

    await client.query("COMMIT");

    return { success: true };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
}