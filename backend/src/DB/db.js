import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Auto-migrations: ajoute les colonnes manquantes sans casser l'existant
export async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE profils   ADD COLUMN IF NOT EXISTS photo_url TEXT;
      ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS photo_url TEXT;
      ALTER TABLE trajets   ADD COLUMN IF NOT EXISTS depart_lat DOUBLE PRECISION;
      ALTER TABLE trajets   ADD COLUMN IF NOT EXISTS depart_lng DOUBLE PRECISION;
      ALTER TABLE trajets   ADD COLUMN IF NOT EXISTS dest_lat   DOUBLE PRECISION;
      ALTER TABLE trajets   ADD COLUMN IF NOT EXISTS dest_lng   DOUBLE PRECISION;
    `);

    // Ajouter les valeurs manquantes à l'enum type_notification
    // ALTER TYPE ADD VALUE ne peut pas s'exécuter dans une transaction explicite
    const enumValues = [
      'TRAJET_PUBLIE', 'DEMANDE_RESERVATION', 'RESERVATION_ACCEPTEE',
      'RESERVATION_REFUSEE', 'RAPPEL_TRAJET', 'TRAJET_MODIFIE',
      'TRAJET_TERMINE', 'TRAJET_ANNULE', 'RESERVATION_ANNULEE'
    ];
    for (const val of enumValues) {
      try {
        await pool.query(`ALTER TYPE type_notification ADD VALUE IF NOT EXISTS '${val}'`);
      } catch { /* valeur déjà présente */ }
    }

    // Activer l'extension pgcrypto pour gen_random_uuid()
    try {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    } catch { /* déjà présente */ }

    // Déterminer le type de la PK utilisateurs (UUID ou INTEGER)
    const pkTypeRes = await pool.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'utilisateurs' AND column_name = 'id'
      LIMIT 1;
    `);
    const userIdType = pkTypeRes.rows[0]?.data_type ?? 'integer';
    const isUUID = userIdType.toLowerCase().includes('uuid');

    // Déterminer le type de la PK trajets
    const trajetPkRes = await pool.query(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'trajets' AND column_name = 'id'
      LIMIT 1;
    `);
    const trajetIdType = trajetPkRes.rows[0]?.data_type ?? 'integer';
    const trajetIsUUID = trajetIdType.toLowerCase().includes('uuid');

    const evalUid   = isUUID       ? "UUID"    : "INTEGER";
    const trajetUid = trajetIsUUID ? "UUID"    : "INTEGER";
    const userRef   = isUUID       ? "UUID"    : "INTEGER"; // FK vers utilisateurs.id
    const evalPk    = isUUID       ? "UUID PRIMARY KEY DEFAULT gen_random_uuid()" : "SERIAL PRIMARY KEY";

    // Table evaluations (système de notation) — sans FK pour compatibilité maximale
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id            ${evalPk},
          evaluateur_id ${evalUid}  NOT NULL,
          evalue_id     ${evalUid}  NOT NULL,
          trajet_id     ${trajetUid} NOT NULL,
          note          SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5),
          commentaire   TEXT,
          cree_le       TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE (evaluateur_id, trajet_id)
        );
      `);
      console.log("Migration evaluations OK");
    } catch (err) { console.error("Migration evaluations:", err.message); }

    // Vérifier si conversations/messages ont le bon type de colonnes
    // Si type mismatch (ex. UUID créé avant mais user IDs sont INTEGER), on recrée
    try {
      const convCol = await pool.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'conversations' AND column_name = 'user1_id' LIMIT 1
      `);
      if (convCol.rows.length > 0) {
        const existingType = convCol.rows[0].data_type.toLowerCase();
        const needsUUID = isUUID;
        const hasUUID   = existingType.includes('uuid');
        if (needsUUID !== hasUUID) {
          // Type incompatible — on supprime et recrée
          await pool.query(`DROP TABLE IF EXISTS messages; DROP TABLE IF EXISTS conversations;`);
          console.log("Migration: tables conversations/messages supprimées (type mismatch), recréation...");
        }
      }
    } catch (err) { console.error("Migration check type:", err.message); }

    // Table conversations — SERIAL PK pour éviter toute dépendance pgcrypto
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id       SERIAL PRIMARY KEY,
          user1_id ${userRef} NOT NULL,
          user2_id ${userRef} NOT NULL,
          cree_le  TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("Migration conversations OK");
    } catch (err) { console.error("Migration conversations:", err.message); }

    // Table messages — SERIAL PK pour éviter toute dépendance pgcrypto
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id              SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL,
          expediteur_id   ${userRef} NOT NULL,
          contenu         TEXT NOT NULL,
          lu              BOOLEAN DEFAULT FALSE,
          envoye_le       TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("Migration messages OK");
    } catch (err) { console.error("Migration messages:", err.message); }

    console.log("Migrations OK");
  } catch (err) {
    console.error("Erreur migration:", err.message);
  }
}

