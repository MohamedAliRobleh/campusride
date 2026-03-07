-- Migration: table signalements
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
