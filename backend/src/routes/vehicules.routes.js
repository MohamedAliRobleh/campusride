/**
 * @fileoverview Routes de gestion des véhicules des conducteurs.
 *
 * Préfixe : `/vehicules`
 *
 * Chaque conducteur ne peut enregistrer qu'un seul véhicule.
 * L'enregistrement d'un véhicule élève automatiquement le rôle de l'utilisateur à CONDUCTEUR.
 * La suppression annule tous les trajets PLANIFIE et rétrograde le rôle à PASSAGER.
 *
 * - `POST   /vehicules/me`       — Enregistrer un véhicule (auth).
 * - `GET    /vehicules/me`       — Récupérer son véhicule (auth).
 * - `PATCH  /vehicules/me`       — Modifier son véhicule (auth).
 * - `DELETE /vehicules/me`       — Supprimer son véhicule (auth).
 * - `POST   /vehicules/me/photo` — Uploader une photo du véhicule (auth).
 *
 * @module routes/vehicules.routes
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { ajouterVehiculeEtMajConducteur, getVehiculeByUserId, updateVehiculeByUserId, supprimerVehiculeEtRevertRole, updateVehiculePhoto } from "../model/vehicules.model.js";
import { upload } from "../middlewares/upload.middleware.js";




const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    if (req.user.role === "ADMIN") {
      return res.status(403).json({ message: "Les administrateurs ne peuvent pas enregistrer de véhicule." });
    }
    const userId = req.user.id;

    const {
      marque,
      modele,
      annee,
      plaque,
      couleur,
      nb_places
    } = req.body;

    
    // Validation des champs
    const marqueClean = String(marque ?? "").trim();
    const modeleClean = String(modele ?? "").trim();
    const plaqueClean = String(plaque ?? "").trim().toUpperCase();

    // Conversion nombre
    const nbPlacesNum = Number(nb_places);
    const anneeNum = annee ? Number(annee) : null;

    // Vérifier champs obligatoires
    if (!marqueClean || !modeleClean || !plaqueClean) {
      return res.status(400).json({
        error: "marque, modele et plaque sont requis."
      });
    }

    // Vérifier nb_places (1 à 8)
    if (!Number.isInteger(nbPlacesNum) || nbPlacesNum < 1 || nbPlacesNum > 8) {
      return res.status(400).json({
        error: "nb_places invalide (doit être un entier entre 1 et 8)."
      });
    }

    // Vérifier annee si fournie (1990 à année courante + 1)
    const anneeMax = new Date().getFullYear() + 1;
    if (anneeNum !== null &&
      (!Number.isInteger(anneeNum) || anneeNum < 1990 || anneeNum > anneeMax)) {
      return res.status(400).json({
        error: `annee invalide (doit être entre 1990 et ${anneeMax}).`
      });
    }

    // Appel du model avec données propres et validées
    const result = await ajouterVehiculeEtMajConducteur({
      userId,
      marque: marqueClean,
      modele: modeleClean,
      annee: anneeNum,
      plaque: plaqueClean,
      couleur: couleur ? String(couleur).trim() : null,
      nb_places: nbPlacesNum
    });

    return res.status(201).json(result);

  } catch (err) {
    console.error(err);
    // 23505 = violation de contrainte UNIQUE
    if (err.code === "23505") {

      // Si l'utilisateur essaie d'ajouter un deuxième véhicule
      if (err.constraint === "vehicules_utilisateur_id_key") {
        return res.status(409).json({
          error: "Vous avez déjà un véhicule enregistré. Modifiez-le au lieu d’en créer un autre."
        });
      }

      // Si la plaque existe déjà
      if (err.constraint === "uq_vehicules_plaque") {
        return res.status(409).json({
          error: "Cette plaque est déjà utilisée par un autre véhicule."
        });
      }

      // Sécurité fallback
      return res.status(409).json({
        error: "Conflit : valeur unique déjà existante."
      });
    }

    // Erreur serveur générique
    return res.status(500).json({ error: "Erreur serveur." });

  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {

    const userId = req.user.id;

    const vehicule = await getVehiculeByUserId(userId);

    if (!vehicule) {
      return res.status(404).json({
        message: "Aucun véhicule enregistré."
      });
    }

    return res.json({ vehicule });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Erreur serveur."
    });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
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

    
    const marqueClean = String(marque ?? "").trim();
    const modeleClean = String(modele ?? "").trim();
    const plaqueClean = String(plaque ?? "").trim().toUpperCase();
    const couleurClean = couleur ? String(couleur).trim() : null;
    const nbPlacesNum = Number(nb_places);
    const anneeNum = annee ? Number(annee) : null;

    if (!marqueClean || !modeleClean || !plaqueClean) {
      return res.status(400).json({
        message: "marque, modele et plaque sont requis."
      });
    }

    if (!Number.isInteger(nbPlacesNum) || nbPlacesNum < 1 || nbPlacesNum > 8) {
      return res.status(400).json({
        message: "nb_places invalide (1 à 8)."
      });
    }

    const anneeMax = new Date().getFullYear() + 1;
    if (anneeNum !== null && (!Number.isInteger(anneeNum) || anneeNum < 1990 || anneeNum > anneeMax)) {
      return res.status(400).json({
        message: `annee invalide (doit être entre 1990 et ${anneeMax}).`
      });
    }


    const vehicule = await updateVehiculeByUserId(userId, {
      marque: marqueClean,
      modele: modeleClean,
      annee: anneeNum,
      plaque: plaqueClean,
      couleur: couleurClean,
      nb_places: nbPlacesNum
    });

    if (!vehicule) {
      return res.status(404).json({
        message: "Aucun véhicule trouvé."
      });
    }

    return res.json({ vehicule });

  } catch (err) {

  console.error(err);

  if (err.code === "23505") {
    return res.status(409).json({
      message: "Cette plaque est déjà utilisée."
    });
  }

  return res.status(500).json({
    message: "Erreur serveur."
  });
}

});


router.delete("/me", requireAuth, async (req, res) => {
  try {

    const userId = req.user.id;

    const result = await supprimerVehiculeEtRevertRole(userId);

    return res.json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur suppression véhicule." });
  }
});



// =====================
// POST /me/photo — Upload photo de voiture
// =====================
router.post("/me/photo", requireAuth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier reçu." });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    const result = await updateVehiculePhoto(req.user.id, photoUrl);
    if (!result) return res.status(404).json({ message: "Aucun véhicule enregistré." });
    return res.json({ photo_url: result.photo_url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;