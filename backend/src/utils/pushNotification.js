import webpush from "web-push";
import { pool } from "../DB/db.js";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Envoie une push notification à tous les appareils d'un utilisateur.
 * @param {number} userId
 * @param {string} title
 * @param {string} body
 * @param {string} url  — page à ouvrir au clic
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
          .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
          .then(() => console.log(`[push] Envoyé à user ${userId}`))
          .catch(async (err) => {
            console.error(`[push] Erreur user ${userId} — status:${err.statusCode} body:${err.body} msg:${err.message}`);
            if (err.statusCode === 410 || err.statusCode === 404) {
              await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [sub.endpoint]);
            }
          })
      )
    );
  } catch (err) {
    console.error("sendPushToUser error:", err.message);
  }
}
