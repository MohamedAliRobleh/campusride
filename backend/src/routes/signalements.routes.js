import { Router } from "express";
import { randomUUID } from "crypto";
import { pool } from "../DB/db.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";

const router = Router();

// POST /signalements — signaler un utilisateur ou un trajet
router.post("/", requireAuth, async (req, res) => {
  const { type, cible_id, motif, niveau, description } = req.body;
  const signaleur_id = req.user.id;

  if (!type || !cible_id || !motif) {
    return res.status(400).json({ error: "type, cible_id et motif sont requis." });
  }
  if (!["UTILISATEUR", "TRAJET"].includes(type)) {
    return res.status(400).json({ error: "type doit être UTILISATEUR ou TRAJET." });
  }
  if (type === "UTILISATEUR" && cible_id === signaleur_id) {
    return res.status(400).json({ error: "Vous ne pouvez pas vous signaler vous-même." });
  }

  // Niveau de gravité (1=mineur, 2=modéré, 3=grave) — défaut 2
  const niveauVal = [1, 2, 3].includes(Number(niveau)) ? Number(niveau) : 2;

  try {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO signalements (id, signaleur_id, type, cible_id, motif, niveau, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, signaleur_id, type, cible_id, motif, niveauVal, description?.trim() || null]
    );

    // --- Actions automatiques selon le niveau ---

    // N3 — Grave : suspension préventive immédiate si c'est un utilisateur
    if (niveauVal === 3 && type === "UTILISATEUR") {
      await pool.query(
        `UPDATE utilisateurs SET actif = FALSE WHERE id = $1`,
        [cible_id]
      );
    }

    // Notifier tous les ADMINs d'un nouveau signalement
    try {
      const admins = await pool.query(
        `SELECT id FROM utilisateurs WHERE role = 'ADMIN' AND actif = TRUE`
      );
      const urgence = niveauVal === 3;
      const contenu = urgence
        ? `🚨 Signalement GRAVE reçu : "${motif}" — action immédiate requise.`
        : `Nouveau signalement reçu (N${niveauVal}) : "${motif}".`;

      for (const admin of admins.rows) {
        await pool.query(
          `INSERT INTO notifications (utilisateur_id, type, contenu, lu)
           VALUES ($1, 'MESSAGE_RECU', $2, FALSE)`,
          [admin.id, contenu]
        );
      }
    } catch (notifErr) {
      // Non-bloquant — la notification est un bonus
      console.warn("Notification admin signalement:", notifErr.message);
    }

    res.status(201).json({ message: "Signalement envoyé. Merci." });
  } catch (err) {
    console.error("POST /signalements:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
