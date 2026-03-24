import { pool } from "../DB/db.js";
import { sendPushToUser } from "../utils/pushNotification.js";


export async function createReservation(passagerId, trajetId) {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const trajetRes = await client.query(
      `
  SELECT 
    id,
    conducteur_id,
    statut,
    places_total,
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

    if (trajetRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "TRAJET_NOT_FOUND" };
    }

    const trajet = trajetRes.rows[0];

    const userRes = await client.query(
      `SELECT prenom FROM utilisateurs WHERE id = $1`,
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

    // Push au conducteur
    sendPushToUser(
      trajet.conducteur_id,
      "Nouvelle demande de réservation",
      `${prenom} veut rejoindre votre trajet ${trajet.lieu_depart} → ${trajet.destination}`,
      "/conducteur/reservations-recues"
    );

    return { reservation: reservationRes.rows[0] };

  } catch (err) {

    await client.query("ROLLBACK");
    throw err;

  } finally {

    client.release();
  }
}

// Récupère les réservations associées aux trajets d’un conducteur avec les infos du passager et du trajet
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
// Accepte une réservation si le conducteur est autorisé, met à jour le statut et notifie le passager
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

    // Push au passager
    sendPushToUser(
      row.passager_id,
      "Réservation acceptée ✅",
      `Votre demande a été acceptée pour le trajet ${row.lieu_depart} → ${row.destination}`,
      "/passager/mes-reservations"
    );

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

    // Push au passager (refus)
    sendPushToUser(
      row.passager_id,
      "Réservation refusée ❌",
      `Votre demande a été refusée pour le trajet ${row.lieu_depart} → ${row.destination}`,
      "/passager/mes-reservations"
    );

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
 * Annulation par le passager
 * Si la réservation est ACCEPTÉE → on remet +1 place
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
        t.destination
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

    // Push au conducteur (annulation par le passager)
    sendPushToUser(
      row.conducteur_id,
      "Réservation annulée",
      `Un passager a annulé sa réservation pour votre trajet ${row.lieu_depart} → ${row.destination}`,
      "/conducteur/reservations-recues"
    );

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