import express from 'express'
import 'dotenv/config'

import compression from 'compression'
import helmet from 'helmet'
import cors from 'cors'
import json from 'express'
import { pool } from "./DB/db.js";

const app = express();

// Middleware

app.use(compression());
app.use(helmet());
app.use(cors());
app.use(json());
app.use(express.static('public'));


app.get("/utilisateurs", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, nom,prenom, email, role, actif, cree_le FROM utilisateurs ORDER BY cree_le DESC;"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur requête utilisateurs" });
    }
});


app.listen(process.env.PORT);
console.info(`Server running under port ${process.env.PORT}`);