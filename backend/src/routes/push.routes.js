import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { pool } from "../DB/db.js";

const router = Router();

// GET /push/vapid-public-key — clé publique pour le frontend
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /push/subscribe — enregistrer un appareil
router.post("/subscribe", requireAuth, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ message: "Subscription invalide." });
  }
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (utilisateur_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET utilisateur_id = $1, p256dh = $3, auth = $4`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("push subscribe error:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// DELETE /push/subscribe — désabonner un appareil
router.delete("/subscribe", requireAuth, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ message: "Endpoint manquant." });
  try {
    await pool.query(
      "DELETE FROM push_subscriptions WHERE endpoint = $1 AND utilisateur_id = $2",
      [endpoint, req.user.id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("push unsubscribe error:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
