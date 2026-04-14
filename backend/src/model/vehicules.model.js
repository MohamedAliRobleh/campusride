/**
 * @fileoverview Couche d'accès aux données pour la gestion des véhicules.
 *
 * Toutes les opérations critiques (ajout, suppression) sont réalisées dans des
 * transactions PostgreSQL afin de garantir la cohérence entre les tables
 * `vehicules`, `utilisateurs`, `trajets` et `reservations`.
 *
 * @module model/vehicules.model
 */

import { pool } from "../DB/db.js";

/**
 * Ajoute un véhicule et met à jour le rôle de l'utilisateur en CONDUCTEUR (transaction).
 *
 * Étapes de la transaction :
 * 1. Insérer le véhicule dans la table `vehicules`.
 * 2. Mettre à jour le rôle de l'utilisateur à CONDUCTEUR.
 *
 * @async
 * @param {Object} params           - Données du véhicule et de l'utilisateur.
 * @param {string} params.userId    - UUID du propriétaire du véhicule.
 * @param {string} params.marque    - Marque du véhicule (ex. : Toyota).
 * @param {string} params.modele    - Modèle du véhicule (ex. : Corolla).
 * @param {number} params.annee     - Année de fabrication (1990 – année courante + 1).
 * @param {string} params.plaque    - Numéro de plaque d'immatriculation (unique).
 * @param {string} params.couleur   - Couleur du véhicule.
 * @param {number} params.nb_places - Nombre de places offertes (1–8).
 * @returns {Promise<{vehicule: Object, user: Object}>} Véhicule et utilisateur mis à jour.
 * @throws {Error} En cas d'échec SQL — la transaction est annulée.
 *
 * @example
 * const { vehicule, user } = await ajouterVehiculeEtMajConducteur({
 *   userId: "uuid-123", marque: "Toyota", modele: "Corolla",
 *   annee: 2020, plaque: "ABC-1234", couleur: "Rouge", nb_places: 3
 * });
 */
export async function ajouterVehiculeEtMajConducteur({
  userId, marque, modele, annee, plaque, couleur, nb_places
}) {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Insérer le  véhicule
    const insertVehiculeQuery = `
      INSERT INTO vehicules (
        utilisateur_id,
        marque,
        modele,
        annee,
        plaque,
        couleur,
        nb_places,
        maj_le
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;

    const vehiculeRes = await client.query(insertVehiculeQuery, [
      userId,
      marque,
      modele,
      annee,
      plaque,
      couleur,
      nb_places
    ]);

    // Mettre à jour rôle .
    const updateRoleQuery = `
      UPDATE utilisateurs
      SET role = 'CONDUCTEUR'
      WHERE id = $1
      RETURNING id, role;
    `;

    const userRes = await client.query(updateRoleQuery, [userId]);

    await client.query("COMMIT");

    return {
      vehicule: vehiculeRes.rows[0],
      user: userRes.rows[0]
    };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();
  }
}

/**
 * Vérifie si un utilisateur possède déjà un véhicule enregistré.
 *
 * @async
 * @param {string} userId - UUID de l'utilisateur.
 * @returns {Promise<boolean>} `true` si un véhicule existe, `false` sinon.
 *
 * @example
 * if (await hasVehicule("uuid-123")) {
 *   return res.status(409).json({ error: "Un véhicule est déjà enregistré." });
 * }
 */
export async function hasVehicule(userId) {

  const { rows } = await pool.query(
    "SELECT 1 FROM vehicules WHERE utilisateur_id = $1",
    [userId]
  );

  return rows.length > 0;
}

/**
 * Récupère le véhicule enregistré d'un utilisateur.
 *
 * @async
 * @param {string} userId - UUID de l'utilisateur propriétaire.
 * @returns {Promise<Object|null>} Objet véhicule complet, ou null si aucun véhicule.
 *
 * @example
 * const vehicule = await getVehiculeByUserId("uuid-123");
 * // → { id, marque, modele, annee, couleur, plaque, nb_places, photo_url, ... }
 */
export async function getVehiculeByUserId(userId) {

  const { rows } = await pool.query(
    `
    SELECT
      id,
      utilisateur_id,
      marque,
      modele,
      annee,
      couleur,
      plaque,
      nb_places,
      photo_url,
      maj_le
    FROM vehicules
    WHERE utilisateur_id = $1
    `,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * Met à jour les informations d'un véhicule existant.
 *
 * @async
 * @param {string} userId              - UUID du propriétaire.
 * @param {Object} data                - Nouvelles données du véhicule.
 * @param {string} data.marque         - Marque du véhicule.
 * @param {string} data.modele         - Modèle du véhicule.
 * @param {number} data.annee          - Année de fabrication.
 * @param {string} data.plaque         - Numéro de plaque.
 * @param {string} data.couleur        - Couleur du véhicule.
 * @param {number} data.nb_places      - Nombre de places (1–8).
 * @returns {Promise<Object|null>} Véhicule mis à jour, ou null si non trouvé.
 */
export async function updateVehiculeByUserId(userId, data) {

  const {
    marque,
    modele,
    annee,
    plaque,
    couleur,
    nb_places
  } = data;

  const { rows } = await pool.query(
    `
    UPDATE vehicules
    SET
      marque = $1,
      modele = $2,
      annee = $3,
      plaque = $4,
      couleur = $5,
      nb_places = $6,
      maj_le = NOW()
    WHERE utilisateur_id = $7
    RETURNING *;
    `,
    [
      marque,
      modele,
      annee,
      plaque,
      couleur,
      nb_places,
      userId
    ]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * Met à jour l'URL de la photo du véhicule d'un utilisateur.
 *
 * @async
 * @param {string} userId   - UUID du propriétaire.
 * @param {string} photoUrl - URL publique de la nouvelle photo.
 * @returns {Promise<{photo_url: string}|null>} Objet avec la nouvelle URL, ou null si non trouvé.
 */
export async function updateVehiculePhoto(userId, photoUrl) {
  const { rows } = await pool.query(
    `UPDATE vehicules SET photo_url = $1, maj_le = NOW()
     WHERE utilisateur_id = $2 RETURNING photo_url;`,
    [photoUrl, userId]
  );
  return rows[0] ?? null;
}

/**
 * Supprime le véhicule d'un utilisateur et rétablit son rôle à PASSAGER (transaction).
 *
 * Étapes de la transaction :
 * 1. Restaurer `places_dispo` pour les trajets PLANIFIE touchés par des réservations actives.
 * 2. Annuler toutes les réservations EN_ATTENTE et ACCEPTEE liées aux trajets PLANIFIE.
 * 3. Insérer des notifications pour les passagers affectés.
 * 4. Marquer les trajets PLANIFIE du conducteur comme ANNULE.
 * 5. Supprimer le véhicule.
 * 6. Rétrograder le rôle de l'utilisateur à PASSAGER.
 *
 * @async
 * @param {string} userId - UUID du conducteur.
 * @returns {Promise<{success: true}>} Confirmation de succès.
 * @throws {Error} En cas d'échec SQL — la transaction est annulée.
 */
export async function supprimerVehiculeEtRevertRole(userId) {

  // On ouvre une connexion dédiée
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Annuler les trajets PLANIFIE du conducteur et restaurer les places des passagers EN_ATTENTE/ACCEPTEE
    // 1. Remettre places_dispo pour chaque réservation active.
    await client.query(
      `UPDATE trajets
       SET places_dispo = places_dispo + (
         SELECT COUNT(*) FROM reservations
         WHERE trajet_id = trajets.id AND statut IN ('EN_ATTENTE', 'ACCEPTEE')
       )
       WHERE conducteur_id = $1 AND statut = 'PLANIFIE'`,
      [userId]
    );

    // 2. Annuler les réservations EN_ATTENTE et ACCEPTEE liées à ces trajets.
    await client.query(
      `UPDATE reservations SET statut = 'ANNULEE', reponse_le = NOW()
       WHERE trajet_id IN (
         SELECT id FROM trajets WHERE conducteur_id = $1 AND statut = 'PLANIFIE'
       ) AND statut IN ('EN_ATTENTE', 'ACCEPTEE')`,
      [userId]
    );

    // 3. Notifier les passagers affectés.
    await client.query(
      `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
       SELECT r.passager_id, 'RESERVATION_ANNULEE',
              'Le conducteur a supprimé son véhicule. Votre réservation pour le trajet '
              || t.lieu_depart || ' → ' || t.destination || ' a été annulée.',
              NOW()
       FROM reservations r
       JOIN trajets t ON t.id = r.trajet_id
       WHERE t.conducteur_id = $1 AND t.statut = 'PLANIFIE' AND r.statut = 'ANNULEE'
         AND r.reponse_le >= NOW() - INTERVAL '5 seconds'`,
      [userId]
    );

    // 4. Annuler les trajets PLANIFIE eux-mêmes.
    await client.query(
      `UPDATE trajets SET statut = 'ANNULE', maj_le = NOW()
       WHERE conducteur_id = $1 AND statut = 'PLANIFIE'`,
      [userId]
    );

    // Supprimer le véhicule.
    await client.query(
      `DELETE FROM vehicules WHERE utilisateur_id = $1`,
      [userId]
    );

    // Remettre le rôle PASSAGER.
    await client.query(
      `UPDATE utilisateurs SET role = 'PASSAGER' WHERE id = $1`,
      [userId]
    );

    await client.query("COMMIT");

    return { success: true };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
}