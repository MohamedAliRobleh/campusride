import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { pool } from "../DB/db.js";

const router = Router();

// =====================
// POST / — Soumettre une évaluation
// Le passager évalue le conducteur après un trajet TERMINE
// =====================
router.post("/", requireAuth, async (req, res) => {
  try {
    const evaluateurId = req.user.id;
    const { trajet_id, note, commentaire } = req.body;

    if (!trajet_id || !note) {
      return res.status(400).json({ message: "trajet_id et note sont requis." });
    }
    const noteNum = Number(note);
    if (!Number.isInteger(noteNum) || noteNum < 1 || noteNum > 5) {
      return res.status(400).json({ message: "La note doit être entre 1 et 5." });
    }

    // Vérifier que la réservation est terminée et appartient à l'évaluateur
    const resaRes = await pool.query(
      `SELECT r.id, t.conducteur_id
       FROM reservations r
       JOIN trajets t ON t.id = r.trajet_id
       WHERE r.trajet_id = $1
         AND r.passager_id = $2
         AND r.statut IN ('ACCEPTEE','TERMINEE')
         AND t.statut = 'TERMINE'`,
      [trajet_id, evaluateurId]
    );

    if (resaRes.rows.length === 0) {
      return res.status(403).json({ message: "Vous ne pouvez pas évaluer ce trajet." });
    }

    const evalueId = resaRes.rows[0].conducteur_id;

    // Insérer (ignorer si déjà évalué)
    const { rows } = await pool.query(
      `INSERT INTO evaluations (evaluateur_id, evalue_id, trajet_id, note, commentaire)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (evaluateur_id, trajet_id) DO NOTHING
       RETURNING *;`,
      [evaluateurId, evalueId, trajet_id, noteNum, commentaire || null]
    );

    if (rows.length === 0) {
      return res.status(409).json({ message: "Vous avez déjà évalué ce trajet." });
    }

    // Notif au conducteur
    await pool.query(
      `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
       VALUES ($1, 'TRAJET_TERMINE', $2, NOW())`,
      [evalueId, `Vous avez reçu une évaluation de ${noteNum}/5 étoiles.`]
    );

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
// GET /trajet/:id/moi — L'utilisateur a-t-il déjà évalué ce trajet ?
// =====================
router.get("/trajet/:id/moi", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id FROM evaluations WHERE evaluateur_id = $1 AND trajet_id = $2`,
      [req.user.id, req.params.id]
    );
    return res.json({ deja_evalue: rows.length > 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
