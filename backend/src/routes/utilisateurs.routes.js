import { Router } from "express";
import { pool } from "../DB/db.js";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { getUserById, updateUserProfile, updateUserPhoto } from "../model/utilisateurs.model.js";
import { upload } from "../middlewares/upload.middleware.js";


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

    //Récupérer l’ID depuis le token
    const userId = req.user.id;

    //Appeler le modèle
    const user = await getUserById(userId);

    //Si utilisateur introuvable
    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable."
      });
    }

    //Retourner les données
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
    //Récupération des données du body
    const { telephone, zones_depart_preferees } = req.body;

    //Validation simple
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
    
    //Mise à jour via modèle
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


// =====================
// PATCH /me/password — Changer le mot de passe
// =====================
router.patch("/me/password", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;

    if (!mot_de_passe_actuel || !nouveau_mot_de_passe) {
      return res.status(400).json({ message: "Les deux mots de passe sont requis." });
    }

    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
    }

    const { rows } = await pool.query(
      "SELECT mot_de_passe_hash FROM utilisateurs WHERE id = $1 AND actif = TRUE",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const ok = await bcrypt.compare(mot_de_passe_actuel, rows[0].mot_de_passe_hash);
    if (!ok) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect." });
    }

    const newHash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query(
      "UPDATE utilisateurs SET mot_de_passe_hash = $1 WHERE id = $2",
      [newHash, userId]
    );

    return res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// DELETE /me — Supprimer le compte
// =====================
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mot_de_passe } = req.body;

    if (!mot_de_passe) {
      return res.status(400).json({ message: "Le mot de passe est requis pour confirmer la suppression." });
    }

    const { rows } = await pool.query(
      "SELECT mot_de_passe_hash FROM utilisateurs WHERE id = $1 AND actif = TRUE",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const ok = await bcrypt.compare(mot_de_passe, rows[0].mot_de_passe_hash);
    if (!ok) {
      return res.status(400).json({ message: "Mot de passe incorrect." });
    }

    // Soft delete (désactivation du compte)
    await pool.query(
      "UPDATE utilisateurs SET actif = FALSE WHERE id = $1",
      [userId]
    );

    return res.json({ message: "Compte supprimé avec succès." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /me/stats — Stats profil (trajets + note)
// =====================
router.get("/me/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM trajets WHERE conducteur_id = $1 AND statut IN ('PLANIFIE','EN_COURS','TERMINE')) AS trajets_conduits,
        (SELECT COUNT(*) FROM reservations WHERE passager_id = $1) AS trajets_passager,
        (SELECT ROUND(AVG(note)::numeric, 1) FROM evaluations WHERE evalue_id = $1) AS note_moyenne,
        (SELECT COUNT(*) FROM evaluations WHERE evalue_id = $1) AS nb_evaluations
      `,
      [userId]
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// POST /me/photo — Upload photo de profil
// =====================
router.post("/me/photo", requireAuth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier reçu." });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    const result = await updateUserPhoto(req.user.id, photoUrl);
    return res.json({ photo_url: result.photo_url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;