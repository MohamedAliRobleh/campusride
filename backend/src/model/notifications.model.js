/**
 * @fileoverview Couche d'accès aux données pour les notifications in-app.
 *
 * Gère la lecture et l'insertion de notifications dans la table `notifications`.
 * Les notifications peuvent être de 12 types différents (RAPPEL_TRAJET, MESSAGE_RECU, etc.)
 * et sont marquées comme lues via la colonne `lu_le`.
 *
 * @module model/notifications.model
 */

import { pool } from "../DB/db.js";

/**
 * Récupère les 100 dernières notifications d'un utilisateur, triées par date décroissante.
 *
 * @async
 * @param {string} userId - UUID de l'utilisateur.
 * @returns {Promise<Array<{id: string, type: string, message: string, cree_le: Date, lu_le: Date|null}>>}
 *   Tableau de notifications. `lu_le` est null si la notification n'a pas encore été lue.
 *
 * @example
 * const notifications = await listNotificationsByUser("uuid-123");
 * const nonLues = notifications.filter(n => n.lu_le === null);
 */
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

/**
 * Insère une notification de type RESERVATION_ANNULEE pour le conducteur d'un trajet.
 *
 * Cette fonction utilise un client de transaction fourni par l'appelant pour garantir
 * que la notification est insérée dans le même contexte transactionnel que l'annulation.
 *
 * @async
 * @param {Object}    params              - Paramètres de la notification.
 * @param {import("pg").PoolClient} params.client      - Client PostgreSQL en transaction.
 * @param {string}    params.conducteurId - UUID du conducteur à notifier.
 * @param {Object}    params.trajet       - Objet trajet contenant lieu_depart et destination.
 * @param {string}    params.trajet.lieu_depart  - Lieu de départ du trajet.
 * @param {string}    params.trajet.destination  - Destination du trajet.
 * @returns {Promise<void>}
 *
 * @example
 * await notifierConducteurReservationAnnulee({
 *   client,
 *   conducteurId: "uuid-conducteur",
 *   trajet: { lieu_depart: "Orléans", destination: "La Cité" }
 * });
 */
export async function notifierConducteurReservationAnnulee({ client, conducteurId, trajet }) {
  await client.query(
    `
    INSERT INTO notifications (utilisateur_id, type, message, cree_le)
    VALUES ($1, 'RESERVATION_ANNULEE', $2, NOW());
    `,
    [
      conducteurId,
      `Un passager a annulé sa réservation pour ${trajet.lieu_depart} → ${trajet.destination}.`,
    ]
  );
}
