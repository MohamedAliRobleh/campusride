import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { pool } from "../DB/db.js";
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

    const { lieu_depart, destination, dateheure_depart, places_total } = req.body;

    const lieuDepart = String(lieu_depart ?? "").trim();
    const dest = String(destination ?? "").trim();
    const placesTotalNum = Number(places_total);

    if (!lieuDepart || !dest) {
      return res.status(400).json({ message: "lieu_depart et destination sont requis." });
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
      placesTotal: placesTotalNum
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

    const depart = req.query.depart ? String(req.query.depart) : null;
    const destination = req.query.destination ? String(req.query.destination) : null;
    const date = req.query.date ? String(req.query.date) : null;

    const trajets = await searchTrajets({ depart, destination, date, userId });

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
router.get("/populaires", async (req, res) => {
  try {
    const rows = await getTrajetsPopulaires();
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
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