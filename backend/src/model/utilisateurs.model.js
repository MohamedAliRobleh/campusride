import { pool } from "../DB/db.js";


export async function getUserRole(userId) {
  const { rows } = await pool.query(
    "SELECT role FROM utilisateurs WHERE id = $1 AND actif = TRUE",
    [userId] // 
  );

  return rows[0]?.role ?? null;
}



export async function getUserById(userId) {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.prenom,
      u.nom,
      u.email,
      u.role,
      u.actif,
      u.cree_le,
      p.telephone,
      p.zones_depart_preferees
    FROM utilisateurs u
    LEFT JOIN profils p
      ON p.utilisateur_id = u.id
    WHERE u.id = $1
    AND u.actif = TRUE
    `,
    [userId] 
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}


export async function updateUserProfile(userId, telephone, zones) {


  const { rows } = await pool.query(
    `
    INSERT INTO profils (utilisateur_id, telephone, zones_depart_preferees, maj_le)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (utilisateur_id)
    DO UPDATE SET
      telephone = EXCLUDED.telephone,
      zones_depart_preferees = EXCLUDED.zones_depart_preferees,
      maj_le = NOW()
    RETURNING *;
    `,
    [userId, telephone, zones]
  );

  return rows[0];
}