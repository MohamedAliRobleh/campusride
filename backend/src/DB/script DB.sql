-- ==========================================================
-- CampusRide - Script complet final
-- Base initiale + tables/colonnes manquantes des migrations
-- UUID conservés partout
-- ==========================================================

-- ==========================================================
-- 0) Extension UUID
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================================
-- 1) Types ENUM
-- ==========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_utilisateur') THEN
    CREATE TYPE role_utilisateur AS ENUM ('PASSAGER', 'CONDUCTEUR', 'ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_trajet') THEN
    CREATE TYPE statut_trajet AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_reservation') THEN
    CREATE TYPE statut_reservation AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'ANNULEE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_notification') THEN
    CREATE TYPE type_notification AS ENUM (
      'TRAJET_PUBLIE',
      'DEMANDE_RESERVATION',
      'RESERVATION_ACCEPTEE',
      'RESERVATION_REFUSEE',
      'RAPPEL_TRAJET',
      'TRAJET_MODIFIE',
      'TRAJET_TERMINE',
      'TRAJET_ANNULE',
      'RESERVATION_ANNULEE',
      'MESSAGE_RECU',
      'AVERTISSEMENT',
      'SIGNALEMENT_RECU'
    );
  END IF;
END $$;

-- Sécurité si le type existait déjà avec moins de valeurs
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'TRAJET_MODIFIE';
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'TRAJET_TERMINE';
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'TRAJET_ANNULE';
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'RESERVATION_ANNULEE';
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'MESSAGE_RECU';
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'AVERTISSEMENT';
ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'SIGNALEMENT_RECU';

-- ==========================================================
-- 2) Table: utilisateurs
-- ==========================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom                    VARCHAR(80) NOT NULL,
  nom                       VARCHAR(80) NOT NULL,
  email                     VARCHAR(180) NOT NULL UNIQUE,
  mot_de_passe_hash         TEXT NOT NULL,
  role                      role_utilisateur NOT NULL DEFAULT 'PASSAGER',
  actif                     BOOLEAN NOT NULL DEFAULT TRUE,
  cree_le                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reset_password_token_hash TEXT,
  reset_password_expires_at TIMESTAMP,
  avertissements            INT NOT NULL DEFAULT 0
);

-- ==========================================================
-- 3) Table: profils
-- ==========================================================
CREATE TABLE IF NOT EXISTS profils (
  utilisateur_id         UUID PRIMARY KEY,
  telephone              VARCHAR(30),
  zones_depart_preferees VARCHAR(120)[] NOT NULL DEFAULT '{}',
  photo_url              TEXT,
  bio                    TEXT,
  maj_le                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_profils_utilisateurs
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
    ON DELETE CASCADE
);

-- ==========================================================
-- 4) Table: vehicules
-- ==========================================================
CREATE TABLE IF NOT EXISTS vehicules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id  UUID NOT NULL UNIQUE,
  marque          VARCHAR(80) NOT NULL,
  modele          VARCHAR(80) NOT NULL,
  annee           INT,
  couleur         VARCHAR(40),
  plaque          VARCHAR(20),
  nb_places       INT NOT NULL DEFAULT 4 CHECK (nb_places BETWEEN 1 AND 8),
  photo_url       TEXT,
  maj_le          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_vehicules_utilisateur
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_vehicules_plaque UNIQUE (plaque)
);

CREATE INDEX IF NOT EXISTS idx_vehicules_plaque ON vehicules(plaque);

-- ==========================================================
-- 5) Table: trajets
-- ==========================================================
CREATE TABLE IF NOT EXISTS trajets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conducteur_id      UUID NOT NULL,
  lieu_depart        VARCHAR(200) NOT NULL,
  destination        VARCHAR(200) NOT NULL,
  dateheure_depart   TIMESTAMPTZ NOT NULL,
  places_total       INT NOT NULL CHECK (places_total > 0),
  places_dispo       INT NOT NULL CHECK (places_dispo >= 0),
  statut             statut_trajet NOT NULL DEFAULT 'PLANIFIE',
  depart_lat         DOUBLE PRECISION,
  depart_lng         DOUBLE PRECISION,
  dest_lat           DOUBLE PRECISION,
  dest_lng           DOUBLE PRECISION,
  conducteur_lat     DOUBLE PRECISION,
  conducteur_lng     DOUBLE PRECISION,
  cree_le            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  maj_le             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_trajets_conducteur
    FOREIGN KEY (conducteur_id) REFERENCES utilisateurs(id)
);

-- ==========================================================
-- 6) Table: reservations
-- ==========================================================
CREATE TABLE IF NOT EXISTS reservations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trajet_id    UUID NOT NULL,
  passager_id  UUID NOT NULL,
  statut       statut_reservation NOT NULL DEFAULT 'EN_ATTENTE',
  demande_le   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reponse_le   TIMESTAMPTZ,
  CONSTRAINT fk_reservations_trajet
    FOREIGN KEY (trajet_id) REFERENCES trajets(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reservations_passager
    FOREIGN KEY (passager_id) REFERENCES utilisateurs(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_trajet_passager
  ON reservations (trajet_id, passager_id);

-- ==========================================================
-- 7) Table: notifications
-- ==========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id  UUID NOT NULL,
  type            type_notification NOT NULL,
  message         TEXT NOT NULL,
  cree_le         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lu_le           TIMESTAMPTZ,
  CONSTRAINT fk_notifications_utilisateur
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
    ON DELETE CASCADE
);

-- ==========================================================
-- 8) Table: conversations
-- ==========================================================
CREATE TABLE IF NOT EXISTS conversations (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  user2_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  cree_le   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user1_id, user2_id)
);

-- ==========================================================
-- 9) Table: messages
-- ==========================================================
CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  expediteur_id    UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  contenu          TEXT NOT NULL,
  lu               BOOLEAN DEFAULT FALSE,
  envoye_le        TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 10) Table: signalements
-- ==========================================================
CREATE TABLE IF NOT EXISTS signalements (
  id            TEXT PRIMARY KEY,
  signaleur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('UTILISATEUR', 'TRAJET')),
  cible_id      UUID NOT NULL,
  motif         VARCHAR(60) NOT NULL,
  description   TEXT,
  statut        VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                CHECK (statut IN ('EN_ATTENTE', 'TRAITE', 'REJETE')),
  niveau        SMALLINT NOT NULL DEFAULT 2 CHECK (niveau IN (1, 2, 3)),
  note_admin    TEXT,
  note_admin_le TIMESTAMPTZ,
  cree_le       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================================
-- 11) Table: evaluations
-- ==========================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluateur_id UUID NOT NULL,
  evalue_id     UUID NOT NULL,
  trajet_id     UUID NOT NULL,
  note          SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire   TEXT,
  cree_le       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_evaluations_evaluateur_evalue_trajet
    UNIQUE (evaluateur_id, evalue_id, trajet_id)
);

-- ==========================================================
-- 12) Table: pwa_installs
-- ==========================================================
CREATE TABLE IF NOT EXISTS pwa_installs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  source         VARCHAR(30) DEFAULT 'inconnu',
  installe_le    TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 13) Table: blocages
-- ==========================================================
CREATE TABLE IF NOT EXISTS blocages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloqueur_id  UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  bloque_id    UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  cree_le      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_blocages_bloqueur_bloque UNIQUE (bloqueur_id, bloque_id)
);

-- ==========================================================
-- 14) Index utiles
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur_id ON notifications(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_reservations_trajet_id ON reservations(trajet_id);
CREATE INDEX IF NOT EXISTS idx_reservations_passager_id ON reservations(passager_id);
CREATE INDEX IF NOT EXISTS idx_trajets_conducteur_id ON trajets(conducteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_expediteur_id ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_signalements_signaleur_id ON signalements(signaleur_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evalue_id ON evaluations(evalue_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_trajet_id ON evaluations(trajet_id);
CREATE INDEX IF NOT EXISTS idx_blocages_bloqueur_id ON blocages(bloqueur_id);
CREATE INDEX IF NOT EXISTS idx_blocages_bloque_id ON blocages(bloque_id);

-- ==========================================================
-- Fin
-- ==========================================================