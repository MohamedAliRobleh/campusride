import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../DB/db.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
const router = Router();

/*
  ROUTE : POST /auth/register
  RÔLE  : Inscription d’un nouvel utilisateur
*/
router.post("/register", async (req, res) => {
    try {
        const { prenom, nom, email, motDePasse, role } = req.body;

        if (!prenom || !nom || !email || !motDePasse) {
            return res.status(400).json({
                error: "Tous les champs sont obligatoires",
            });
        }

        // 3️ Vérifier si l’email existe déjà dans la base de données
        const userExists = await pool.query(
            "SELECT id FROM utilisateurs WHERE email = $1",
            [email]
        );
        if (userExists.rows.length > 0) {
            return res.status(409).json({
                error: "Cet email est déjà utilisé",
            });
        }

        // Hasher  le mot de passe avant de le stocker
        const motDePasseHash = await bcrypt.hash(motDePasse, 10);

        // Insertion du nouvel utilisateur dans la base
        const result = await pool.query(
            `
      INSERT INTO utilisateurs (prenom, nom, email, mot_de_passe_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, prenom, nom, email, role, actif, cree_le
      `,
            [
                prenom,
                nom,
                email,
                motDePasseHash,
                "PASSAGER", // rôle par défaut
            ]
        );
        return res.status(201).json({
            message: "Inscription réussie",
            utilisateur: result.rows[0],
        });

    } catch (error) {
        // 7 Gestion des erreurs serveur
        console.error("Erreur register :", error);
        return res.status(500).json({
            error: "Erreur serveur lors de l'inscription",
        });
    }
});


router.post("/login", async (req, res) => {
  try {
    // 1️ Récupérer les champs
    const { email, motDePasse } = req.body;

    // 2️ Vérifier présence des champs
    if (!email || !motDePasse) {
      return res.status(400).json({ error: "Email et mot de passe obligatoires" });
    }

    // 3️Chercher l'utilisateur par email
    const result = await pool.query(
      `SELECT id, prenom, nom, email, mot_de_passe_hash, role, actif
       FROM utilisateurs
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = result.rows[0];

    // 4️Vérifier si compte actif
    if (user.actif === false) {
      return res.status(403).json({ error: "Compte désactivé" });
    }

    // 5️ Comparer mot de passe (plain vs hash)
    const ok = await bcrypt.compare(motDePasse, user.mot_de_passe_hash);
    if (!ok) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // 6️ Générer un token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 7 Ne jamais renvoyer le hash au frontend
    const safeUser = {
      id: user.id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
      actif: user.actif,
    };

    return res.status(200).json({
      message: "Connexion réussie",
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error("Erreur login:", err);
    return res.status(500).json({ error: "Erreur serveur lors de la connexion" });
  }
});

// Pour tester que le token marche
router.get("/me", requireAuth, async (req, res) => {
  // req.user vient du token
  return res.json({ message: "OK", user: req.user });
});

export default router;

