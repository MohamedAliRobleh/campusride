/**
 * @fileoverview Routes de gestion des notifications in-app.
 *
 * Préfixe : `/notifications`
 *
 * Les notifications sont créées automatiquement par les autres routes lors d'événements
 * (nouvelle réservation, trajet démarré, message reçu, etc.).
 * Ce module expose uniquement la lecture et le marquage comme lu.
 *
 * - `GET   /notifications`          — Lister les 50 dernières notifications (auth).
 * - `PATCH /notifications/read-all` — Marquer toutes les notifications comme lues (auth).
 * - `PATCH /notifications/:id/read` — Marquer une notification spécifique comme lue (auth).
 *
 * @module routes/notifications.routes
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { pool } from "../DB/db.js";

const router = Router();



router.get("/", requireAuth, async (req, res) => {
  try {

    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT id, type, message, cree_le, lu_le
      FROM notifications
      WHERE utilisateur_id = $1
      ORDER BY cree_le DESC
      LIMIT 50;
      `,
      [userId]
    );

    return res.json({ notifications: rows });

  } catch (err) {
    console.error("Erreur GET notifications:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});



router.patch("/read-all", requireAuth, async (req, res) => {
  try {

    const userId = req.user.id;

    await pool.query(
      `
      UPDATE notifications
      SET lu_le = NOW()
      WHERE utilisateur_id = $1
      AND lu_le IS NULL;
      `,
      [userId]
    );

    return res.json({ success: true });

  } catch (err) {
    console.error("Erreur read-all:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});


router.patch("/:id/read", requireAuth, async (req, res) => {
  try {

    const userId = req.user.id;
    const notifId = req.params.id;

    const { rowCount } = await pool.query(
      `
      UPDATE notifications
      SET lu_le = NOW()
      WHERE id = $1
      AND utilisateur_id = $2
      AND lu_le IS NULL;
      `,
      [notifId, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Notification introuvable." });
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("Erreur read single:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;