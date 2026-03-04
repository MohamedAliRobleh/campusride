import { pool } from "../DB/db.js";

export async function insertTrajet({
  conducteurId,
  lieuDepart,
  destination,
  dateHeureDepart,
  placesTotal
}) {
  const query = `
    INSERT INTO trajets (
      conducteur_id,
      lieu_depart,
      destination,
      dateheure_depart,
      places_total,
      places_dispo,
      statut,
      cree_le,
      maj_le
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $5,
      'PLANIFIE',
      NOW(),
      NOW()
    )
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    conducteurId,
    lieuDepart,
    destination,
    dateHeureDepart,
    placesTotal
  ]);

  return rows[0];
}


export async function searchTrajets({ depart, destination, date, userId }) {

  
  await pool.query(`
    UPDATE trajets
    SET statut = 'EN_COURS'
    WHERE statut = 'PLANIFIE'
    AND dateheure_depart <= NOW()
  `);

  const q = `
    SELECT
      id,
      conducteur_id,
      lieu_depart,
      destination,
      dateheure_depart,
      places_total,
      places_dispo,
      statut,
      cree_le,
      maj_le
    FROM trajets
    WHERE statut = 'PLANIFIE'
      AND places_dispo > 0
      AND dateheure_depart > NOW()
      AND conducteur_id <> $4
      AND ($1::text IS NULL OR lieu_depart ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR destination ILIKE '%' || $2 || '%')
      AND ($3::date IS NULL OR dateheure_depart::date = $3::date)
    ORDER BY dateheure_depart ASC
    LIMIT 100;
  `;

  const values = [
    depart && depart.trim() ? depart.trim() : null,
    destination && destination.trim() ? destination.trim() : null,
    date && date.trim() ? date.trim() : null,
    userId
  ];

  const { rows } = await pool.query(q, values);

  return rows;
}



/**
 * Termine un trajet (seulement conducteur) + notifie les passagers acceptés
 * Retourne le trajet terminé ou null si pas autorisé / pas trouvable
 */
export async function terminerTrajetEtNotifier({ client, trajetId, conducteurId }) {
  // 1) terminer + récupérer infos utiles
  const res = await client.query(
    `
    UPDATE trajets
    SET statut = 'TERMINE',
        maj_le = NOW()
    WHERE id = $1
      AND conducteur_id = $2
      AND statut IN ('PLANIFIE','EN_COURS')
    RETURNING id, lieu_depart, destination, conducteur_id, dateheure_depart, statut;
    `,
    [trajetId, conducteurId]
  );

  if (res.rows.length === 0) return null;

  const trajet = res.rows[0];

  // 2) notifier en 1 requête (pas de boucle)
  await client.query(
    `
    INSERT INTO notifications (utilisateur_id, type, message, cree_le)
    SELECT
      r.passager_id,
      'TRAJET_TERMINE',
      $2,
      NOW()
    FROM reservations r
    WHERE r.trajet_id = $1
      AND r.statut = 'ACCEPTEE';
    `,
    [trajetId, `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} a été terminé par le conducteur.`]
  );

  return trajet;
}

export async function getMesTrajetsAvecPlacesReservees(conducteurId) {
  const { rows } = await pool.query(
    `
    SELECT
      t.*,
      COUNT(r.id) FILTER (WHERE r.statut = 'ACCEPTEE') AS places_reservees
    FROM trajets t
    LEFT JOIN reservations r ON r.trajet_id = t.id
    WHERE t.conducteur_id = $1
    GROUP BY t.id
    ORDER BY t.dateheure_depart DESC;
    `,
    [conducteurId]
  );
  return rows;
}

export async function getTrajetsPopulaires() {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM trajets
    WHERE statut IN ('PLANIFIE','EN_COURS')
      AND dateheure_depart >= NOW()
    ORDER BY dateheure_depart ASC
    LIMIT 5;
    `
  );
  return rows;
}

/**
 * Lock + lecture trajet (utile pour annulation/modif)
 */
export async function getTrajetByIdForUpdate({ client, trajetId }) {
  const res = await client.query(
    `
    SELECT *
    FROM trajets
    WHERE id = $1
    FOR UPDATE;
    `,
    [trajetId]
  );
  return res.rows[0] || null;
}

/**
 * Annule un trajet par le conducteur (PLANIFIE/EN_COURS)
 * + annule réservations actives et notifie les passagers concernés (1 requête)
 */
export async function annulerTrajetConducteurEtNotifier({ client, trajetId }) {
  const upd = await client.query(
    `
    UPDATE trajets
    SET statut = 'ANNULE',
        maj_le = NOW()
    WHERE id = $1
      AND statut IN ('PLANIFIE','EN_COURS')
    RETURNING id, lieu_depart, destination, conducteur_id;
    `,
    [trajetId]
  );

  if (upd.rows.length === 0) return null;

  const trajet = upd.rows[0];

  // Annuler réservations actives + récupérer passagers touchés
  const annuleResa = await client.query(
    `
    UPDATE reservations
    SET statut = 'ANNULEE',
        reponse_le = NOW()
    WHERE trajet_id = $1
      AND statut IN ('ACCEPTEE','EN_ATTENTE')
    RETURNING passager_id;
    `,
    [trajetId]
  );

  // Notif batch (évite boucle)
  await client.query(
    `
    INSERT INTO notifications (utilisateur_id, type, message, cree_le)
    SELECT
      x.passager_id,
      'TRAJET_ANNULE',
      $2,
      NOW()
    FROM (
      SELECT DISTINCT passager_id
      FROM reservations
      WHERE trajet_id = $1
        AND statut = 'ANNULEE'
    ) x;
    `,
    [trajetId, `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} a été annulé par le conducteur.`]
  );

  return {
    trajet,
    reservations_annulees: annuleResa.rowCount
  };
}

/**
 * Modifier trajet et notfier passages accepetes (seulement conducteur + statut PLANIFIE)
 */
export async function modifierTrajetEtNotifier({ client, trajetId, conducteurId, lieuDepart, dest, dateIso }) {
  // ancien trajet
  const oldRes = await client.query(
    `
    SELECT lieu_depart, destination, dateheure_depart
    FROM trajets
    WHERE id = $1
      AND conducteur_id = $2
      AND statut = 'PLANIFIE';
    `,
    [trajetId, conducteurId]
  );
  if (oldRes.rows.length === 0) return null;

  const oldTrajet = oldRes.rows[0];

  // update
  const updateRes = await client.query(
    `
    UPDATE trajets
    SET lieu_depart = $1,
        destination = $2,
        dateheure_depart = $3,
        maj_le = NOW()
    WHERE id = $4
      AND conducteur_id = $5
      AND statut = 'PLANIFIE'
    RETURNING *;
    `,
    [lieuDepart, dest, dateIso, trajetId, conducteurId]
  );

  const trajet = updateRes.rows[0];

  const msg =
    `Le trajet ${oldTrajet.lieu_depart} → ${oldTrajet.destination} a été modifié ` +
    `(nouveau: ${trajet.lieu_depart} → ${trajet.destination}, départ: ${new Date(trajet.dateheure_depart).toLocaleString()}).`;

  // notif batch
  await client.query(
    `
    INSERT INTO notifications (utilisateur_id, type, message, cree_le)
    SELECT
      r.passager_id,
      'TRAJET_MODIFIE',
      $2,
      NOW()
    FROM reservations r
    WHERE r.trajet_id = $1
      AND r.statut = 'ACCEPTEE';
    `,
    [trajetId, msg]
  );

  return trajet;
}
