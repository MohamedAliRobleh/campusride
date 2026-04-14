/**
 * @fileoverview Tâches planifiées (cron) pour CampusRide.
 *
 * Deux tâches s'exécutent toutes les heures :
 * 1. Passage automatique des trajets PLANIFIÉ → EN_COURS quand l'heure de départ est passée.
 * 2. Envoi de rappels 24 h avant chaque trajet aux conducteurs et passagers acceptés.
 *
 * Les rappels sont dédupliqués : un utilisateur ne reçoit pas deux fois le même rappel
 * dans une fenêtre de 2 heures.
 *
 * @module utils/cron
 */

import { pool } from "../DB/db.js";

/**
 * Démarre les tâches planifiées de l'application.
 *
 * Exécute immédiatement les deux tâches au démarrage du serveur,
 * puis les répète toutes les heures (3 600 000 ms).
 *
 * @returns {void}
 *
 * @example
 * // Dans server.js
 * import { startCronJobs } from "./src/utils/cron.js";
 * startCronJobs();
 */
export function startCronJobs() {

  /**
   * Met à jour le statut des trajets dont l'heure de départ est passée.
   * Passe PLANIFIE → EN_COURS automatiquement.
   *
   * @async
   * @returns {Promise<void>}
   */
  const mettreAJourStatuts = async () => {
    try {
      await pool.query(`
        UPDATE trajets
        SET statut = 'EN_COURS'
        WHERE statut = 'PLANIFIE'
          AND dateheure_depart <= NOW()
      `);
    } catch (err) {
      console.error("[Cron] Erreur mise à jour statuts:", err.message);
    }
  };

  /**
   * Envoie des rappels de trajet 24 h à l'avance.
   *
   * Cible les trajets PLANIFIE dont le départ est dans la fenêtre 23h–25h.
   * Insère une notification pour le conducteur et pour chaque passager ACCEPTE,
   * en vérifiant qu'aucun rappel identique n'a été envoyé dans les 2 dernières heures.
   *
   * @async
   * @returns {Promise<void>}
   */
  const envoyerRappels = async () => {
    try {
      const { rows: trajets } = await pool.query(`
        SELECT t.id, t.lieu_depart, t.destination, t.dateheure_depart
        FROM trajets t
        WHERE t.statut = 'PLANIFIE'
          AND t.dateheure_depart BETWEEN NOW() + INTERVAL '23 hours'
                                      AND NOW() + INTERVAL '25 hours'
      `);

      for (const trajet of trajets) {
        const msg = `Rappel : votre trajet ${trajet.lieu_depart} → ${trajet.destination} est dans moins de 24h.`;

        // Notifier le conducteur (avec déduplication sur 2h)
        await pool.query(
          `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
           SELECT t.conducteur_id, 'RAPPEL_TRAJET', $1, NOW()
           FROM trajets t WHERE t.id = $2
           AND NOT EXISTS (
             SELECT 1 FROM notifications n
             WHERE n.utilisateur_id = t.conducteur_id
               AND n.type = 'RAPPEL_TRAJET'
               AND n.message = $1
               AND n.cree_le > NOW() - INTERVAL '2 hours'
           )`,
          [msg, trajet.id]
        );

        // Notifier chaque passager avec une réservation ACCEPTEE (avec déduplication sur 2h)
        await pool.query(
          `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
           SELECT r.passager_id, 'RAPPEL_TRAJET', $1, NOW()
           FROM reservations r
           WHERE r.trajet_id = $2
             AND r.statut = 'ACCEPTEE'
             AND NOT EXISTS (
               SELECT 1 FROM notifications n
               WHERE n.utilisateur_id = r.passager_id
                 AND n.type = 'RAPPEL_TRAJET'
                 AND n.message = $1
                 AND n.cree_le > NOW() - INTERVAL '2 hours'
             )`,
          [msg, trajet.id]
        );
      }

      if (trajets.length > 0) {
        console.log(`[Cron] Rappels envoyés pour ${trajets.length} trajet(s).`);
      }
    } catch (err) {
      console.error("[Cron] Erreur rappels:", err.message);
    }
  };

  // Exécution immédiate au démarrage du serveur
  mettreAJourStatuts();
  envoyerRappels();

  // Répétition toutes les heures
  setInterval(() => {
    mettreAJourStatuts();
    envoyerRappels();
  }, 60 * 60 * 1000);

  console.log("[Cron] Rappels automatiques et mise à jour statuts activés (toutes les heures).");
}
