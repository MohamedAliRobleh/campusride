import { Router } from "express";
import { randomUUID } from "crypto";
import pool from "../DB/db.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// POST /signalements — signaler un utilisateur ou un trajet
router.post("/", requireAuth, async (req, res) => {
  const { type, cible_id, motif, description } = req.body;
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

  try {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO signalements (id, signaleur_id, type, cible_id, motif, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, signaleur_id, type, cible_id, motif, description?.trim() || null]
    );
    res.status(201).json({ message: "Signalement envoyé. Merci." });
  } catch (err) {
    console.error("POST /signalements:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
