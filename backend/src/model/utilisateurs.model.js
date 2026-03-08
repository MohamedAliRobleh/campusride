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
      p.zones_depart_preferees,
      p.photo_url,
      p.bio
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


export async function updateUserPhoto(userId, photoUrl) {
  const { rows } = await pool.query(
    `INSERT INTO profils (utilisateur_id, photo_url, maj_le)
     VALUES ($1, $2, NOW())
     ON CONFLICT (utilisateur_id)
     DO UPDATE SET photo_url = EXCLUDED.photo_url, maj_le = NOW()
     RETURNING photo_url;`,
    [userId, photoUrl]
  );
  return rows[0];
}

export async function updateUserProfile(userId, telephone, zones, bio) {

  const { rows } = await pool.query(
    `
    INSERT INTO profils (utilisateur_id, telephone, zones_depart_preferees, bio, maj_le)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (utilisateur_id)
    DO UPDATE SET
      telephone = EXCLUDED.telephone,
      zones_depart_preferees = EXCLUDED.zones_depart_preferees,
      bio = EXCLUDED.bio,
      maj_le = NOW()
    RETURNING *;
    `,
    [userId, telephone, zones, bio ?? null]
  );

  return rows[0];
}