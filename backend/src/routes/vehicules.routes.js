import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { ajouterVehiculeEtMajConducteur } from "../model/vehicules.model.js";

const router = Router();

// POST /vehicules
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      marque,
      modele,
      annee,
      plaque,
      couleur,
      nb_places
    } = req.body;

    // Mini validation (rapide)
    if (!marque || !modele || !plaque || !nb_places) {
      return res.status(400).json({ error: "Champs requis manquants." });
    }

    const result = await ajouterVehiculeEtMajConducteur({
      userId,
      marque: String(marque).trim(),
      modele: String(modele).trim(),
      annee: annee ? Number(annee) : null,
      plaque: String(plaque).trim().toUpperCase(),
      couleur: couleur ? String(couleur).trim() : null,
      nb_places: Number(nb_places)
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);

    // Optionnel: gérer contrainte plaque unique
    // if (err.code === "23505") ...

    return res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
