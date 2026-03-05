import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import ModalAjouterVoiture from "./modals/ModalAjouterVoiture.jsx";
import CropPhotoModal from "../../components/CropPhotoModal.jsx";

export default function ProfilVoitures() {
  const { isDark, reloadUser } = useOutletContext();
  const [showAdd, setShowAdd] = useState(false);
  const [vehicule, setVehicule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const carPhotoRef = useRef(null);

  const loadVehicule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/vehicules/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
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

  // 1. Sélection fichier → ouvre le modal crop
  const handleCarPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // 2. Après recadrage → upload blob
  const handleCarCropSave = async (blob) => {
    setCropSrc(null);
    try {
      setUploadingPhoto(true);
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("photo", blob, "car.jpg");
      const res = await fetch("/vehicules/me/photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) await loadVehicule();
    } catch (err) {
      console.error("Erreur upload photo voiture", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre véhicule ?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/vehicules/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Erreur suppression véhicule"); return; }
      await loadVehicule();
      reloadUser?.();
    } catch (err) {
      console.error("Erreur suppression véhicule", err);
    }
  };

  useEffect(() => { loadVehicule(); }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">Mon véhicule</h4>
          <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
            {vehicule ? "Voiture enregistrée sur votre profil conducteur." : "Aucun véhicule enregistré."}
          </p>
        </div>
        {!vehicule && (
          <button
            type="button"
            className="btn btn-success rounded-3 fw-semibold"
            style={{ fontSize: "0.85rem" }}
            onClick={() => setShowAdd(true)}
          >
            <i className="bi bi-plus-lg me-1" />
            Ajouter
          </button>
        )}
      </div>

      {/* ── Aucun véhicule ── */}
      {!vehicule && (
        <div className={`text-center py-5 rounded-4 border ${isDark ? "bg-dark border-secondary" : "bg-light border-light"}`}>
          <div
            className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: 64, height: 64, background: "rgba(25,135,84,0.08)" }}
          >
            <i className="bi bi-car-front text-success" style={{ fontSize: "1.8rem" }} />
          </div>
          <p className="fw-semibold mb-1">Aucun véhicule</p>
          <p className={`small mb-3 ${isDark ? "text-secondary" : "text-muted"}`}>
            Ajoutez votre voiture pour proposer des trajets en tant que conducteur.
          </p>
          <button
            type="button"
            className="btn btn-success rounded-3 fw-semibold px-4"
            style={{ fontSize: "0.88rem" }}
            onClick={() => setShowAdd(true)}
          >
            <i className="bi bi-plus-lg me-2" />
            Ajouter un véhicule
          </button>
        </div>
      )}

      {/* ── Véhicule enregistré ── */}
      {vehicule && (
        <div className={`rounded-4 overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white border"}`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374)" }} />

          {/* Photo de la voiture */}
          <div className="position-relative" style={{ height: 190, background: isDark ? "#1a1a1a" : "#f8f9fa" }}>
            {vehicule.photo_url ? (
              <img
                src={vehicule.photo_url}
                alt="Photo du véhicule"
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-2">
                <i className="bi bi-car-front text-success" style={{ fontSize: "3rem", opacity: 0.25 }} />
                <span className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>
                  Aucune photo
                </span>
              </div>
            )}

            {/* Bouton upload photo */}
            <button
              type="button"
              className={`btn btn-sm position-absolute d-flex align-items-center gap-1 rounded-3 fw-semibold ${isDark ? "btn-dark border border-secondary" : "btn-white border"}`}
              style={{ bottom: 10, right: 10, fontSize: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
              onClick={() => carPhotoRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto
                ? <><span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} /> Envoi...</>
                : <><i className="bi bi-camera-fill text-success" /> {vehicule.photo_url ? "Changer la photo" : "Ajouter une photo"}</>
              }
            </button>
            <input
              ref={carPhotoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="d-none"
              onChange={handleCarPhotoChange}
            />
          </div>

          {/* Infos véhicule */}
          <div className="p-3 p-md-4">
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div>
                <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                  {vehicule.marque} {vehicule.modele}
                </div>
                <div className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                  {[vehicule.couleur, vehicule.annee].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2" style={{ fontSize: "0.72rem" }}>
                <i className="bi bi-patch-check-fill me-1" />
                Conducteur
              </span>
            </div>

            {/* Grille de détails */}
            <div className="row g-2 mb-4">
              {[
                { icon: "bi-calendar3", label: "Année", value: vehicule.annee || "—" },
                { icon: "bi-palette", label: "Couleur", value: vehicule.couleur || "—" },
                { icon: "bi-credit-card-2-front", label: "Plaque", value: vehicule.plaque || "—", mono: true },
                { icon: "bi-people", label: "Places", value: `${vehicule.nb_places} places` },
              ].map(({ icon, label, value, mono }) => (
                <div key={label} className="col-6">
                  <div className={`rounded-3 p-2 text-center ${isDark ? "bg-dark border border-secondary" : "bg-light"}`}>
                    <i className={`bi ${icon} text-success d-block mb-1`} style={{ fontSize: "1rem" }} />
                    <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                    <div className={`fw-bold ${mono ? "font-monospace" : ""}`} style={{ fontSize: "0.82rem" }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-success rounded-3 fw-semibold flex-fill"
                style={{ fontSize: "0.85rem" }}
                onClick={() => setShowAdd(true)}
              >
                <i className="bi bi-pencil me-1" />
                Modifier
              </button>
              <button
                className="btn btn-outline-danger rounded-3 fw-semibold flex-fill"
                style={{ fontSize: "0.85rem" }}
                onClick={handleDelete}
              >
                <i className="bi bi-trash3 me-1" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalAjouterVoiture
        show={showAdd}
        vehicule={vehicule}
        onClose={() => { setShowAdd(false); loadVehicule().then(() => reloadUser?.()); }}
        isDark={isDark}
      />

      {/* Modal de recadrage photo voiture */}
      {cropSrc && (
        <CropPhotoModal
          imageSrc={cropSrc}
          onSave={handleCarCropSave}
          onClose={() => setCropSrc(null)}
          isDark={isDark}
          circular={false}
          title="Recadrer la photo du véhicule"
        />
      )}
    </div>
  );
}
