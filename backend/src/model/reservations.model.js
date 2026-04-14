/**
 * @fileoverview Couche d'accès aux données pour les réservations de trajets.
 *
 * Toutes les opérations de mutation utilisent des transactions PostgreSQL
 * pour garantir la cohérence des données (places disponibles, statuts, notifications).
 *
 * Codes d'erreur retournés (champ `error`) :
 * - `TRAJET_NOT_FOUND`        : le trajet n'existe pas.
 * - `CANNOT_RESERVE_OWN_TRAJET` : le conducteur tente de réserver son propre trajet.
 * - `TRAJET_NOT_PLANIFIE`     : le trajet n'est pas en statut PLANIFIE.
 * - `TRAJET_PAST`             : la date de départ est déjà passée.
 * - `NO_PLACES_AVAILABLE`     : plus aucune place disponible.
 * - `MAX_PENDING_REACHED`     : le passager a déjà 5 demandes EN_ATTENTE.
 * - `ALREADY_RESERVED`        : une réservation active existe déjà.
 * - `RESERVATION_NOT_FOUND`   : la réservation n'existe pas.
 * - `NOT_OWNER`               : l'utilisateur n'est pas propriétaire de la ressource.
 * - `NOT_PENDING`             : la réservation n'est pas en statut EN_ATTENTE.
 * - `ALREADY_CLOSED`          : la réservation est déjà terminée ou annulée.
 * - `TRAJET_ALREADY_STARTED`  : le trajet est EN_COURS ou TERMINE.
 * - `CANCELLATION_TOO_LATE`   : annulation à moins de 30 minutes du départ.
 *
 * @module model/reservations.model
 */

import { pool } from "../DB/db.js";
import { sendPushToUser } from "../utils/pushNotification.js";
import {
  emailNouvelleReservation,
  emailReservationAcceptee,
  emailReservationRefusee,
  emailReservationAnnuleeParPassager,
} from "../utils/sendEmail.js";

const APP_URL = process.env.APP_URL || "https://campusride-delta.vercel.app";


/**
 * Crée une réservation pour un passager sur un trajet (transaction).
 *
 * Effectue toutes les validations métier avant d'insérer :
 * - Trajet existant, PLANIFIE, futur, avec des places disponibles.
 * - Le passager ne réserve pas son propre trajet.
 * - Pas plus de 5 demandes EN_ATTENTE simultanées.
 * - Si une réservation REFUSEE ou ANNULEE existe, elle est réactivée plutôt que dupliquée.
 * Décrémente `places_dispo` dès la création (avant acceptation).
 * Notifie le conducteur par notification in-app, push et courriel.
 *
 * @async
 * @param {string} passagerId - UUID du passager.
 * @param {string} trajetId   - UUID du trajet.
 * @returns {Promise<{reservation: Object}|{error: string}>}
 *   Objet `reservation` en cas de succès, ou objet `error` avec un code d'erreur.
 * @throws {Error} En cas d'erreur SQL inattendue.
 */
export async function createReservation(passagerId, trajetId) {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const trajetRes = await client.query(
      `
  SELECT
    t.id, t.conducteur_id, t.statut, t.places_total, t.places_dispo,
    t.dateheure_depart, t.lieu_depart, t.destination,
    u.email AS conducteur_email
  FROM trajets t
  JOIN utilisateurs u ON u.id = t.conducteur_id
  WHERE t.id = $1
  FOR UPDATE OF t
  `,
      [trajetId]
    );

    if (trajetRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "TRAJET_NOT_FOUND" };
    }

    const trajet = trajetRes.rows[0];

    const userRes = await client.query(
      `SELECT prenom, email FROM utilisateurs WHERE id = $1`,
      [passagerId]
    );

    const prenom = userRes.rows[0]?.prenom || "Un utilisateur";


    if (trajet.conducteur_id === passagerId) {
      await client.query("ROLLBACK");
      return { error: "CANNOT_RESERVE_OWN_TRAJET" };
    }

    // Vérifier statut du trajet
    if (trajet.statut !== "PLANIFIE") {
      await client.query("ROLLBACK");
      return { error: "TRAJET_NOT_PLANIFIE" };
    }

    // DOUBLE SÉCURITÉ DATE PASSÉE
    const maintenant = new Date();

    if (new Date(trajet.dateheure_depart) <= maintenant) {
      await client.query("ROLLBACK");
      return { error: "TRAJET_PAST" };
    }

    // places_dispo est décrémenté dès la CRÉATION (pas à l'acceptation)
    // → 0 signifie que toutes les places sont soit réservées soit en attente
    if (trajet.places_dispo <= 0) {
      await client.query("ROLLBACK");
      return { error: "NO_PLACES_AVAILABLE" };
    }

    // Max 5 réservations EN_ATTENTE simultanées par passager
    const pendingCount = await client.query(
      `SELECT COUNT(*) FROM reservations WHERE passager_id = $1 AND statut = 'EN_ATTENTE'`,
      [passagerId]
    );
    if (parseInt(pendingCount.rows[0].count, 10) >= 5) {
      await client.query("ROLLBACK");
      return { error: "MAX_PENDING_REACHED" };
    }

    // Vérifier si une réservation si elle existe déjà pour ce passager + trajet.
    const existingRes = await client.query(
      `SELECT id, statut FROM reservations WHERE passager_id = $1 AND trajet_id = $2`,
      [passagerId, trajetId]
    );

    let reservationRes;

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      // Déjà EN_ATTENTE ou ACCEPTEE → impossible de re-réserver.
      if (existing.statut === "EN_ATTENTE" || existing.statut === "ACCEPTEE") {
        await client.query("ROLLBACK");
        return { error: "ALREADY_RESERVED" };
      }
      // REFUSÉE ou ANNULEE → réactiver la réservation existante.
      reservationRes = await client.query(
        `UPDATE reservations
         SET statut = 'EN_ATTENTE', demande_le = NOW(), reponse_le = NULL
         WHERE id = $1
         RETURNING *;`,
        [existing.id]
      );
    } else {
      // Insérer une nouvelle réservation.
      reservationRes = await client.query(
        `INSERT INTO reservations (trajet_id, passager_id)
         VALUES ($1, $2)
         RETURNING *;`,
        [trajetId, passagerId]
      );
    }

    // Décrémenter places_dispo dès la création/réactivation de la demande.
    await client.query(
      `UPDATE trajets SET places_dispo = places_dispo - 1 WHERE id = $1`,
      [trajetId]
    );

    // ======================================
    // Créer notification pour le conducteur.
    // ======================================
    await client.query(
      `
  INSERT INTO notifications (
    utilisateur_id,
    type,
    message,
    cree_le
  )
  VALUES ($1, 'DEMANDE_RESERVATION', $2, NOW());
  `,
      [
        trajet.conducteur_id,
        `Nouvelle demande de ${prenom} pour votre trajet ${trajet.lieu_depart} → ${trajet.destination}`
      ]
    );

    // Valider la transaction
    await client.query("COMMIT");

    // Push + email au conducteur
    sendPushToUser(
      trajet.conducteur_id,
      "Nouvelle demande de réservation",
      `${prenom} veut rejoindre votre trajet ${trajet.lieu_depart} → ${trajet.destination}`,
      "/conducteur/reservations-recues"
    );
    if (trajet.conducteur_email) {
      emailNouvelleReservation({
        to: trajet.conducteur_email,
        passagerPrenom: prenom,
        depart: trajet.lieu_depart,
        destination: trajet.destination,
        appUrl: APP_URL,
      });
    }

    return { reservation: reservationRes.rows[0] };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();
  }
}

/**
 * Récupère toutes les réservations associées aux trajets d’un conducteur.
 *
 * Inclut les informations du passager (nom, photo) et du trajet (lieux, date, statut).
 * Retourne jusqu’à 200 réservations triées par date de demande décroissante.
 *
 * @async
 * @param {string} conducteurId - UUID du conducteur.
 * @returns {Promise<Object[]>} Tableau de réservations enrichies.
 */
export async function listReservationsForConducteur(conducteurId) {
  const { rows } = await pool.query(
    `
    SELECT
  r.id AS reservation_id,
  r.statut,
  r.demande_le,
  r.reponse_le,
  r.passager_id,
  u.prenom,
  u.nom,
  u.email,
  p.photo_url AS passager_photo_url,
  t.id AS trajet_id,
  t.lieu_depart,
  t.destination,
  t.dateheure_depart,
  t.places_dispo,
  t.statut AS trajet_statut
FROM reservations r
JOIN trajets t ON t.id = r.trajet_id
JOIN utilisateurs u ON u.id = r.passager_id
LEFT JOIN profils p ON p.utilisateur_id = r.passager_id
WHERE t.conducteur_id = $1
ORDER BY r.demande_le DESC
LIMIT 200;
    `,
    [conducteurId]
  );

  return rows;
}
/**
 * Accepte une réservation EN_ATTENTE (transaction).
 *
 * Vérifie que le conducteur est bien propriétaire du trajet et que la réservation
 * est en statut EN_ATTENTE. Met à jour le statut à ACCEPTEE et notifie le passager
 * par notification in-app, push et courriel.
 *
 * @async
 * @param {string} conducteurId   - UUID du conducteur qui accepte.
 * @param {string} reservationId  - UUID de la réservation à accepter.
 * @returns {Promise<{reservation: Object, trajet: Object}|{error: string}>}
 * @throws {Error} En cas d'erreur SQL inattendue.
 */
export async function acceptReservation(conducteurId, reservationId) {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // Charger réservation + trajet
    const { rows } = await client.query(
      `
      SELECT
        r.id AS reservation_id,
        r.statut AS reservation_statut,
        r.passager_id,
        r.trajet_id,
        t.conducteur_id,
        t.places_dispo,
        t.statut AS trajet_statut,
        t.lieu_depart,
        t.destination,
        t.dateheure_depart,
        u.email AS passager_email
      FROM reservations r
      JOIN trajets t ON t.id = r.trajet_id
      JOIN utilisateurs u ON u.id = r.passager_id
      WHERE r.id = $1
      FOR UPDATE OF r
      `,
      [reservationId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "RESERVATION_NOT_FOUND" };
    }

    const row = rows[0];
    // Vérifier propriétaire

    if (row.conducteur_id !== conducteurId) {
      await client.query("ROLLBACK");
      return { error: "NOT_OWNER" };
    }


    // Vérifier statut EN_ATTENTE
    if (row.reservation_statut !== "EN_ATTENTE") {
      await client.query("ROLLBACK");
      return { error: "NOT_PENDING" };
    }

    // Mettre réservation ACCEPTÉE
    const reservationRes = await client.query(
      `
      UPDATE reservations
      SET statut = 'ACCEPTEE', reponse_le = NOW()
      WHERE id = $1
      RETURNING *;
      `,
      [reservationId]
    );


    // places_dispo a déjà été décrémenté à la création de la réservation .
    const newPlaces = row.places_dispo;
    const nouveauStatutTrajet = "PLANIFIE";

    // ============================================
    // Notifier le passager : réservation acceptée
    // ============================================
    await client.query(
      `
  INSERT INTO notifications (utilisateur_id, type, message, cree_le)
  SELECT
    r.passager_id,
    'RESERVATION_ACCEPTEE',
    'Votre demande a été acceptée pour le trajet ' || t.lieu_depart || ' → ' || t.destination,
    NOW()
  FROM reservations r
  JOIN trajets t ON t.id = r.trajet_id
  WHERE r.id = $1;
  `,
      [reservationId]
    );

    // Valider transaction
    await client.query("COMMIT");

    // Push + email au passager
    sendPushToUser(
      row.passager_id,
      "Réservation acceptée ✅",
      `Votre demande a été acceptée pour le trajet ${row.lieu_depart} → ${row.destination}`,
      "/passager/mes-reservations"
    );
    if (row.passager_email) {
      emailReservationAcceptee({
        to: row.passager_email,
        depart: row.lieu_depart,
        destination: row.destination,
        dateHeure: new Date(row.dateheure_depart).toLocaleString("fr-CA", { dateStyle: "full", timeStyle: "short" }),
        appUrl: APP_URL,
      });
    }

    return {
      reservation: reservationRes.rows[0],
      trajet: {
        id: row.trajet_id,
        places_dispo: newPlaces,
        statut: nouveauStatutTrajet
      }
    };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();
  }
}


/**
 * Refuse une réservation EN_ATTENTE (transaction).
 *
 * Restaure `places_dispo` du trajet et notifie le passager par push et courriel.
 *
 * @async
 * @param {string} conducteurId   - UUID du conducteur qui refuse.
 * @param {string} reservationId  - UUID de la réservation à refuser.
 * @returns {Promise<{reservation: Object}|{error: string}>}
 * @throws {Error} En cas d'erreur SQL inattendue.
 */
export async function refuseReservation(conducteurId, reservationId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Charger reservation + trajet (verrouillé)
    const { rows } = await client.query(
      `
      SELECT
        r.id AS reservation_id,
        r.statut AS reservation_statut,
        r.passager_id,
        r.trajet_id,
        t.conducteur_id,
        t.lieu_depart,
        t.destination,
        u.email AS passager_email
      FROM reservations r
      JOIN trajets t ON t.id = r.trajet_id
      JOIN utilisateurs u ON u.id = r.passager_id
      WHERE r.id = $1
      FOR UPDATE OF r
      `,
      [reservationId]
    );

    // Si aucune réservation trouvée
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "RESERVATION_NOT_FOUND" };
    }

    const row = rows[0];

    // 2) Vérifier que le conducteur est propriétaire du trajet
    if (row.conducteur_id !== conducteurId) {
      await client.query("ROLLBACK");
      return { error: "NOT_OWNER" };
    }

    // 3) La réservation doit être EN_ATTENTE
    if (row.reservation_statut !== "EN_ATTENTE") {
      await client.query("ROLLBACK");
      return { error: "NOT_PENDING" };
    }

    // 4) Mettre à jour le statut => REFUSEE
    const reservationRes = await client.query(
      `
      UPDATE reservations
      SET statut = 'REFUSEE', reponse_le = NOW()
      WHERE id = $1
      RETURNING *;
      `,
      [reservationId]
    );

    // Restaurer la place (décrémentée à la création)
    await client.query(
      `UPDATE trajets SET places_dispo = places_dispo + 1 WHERE id = $1`,
      [row.trajet_id]
    );

    // notifier passager
    await client.query(
      `
  INSERT INTO notifications (utilisateur_id, type, message, cree_le)
  SELECT
    r.passager_id,
    'RESERVATION_REFUSEE',
    'Votre demande a été refusée pour le trajet ' || t.lieu_depart || ' → ' || t.destination,
    NOW()
  FROM reservations r
  JOIN trajets t ON t.id = r.trajet_id
  WHERE r.id = $1;
  `,
      [reservationId]
    );

    await client.query("COMMIT");

    // Push + email au passager (refus)
    sendPushToUser(
      row.passager_id,
      "Réservation refusée ❌",
      `Votre demande a été refusée pour le trajet ${row.lieu_depart} → ${row.destination}`,
      "/passager/mes-reservations"
    );
    if (row.passager_email) {
      emailReservationRefusee({
        to: row.passager_email,
        depart: row.lieu_depart,
        destination: row.destination,
        appUrl: APP_URL,
      });
    }

    return { reservation: reservationRes.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


/**
 * Récupère toutes les réservations d'un passager avec les détails du trajet et du conducteur.
 *
 * @async
 * @param {string} passagerId - UUID du passager.
 * @returns {Promise<Object[]>} Tableau de réservations avec informations du conducteur et du véhicule.
 */
export async function getReservationsByPassager(passagerId) {
  const { rows } = await pool.query(
    `
    SELECT
  r.id,
  r.trajet_id,
  r.statut,
  r.demande_le,
  r.reponse_le,

  t.lieu_depart,
  t.destination,
  t.dateheure_depart,
  t.statut AS trajet_statut,
  t.dest_lat,
  t.dest_lng,

  u.id AS conducteur_id,
  u.prenom AS conducteur_prenom,
  u.nom AS conducteur_nom,
  u.email AS conducteur_email,
  p.photo_url AS conducteur_photo_url,

  v.marque,
  v.modele,
  v.annee,
  v.couleur,
  v.plaque

FROM reservations r
JOIN trajets t ON t.id = r.trajet_id
JOIN utilisateurs u ON u.id = t.conducteur_id
LEFT JOIN profils p ON p.utilisateur_id = u.id
LEFT JOIN vehicules v ON v.utilisateur_id = u.id

WHERE r.passager_id = $1
ORDER BY r.demande_le DESC

    `,
    [passagerId]
  );


  return rows;
}

/**
 * Annule une réservation à la demande du passager (transaction).
 *
 * Conditions d'annulation :
 * - La réservation doit appartenir au passager.
 * - Statut non terminal (pas REFUSEE, ANNULEE, TERMINEE).
 * - Le trajet ne doit pas être EN_COURS ou TERMINE.
 * - La date de départ ne doit pas être passée.
 * - L'annulation doit se faire au moins 30 minutes avant le départ.
 *
 * Restaure systématiquement `places_dispo` (qu'elle soit EN_ATTENTE ou ACCEPTEE).
 * Notifie le conducteur par push et courriel.
 *
 * @async
 * @param {string} passagerId    - UUID du passager qui annule.
 * @param {string} reservationId - UUID de la réservation à annuler.
 * @returns {Promise<{reservation: Object}|{error: string}>}
 * @throws {Error} En cas d'erreur SQL inattendue.
 */
export async function cancelReservation(passagerId, reservationId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️ Charger reservation + trajet (verrou)
    const { rows } = await client.query(
      `
      SELECT
        r.id,
        r.statut,
        r.trajet_id,
        r.passager_id,
        t.places_dispo,
        t.dateheure_depart,
        t.statut AS trajet_statut,
        t.conducteur_id,
        t.lieu_depart,
        t.destination,
        uc.email AS conducteur_email,
        up.prenom AS passager_prenom
      FROM reservations r
      JOIN trajets t ON t.id = r.trajet_id
      JOIN utilisateurs uc ON uc.id = t.conducteur_id
      JOIN utilisateurs up ON up.id = r.passager_id
      WHERE r.id = $1
      FOR UPDATE OF r
      `,
      [reservationId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "RESERVATION_NOT_FOUND" };
    }

    const row = rows[0];

    // 2️ Vérifier propriétaire
    if (row.passager_id !== passagerId) {
      await client.query("ROLLBACK");
      return { error: "NOT_OWNER" };
    }

    // 3️ Interdire annulation déjà REFUSEE, ANNULEE ou TERMINEE
    if (row.statut === "REFUSEE" || row.statut === "ANNULEE" || row.statut === "TERMINEE") {
      await client.query("ROLLBACK");
      return { error: "ALREADY_CLOSED" };
    }

    // 3b. Interdire annulation si le trajet est EN_COURS ou TERMINE
    if (row.trajet_statut === "EN_COURS" || row.trajet_statut === "TERMINE") {
      await client.query("ROLLBACK");
      return { error: "TRAJET_ALREADY_STARTED" };
    }

    // 4️ Interdire annulation si trajet passé
    if (new Date(row.dateheure_depart) <= new Date()) {
      await client.query("ROLLBACK");
      return { error: "TRAJET_PAST" };
    }

    // 4b. Interdire annulation à moins de 30 minutes du départ
    const minutesUntilDepart = (new Date(row.dateheure_depart) - new Date()) / 60000;
    if (minutesUntilDepart < 30) {
      await client.query("ROLLBACK");
      return { error: "CANCELLATION_TOO_LATE" };
    }

    // 5️ Restaurer la place (places_dispo est décrémenté à la création,
    //    donc on restaure que la réservation soit EN_ATTENTE ou ACCEPTEE)
    await client.query(
      `UPDATE trajets SET places_dispo = places_dispo + 1 WHERE id = $1`,
      [row.trajet_id]
    );

    // 6️ Mettre statut ANNULEE
    const reservationRes = await client.query(
      `
      UPDATE reservations
      SET statut = 'ANNULEE', reponse_le = NOW()
      WHERE id = $1
      RETURNING *;
      `,
      [reservationId]
    );

    // Notification pour le passager (annulation volontaire)
    await client.query(
      `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
       VALUES ($1, 'RESERVATION_ANNULEE', $2, NOW())`,
      [row.passager_id, `Vous avez annulé votre réservation pour le trajet ${row.lieu_depart} → ${row.destination}`]
    );

    // Notification pour le conducteur
    await client.query(
      `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
       VALUES ($1, 'RESERVATION_ANNULEE', $2, NOW())`,
      [row.conducteur_id, `Un passager a annulé sa réservation pour votre trajet ${row.lieu_depart} → ${row.destination}`]
    );
    await client.query("COMMIT");

    // Push + email au conducteur (annulation par le passager)
    sendPushToUser(
      row.conducteur_id,
      "Réservation annulée",
      `Un passager a annulé sa réservation pour votre trajet ${row.lieu_depart} → ${row.destination}`,
      "/conducteur/reservations-recues"
    );
    if (row.conducteur_email) {
      emailReservationAnnuleeParPassager({
        to: row.conducteur_email,
        passagerPrenom: row.passager_prenom || "Un passager",
        depart: row.lieu_depart,
        destination: row.destination,
        appUrl: APP_URL,
      });
    }

    return {
      reservation: reservationRes.rows[0]
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}