import { pool } from "../DB/db.js";

/**
 * Cron : envoie un rappel 24h avant chaque trajet PLANIFIE
 * Tourne toutes les heures.
 */
export function startCronJobs() {
  const envoyerRappels = async () => {
    try {
      // Trouver les trajets qui partent dans 23h–25h et n'ont pas encore eu de rappel
      const { rows: trajets } = await pool.query(`
        SELECT t.id, t.lieu_depart, t.destination, t.dateheure_depart
        FROM trajets t
        WHERE t.statut = 'PLANIFIE'
          AND t.dateheure_depart BETWEEN NOW() + INTERVAL '23 hours'
                                      AND NOW() + INTERVAL '25 hours'
      `);

      for (const trajet of trajets) {
        const msg = `Rappel : votre trajet ${trajet.lieu_depart} → ${trajet.destination} est dans moins de 24h.`;

        // Notifier le conducteur
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

        // Notifier les passagers ACCEPTES
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

  // Exécuter immédiatement au démarrage, puis toutes les heures
  envoyerRappels();
  setInterval(envoyerRappels, 60 * 60 * 1000);

  console.log("[Cron] Rappels automatiques activés (toutes les heures).");
}
