import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import ModalAjouterVoiture from "./modals/ModalAjouterVoiture.jsx";

export default function ProfilVoitures() {
  const { isDark } = useOutletContext();
  const [showAdd, setShowAdd] = useState(false);

  const cardClass = `rounded-4 border shadow-sm p-3 p-md-4 ${
    isDark ? "bg-dark bg-opacity-25 border-secondary" : "bg-white"
  }`;

  // UI: aucune voiture pour l’instant (comme AmigoExpress)
  const voitures = [];

  return (
    <div className={cardClass}>
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <h2 className="h4 fw-bold mb-1">Mes voitures</h2>
          <p className={isDark ? "text-secondary mb-0" : "text-muted mb-0"}>
            {voitures.length === 0 ? "Aucune voiture à votre profil" : "Gérez vos voitures"}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 56, height: 56 }}
          onClick={() => setShowAdd(true)}
          aria-label="Ajouter une voiture"
          title="Ajouter"
        >
          <i className="bi bi-plus-lg fs-4" />
        </button>
      </div>

      <ModalAjouterVoiture show={showAdd} onClose={() => setShowAdd(false)} isDark={isDark} />
    </div>
  );
}
