/**
 * @fileoverview Connexion à la base de données PostgreSQL via un pool de connexions.
 *
 * En production, utilise la variable DATABASE_URL (fournie par Render).
 * En développement, utilise les variables DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.
 *
 * @module DB/db
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

/**
 * Pool de connexions PostgreSQL partagé dans toute l'application.
 *
 * - En production : connexion SSL via DATABASE_URL.
 * - En développement : connexion locale via variables d'environnement individuelles.
 *
 * @type {pg.Pool}
 * @example
 * import { pool } from "../DB/db.js";
 * const { rows } = await pool.query("SELECT * FROM utilisateurs WHERE id = $1", [id]);
 */
export const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);
