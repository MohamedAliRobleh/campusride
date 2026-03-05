import express from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.middlewares.js";
import { pool } from "../DB/db.js";

const router = express.Router();

// =====================
// GET /admin/stats — Statistiques globales
// =====================
router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM utilisateurs WHERE actif = TRUE) AS total_utilisateurs,
        (SELECT COUNT(*) FROM utilisateurs WHERE role = 'CONDUCTEUR' AND actif = TRUE) AS total_conducteurs,
        (SELECT COUNT(*) FROM utilisateurs WHERE role = 'PASSAGER' AND actif = TRUE) AS total_passagers,
        (SELECT COUNT(*) FROM utilisateurs WHERE role = 'ADMIN') AS total_admins,
        (SELECT COUNT(*) FROM trajets) AS total_trajets,
        (SELECT COUNT(*) FROM trajets WHERE statut = 'PLANIFIE') AS trajets_planifies,
        (SELECT COUNT(*) FROM trajets WHERE statut = 'EN_COURS') AS trajets_en_cours,
        (SELECT COUNT(*) FROM trajets WHERE statut = 'TERMINE') AS trajets_termines,
        (SELECT COUNT(*) FROM trajets WHERE statut = 'ANNULE') AS trajets_annules,
        (SELECT COUNT(*) FROM reservations) AS total_reservations,
        (SELECT COUNT(*) FROM reservations WHERE statut = 'ACCEPTEE') AS reservations_acceptees,
        (SELECT COUNT(*) FROM evaluations) AS total_evaluations,
        (SELECT ROUND(AVG(note)::numeric,1) FROM evaluations) AS note_moyenne_globale
    `);
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /admin/users — Liste des utilisateurs
// =====================
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const search = req.query.search ? String(req.query.search) : null;
    const { rows } = await pool.query(
      `SELECT u.id, u.prenom, u.nom, u.email, u.role, u.actif, u.cree_le,
              p.photo_url,
              (SELECT COUNT(*) FROM trajets WHERE conducteur_id = u.id) AS nb_trajets,
              (SELECT COUNT(*) FROM reservations WHERE passager_id = u.id) AS nb_reservations,
              (SELECT ROUND(AVG(note)::numeric,1) FROM evaluations WHERE evalue_id = u.id) AS note_moyenne
       FROM utilisateurs u
       LEFT JOIN profils p ON p.utilisateur_id = u.id
       ${search ? "WHERE u.prenom ILIKE '%' || $1 || '%' OR u.nom ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%'" : ""}
       ORDER BY u.cree_le DESC
       LIMIT 200`,
      search ? [search] : []
    );
    return res.json({ users: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// PATCH /admin/users/:id/toggle-actif — Activer/Désactiver un compte
// =====================
router.patch("/users/:id/toggle-actif", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { rows } = await pool.query(
      `UPDATE utilisateurs SET actif = NOT actif WHERE id = $1 RETURNING id, actif, role`,
      [userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Utilisateur introuvable." });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// PATCH /admin/users/:id/role — Changer le rôle
// =====================
router.patch("/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    if (!["PASSAGER", "CONDUCTEUR", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }
    const { rows } = await pool.query(
      `UPDATE utilisateurs SET role = $1 WHERE id = $2 RETURNING id, role`,
      [role, userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Utilisateur introuvable." });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /admin/trajets — Liste de tous les trajets
// =====================
router.get("/trajets", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { statut, search } = req.query;
    const params = [];
    const where = [];
    if (statut && statut !== "TOUS") {
      params.push(statut);
      where.push(`t.statut = $${params.length}`);
    }
    if (search) {
      params.push(search);
      where.push(`(t.lieu_depart ILIKE '%' || $${params.length} || '%' OR t.destination ILIKE '%' || $${params.length} || '%' OR u.prenom ILIKE '%' || $${params.length} || '%' OR u.nom ILIKE '%' || $${params.length} || '%')`);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT t.id, t.lieu_depart, t.destination, t.dateheure_depart, t.statut,
              t.places_total, t.places_dispo,
              u.prenom AS conducteur_prenom, u.nom AS conducteur_nom, u.email AS conducteur_email,
              (SELECT COUNT(*) FROM reservations r WHERE r.trajet_id = t.id) AS nb_reservations
       FROM trajets t
       JOIN utilisateurs u ON u.id = t.conducteur_id
       ${whereClause}
       ORDER BY t.dateheure_depart DESC
       LIMIT 150`,
      params
    );
    return res.json({ trajets: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// PATCH /admin/trajets/:id/annuler — Annuler un trajet
// =====================
router.patch("/trajets/:id/annuler", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE trajets SET statut = 'ANNULE' WHERE id = $1 AND statut IN ('PLANIFIE','EN_COURS') RETURNING id, statut`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Trajet introuvable ou déjà terminé/annulé." });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
