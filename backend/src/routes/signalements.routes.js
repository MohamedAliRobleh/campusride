/**
 * @fileoverview Routes de gestion des signalements d'utilisateurs et de trajets.
 *
 * Préfixe : `/signalements`
 *
 * Les signalements permettent aux utilisateurs de signaler un comportement inapproprié.
 * Trois niveaux de gravité sont définis :
 * - Niveau 1 (mineur)   : stocké pour examen par l'admin.
 * - Niveau 2 (modéré)   : stocké et tous les admins sont notifiés.
 * - Niveau 3 (grave)    : suspension immédiate du compte cible + alerte courriel admin.
 *
 * - `POST /signalements` — Déposer un signalement (auth).
 *
 * @module routes/signalements.routes
 */

import { Router } from "express";
import { randomUUID } from "crypto";
import { pool } from "../DB/db.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { sendSignalementGraveEmail } from "../utils/mailer.js";

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

    // N3 — Grave : suspension préventive immédiate si c'est un utilisateur + email admin
    if (niveauVal === 3 && type === "UTILISATEUR") {
      await pool.query(
        `UPDATE utilisateurs SET actif = FALSE WHERE id = $1`,
        [cible_id]
      );
      // Récupérer les infos pour l'email
      try {
        const [signaleurRes, cibleRes] = await Promise.all([
          pool.query(`SELECT prenom, nom, email FROM utilisateurs WHERE id = $1`, [signaleur_id]),
          pool.query(`SELECT prenom, nom, email FROM utilisateurs WHERE id = $1`, [cible_id]),
        ]);
        const signaleur = signaleurRes.rows[0];
        const cible = cibleRes.rows[0];
        if (signaleur && cible) {
          sendSignalementGraveEmail({
            motif,
            cible_prenom: cible.prenom,
            cible_nom: cible.nom,
            cible_email: cible.email,
            signaleur_email: signaleur.email,
            description: description?.trim() || null,
          }).catch((err) => console.warn("Email N3 signalement:", err.message));
        }
      } catch (emailErr) {
        console.warn("Fetch info email N3:", emailErr.message);
      }
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
          `INSERT INTO notifications (utilisateur_id, type, message)
           VALUES ($1, 'SIGNALEMENT_RECU', $2)`,
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
