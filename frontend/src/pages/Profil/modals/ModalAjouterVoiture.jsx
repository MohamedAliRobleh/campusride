import { useState, useEffect } from "react";

export default function ModalAjouterVoiture({ show, onClose, isDark, vehicule }) {

  // Etats contrôlés
  const [marque, setMarque] = useState("");
  const [modele, setModele] = useState("");
  const [annee, setAnnee] = useState("");
  const [plaque, setPlaque] = useState("");
  const [nbPlaces, setNbPlaces] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
 * Si un véhicule existe,
 * on pré-remplit les champs (mode modification)
 */
  useEffect(() => {
    if (vehicule) {
      setMarque(vehicule.marque || "");
      setModele(vehicule.modele || "");
      setAnnee(vehicule.annee || "");
      setPlaque(vehicule.plaque || "");
      setNbPlaces(vehicule.nb_places || "");
    } else {
      // Mode création → vider les champs
      setMarque("");
      setModele("");
      setAnnee("");
      setPlaque("");
      setNbPlaces("");
    }
  }, [vehicule, show]);


  if (!show) return null;

  const inputClass = `form-control ${isDark ? "bg-dark text-light border-secondary" : ""}`;

  /**
   * Envoi vers backend
   */
  /**
 * handleSubmit
 * ------------
 * Si vehicule existe → PATCH (modifier)
 * Sinon → POST (créer)
 */
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      // 🔥 Choix intelligent de la méthode
      const method = vehicule ? "PATCH" : "POST";

      // 🔥 Choix de la route
      const url = vehicule
        ? "http://localhost:8000/vehicules/me"
        : "http://localhost:8000/vehicules";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          marque,
          modele,
          annee: Number(annee),
          plaque,
          nb_places: Number(nbPlaces)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur serveur");
        return;
      }

      onClose(); // Ferme modal + reload parent

    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="modal fade show" style={{ display: "block" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className={`modal-content ${isDark ? "bg-dark text-light border-secondary" : ""}`}>

            <div className="modal-header">
              <h5 className="modal-title">Ajouter une voiture</h5>
              <button className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <input className={inputClass} placeholder="Marque"
                value={marque} onChange={(e) => setMarque(e.target.value)} />

              <input className={inputClass + " mt-2"} placeholder="Modèle"
                value={modele} onChange={(e) => setModele(e.target.value)} />

              <input className={inputClass + " mt-2"} placeholder="Année"
                value={annee} onChange={(e) => setAnnee(e.target.value)} />

              <input className={inputClass + " mt-2"} placeholder="Plaque"
                value={plaque} onChange={(e) => setPlaque(e.target.value)} />

              <input className={inputClass + " mt-2"} placeholder="Places"
                value={nbPlaces} onChange={(e) => setNbPlaces(e.target.value)} />

              {error && <div className="text-danger mt-2">{error}</div>}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onClose}>
                Annuler
              </button>

              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? "Enregistrement..."
                  : vehicule
                    ? "Mettre à jour"
                    : "Enregistrer"}
              </button>

            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}