// src/routes/reservations.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { createReservation } from "../model/reservations.model.js";
import { listReservationsForConducteur } from "../model/reservations.model.js";
import { acceptReservation } from "../model/reservations.model.js";
import { refuseReservation } from "../model/reservations.model.js";
import { getReservationsByPassager } from "../model/reservations.model.js";
import { cancelReservation } from "../model/reservations.model.js";



const router = Router();


router.post("/", requireAuth, async (req, res) => {
  try {
    // L'utilisateur connecté (peut être PASSAGER ou CONDUCTEUR)
    const passagerId = req.user.id;

    // Récupération trajet_id depuis le body
    const trajetId = String(req.body?.trajet_id ?? "").trim();
    if (!trajetId) {
      return res.status(400).json({ message: "trajet_id est requis." });
    }

    const result = await createReservation(passagerId, trajetId);

    // Gestion des erreurs métier propres
    if (result.error === "TRAJET_NOT_FOUND") {
      return res.status(404).json({ message: "Trajet introuvable." });
    }
    if (result.error === "CANNOT_RESERVE_OWN_TRAJET") {
      return res.status(403).json({ message: "Vous ne pouvez pas réserver votre propre trajet." });
    }
    if (result.error === "TRAJET_NOT_PLANIFIE") {
      return res.status(400).json({ message: "Ce trajet n'est pas disponible à la réservation." });
    }
    if (result.error === "TRAJET_PAST") {
      return res.status(400).json({ message: "Ce trajet est déjà passé." });
    }
    if (result.error === "NO_PLACES_AVAILABLE") {
      return res.status(409).json({ message: "Plus aucune place disponible." });
    }
    if (result.error === "ALREADY_RESERVED") {
      return res.status(409).json({ message: "Vous avez déjà réservé ce trajet." });
    }

    // Succès
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});


router.get("/recues", requireAuth, async (req, res) => {
  try {
    const conducteurId = req.user.id;
    const rows = await listReservationsForConducteur(conducteurId);
    return res.json({ reservations: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});
router.patch("/:id/accepter", requireAuth, async (req, res) => {
  try {
    const conducteurId = req.user.id;
    const reservationId = String(req.params.id);

    const result = await acceptReservation(conducteurId, reservationId);

    if (result.error === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Réservation introuvable." });
    }
    if (result.error === "NOT_OWNER") {
      return res.status(403).json({ message: "Accès refusé." });
    }
    if (result.error === "NOT_PENDING") {
      return res.status(409).json({ message: "Réservation déjà traitée." });
    }
    if (result.error === "NO_PLACES_AVAILABLE") {
      return res.status(409).json({ message: "Plus aucune place disponible." });
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

router.patch("/:id/refuser", requireAuth, async (req, res) => {
  try {
    const conducteurId = req.user.id;
    const reservationId = String(req.params.id);

    const result = await refuseReservation(conducteurId, reservationId);

    if (result.error === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ message: "Réservation introuvable." });
    }
    if (result.error === "NOT_OWNER") {
      return res.status(403).json({ message: "Accès refusé." });
    }
    if (result.error === "NOT_PENDING") {
      return res.status(409).json({ message: "Réservation déjà traitée." });
    }

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});


router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const reservations = await getReservationsByPassager(userId);

    return res.json({ reservations });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});


router.patch("/:id/annuler", requireAuth, async (req, res) => {
  try {
    const passagerId = req.user.id;
    const reservationId = String(req.params.id);

    const result = await cancelReservation(passagerId, reservationId);

    if (result.error === "RESERVATION_NOT_FOUND")
      return res.status(404).json({ message: "Réservation introuvable." });

    if (result.error === "NOT_OWNER")
      return res.status(403).json({ message: "Accès refusé." });

    if (result.error === "ALREADY_CLOSED")
      return res.status(409).json({ message: "Réservation déjà fermée." });

    if (result.error === "TRAJET_PAST")
      return res.status(400).json({ message: "Impossible d'annuler un trajet passé." });

    return res.json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});



export default router;