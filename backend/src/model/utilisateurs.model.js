/**
 * @fileoverview Couche d'accès aux données pour les utilisateurs et leurs profils.
 *
 * Ce module expose les fonctions de lecture et d'écriture sur les tables
 * `utilisateurs` et `profils` de la base de données PostgreSQL.
 *
 * @module model/utilisateurs.model
 */

import { pool } from "../DB/db.js";

/**
 * Récupère le rôle d'un utilisateur actif par son identifiant.
 *
 * @async
 * @param {string} userId - UUID de l'utilisateur.
 * @returns {Promise<string|null>} Le rôle (PASSAGER, CONDUCTEUR ou ADMIN), ou null si introuvable/inactif.
 *
 * @example
 * const role = await getUserRole("uuid-123");
 * // → "CONDUCTEUR"
 */
export async function getUserRole(userId) {
  const { rows } = await pool.query(
    "SELECT role FROM utilisateurs WHERE id = $1 AND actif = TRUE",
    [userId]
  );
  return rows[0]?.role ?? null;
}

/**
 * Récupère le profil complet d'un utilisateur actif (données de base + profil étendu).
 *
 * Effectue une jointure LEFT JOIN avec la table `profils` pour inclure
 * les informations optionnelles (téléphone, zones préférées, photo, bio).
 *
 * @async
 * @param {string} userId - UUID de l'utilisateur.
 * @returns {Promise<Object|null>} Objet utilisateur avec les champs du profil, ou null si introuvable/inactif.
 * @returns {string}  return.id
 * @returns {string}  return.prenom
 * @returns {string}  return.nom
 * @returns {string}  return.email
 * @returns {string}  return.role
 * @returns {boolean} return.actif
 * @returns {Date}    return.cree_le
 * @returns {string|null} return.telephone
 * @returns {string[]|null} return.zones_depart_preferees
 * @returns {string|null} return.photo_url
 * @returns {string|null} return.bio
 *
 * @example
 * const user = await getUserById("uuid-123");
 * if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
 */
export async function getUserById(userId) {
  const { rows } = await pool.query(
    `
    SELECT
      u.id,
      u.prenom,
      u.nom,
      u.email,
      u.role,
      u.actif,
      u.cree_le,
      p.telephone,
      p.zones_depart_preferees,
      p.photo_url,
      p.bio
    FROM utilisateurs u
    LEFT JOIN profils p ON p.utilisateur_id = u.id
    WHERE u.id = $1
      AND u.actif = TRUE
    `,
    [userId]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

/**
 * Met à jour (ou crée) la photo de profil d'un utilisateur.
 *
 * Utilise un UPSERT (INSERT … ON CONFLICT … DO UPDATE) pour créer la ligne
 * de profil si elle n'existe pas encore, ou mettre à jour la photo existante.
 *
 * @async
 * @param {string} userId   - UUID de l'utilisateur.
 * @param {string} photoUrl - URL publique de la nouvelle photo (Cloudinary ou chemin local).
 * @returns {Promise<{photo_url: string}>} Objet contenant la nouvelle URL de la photo.
 *
 * @example
 * const result = await updateUserPhoto("uuid-123", "https://res.cloudinary.com/campusride/photo.jpg");
 * // → { photo_url: "https://res.cloudinary.com/campusride/photo.jpg" }
 */
export async function updateUserPhoto(userId, photoUrl) {
  const { rows } = await pool.query(
    `INSERT INTO profils (utilisateur_id, photo_url, maj_le)
     VALUES ($1, $2, NOW())
     ON CONFLICT (utilisateur_id)
     DO UPDATE SET photo_url = EXCLUDED.photo_url, maj_le = NOW()
     RETURNING photo_url;`,
    [userId, photoUrl]
  );
  return rows[0];
}

/**
 * Met à jour (ou crée) le profil étendu d'un utilisateur.
 *
 * Effectue un UPSERT sur la table `profils` pour les champs :
 * téléphone, zones de départ préférées et biographie.
 *
 * @async
 * @param {string}        userId    - UUID de l'utilisateur.
 * @param {string|null}   telephone - Numéro de téléphone (peut être null).
 * @param {string[]|null} zones     - Tableau des zones de départ préférées (peut être null).
 * @param {string|null}   bio       - Biographie (max 500 caractères, peut être null).
 * @returns {Promise<Object>} Ligne de profil complète après mise à jour.
 *
 * @example
 * const profil = await updateUserProfile("uuid-123", "613-555-0101", ["Orléans", "Barrhaven"], "Étudiant en TI.");
 */
export async function updateUserProfile(userId, telephone, zones, bio) {
  const { rows } = await pool.query(
    `
    INSERT INTO profils (utilisateur_id, telephone, zones_depart_preferees, bio, maj_le)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (utilisateur_id)
    DO UPDATE SET
      telephone               = EXCLUDED.telephone,
      zones_depart_preferees  = EXCLUDED.zones_depart_preferees,
      bio                     = EXCLUDED.bio,
      maj_le                  = NOW()
    RETURNING *;
    `,
    [userId, telephone, zones, bio ?? null]
  );
  return rows[0];
}
