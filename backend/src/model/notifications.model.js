import { pool } from "../DB/db.js";

export async function listNotificationsByUser(userId) {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      type,
      message,
      cree_le,
      lu_le
    FROM notifications
    WHERE utilisateur_id = $1
    ORDER BY cree_le DESC
    LIMIT 100;
    `,
    [userId]
  );

  return rows;
}