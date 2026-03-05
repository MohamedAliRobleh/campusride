-- Migration: ajouter photo_url aux tables profils et vehicules
ALTER TABLE profils    ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE vehicules  ADD COLUMN IF NOT EXISTS photo_url TEXT;
