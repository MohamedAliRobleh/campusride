/**
 * @fileoverview Couche d'accès aux données pour les trajets de covoiturage.
 *
 * Ce module gère toutes les opérations SQL sur la table `trajets`, incluant
 * la création, la recherche géographique (algorithme Haversine), et la gestion
 * du cycle de vie des trajets (démarrer, terminer, annuler, modifier).
 *
 * Les opérations de mutation critiques (terminer, annuler, modifier) sont réalisées
 * dans des transactions avec verrouillage FOR UPDATE pour éviter les conditions de course.
 *
 * @module model/trajets.model
 */

import { pool } from "../DB/db.js";

/**
 * Insère un nouveau trajet dans la base de données.
 *
 * @async
 * @param {Object}      params                  - Données du trajet.
 * @param {string}      params.conducteurId     - UUID du conducteur.
 * @param {string}      params.lieuDepart       - Adresse de départ (texte libre).
 * @param {string}      params.destination      - Adresse de destination (texte libre).
 * @param {string}      params.dateHeureDepart  - Date et heure ISO 8601 du départ.
 * @param {number}      params.placesTotal      - Nombre total de places (1–8).
 * @param {number|null} [params.departLat]      - Latitude du point de départ.
 * @param {number|null} [params.departLng]      - Longitude du point de départ.
 * @param {number|null} [params.destLat]        - Latitude de la destination.
 * @param {number|null} [params.destLng]        - Longitude de la destination.
 * @returns {Promise<Object>} Le trajet inséré avec tous ses champs.
 *
 * @example
 * const trajet = await insertTrajet({
 *   conducteurId: "uuid-123",
 *   lieuDepart: "Orléans",
 *   destination: "Collège La Cité",
 *   dateHeureDepart: "2025-05-01T08:00:00",
 *   placesTotal: 3,
 *   departLat: 45.45, departLng: -75.52,
 *   destLat: 45.42, destLng: -75.69
 * });
 */
export async function insertTrajet({
  conducteurId,
  lieuDepart,
  destination,
  dateHeureDepart,
  placesTotal,
  departLat = null,
  departLng = null,
  destLat   = null,
  destLng   = null,
}) {
  const { rows } = await pool.query(
    `
    INSERT INTO trajets (
      conducteur_id, lieu_depart, destination,
      dateheure_depart, places_total, places_dispo,
      statut, cree_le, maj_le,
      depart_lat, depart_lng, dest_lat, dest_lng
    )
    VALUES ($1,$2,$3,$4,$5,$5,'PLANIFIE',NOW(),NOW(),$6,$7,$8,$9)
    RETURNING *;
    `,
    [conducteurId, lieuDepart, destination, dateHeureDepart, placesTotal,
     departLat, departLng, destLat, destLng]
  );
  return rows[0];
}


/**
 * Recherche des trajets disponibles par localisation et date (algorithme Haversine).
 *
 * Si des coordonnées GPS sont fournies, un score de correspondance est calculé :
 * - 70 points pour la proximité du départ (dans le rayon défini).
 * - 30 points pour la proximité de la destination (dans le rayon défini).
 * Les trajets sans coordonnées GPS ont un score de 0 mais restent inclus.
 *
 * Retourne jusqu'à 100 trajets PLANIFIE futurs non pleins,
 * triés par score décroissant puis par date de départ croissante.
 *
 * @async
 * @param {Object}      params              - Paramètres de recherche.
 * @param {string}      params.depart       - Texte de départ (recherche ILIKE).
 * @param {string}      params.destination  - Texte de destination (recherche ILIKE).
 * @param {string|null} params.date         - Date ISO (filtre optionnel sur le jour).
 * @param {string}      params.userId       - UUID de l'utilisateur (pour exclure ses propres trajets).
 * @param {number|null} [params.departLat]  - Latitude GPS du départ.
 * @param {number|null} [params.departLng]  - Longitude GPS du départ.
 * @param {number|null} [params.destLat]    - Latitude GPS de la destination.
 * @param {number|null} [params.destLng]    - Longitude GPS de la destination.
 * @param {number}      [params.rayonKm=20] - Rayon de tolérance en kilomètres.
 * @returns {Promise<Object[]>} Tableau de trajets avec `match_score`, conducteur et véhicule.
 */
export async function searchTrajets({
  depart, destination, date, userId,
  departLat = null, departLng = null,
  destLat   = null, destLng   = null,
  rayonKm   = 20,
}) {

  
  /*
   * Algorithme de matching conducteur / passager
   * ─────────────────────────────────────────────
   * Score (0-100) :
   *   70 pts  → proximité point de départ  (Haversine, linéaire jusqu'à rayon_km)
   *   30 pts  → proximité destination      (Haversine, linéaire jusqu'à 5 km)
   *
   * Si aucune coordonnée passée : score partiel neutre (50/100), tri par date.
   * Le filtre distance n'est appliqué que lorsque les coordonnées passager sont connues.
   */
  const q = `
    WITH base AS (
      SELECT
        t.id, t.conducteur_id,
        t.lieu_depart, t.destination,
        t.dateheure_depart, t.places_total, t.places_dispo,
        t.statut, t.cree_le, t.maj_le,
        t.depart_lat, t.depart_lng, t.dest_lat, t.dest_lng,
        u.prenom  AS conducteur_prenom,
        u.nom     AS conducteur_nom,
        p.photo_url AS conducteur_photo_url,
        v.marque  AS voiture_marque,
        v.modele  AS voiture_modele,
        v.couleur AS voiture_couleur,
        v.annee   AS voiture_annee,

        -- Distance Haversine départ passager ↔ départ conducteur (km)
        CASE
          WHEN $1::double precision IS NOT NULL AND t.depart_lat IS NOT NULL
          THEN ROUND((
            2 * 6371 * asin(sqrt(
              power(sin(radians((t.depart_lat - $1::double precision) / 2)), 2) +
              cos(radians($1::double precision)) * cos(radians(t.depart_lat)) *
              power(sin(radians((t.depart_lng - $2::double precision) / 2)), 2)
            ))
          )::numeric, 2)
          ELSE NULL
        END AS depart_distance_km,

        -- Distance Haversine destination passager ↔ destination conducteur (km)
        CASE
          WHEN $3::double precision IS NOT NULL AND t.dest_lat IS NOT NULL
          THEN ROUND((
            2 * 6371 * asin(sqrt(
              power(sin(radians((t.dest_lat - $3::double precision) / 2)), 2) +
              cos(radians($3::double precision)) * cos(radians(t.dest_lat)) *
              power(sin(radians((t.dest_lng - $4::double precision) / 2)), 2)
            ))
          )::numeric, 2)
          ELSE NULL
        END AS dest_distance_km

      FROM trajets t
      JOIN utilisateurs u ON u.id = t.conducteur_id
      LEFT JOIN profils  p ON p.utilisateur_id = t.conducteur_id
      LEFT JOIN vehicules v ON v.utilisateur_id = t.conducteur_id
      WHERE t.statut = 'PLANIFIE'
        AND t.places_dispo > 0
        AND t.dateheure_depart > NOW()
        AND t.conducteur_id <> $5
        AND ($6::text IS NULL OR t.lieu_depart ILIKE '%' || $6 || '%')
        AND ($7::text IS NULL OR t.destination ILIKE '%' || $7 || '%')
        AND ($8::date IS NULL OR t.dateheure_depart::date = $8::date)
    ),
    scored AS (
      SELECT *,
        ROUND(GREATEST(0,
          -- Score départ (0-70 pts)
          CASE
            WHEN depart_distance_km IS NOT NULL
            THEN 70.0 * GREATEST(0.0, 1.0 - depart_distance_km / $9::double precision)
            ELSE 35.0
          END
          +
          -- Score destination (0-30 pts)
          CASE
            WHEN dest_distance_km IS NOT NULL
            THEN 30.0 * GREATEST(0.0, 1.0 - dest_distance_km / 5.0)
            ELSE 15.0
          END
        ))::integer AS match_score
      FROM base
      -- Ne garder les trajets trop loin que si les coordonnées passager sont connues
      WHERE depart_distance_km IS NULL
         OR depart_distance_km <= $9::double precision
    )
    SELECT * FROM scored
    ORDER BY
      CASE WHEN $1::double precision IS NOT NULL THEN match_score END DESC NULLS LAST,
      dateheure_depart ASC
    LIMIT 100;
  `;

  const values = [
    departLat   ?? null,                                   // $1
    departLng   ?? null,                                   // $2
    destLat     ?? null,                                   // $3
    destLng     ?? null,                                   // $4
    userId,                                                // $5
    depart      && depart.trim()      ? depart.trim()      : null, // $6
    destination && destination.trim() ? destination.trim() : null, // $7
    date        && date.trim()        ? date.trim()        : null, // $8
    rayonKm     ?? 20,                                     // $9
  ];

  const { rows } = await pool.query(q, values);
  return rows;
}



/**
 * Termine un trajet et notifie tous les passagers acceptés (dans une transaction externe).
 *
 * Met le statut à TERMINE et insère une notification TRAJET_TERMINE
 * pour chaque passager avec une réservation ACCEPTEE.
 *
 * @async
 * @param {Object}              params              - Paramètres.
 * @param {import("pg").PoolClient} params.client   - Client PostgreSQL en transaction.
 * @param {string}              params.trajetId     - UUID du trajet.
 * @param {string}              params.conducteurId - UUID du conducteur (vérification de propriété).
 * @returns {Promise<Object|null>} Trajet terminé avec info conducteur, ou null si non autorisé.
 */
export async function terminerTrajetEtNotifier({ client, trajetId, conducteurId }) {
  // 1) terminer + récupérer les infos utiles.
  const res = await client.query(
    `
    UPDATE trajets
    SET statut = 'TERMINE',
        maj_le = NOW()
    WHERE id = $1
      AND conducteur_id = $2
      AND statut IN ('PLANIFIE','EN_COURS')
    RETURNING id, lieu_depart, destination, conducteur_id, dateheure_depart, statut;
    `,
    [trajetId, conducteurId]
  );

  if (res.rows.length === 0) return null;

  const trajet = res.rows[0];

  // 2) notifier en 1 requête (pas de boucle)
  await client.query(
    `
    INSERT INTO notifications (utilisateur_id, type, message, cree_le)
    SELECT
      r.passager_id,
      'TRAJET_TERMINE',
      $2,
      NOW()
    FROM reservations r
    WHERE r.trajet_id = $1
      AND r.statut = 'ACCEPTEE';
    `,
    [trajetId, `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} a été terminé par le conducteur.`]
  );

  return trajet;
}

/**
 * Récupère les trajets d'un conducteur avec le nombre de places réservées (ACCEPTEE).
 *
 * @async
 * @param {string} conducteurId - UUID du conducteur.
 * @returns {Promise<Object[]>} Trajets du conducteur avec le champ `places_reservees`.
 */
export async function getMesTrajetsAvecPlacesReservees(conducteurId) {
  const { rows } = await pool.query(
    `
    SELECT
      t.*,
      COUNT(r.id) FILTER (WHERE r.statut = 'ACCEPTEE') AS places_reservees
    FROM trajets t
    LEFT JOIN reservations r ON r.trajet_id = t.id
    WHERE t.conducteur_id = $1
    GROUP BY t.id
    ORDER BY t.dateheure_depart DESC;
    `,
    [conducteurId]
  );
  return rows;
}

/**
 * Récupère les 5 prochains trajets PLANIFIE (page d'accueil / trajets populaires).
 *
 * Inclut les informations du conducteur et de son véhicule.
 * Triés par date de départ croissante.
 *
 * @async
 * @returns {Promise<Object[]>} Tableau de 5 trajets à venir maximum.
 */
export async function getTrajetsPopulaires() {
  const { rows } = await pool.query(
    `
    SELECT
      t.*,
      u.prenom AS conducteur_prenom,
      u.nom    AS conducteur_nom,
      p.photo_url AS conducteur_photo_url,
      v.marque  AS voiture_marque,
      v.modele  AS voiture_modele,
      v.couleur AS voiture_couleur,
      v.annee   AS voiture_annee
    FROM trajets t
    JOIN utilisateurs u ON u.id = t.conducteur_id
    LEFT JOIN profils p ON p.utilisateur_id = t.conducteur_id
    LEFT JOIN vehicules v ON v.utilisateur_id = t.conducteur_id
    WHERE t.statut = 'PLANIFIE'
      AND t.dateheure_depart >= NOW()
      AND (
        t.places_dispo > 0
        OR NOT EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.trajet_id = t.id AND r.statut = 'ACCEPTEE'
        )
      )
    ORDER BY t.dateheure_depart ASC
    LIMIT 5;
    `
  );
  return rows;
}

/**
 * Lock + lecture trajet (utile pour annulation/modif).
 */
/**
 * Récupère un trajet par son identifiant avec un verrou FOR UPDATE.
 *
 * À utiliser dans une transaction pour prévenir les modifications concurrentes.
 *
 * @async
 * @param {Object}              params          - Paramètres.
 * @param {import("pg").PoolClient} params.client  - Client PostgreSQL en transaction.
 * @param {string}              params.trajetId - UUID du trajet.
 * @returns {Promise<Object|null>} Le trajet verrouillé, ou null si non trouvé.
 */
export async function getTrajetByIdForUpdate({ client, trajetId }) {
  const res = await client.query(
    `
    SELECT *
    FROM trajets
    WHERE id = $1
    FOR UPDATE;
    `,
    [trajetId]
  );
  return res.rows[0] || null;
}

/**
 * Annule un trajet par le conducteur (PLANIFIE/EN_COURS)
 * + annule réservations actives et notifie les passagers concernés (1 requête)
 */
/**
 * Annule un trajet et notifie tous les passagers avec une réservation active (dans une transaction externe).
 *
 * Annule les réservations EN_ATTENTE et ACCEPTEE, restaure les places disponibles,
 * insère des notifications TRAJET_ANNULE pour chaque passager.
 *
 * @async
 * @param {Object}              params          - Paramètres.
 * @param {import("pg").PoolClient} params.client  - Client PostgreSQL en transaction.
 * @param {string}              params.trajetId - UUID du trajet à annuler.
 * @returns {Promise<{trajet: Object, reservations_annulees: Object[]}|null>}
 *   Trajet annulé et liste des réservations annulées, ou null si non trouvé.
 */
export async function annulerTrajetConducteurEtNotifier({ client, trajetId }) {
  const upd = await client.query(
    `
    UPDATE trajets
    SET statut = 'ANNULE',
        maj_le = NOW()
    WHERE id = $1
      AND statut IN ('PLANIFIE','EN_COURS')
    RETURNING id, lieu_depart, destination, conducteur_id;
    `,
    [trajetId]
  );

  if (upd.rows.length === 0) return null;

  const trajet = upd.rows[0];

  // Annuler réservations actives + récupérer passagers touchés.
  const annuleResa = await client.query(
    `
    UPDATE reservations
    SET statut = 'ANNULEE',
        reponse_le = NOW()
    WHERE trajet_id = $1
      AND statut IN ('ACCEPTEE','EN_ATTENTE')
    RETURNING passager_id;
    `,
    [trajetId]
  );

  // Notif batch — utilise uniquement les passagers des réservations qu'on vient d'annuler.
  if (annuleResa.rows.length > 0) {
    const passagerIds = [...new Set(annuleResa.rows.map(r => r.passager_id))];
    await client.query(
      `
      INSERT INTO notifications (utilisateur_id, type, message, cree_le)
      SELECT unnest($1::uuid[]), 'TRAJET_ANNULE', $2, NOW()
      `,
      [passagerIds, `Votre trajet ${trajet.lieu_depart} → ${trajet.destination} a été annulé par le conducteur.`]
    );
  }

  return {
    trajet,
    reservations_annulees: annuleResa.rowCount
  };
}

/**
 * Modifier trajet et notfier passages accepetes (seulement conducteur + statut PLANIFIE).
 */
/**
 * Modifie les détails d'un trajet PLANIFIE et notifie les passagers concernés (dans une transaction externe).
 *
 * Seul le conducteur propriétaire peut modifier. Notifie les passagers ACCEPTEE et EN_ATTENTE
 * avec une notification TRAJET_MODIFIE.
 *
 * @async
 * @param {Object}              params              - Paramètres.
 * @param {import("pg").PoolClient} params.client   - Client PostgreSQL en transaction.
 * @param {string}              params.trajetId     - UUID du trajet.
 * @param {string}              params.conducteurId - UUID du conducteur (vérification de propriété).
 * @param {string}              params.lieuDepart   - Nouveau lieu de départ.
 * @param {string}              params.dest         - Nouvelle destination.
 * @param {string}              params.dateIso      - Nouvelle date/heure ISO 8601.
 * @returns {Promise<Object|null>} Trajet modifié, ou null si non autorisé / non trouvé.
 */
export async function modifierTrajetEtNotifier({ client, trajetId, conducteurId, lieuDepart, dest, dateIso }) {
  // ancien trajet
  const oldRes = await client.query(
    `
    SELECT lieu_depart, destination, dateheure_depart
    FROM trajets
    WHERE id = $1
      AND conducteur_id = $2
      AND statut = 'PLANIFIE';
    `,
    [trajetId, conducteurId]
  );
  if (oldRes.rows.length === 0) return null;

  const oldTrajet = oldRes.rows[0];

  // update
  const updateRes = await client.query(
    `
    UPDATE trajets
    SET lieu_depart = $1,
        destination = $2,
        dateheure_depart = $3,
        maj_le = NOW()
    WHERE id = $4
      AND conducteur_id = $5
      AND statut = 'PLANIFIE'
    RETURNING *;
    `,
    [lieuDepart, dest, dateIso, trajetId, conducteurId]
  );

  const trajet = updateRes.rows[0];
  if (!trajet) return null;

  const msg =
    `Le trajet ${oldTrajet.lieu_depart} → ${oldTrajet.destination} a été modifié ` +
    `(nouveau: ${trajet.lieu_depart} → ${trajet.destination}, départ: ${new Date(trajet.dateheure_depart).toLocaleString("fr-CA")}).`;

  // Notifier les passagers acceptés ET en attente.
  await client.query(
    `
    INSERT INTO notifications (utilisateur_id, type, message, cree_le)
    SELECT DISTINCT
      r.passager_id,
      'TRAJET_MODIFIE',
      $2,
      NOW()
    FROM reservations r
    WHERE r.trajet_id = $1
      AND r.statut IN ('ACCEPTEE', 'EN_ATTENTE');
    `,
    [trajetId, msg]
  );

  return trajet;
}
