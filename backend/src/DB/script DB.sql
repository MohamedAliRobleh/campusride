-- ==========================================================
-- CampusRide - Script initial
-- ==========================================================

-- 0) Extension (UUID)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================================
-- 1) Types ENUM (avec toutes les valeurs dès le départ)
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
      'RESERVATION_ANNULEE'
    );
  END IF;
END $$;

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
  reset_password_expires_at TIMESTAMP
);

-- ==========================================================
-- 3) Table: profils
-- ==========================================================
CREATE TABLE IF NOT EXISTS profils (
  utilisateur_id        UUID PRIMARY KEY,
  telephone             VARCHAR(30),
  zones_depart_preferees VARCHAR(120)[] NOT NULL DEFAULT '{}',
  maj_le                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_profils_utilisateurs
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
    ON DELETE CASCADE
);

-- ==========================================================
-- 3bis) Table: vehicules
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
  maj_le          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_vehicules_utilisateur
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_vehicules_plaque UNIQUE (plaque)
);

CREATE INDEX IF NOT EXISTS idx_vehicules_plaque ON vehicules(plaque);

-- ==========================================================
-- 4) Table: trajets
-- ==========================================================
CREATE TABLE IF NOT EXISTS trajets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conducteur_id    UUID NOT NULL,
  lieu_depart      VARCHAR(200) NOT NULL,
  destination      VARCHAR(200) NOT NULL,
  dateheure_depart TIMESTAMPTZ NOT NULL,
  places_total     INT NOT NULL CHECK (places_total > 0),
  places_dispo     INT NOT NULL CHECK (places_dispo >= 0),
  statut           statut_trajet NOT NULL DEFAULT 'PLANIFIE',
  cree_le          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  maj_le           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_trajets_conducteur
    FOREIGN KEY (conducteur_id) REFERENCES utilisateurs(id)
);

-- ==========================================================
-- 5) Table: reservations
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
-- 6) Table: notifications
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

  
  