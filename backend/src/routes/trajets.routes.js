// src/routes/trajets.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js"; 
import { insertTrajet } from "../model/trajets.model.js";
import { searchTrajets } from "../model/trajets.model.js";

const router = Router();

// Route POST pour creer un trajet (conducteur uniquement)
router.post("/", requireAuth, async (req, res) => {
  try {
    // Vérification du rôle
    if (req.user.role !== "CONDUCTEUR") {
      return res.status(403).json({
        message: "Accès refusé : seul un conducteur peut publier un trajet."
      });
    }

    const conducteurId = req.user.id;

    const {
      lieu_depart,
      destination,
      dateheure_depart,
      places_total
    } = req.body;

    // Mini validation
    if (!lieu_depart || !destination || !dateheure_depart || !places_total) {
      return res.status(400).json({ message: "Champs requis manquants." });
    }

    const trajet = await insertTrajet({
      conducteurId,
      lieuDepart: lieu_depart,
      destination,
      dateHeureDepart: dateheure_depart,
      placesTotal: places_total
    });

    return res.status(201).json({ trajet });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// GET /trajets/recherche
router.get("/recherche", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const depart = req.query.depart ? String(req.query.depart) : null;
    const destination = req.query.destination ? String(req.query.destination) : null;
    const date = req.query.date ? String(req.query.date) : null; // YYYY-MM-DD

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




export default router;
