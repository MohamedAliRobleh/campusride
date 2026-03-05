import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { pool } from "../DB/db.js";

const router = Router();

// =====================
// GET /conversations — Lister mes conversations
// =====================
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT
        c.id,
        CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS interlocuteur_id,
        u.prenom AS interlocuteur_prenom,
        u.nom    AS interlocuteur_nom,
        p.photo_url AS interlocuteur_photo_url,
        (SELECT contenu FROM messages WHERE conversation_id = c.id ORDER BY envoye_le DESC LIMIT 1) AS dernier_message,
        (SELECT envoye_le FROM messages WHERE conversation_id = c.id ORDER BY envoye_le DESC LIMIT 1) AS dernier_message_le,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND expediteur_id <> $1 AND lu = FALSE) AS non_lus
       FROM conversations c
       JOIN utilisateurs u ON u.id = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
       LEFT JOIN profils p ON p.utilisateur_id = u.id
       WHERE c.user1_id = $1 OR c.user2_id = $1
       ORDER BY dernier_message_le DESC NULLS LAST`,
      [userId]
    );
    return res.json({ conversations: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// POST /conversations — Créer ou obtenir une conversation
// =====================
router.post("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { interlocuteur_id } = req.body;
    if (!interlocuteur_id || String(interlocuteur_id) === String(userId)) {
      return res.status(400).json({ message: "interlocuteur_id invalide." });
    }

    // Chercher une conversation existante dans les deux sens
    const existing = await pool.query(
      `SELECT id FROM conversations
       WHERE (user1_id = $1 AND user2_id = $2)
          OR (user1_id = $2 AND user2_id = $1)`,
      [userId, interlocuteur_id]
    );

    let convId;
    if (existing.rows.length > 0) {
      convId = existing.rows[0].id;
    } else {
      // Générer l'UUID côté SQL pour compatibilité avec toutes les configs
      const { rows } = await pool.query(
        `INSERT INTO conversations (id, user1_id, user2_id)
         VALUES (gen_random_uuid(), $1, $2) RETURNING id;`,
        [userId, interlocuteur_id]
      );
      convId = rows[0].id;
    }

    // Retourner les infos complètes de la conversation pour l'auto-sélection
    const { rows: convRows } = await pool.query(
      `SELECT c.id, u.id AS interlocuteur_id, u.prenom AS interlocuteur_prenom,
              u.nom AS interlocuteur_nom, p.photo_url AS interlocuteur_photo_url
       FROM conversations c
       JOIN utilisateurs u ON u.id = $2
       LEFT JOIN profils p ON p.utilisateur_id = u.id
       WHERE c.id = $1`,
      [convId, interlocuteur_id]
    );

    return res.json({ conversation_id: convId, conversation: convRows[0] ?? null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /conversations/:id/messages — Lire les messages
// =====================
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const convId = req.params.id;

    // Vérifier appartenance
    const check = await pool.query(
      `SELECT id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [convId, userId]
    );
    if (check.rows.length === 0) return res.status(403).json({ message: "Accès refusé." });

    // Marquer comme lu
    await pool.query(
      `UPDATE messages SET lu = TRUE WHERE conversation_id = $1 AND expediteur_id <> $2`,
      [convId, userId]
    );

    const { rows } = await pool.query(
      `SELECT m.id, m.expediteur_id, m.contenu, m.lu, m.envoye_le,
              u.prenom AS expediteur_prenom, u.nom AS expediteur_nom,
              p.photo_url AS expediteur_photo_url
       FROM messages m
       JOIN utilisateurs u ON u.id = m.expediteur_id
       LEFT JOIN profils p ON p.utilisateur_id = m.expediteur_id
       WHERE m.conversation_id = $1
       ORDER BY m.envoye_le ASC`,
      [convId]
    );
    return res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// POST /conversations/:id/messages — Envoyer un message
// =====================
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const convId = req.params.id;
    const { contenu } = req.body;

    if (!contenu || !String(contenu).trim()) {
      return res.status(400).json({ message: "Le message ne peut pas être vide." });
    }

    // Vérifier appartenance
    const check = await pool.query(
      `SELECT id, user1_id, user2_id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [convId, userId]
    );
    if (check.rows.length === 0) return res.status(403).json({ message: "Accès refusé." });

    const { rows } = await pool.query(
      `INSERT INTO messages (id, conversation_id, expediteur_id, contenu)
       VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *`,
      [convId, userId, String(contenu).trim()]
    );

    // Notif destinataire
    const conv = check.rows[0];
    const destinataireId = String(conv.user1_id) === String(userId) ? conv.user2_id : conv.user1_id;
    try {
      await pool.query(
        `INSERT INTO notifications (utilisateur_id, type, message, cree_le)
         VALUES ($1, 'RAPPEL_TRAJET', $2, NOW())`,
        [destinataireId, "Vous avez reçu un nouveau message dans votre messagerie."]
      );
    } catch { /* ignore */ }

    return res.status(201).json({ message: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

// =====================
// GET /non-lus — Nombre total de messages non lus
// =====================
router.get("/non-lus", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE (c.user1_id = $1 OR c.user2_id = $1)
         AND m.expediteur_id <> $1
         AND m.lu = FALSE`,
      [userId]
    );
    return res.json({ non_lus: Number(rows[0].total) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
});

export default router;
