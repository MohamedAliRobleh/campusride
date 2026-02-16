import { Router } from "express";
import { pool } from "../DB/db.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { getUserById } from "../model/utilisateurs.model.js";
import { updateUserProfile } from "../model/utilisateurs.model.js";


const router = Router();



router.get("/", async (req, res) => {
  try {

    const result = await pool.query(
      `
      SELECT id, nom, prenom, email, role, actif, cree_le
      FROM utilisateurs
      ORDER BY cree_le DESC;
      `
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur requête utilisateurs" });
  }
});



router.get("/me", requireAuth, async (req, res) => {
  try {

    // 1️⃣ Récupérer l’ID depuis le token
    const userId = req.user.id;

    // 2️⃣ Appeler le modèle
    const user = await getUserById(userId);

    // 3️⃣ Si utilisateur introuvable
    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable."
      });
    }

    // 4️⃣ Retourner les données
    return res.json({ user });

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

    // ============================================================
    // 1️⃣ Récupération des données du body
    // ============================================================
    const { telephone, zones_depart_preferees } = req.body;

    // ============================================================
    // 2️⃣ Validation simple
    // ============================================================

    // telephone peut être null ou string
    const telephoneClean =
      telephone !== undefined ? String(telephone).trim() : null;

    // zones doit être un tableau si fourni
    let zonesClean = null;

    if (zones_depart_preferees !== undefined) {

      if (!Array.isArray(zones_depart_preferees)) {
        return res.status(400).json({
          message: "zones_depart_preferees doit être un tableau."
        });
      }

      // Nettoyage des zones (trim + suppression vides)
      zonesClean = zones_depart_preferees
        .map(z => String(z).trim())
        .filter(z => z.length > 0);
    }

    // ============================================================
    // 3️⃣ Mise à jour via modèle
    // ============================================================
    const profil = await updateUserProfile(
      userId,
      telephoneClean,
      zonesClean
    );

    return res.json({ profil });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Erreur serveur."
    });
  }
});


export default router;