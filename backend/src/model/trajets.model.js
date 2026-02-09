import { pool } from "../DB/db.js";

//fonction pour creer un trajet
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
    date && date.trim() ? date.trim() : null, // "YYYY-MM-DD"
    userId
  ];

  const { rows } = await pool.query(q, values);
  return rows;
}
