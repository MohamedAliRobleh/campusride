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
        (SELECT ROUND(AVG(note)::numeric,1) FROM evaluations) AS note_moyenne_globale,
        (SELECT COUNT(*) FROM utilisateurs WHERE actif = TRUE AND cree_le >= NOW() - INTERVAL '7 days') AS nouveaux_7j,
        (SELECT COUNT(*) FROM pwa_installs) AS pwa_total,
        (SELECT COUNT(*) FROM pwa_installs WHERE source = 'banniere') AS pwa_banniere,
        (SELECT COUNT(*) FROM pwa_installs WHERE source = 'profil') AS pwa_profil
    `);
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// POST /admin/pwa-install — Enregistrer une installation PWA (public, sans auth)
// =====================
router.post("/pwa-install", async (req, res) => {
  try {
    const { source, utilisateur_id } = req.body;
    await pool.query(
      "INSERT INTO pwa_installs (utilisateur_id, source) VALUES ($1, $2)",
      [utilisateur_id || null, source || "inconnu"]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false });
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

    // Interdire de désactiver son propre compte ou un autre admin
    const { rows: target } = await pool.query(
      `SELECT role FROM utilisateurs WHERE id = $1`, [userId]
    );
    if (target.length === 0) return res.status(404).json({ message: "Utilisateur introuvable." });
    if (target[0].role === "ADMIN") return res.status(403).json({ message: "Impossible de désactiver un compte administrateur." });
    if (String(userId) === String(req.user.id)) return res.status(403).json({ message: "Vous ne pouvez pas désactiver votre propre compte." });

    const { rows } = await pool.query(
      `UPDATE utilisateurs SET actif = NOT actif WHERE id = $1 RETURNING id, actif, role`,
      [userId]
    );
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
// PATCH /admin/trajets/:id/annuler — Annuler un trajet + réservations + notifications
// =====================
router.patch("/trajets/:id/annuler", requireAuth, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE trajets SET statut = 'ANNULE', maj_le = NOW()
       WHERE id = $1 AND statut IN ('PLANIFIE','EN_COURS')
       RETURNING id, lieu_depart, destination`,
      [req.params.id]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Trajet introuvable ou déjà terminé/annulé." });
    }
    const trajet = rows[0];

    // Annuler les réservations actives
    const annuleResa = await client.query(
      `UPDATE reservations SET statut = 'ANNULEE', reponse_le = NOW()
       WHERE trajet_id = $1 AND statut IN ('ACCEPTEE','EN_ATTENTE')
       RETURNING passager_id`,
      [trajet.id]
    );

    // Notifier les passagers impactés
    if (annuleResa.rows.length > 0) {
      const passagerIds = [...new Set(annuleResa.rows.map(r => r.passager_id))];
      await client.query(
        `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
         SELECT unnest($1::text[]), 'TRAJET_ANNULE', $2, NOW()`,
        [passagerIds, `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} a été annulé par un administrateur.`]
      );
    }

    await client.query("COMMIT");
    return res.json({ id: trajet.id, statut: "ANNULE", reservations_annulees: annuleResa.rowCount });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  } finally {
    client.release();
  }
});

// =====================
// GET /admin/reservations — Liste toutes les réservations
// =====================
router.get("/reservations", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { statut, search } = req.query;
    const params = [];
    const where = [];

    if (statut && statut !== "TOUS") {
      params.push(statut);
      where.push(`r.statut = $${params.length}`);
    }
    if (search) {
      params.push(search);
      where.push(
        `(up.prenom ILIKE '%' || $${params.length} || '%'
          OR up.nom   ILIKE '%' || $${params.length} || '%'
          OR t.lieu_depart  ILIKE '%' || $${params.length} || '%'
          OR t.destination  ILIKE '%' || $${params.length} || '%')`
      );
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
         r.id, r.statut, r.demande_le, r.reponse_le,
         up.id    AS passager_id,
         up.prenom AS passager_prenom,
         up.nom    AS passager_nom,
         up.email  AS passager_email,
         pp.photo_url AS passager_photo_url,
         t.id   AS trajet_id,
         t.lieu_depart, t.destination, t.dateheure_depart,
         t.statut AS trajet_statut,
         uc.prenom AS conducteur_prenom,
         uc.nom    AS conducteur_nom
       FROM reservations r
       JOIN utilisateurs up ON up.id = r.passager_id
       LEFT JOIN profils pp ON pp.utilisateur_id = r.passager_id
       JOIN trajets t ON t.id = r.trajet_id
       JOIN utilisateurs uc ON uc.id = t.conducteur_id
       ${whereClause}
       ORDER BY r.demande_le DESC
       LIMIT 200`,
      params
    );
    return res.json({ reservations: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// ── Signalements ──────────────────────────────────────────────
// GET /admin/signalements
router.get("/signalements", requireAuth, requireAdmin, async (req, res) => {
  const { statut } = req.query;
  const params = [];
  let where = "";
  if (statut) { params.push(statut); where = `WHERE s.statut = $${params.length}`; }
  try {
    const { rows } = await pool.query(
      `SELECT s.*,
              us.prenom AS signaleur_prenom, us.nom AS signaleur_nom, us.email AS signaleur_email
       FROM signalements s
       JOIN utilisateurs us ON us.id = s.signaleur_id
       ${where}
       ORDER BY s.cree_le DESC
       LIMIT 300`,
      params
    );
    return res.json({ signalements: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// PATCH /admin/signalements/:id/statut
router.patch("/signalements/:id/statut", requireAuth, requireAdmin, async (req, res) => {
  const { statut } = req.body;
  if (!["TRAITE", "REJETE", "EN_ATTENTE"].includes(statut)) {
    return res.status(400).json({ message: "Statut invalide." });
  }
  try {
    const { rowCount } = await pool.query(
      `UPDATE signalements SET statut = $1 WHERE id = $2`,
      [statut, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ message: "Signalement introuvable." });
    return res.json({ message: "Statut mis à jour." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
