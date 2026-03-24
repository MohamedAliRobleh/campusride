import { pool } from "../DB/db.js";

// Récupère les notifications d’un utilisateur triées par date décroissante
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

// Envoie une notification au conducteur lorsqu’une réservation est annulée
export async function notifierConducteurReservationAnnulee({ client, conducteurId, trajet }) {
  await client.query(
    `
    INSERT INTO notifications (utilisateur_id, type, message, cree_le)
    VALUES ($1, 'RESERVATION_ANNULEE', $2, NOW());
    `,
    [conducteurId, `Un passager a annulé sa réservation pour ${trajet.lieu_depart} → ${trajet.destination}.`]
  );
}