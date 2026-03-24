import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { pool } from "../DB/db.js";
import { sendPushToUser } from "../utils/pushNotification.js";
import { hasVehicule } from "../model/vehicules.model.js";
import { getUserRole } from "../model/utilisateurs.model.js";
import {
  insertTrajet,
  searchTrajets,
  terminerTrajetEtNotifier,
  getTrajetByIdForUpdate,
  annulerTrajetConducteurEtNotifier,
  modifierTrajetEtNotifier,
  getMesTrajetsAvecPlacesReservees,
  getTrajetsPopulaires
} from "../model/trajets.model.js";

const router = Router();

// =====================
// POST /  Publier trajet
// =====================
router.post("/", requireAuth, async (req, res) => {
  try {
    const conducteurId = req.user.id;

    const role = await getUserRole(conducteurId);
    if (role !== "CONDUCTEUR") {
      return res.status(403).json({
        message: "Accès refusé : ajoutez un véhicule pour devenir conducteur et publier un trajet."
      });
    }

    const okVehicule = await hasVehicule(conducteurId);
    if (!okVehicule) {
      return res.status(400).json({
        message: "Vous devez enregistrer un véhicule avant de publier un trajet."
      });
    }

    const { lieu_depart, destination, dateheure_depart, places_total,
            depart_lat, depart_lng, dest_lat, dest_lng } = req.body;

    const lieuDepart = String(lieu_depart ?? "").trim();
    const dest = String(destination ?? "").trim();
    const placesTotalNum = Number(places_total);
    const departLat = depart_lat != null ? parseFloat(depart_lat) : null;
    const departLng = depart_lng != null ? parseFloat(depart_lng) : null;
    const dstLat    = dest_lat   != null ? parseFloat(dest_lat)   : null;
    const dstLng    = dest_lng   != null ? parseFloat(dest_lng)   : null;

    if (!lieuDepart || !dest) {
      return res.status(400).json({ message: "lieu_depart et destination sont requis." });
    }

    if (lieuDepart.toLowerCase() === dest.toLowerCase()) {
      return res.status(400).json({ message: "Le lieu de départ et la destination doivent être différents." });
    }

    if (!Number.isInteger(placesTotalNum) || placesTotalNum < 1 || placesTotalNum > 8) {
      return res.status(400).json({
        message: "places_total invalide (doit être un entier entre 1 et 8)."
      });
    }

    const d = new Date(dateheure_depart);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ message: "dateheure_depart invalide." });
    }

    if (d <= new Date()) {
      return res.status(400).json({ message: "dateheure_depart doit être dans le futur." });
    }

    const trajet = await insertTrajet({
      conducteurId,
      lieuDepart,
      destination: dest,
      dateHeureDepart: d.toISOString(),
      placesTotal: placesTotalNum,
      departLat,
      departLng,
      destLat: dstLat,
      destLng: dstLng,
    });

    return res.status(201).json({ trajet });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /recherche
// =====================
router.get("/recherche", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const depart      = req.query.depart      ? String(req.query.depart)      : null;
    const destination = req.query.destination ? String(req.query.destination) : null;
    const date        = req.query.date        ? String(req.query.date)        : null;
    const departLat   = req.query.depart_lat  ? parseFloat(req.query.depart_lat) : null;
    const departLng   = req.query.depart_lng  ? parseFloat(req.query.depart_lng) : null;
    const destLat     = req.query.dest_lat    ? parseFloat(req.query.dest_lat)   : null;
    const destLng     = req.query.dest_lng    ? parseFloat(req.query.dest_lng)   : null;
    const rayonKm     = req.query.rayon_km    ? parseFloat(req.query.rayon_km)   : 5;

    if (rayonKm < 1 || rayonKm > 50) {
      return res.status(400).json({ message: "rayon_km doit être entre 1 et 50 km." });
    }

    const trajets = await searchTrajets({
      depart, destination, date, userId,
      departLat, departLng, destLat, destLng, rayonKm
    });

    return res.json({
      filters: { depart, destination, date },
      trajets
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// PATCH /:id/demarrer — Conducteur démarre le trajet (PLANIFIE → EN_COURS)
// =====================
router.patch("/:id/demarrer", requireAuth, async (req, res) => {
  try {
    const conducteurId = req.user.id;
    const trajetId = req.params.id;

    // Vérifier que le trajet appartient au conducteur et est PLANIFIE
    const { rows } = await pool.query(
      `SELECT id, conducteur_id, statut, lieu_depart, destination
       FROM trajets WHERE id = $1`,
      [trajetId]
    );

    if (!rows.length) return res.status(404).json({ message: "Trajet introuvable." });
    const trajet = rows[0];

    if (trajet.conducteur_id !== conducteurId)
      return res.status(403).json({ message: "Accès refusé." });

    if (trajet.statut !== "PLANIFIE")
      return res.status(400).json({ message: "Le trajet doit être en statut PLANIFIE pour démarrer." });

    // Vérifier qu'au moins une réservation est acceptée
    const { rows: acceptees } = await pool.query(
      `SELECT COUNT(*) AS nb FROM reservations WHERE trajet_id = $1 AND statut = 'ACCEPTEE'`,
      [trajetId]
    );
    if (parseInt(acceptees[0].nb) === 0) {
      return res.status(400).json({ message: "Vous devez accepter au moins une réservation avant de démarrer le trajet." });
    }

    // Vérifier qu'aucun autre trajet du conducteur n'est déjà EN_COURS
    const { rows: enCours } = await pool.query(
      `SELECT id FROM trajets WHERE conducteur_id = $1 AND statut = 'EN_COURS' AND id != $2`,
      [conducteurId, trajetId]
    );
    if (enCours.length > 0) {
      return res.status(409).json({ message: "Vous avez déjà un trajet en cours. Terminez-le avant d'en démarrer un autre." });
    }

    // Passer à EN_COURS
    const { rows: updated } = await pool.query(
      `UPDATE trajets SET statut = 'EN_COURS', maj_le = NOW() WHERE id = $1 RETURNING *`,
      [trajetId]
    );

    // Notifier les passagers acceptés
    await pool.query(
      `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
       SELECT r.passager_id, 'TRAJET_TERMINE',
              'Votre trajet ' || $2 || ' → ' || $3 || ' vient de démarrer !',
              NOW()
       FROM reservations r
       WHERE r.trajet_id = $1 AND r.statut = 'ACCEPTEE'`,
      [trajetId, trajet.lieu_depart, trajet.destination]
    );

    // Push aux passagers acceptés (non bloquant)
    pool.query(`SELECT passager_id FROM reservations WHERE trajet_id = $1 AND statut = 'ACCEPTEE'`, [trajetId])
      .then(({ rows }) => rows.forEach(p =>
        sendPushToUser(p.passager_id, "Trajet démarré 🚗",
          `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} vient de démarrer !`,
          "/passager/mes-reservations")
      ))
      .catch(() => {});

    return res.json({ trajet: updated[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// PATCH /:id/terminer
// =====================
router.patch("/:id/terminer", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const conducteurId = req.user.id;
    const trajetId = req.params.id;

    const trajet = await terminerTrajetEtNotifier({ client, trajetId, conducteurId });

    if (!trajet) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Impossible de terminer ce trajet." });
    }

    await client.query("COMMIT");

    // Push aux passagers du trajet terminé (non bloquant)
    pool.query(`SELECT passager_id FROM reservations WHERE trajet_id = $1 AND statut = 'ACCEPTEE'`, [trajetId])
      .then(({ rows }) => rows.forEach(p =>
        sendPushToUser(p.passager_id, "Trajet terminé ✅",
          `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} est terminé.`,
          "/passager/mes-reservations")
      ))
      .catch(() => {});

    return res.json({ trajet });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  } finally {
    client.release();
  }
});

// =====================
// PATCH /:id/annuler
// (pour Conducteur seulement)
// =====================
router.patch("/:id/annuler", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userId = req.user.id;
    const trajetId = req.params.id;
    const trajet = await getTrajetByIdForUpdate({ client, trajetId });

    if (!trajet) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Trajet introuvable." });
    }

    const isConducteur = trajet.conducteur_id === userId;
    if (!isConducteur) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message:
          "Accès refusé : l'annulation du trajet est réservée au conducteur. Le passager annule via sa réservation."
      });
    }

    const result = await annulerTrajetConducteurEtNotifier({ client, trajetId });
    if (!result) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Impossible d'annuler ce trajet." });
    }

    await client.query("COMMIT");

    // Push aux passagers dont la réservation vient d'être annulée (non bloquant)
    pool.query(`SELECT passager_id FROM reservations WHERE trajet_id = $1 AND statut = 'ANNULEE'`, [trajetId])
      .then(({ rows }) => rows.forEach(p =>
        sendPushToUser(p.passager_id, "Trajet annulé ❌",
          `Le trajet ${result.trajet.lieu_depart} → ${result.trajet.destination} a été annulé par le conducteur.`,
          "/passager/mes-reservations")
      ))
      .catch(() => {});

    return res.json(result);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  } finally {
    client.release();
  }
});

// =====================
// GET /mes-trajets
// =====================
router.get("/mes-trajets", requireAuth, async (req, res) => {
  try {
    const conducteurId = req.user.id;
    const rows = await getMesTrajetsAvecPlacesReservees(conducteurId);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /Trajets populaires
// =====================
router.get("/populaires", async (_req, res) => {
  try {
    const rows = await getTrajetsPopulaires();
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

// =====================
// PATCH /:id/position — Conducteur met à jour sa position GPS en direct
// =====================
router.patch("/:id/position", requireAuth, async (req, res) => {
  try {
    const conducteurId = req.user.id;
    const trajetId = req.params.id;
    const { lat, lng } = req.body;

    if (lat == null || lng == null) return res.status(400).json({ message: "lat et lng sont requis." });

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ message: "Coordonnées GPS invalides." });
    }

    const { rows } = await pool.query(
      `SELECT conducteur_id, statut FROM trajets WHERE id = $1`,
      [trajetId]
    );
    if (!rows.length) return res.status(404).json({ message: "Trajet introuvable." });
    if (rows[0].conducteur_id !== conducteurId) return res.status(403).json({ message: "Accès refusé." });
    if (rows[0].statut !== "EN_COURS") return res.status(400).json({ message: "Le trajet doit être EN_COURS." });

    await pool.query(
      `UPDATE trajets SET conducteur_lat = $1, conducteur_lng = $2 WHERE id = $3`,
      [latNum, lngNum, trajetId]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /:id/live — Position en direct du conducteur (conducteur OU passager ACCEPTEE)
// =====================
router.get("/:id/live", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const trajetId = req.params.id;

    const { rows } = await pool.query(
      `SELECT t.conducteur_id, t.statut, t.conducteur_lat, t.conducteur_lng,
              t.dest_lat, t.dest_lng, t.depart_lat, t.depart_lng,
              t.destination, t.lieu_depart
       FROM trajets t WHERE t.id = $1`,
      [trajetId]
    );
    if (!rows.length) return res.status(404).json({ message: "Trajet introuvable." });
    const t = rows[0];

    // Le suivi n'est disponible que pour un trajet EN_COURS
    if (t.statut === "TERMINE") {
      return res.status(410).json({ message: "Le trajet est terminé.", statut: "TERMINE" });
    }
    if (t.statut !== "EN_COURS") {
      return res.status(400).json({ message: "Le trajet n'est pas en cours.", statut: t.statut });
    }

    const isConducteur = t.conducteur_id === userId;
    if (!isConducteur) {
      const { rows: resas } = await pool.query(
        `SELECT 1 FROM reservations WHERE trajet_id = $1 AND passager_id = $2 AND statut = 'ACCEPTEE'`,
        [trajetId, userId]
      );
      if (!resas.length) return res.status(403).json({ message: "Accès refusé." });
    }

    return res.json({
      conducteur_lat: t.conducteur_lat,
      conducteur_lng: t.conducteur_lng,
      dest_lat: t.dest_lat,
      dest_lng: t.dest_lng,
      depart_lat: t.depart_lat,
      depart_lng: t.depart_lng,
      destination: t.destination,
      lieu_depart: t.lieu_depart,
      statut: t.statut,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// PATCH /:id  Modifier trajet
// =====================
router.patch("/:id", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const conducteurId = req.user.id;
    const trajetId = req.params.id;

    const { lieu_depart, destination, dateheure_depart } = req.body;

    const lieuDepart = String(lieu_depart ?? "").trim();
    const dest = String(destination ?? "").trim();
    const d = new Date(dateheure_depart);

    if (!lieuDepart || !dest) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "lieu_depart et destination sont requis." });
    }
    if (lieuDepart.toLowerCase() === dest.toLowerCase()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Le lieu de départ et la destination doivent être différents." });
    }
    if (Number.isNaN(d.getTime())) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "dateheure_depart invalide." });
    }
    if (d <= new Date()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "dateheure_depart doit être dans le futur." });
    }

    const trajet = await modifierTrajetEtNotifier({
      client,
      trajetId,
      conducteurId,
      lieuDepart,
      dest,
      dateIso: d.toISOString()
    });

    if (!trajet) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Impossible de modifier ce trajet." });
    }
    await client.query("COMMIT");
    return res.json({ trajet });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  } finally {
    client.release();
  }
});

export default router;