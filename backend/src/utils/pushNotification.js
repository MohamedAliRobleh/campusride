/**
 * @fileoverview Service d'envoi de notifications push web (Web Push API) pour CampusRide.
 *
 * Utilise la bibliothèque `web-push` avec les clés VAPID configurées dans les variables
 * d'environnement. Les abonnements périmés (HTTP 410/404) sont automatiquement supprimés
 * de la base de données.
 *
 * @module utils/pushNotification
 */

import webpush from "web-push";
import { pool } from "../DB/db.js";

// Configuration des clés VAPID pour identifier le serveur d'envoi
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Envoie une notification push à tous les appareils enregistrés d'un utilisateur.
 *
 * Récupère les abonnements push de l'utilisateur en base de données et envoie
 * la notification à chacun en parallèle. Les abonnements expirés ou invalides
 * (statuts HTTP 410 ou 404) sont automatiquement supprimés.
 *
 * @async
 * @param {string} userId    - UUID de l'utilisateur destinataire.
 * @param {string} title     - Titre de la notification (affiché en gras).
 * @param {string} body      - Corps du message de la notification.
 * @param {string} [url="/"] - URL à ouvrir lors du clic sur la notification.
 * @returns {Promise<void>}
 *
 * @example
 * // Notifier un conducteur qu'une réservation a été faite
 * await sendPushToUser(conducteurId, "Nouvelle réservation", "Un passager a réservé votre trajet.", "/conducteur/reservations-recues");
 */
export async function sendPushToUser(userId, title, body, url = "/") {
  try {
    const { rows } = await pool.query(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE utilisateur_id = $1",
      [userId]
    );

    const payload = JSON.stringify({ title, body, url });

    await Promise.allSettled(
      rows.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
          .then(() => console.log(`[push] Envoyé à user ${userId}`))
          .catch(async (err) => {
            console.error(
              `[push] Erreur user ${userId} — status:${err.statusCode} body:${err.body} msg:${err.message}`
            );
            // Supprimer les abonnements périmés pour éviter les erreurs futures
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query(
                "DELETE FROM push_subscriptions WHERE endpoint = $1",
                [sub.endpoint]
              );
            }
          })
      )
    );
  } catch (err) {
    console.error("sendPushToUser error:", err.message);
  }
}
