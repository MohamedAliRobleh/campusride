import {pool} from "../DB/db.js";

/**
 * Crée un véhicule pour un user et le passe en CONDUCTEUR
 * (transaction: si une étape échoue => rollback)
 */

// Fonction pour Ajouter un Vehicule
export async function ajouterVehiculeEtMajConducteur({
  userId, marque,modele,annee,plaque,couleur,nb_places
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Insérer véhicule
    const insertVehiculeQuery = `
      INSERT INTO vehicules (
        utilisateur_id,
        marque,
        modele,
        annee,
        plaque,
        couleur,
        nb_places ,
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

    // 2) Mettre à jour rôle
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
