import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

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
      'TRAJET_TERMINE', 'TRAJET_ANNULE', 'RESERVATION_ANNULEE', 'MESSAGE_RECU'
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
          UNIQUE (evaluateur_id, evalue_id, trajet_id)
        );
      `);
      console.log("Migration evaluations OK");
    } catch (err) { console.error("Migration evaluations:", err.message); }

    // Migration: recalculer places_dispo pour les trajets PLANIFIE
    // (places_dispo = places_total - nombre de réservations actives)
    // Nécessaire car l'ancien code ne décrémentait qu'à l'acceptation
    try {
      await pool.query(`
        UPDATE trajets t
        SET places_dispo = GREATEST(0,
          t.places_total - (
            SELECT COUNT(*) FROM reservations r
            WHERE r.trajet_id = t.id
              AND r.statut IN ('EN_ATTENTE', 'ACCEPTEE')
          )
        )
        WHERE t.statut = 'PLANIFIE';
      `);
      console.log("Migration recalcul places_dispo OK");
    } catch (err) { console.error("Migration recalcul places_dispo:", err.message); }

    // Migration: remplacer l'ancienne contrainte UNIQUE(evaluateur_id, trajet_id)
    // par UNIQUE(evaluateur_id, evalue_id, trajet_id) pour permettre d'évaluer
    // plusieurs passagers par trajet
    // On utilise CREATE UNIQUE INDEX IF NOT EXISTS (compatible toutes versions PG)
    try {
      await pool.query(`
        ALTER TABLE evaluations
          DROP CONSTRAINT IF EXISTS evaluations_evaluateur_id_trajet_id_key;
      `);
    } catch (err) { console.error("Migration drop contrainte evaluations:", err.message); }
    try {
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS evaluations_evaluateur_evalue_trajet_key
        ON evaluations (evaluateur_id, evalue_id, trajet_id);
      `);
      console.log("Migration contrainte evaluations OK");
    } catch (err) { console.error("Migration contrainte evaluations:", err.message); }

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

    // Table pwa_installs — suivi des installations de l'application mobile
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pwa_installs (
          id             SERIAL PRIMARY KEY,
          utilisateur_id ${userRef} REFERENCES utilisateurs(id) ON DELETE SET NULL,
          source         VARCHAR(30) DEFAULT 'inconnu',
          installe_le    TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log("Migration pwa_installs OK");
    } catch (err) { console.error("Migration pwa_installs:", err.message); }

    // Migration: table signalements
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS signalements (
          id            TEXT PRIMARY KEY,
          signaleur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
          type          VARCHAR(20) NOT NULL CHECK (type IN ('UTILISATEUR', 'TRAJET')),
          cible_id      UUID NOT NULL,
          motif         VARCHAR(60) NOT NULL,
          description   TEXT,
          statut        VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                        CHECK (statut IN ('EN_ATTENTE', 'TRAITE', 'REJETE')),
          cree_le       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Migration signalements OK");
    } catch (err) { console.error("Migration signalements:", err.message); }

    // Migration: colonne niveau de gravité sur signalements (1=mineur, 2=modéré, 3=grave)
    try {
      await pool.query(`
        ALTER TABLE signalements ADD COLUMN IF NOT EXISTS niveau SMALLINT NOT NULL DEFAULT 2
          CHECK (niveau IN (1, 2, 3));
      `);
      console.log("Migration signalements.niveau OK");
    } catch (err) { console.error("Migration signalements.niveau:", err.message); }

    // Migration: colonne avertissements sur utilisateurs
    try {
      await pool.query(`
        ALTER TABLE utilisateurs
        ADD COLUMN IF NOT EXISTS avertissements INT NOT NULL DEFAULT 0;
      `);
      console.log("Migration avertissements OK");
    } catch (err) { console.error("Migration avertissements:", err.message); }

    console.log("Migrations OK");
  } catch (err) {
    console.error("Erreur migration:", err.message);
  }
}

