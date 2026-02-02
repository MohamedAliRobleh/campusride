import { Router } from "express";
import { pool } from "../DB/db.js";

const router = Router();

// GET /utilisateurs
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nom, prenom, email, role, actif, cree_le FROM utilisateurs ORDER BY cree_le DESC;"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur requête utilisateurs" });
  }
});

export default router;
