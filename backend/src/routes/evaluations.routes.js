import { Router } from "express";
import { randomUUID } from "crypto";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { pool } from "../DB/db.js";

const router = Router();

// =====================
// POST / — Soumettre une évaluation (passager → conducteur OU conducteur → passager)
// =====================
router.post("/", requireAuth, async (req, res) => {
  try {
    const evaluateurId = req.user.id;
    const { trajet_id, note, commentaire, passager_id } = req.body;

    if (!trajet_id || !note) {
      return res.status(400).json({ message: "trajet_id et note sont requis." });
    }
    const noteNum = Number(note);
    if (!Number.isInteger(noteNum) || noteNum < 1 || noteNum > 5) {
      return res.status(400).json({ message: "La note doit être entre 1 et 5." });
    }

    let evalueId;

    if (passager_id) {
      // === CAS : Conducteur évalue un passager ===
      const check = await pool.query(
        `SELECT r.id FROM reservations r
         JOIN trajets t ON t.id = r.trajet_id
         WHERE r.trajet_id = $1
           AND t.conducteur_id = $2
           AND r.passager_id = $3
           AND r.statut = 'ACCEPTEE'
           AND t.statut = 'TERMINE'`,
        [trajet_id, evaluateurId, passager_id]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: "Vous ne pouvez pas évaluer ce passager." });
      }
      evalueId = passager_id;
    } else {
      // === CAS : Passager évalue le conducteur ===
      const check = await pool.query(
        `SELECT r.id, t.conducteur_id
         FROM reservations r
         JOIN trajets t ON t.id = r.trajet_id
         WHERE r.trajet_id = $1
           AND r.passager_id = $2
           AND r.statut = 'ACCEPTEE'
           AND t.statut = 'TERMINE'`,
        [trajet_id, evaluateurId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: "Vous ne pouvez pas évaluer ce trajet." });
      }
      evalueId = check.rows[0].conducteur_id;
    }

    // Vérifier si déjà évalué
    const existing = await pool.query(
      `SELECT id FROM evaluations WHERE evaluateur_id = $1 AND evalue_id = $2 AND trajet_id = $3`,
      [evaluateurId, evalueId, trajet_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Vous avez déjà évalué cette personne pour ce trajet." });
    }

    const { rows } = await pool.query(
      `INSERT INTO evaluations (id, evaluateur_id, evalue_id, trajet_id, note, commentaire)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [randomUUID(), evaluateurId, evalueId, trajet_id, noteNum, commentaire || null]
    );

    // Notification non-critique (ne bloque pas si le type enum est manquant)
    try {
      await pool.query(
        `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
         VALUES ($1, 'TRAJET_TERMINE', $2, NOW())`,
        [evalueId, `Vous avez reçu une évaluation de ${noteNum}/5 étoiles.`]
      );
    } catch (notifErr) {
      console.warn("[eval] notification échouée (non-critique):", notifErr.message);
    }

    return res.status(201).json({ evaluation: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /conducteur/:id — Évaluations d'un conducteur
// =====================
router.get("/conducteur/:id", async (req, res) => {
  try {
    const evalueId = req.params.id;
    const { rows } = await pool.query(
      `SELECT e.id, e.note, e.commentaire, e.cree_le,
              u.prenom AS evaluateur_prenom, u.nom AS evaluateur_nom,
              p.photo_url AS evaluateur_photo_url
       FROM evaluations e
       JOIN utilisateurs u ON u.id = e.evaluateur_id
       LEFT JOIN profils p ON p.utilisateur_id = e.evaluateur_id
       WHERE e.evalue_id = $1
       ORDER BY e.cree_le DESC
       LIMIT 50`,
      [evalueId]
    );
    const avgRes = await pool.query(
      `SELECT ROUND(AVG(note)::numeric, 1) AS moyenne, COUNT(*) AS total
       FROM evaluations WHERE evalue_id = $1`,
      [evalueId]
    );
    return res.json({ evaluations: rows, stats: avgRes.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /passager/:id — Évaluations reçues par un passager
// =====================
router.get("/passager/:id", async (req, res) => {
  try {
    const evalueId = req.params.id;
    const { rows } = await pool.query(
      `SELECT e.id, e.note, e.commentaire, e.cree_le,
              u.prenom AS evaluateur_prenom, u.nom AS evaluateur_nom,
              p.photo_url AS evaluateur_photo_url
       FROM evaluations e
       JOIN utilisateurs u ON u.id = e.evaluateur_id
       LEFT JOIN profils p ON p.utilisateur_id = e.evaluateur_id
       WHERE e.evalue_id = $1
       ORDER BY e.cree_le DESC
       LIMIT 50`,
      [evalueId]
    );
    const avgRes = await pool.query(
      `SELECT ROUND(AVG(note)::numeric, 1) AS moyenne, COUNT(*) AS total
       FROM evaluations WHERE evalue_id = $1`,
      [evalueId]
    );
    return res.json({ evaluations: rows, stats: avgRes.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /trajet/:id/moi — L'utilisateur a-t-il déjà évalué ce trajet ?
// =====================
router.get("/trajet/:id/moi", requireAuth, async (req, res) => {
  try {
    const { evalue_id } = req.query;
    let query, params;
    if (evalue_id) {
      query = `SELECT id FROM evaluations WHERE evaluateur_id = $1 AND trajet_id = $2 AND evalue_id = $3`;
      params = [req.user.id, req.params.id, evalue_id];
    } else {
      query = `SELECT id FROM evaluations WHERE evaluateur_id = $1 AND trajet_id = $2`;
      params = [req.user.id, req.params.id];
    }
    const { rows } = await pool.query(query, params);
    return res.json({ deja_evalue: rows.length > 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
