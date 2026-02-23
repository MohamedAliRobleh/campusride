import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { insertTrajet } from "../model/trajets.model.js";
import { searchTrajets } from "../model/trajets.model.js";
import { hasVehicule } from "../model/vehicules.model.js"; 
import { getUserRole } from "../model/utilisateurs.model.js"; 
import { pool } from "../DB/db.js";



const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {

    // 🔐 Récupérer l'ID utilisateur depuis le token validé
    const conducteurId = req.user.id;

    // 🔍 Vérifier le rôle ACTUEL dans la base de données
    const role = await getUserRole(conducteurId);

    // 🚫 Si le rôle en DB n’est pas CONDUCTEUR → accès refusé
    if (role !== "CONDUCTEUR") {
      return res.status(403).json({
        message: "Accès refusé : ajoutez un véhicule pour devenir conducteur et publier un trajet."
      });
    }

    // 🚗 Vérifier que l'utilisateur a réellement un véhicule enregistré
    const okVehicule = await hasVehicule(conducteurId);

    // Si aucun véhicule n'existe, on refuse la publication
    if (!okVehicule) {
      return res.status(400).json({
        message: "Vous devez enregistrer un véhicule avant de publier un trajet."
      });
    }


    // 📦 Récupération des données envoyées dans le body
    const {
      lieu_depart,
      destination,
      dateheure_depart,
      places_total
    } = req.body;

    // =========================
    // Validation des champs
    // =========================

    // Nettoyage des champs texte (évite espaces / valeurs bizarres)
    const lieuDepart = String(lieu_depart ?? "").trim();
    const dest = String(destination ?? "").trim();

    // Conversion en nombre (places_total arrive souvent en string depuis JSON)
    const placesTotalNum = Number(places_total);

    // Vérifier champs texte obligatoires
    if (!lieuDepart || !dest) {
      return res.status(400).json({
        message: "lieu_depart et destination sont requis."
      });
    }

    // Vérifier places_total: entier entre 1 et 8 (cohérent avec ton nb_places max)
    if (!Number.isInteger(placesTotalNum) || placesTotalNum < 1 || placesTotalNum > 8) {
      return res.status(400).json({
        message: "places_total invalide (doit être un entier entre 1 et 8)."
      });
    }

    // Vérifier dateheure_depart: date valide
    const d = new Date(dateheure_depart);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({
        message: "dateheure_depart invalide."
      });
    }

    // Vérifier que la date est dans le futur
    if (d <= new Date()) {
      return res.status(400).json({
        message: "dateheure_depart doit être dans le futur."
      });
    }


    // 🚀 Création du trajet
    const trajet = await insertTrajet({
      conducteurId,
      lieuDepart,                 // valeur nettoyée
      destination: dest,          // valeur nettoyée
      dateHeureDepart: d.toISOString(), // date normalisée
      placesTotal: placesTotalNum // nombre validé
    });




    // 📤 Réponse succès
    return res.status(201).json({ trajet });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});



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


router.patch("/:id/terminer", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const conducteurId = req.user.id;
    const trajetId = req.params.id;

    // 1️⃣ Terminer le trajet
    const updateRes = await client.query(
      `
      UPDATE trajets
      SET statut = 'TERMINE'
      WHERE id = $1
      AND conducteur_id = $2
      AND statut IN ('PLANIFIE','EN_COURS')
      RETURNING *;
      `,
      [trajetId, conducteurId]
    );

    if (updateRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "Impossible de terminer ce trajet."
      });
    }

    const trajet = updateRes.rows[0];

    // 2️⃣ Récupérer tous les passagers ACCEPTÉS
    const passagersRes = await client.query(
      `
      SELECT passager_id
      FROM reservations
      WHERE trajet_id = $1
      AND statut = 'ACCEPTEE'
      `,
      [trajetId]
    );

    // 3️⃣ Créer notification pour chaque passager
    for (const row of passagersRes.rows) {
      await client.query(
        `
        INSERT INTO notifications (
          utilisateur_id,
          type,
          message,
          cree_le
        )
        VALUES ($1, 'TRAJET_TERMINE', $2, NOW());
        `,
        [
          row.passager_id,
          `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} a été terminé par le conducteur.`
        ]
      );
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


router.patch("/:id/annuler", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const conducteurId = req.user.id;
    const trajetId = req.params.id;

    // 1️⃣ Annuler le trajet
    const updateRes = await client.query(
      `
      UPDATE trajets
      SET statut = 'ANNULE'
      WHERE id = $1
      AND conducteur_id = $2
      AND statut IN ('PLANIFIE','EN_COURS')
      RETURNING *;
      `,
      [trajetId, conducteurId]
    );

    if (updateRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "Impossible d'annuler ce trajet."
      });
    }

    const trajet = updateRes.rows[0];

    // 2️⃣ Récupérer passagers ACCEPTÉS
    const passagersRes = await client.query(
      `
      SELECT passager_id
      FROM reservations
      WHERE trajet_id = $1
      AND statut = 'ACCEPTEE'
      `,
      [trajetId]
    );

    // 3️⃣ Créer notifications
    for (const row of passagersRes.rows) {
      await client.query(
        `
        INSERT INTO notifications (
          utilisateur_id,
          type,
          message,
          cree_le
        )
        VALUES ($1, 'TRAJET_ANNULE', $2, NOW());
        `,
        [
          row.passager_id,
          `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} a été annulé par le conducteur.`
        ]
      );
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



router.get("/mes-trajets", requireAuth, async (req, res) => {
  try {
    const conducteurId = req.user.id;

    const { rows } = await pool.query(
      `
  SELECT
    t.*,
    COUNT(r.id) FILTER (WHERE r.statut = 'ACCEPTEE') AS places_reservees
  FROM trajets t
  LEFT JOIN reservations r ON r.trajet_id = t.id
  WHERE t.conducteur_id = $1
  GROUP BY t.id
  ORDER BY t.dateheure_depart DESC;
  `,
      [conducteurId]
    );


    return res.json(rows);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});


router.get("/populaires", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT *
      FROM trajets
      WHERE statut IN ('PLANIFIE','EN_COURS')
      AND dateheure_depart >= NOW()
      ORDER BY dateheure_depart ASC
      LIMIT 5
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



export default router;