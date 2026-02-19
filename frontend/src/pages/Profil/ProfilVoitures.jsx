import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ModalAjouterVoiture from "./modals/ModalAjouterVoiture.jsx";

export default function ProfilVoitures() {

  // Récupération du thème depuis le layout parent
  const { isDark } = useOutletContext();

  // Etat pour afficher la modal
  const [showAdd, setShowAdd] = useState(false);

  // Etat pour stocker le véhicule récupéré du backend
  const [vehicule, setVehicule] = useState(null);

  // Etat loading pour UX propre
  const [loading, setLoading] = useState(true);

  // Classe bootstrap dynamique
  const cardClass = `rounded-4 border shadow-sm p-3 p-md-4 ${isDark ? "bg-dark bg-opacity-25 border-secondary" : "bg-white"
    }`;

  /**
   * Fonction pour charger le véhicule connecté
   * Appelle GET /vehicules/me
   */
  const loadVehicule = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/vehicules/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 404) {
        // Aucun véhicule
        setVehicule(null);
      } else {
        const data = await res.json();
        setVehicule(data.vehicule);
      }

    } catch (err) {
      console.error("Erreur chargement véhicule", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {

  const confirmDelete = window.confirm(
    "Êtes-vous sûr de vouloir supprimer votre véhicule ?"
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/vehicules/me", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      alert("Erreur suppression véhicule");
      return;
    }

    loadVehicule();

  } catch (err) {
    console.error("Erreur suppression véhicule", err);
  }
};


  // Charger au premier rendu
  useEffect(() => {
    loadVehicule();
  }, []);

  return (
    <div className={cardClass}>
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <h2 className="h4 fw-bold mb-1">Mes voitures</h2>

          {loading ? (
            <p className="text-muted">Chargement...</p>
          ) : vehicule ? (
            <p className="text-success mb-0">Voiture enregistrée</p>
          ) : (
            <p className="text-muted mb-0">Aucune voiture à votre profil</p>
          )}
        </div>

        {!vehicule && (
          <button
            type="button"
            className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 56, height: 56 }}
            onClick={() => setShowAdd(true)}
          >
            <i className="bi bi-plus-lg fs-4" />
          </button>
        )}

      </div>

      {/* Affichage véhicule si existe */}
      {!loading && vehicule && (
        <div className="mt-4 border rounded-3 p-3">

          <h5 className="fw-bold">
            {vehicule.marque} {vehicule.modele}
          </h5>

          <div>Année: {vehicule.annee}</div>
          <div>Plaque: {vehicule.plaque}</div>
          <div>Places: {vehicule.nb_places}</div>

          <div className="mt-3 d-flex gap-2">

            {/* Bouton Modifier */}
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowAdd(true)}
            >
              Modifier
            </button>

            {/* Bouton Supprimer */}
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleDelete}
            >
              Supprimer
            </button>

          </div>
        </div>
      )}


      {/* Modal */}
      <ModalAjouterVoiture
        show={showAdd}
        vehicule={vehicule}  // 🔥 IMPORTANT
        onClose={() => {
          setShowAdd(false);
          loadVehicule();
        }}
        isDark={isDark}
      />

    </div>
  );
}
