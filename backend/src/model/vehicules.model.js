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

export async function supprimerVehiculeEtRevertRole(userId) {

  // On ouvre une connexion dédiée
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Supprimer le véhicule
    await client.query(
      `
      DELETE FROM vehicules
      WHERE utilisateur_id = $1
      `,
      [userId]
    );

    // Remettre le rôle PASSAGER
    await client.query(
      `
      UPDATE utilisateurs
      SET role = 'PASSAGER'
      WHERE id = $1
      `,
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