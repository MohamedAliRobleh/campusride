// src/model/reservations.model.js
import { pool } from "../DB/db.js";

/**
 * Fonction: createReservation
 * ---------------------------
 * Permet à un utilisateur (passager) de réserver un trajet.
 *
 * Règles métier vérifiées :
 * - Le trajet existe
 * - L'utilisateur ne réserve pas son propre trajet
 * - Le trajet est PLANIFIE
 * - La date du trajet est dans le futur (DOUBLE SÉCURITÉ)
 * - Il reste des places disponibles
 * - L'utilisateur n'a pas déjà réservé ce trajet
 *
 * Utilise une transaction pour garantir la cohérence des données.
 */
export async function createReservation(passagerId, trajetId) {

  // Connexion client PostgreSQL (transaction manuelle)
  const client = await pool.connect();

  try {

    // ===============================
    // Démarrer la transaction
    // ===============================
    await client.query("BEGIN");

    // ===============================
    // 1️⃣ Charger le trajet
    // ===============================
    // FOR UPDATE verrouille la ligne du trajet
    // Cela empêche les conflits en cas de réservations simultanées
    const trajetRes = await client.query(
  `
  SELECT 
    id,
    conducteur_id,
    statut,
    places_dispo,
    dateheure_depart,
    lieu_depart,
    destination
  FROM trajets
  WHERE id = $1
  FOR UPDATE
  `,
  [trajetId]
);


    // Si le trajet n'existe pas
    if (trajetRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "TRAJET_NOT_FOUND" };
    }

    const trajet = trajetRes.rows[0];
    // ===============================
// Récupérer le prénom du passager
// ===============================
const userRes = await client.query(
  `SELECT prenom FROM utilisateurs WHERE id = $1`,
  [passagerId]
);

const prenom = userRes.rows[0]?.prenom || "Un utilisateur";


    // ===============================
    // 2️⃣ Interdire réservation de son propre trajet
    // ===============================
    if (trajet.conducteur_id === passagerId) {
      await client.query("ROLLBACK");
      return { error: "CANNOT_RESERVE_OWN_TRAJET" };
    }

    // ===============================
    // 3️⃣ Vérifier statut du trajet
    // ===============================
    // Seuls les trajets PLANIFIE peuvent être réservés
    if (trajet.statut !== "PLANIFIE") {
      await client.query("ROLLBACK");
      return { error: "TRAJET_NOT_PLANIFIE" };
    }

    // ===============================
    // 4️⃣ DOUBLE SÉCURITÉ DATE PASSÉE
    // ===============================
    // On compare la date du trajet avec la date actuelle serveur.
    // Cela protège contre :
    // - Manipulation manuelle API
    // - Latence entre recherche et réservation
    // - Utilisateur malveillant
    const maintenant = new Date();

    if (new Date(trajet.dateheure_depart) <= maintenant) {
      await client.query("ROLLBACK");
      return { error: "TRAJET_PAST" };
    }

    // ===============================
    // 5️⃣ Vérifier disponibilité des places
    // ===============================
    if (trajet.places_dispo <= 0) {
      await client.query("ROLLBACK");
      return { error: "NO_PLACES_AVAILABLE" };
    }

    // ===============================
    // Insérer réservation
    // ===============================
    const reservationRes = await client.query(
      `
  INSERT INTO reservations (
  trajet_id,
  passager_id
)
VALUES ($1, $2)
RETURNING *;

  `,
      [trajetId, passagerId]
    );

    // ===============================
    // 7️⃣ Créer notification pour le conducteur
    // ===============================
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

    // ===============================
    // Valider la transaction
    // ===============================
    await client.query("COMMIT");


    return { reservation: reservationRes.rows[0] };

  } catch (err) {

    // ===============================
    // Annuler transaction en cas d'erreur
    // ===============================
    await client.query("ROLLBACK");

    // 23505 = violation UNIQUE
    // Cela signifie que le passager a déjà réservé ce trajet
    if (err.code === "23505") {
      return { error: "ALREADY_RESERVED" };
    }

    throw err;

  } finally {

    // Toujours libérer la connexion
    client.release();
  }
}



/**
 * Liste les demandes de réservation reçues pour les trajets d'un conducteur.
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
  t.id AS trajet_id,
  t.lieu_depart,
  t.destination,
  t.dateheure_depart,
  t.places_dispo
FROM reservations r
JOIN trajets t ON t.id = r.trajet_id
JOIN utilisateurs u ON u.id = r.passager_id
WHERE t.conducteur_id = $1
ORDER BY r.demande_le DESC
LIMIT 200;
    `,
    [conducteurId]
  );

  return rows;
}


/**
 * Fonction: acceptReservation
 * ---------------------------
 * Permet au conducteur d'accepter une réservation.
 *
 * Logique métier :
 * - Vérifie que la réservation existe
 * - Vérifie que le conducteur est propriétaire du trajet
 * - Vérifie que la réservation est EN_ATTENTE
 * - Vérifie qu'il reste des places
 * - Met la réservation en ACCEPTEE
 * - Décrémente places_dispo
 * - Si places_dispo devient 0 → clôture automatique du trajet
 */
export async function acceptReservation(conducteurId, reservationId) {

  const client = await pool.connect();

  try {

    // ===============================
    // Démarrer transaction
    // ===============================
    await client.query("BEGIN");

    // ===============================
    // 1️⃣ Charger réservation + trajet
    // ===============================
    const { rows } = await client.query(
      `
      SELECT
        r.id AS reservation_id,
        r.statut AS reservation_statut,
        r.trajet_id,
        t.conducteur_id,
        t.places_dispo,
        t.statut AS trajet_statut
      FROM reservations r
      JOIN trajets t ON t.id = r.trajet_id
      WHERE r.id = $1
      FOR UPDATE
      `,
      [reservationId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "RESERVATION_NOT_FOUND" };
    }

    const row = rows[0];

    // ===============================
    // 2️⃣ Vérifier propriétaire
    // ===============================
    if (row.conducteur_id !== conducteurId) {
      await client.query("ROLLBACK");
      return { error: "NOT_OWNER" };
    }

    // ===============================
    // 3️⃣ Vérifier statut EN_ATTENTE
    // ===============================
    if (row.reservation_statut !== "EN_ATTENTE") {
      await client.query("ROLLBACK");
      return { error: "NOT_PENDING" };
    }

    // ===============================
    // 4️⃣ Vérifier places disponibles
    // ===============================
    if (row.places_dispo <= 0) {
      await client.query("ROLLBACK");
      return { error: "NO_PLACES_AVAILABLE" };
    }

    // ===============================
    // 5️⃣ Mettre réservation ACCEPTÉE
    // ===============================
    const reservationRes = await client.query(
      `
      UPDATE reservations
      SET statut = 'ACCEPTEE', reponse_le = NOW()
      WHERE id = $1
      RETURNING *;
      `,
      [reservationId]
    );

    // ===============================
    // 6️⃣ Décrémenter places_dispo
    // ===============================
    const trajetRes = await client.query(
      `
      UPDATE trajets
      SET places_dispo = places_dispo - 1
      WHERE id = $1
      RETURNING places_dispo;
      `,
      [row.trajet_id]
    );

    const newPlaces = trajetRes.rows[0].places_dispo;

    // ===============================
    // 7️⃣ CLÔTURE AUTOMATIQUE SI COMPLET
    // ===============================
    // Si après décrémentation il reste 0 place,
    // on passe automatiquement le trajet en TERMINE
    if (newPlaces === 0) {
      await client.query(
        `
        UPDATE trajets
        SET statut = 'TERMINE'
        WHERE id = $1
        `,
        [row.trajet_id]
      );
    }

    // ===============================
    // Valider transaction
    // ===============================
    await client.query("COMMIT");

    return {
      reservation: reservationRes.rows[0],
      trajet: {
        id: row.trajet_id,
        places_dispo: newPlaces,
        statut: newPlaces === 0 ? "TERMINE" : "PLANIFIE"
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
 * Fonction: refuseReservation
 * --------------------------
 * Refuse une réservation (statut REFUSEE) si :
 * - la réservation existe
 * - le trajet appartient bien au conducteur connecté
 * - la réservation est encore EN_ATTENTE
 *
 * @param {string} conducteurId - UUID du conducteur connecté
 * @param {string} reservationId - UUID de la réservation
 * @returns {object} - réservation mise à jour ou { error: ... }
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
        r.trajet_id,
        t.conducteur_id
      FROM reservations r
      JOIN trajets t ON t.id = r.trajet_id
      WHERE r.id = $1
      FOR UPDATE
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

    await client.query("COMMIT");

    return { reservation: reservationRes.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


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

  u.prenom AS conducteur_prenom,
  u.nom AS conducteur_nom,
  u.email AS conducteur_email,

  v.marque,
  v.modele,
  v.annee,
  v.couleur,
  v.plaque

FROM reservations r
JOIN trajets t ON t.id = r.trajet_id
JOIN utilisateurs u ON u.id = t.conducteur_id
LEFT JOIN vehicules v ON v.utilisateur_id = u.id

WHERE r.passager_id = $1
ORDER BY r.demande_le DESC

    `,
    [passagerId]
  );


  return rows;
}

/**
 * Annulation par le passager
 * Si la réservation est ACCEPTÉE → on remet +1 place
 */
export async function cancelReservation(passagerId, reservationId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Charger reservation + trajet (verrou)
    const { rows } = await client.query(
      `
      SELECT
        r.id,
        r.statut,
        r.trajet_id,
        r.passager_id,
        t.places_dispo,
        t.dateheure_depart
      FROM reservations r
      JOIN trajets t ON t.id = r.trajet_id
      WHERE r.id = $1
      FOR UPDATE
      `,
      [reservationId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "RESERVATION_NOT_FOUND" };
    }

    const row = rows[0];

    // 2️⃣ Vérifier propriétaire
    if (row.passager_id !== passagerId) {
      await client.query("ROLLBACK");
      return { error: "NOT_OWNER" };
    }

    // 3️⃣ Interdire annulation déjà REFUSEE ou ANNULEE
    if (row.statut === "REFUSEE" || row.statut === "ANNULEE") {
      await client.query("ROLLBACK");
      return { error: "ALREADY_CLOSED" };
    }

    // 4️⃣ Interdire annulation si trajet passé
    if (new Date(row.dateheure_depart) <= new Date()) {
      await client.query("ROLLBACK");
      return { error: "TRAJET_PAST" };
    }

    // 5️⃣ Si ACCEPTÉE → remettre une place
    if (row.statut === "ACCEPTEE") {
      await client.query(
        `
        UPDATE trajets
        SET places_dispo = places_dispo + 1
        WHERE id = $1
        `,
        [row.trajet_id]
      );
    }

    // 6️⃣ Mettre statut ANNULEE
    const reservationRes = await client.query(
      `
      UPDATE reservations
      SET statut = 'ANNULEE', reponse_le = NOW()
      WHERE id = $1
      RETURNING *;
      `,
      [reservationId]
    );

    await client.query("COMMIT");

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