// src/pages/Passager/Trajets.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";
import UserProfileModal from "../../components/UserProfileModal";
import TrajetMapModal from "../../components/TrajetMapModal";
import ReportModal from "../../components/ReportModal";
import EmergencyButton from "../../components/EmergencyButton";

export default function Trajets() {
  const navigate = useNavigate();
  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUserId, setProfileUserId] = useState(null);
  const [mapTrajet, setMapTrajet] = useState(null);
  const [reportTrajet, setReportTrajet] = useState(null);
  const [toast, setToast] = useState({ show: false, text: "" });
  const token = localStorage.getItem("token");
  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  const showToast = (text) => {
    setToast({ show: true, text });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  useEffect(() => {
    document.body.dataset.bsTheme = theme;
    window.scrollTo(0, 0);
  }, [theme]);

  useEffect(() => {
    const fetchTrajets = async () => {
      try {
        setLoading(true);
        const response = await fetch("/trajets/recherche", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setTrajets(data.trajets || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrajets();
  }, [token]);

  const getInitiales = (prenom, nom) => {
    const p = prenom?.[0]?.toUpperCase() ?? "";
    const n = nom?.[0]?.toUpperCase() ?? "";
    return p + n || "?";
  };

  return (
    <div className={`d-flex flex-column min-vh-100 ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <HeaderPrivate isDark={isDark} />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 720 }}>

          {/* Header */}
          <div className="mb-4">
            <h4 className="fw-bold mb-1">Tous les trajets disponibles</h4>
            <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
              Trouvez un trajet et réservez votre place en quelques secondes.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-success" />
            </div>
          )}

          {/* Empty */}
          {!loading && trajets.length === 0 && (
            <div className={`text-center py-5 rounded-4 ${isDark ? "bg-dark border border-secondary" : "bg-white"} shadow-sm`}>
              <i className="bi bi-car-front text-success" style={{ fontSize: "2.5rem" }} />
              <p className="mt-3 fw-semibold mb-1">Aucun trajet disponible</p>
              <p className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                Revenez plus tard ou modifiez vos critères de recherche.
              </p>
            </div>
          )}

          {/* Cards */}
          {!loading && trajets.map((t) => {
            const dateObj = new Date(t.dateheure_depart);
            const conducteurNom = `${t.conducteur_prenom ?? ""} ${t.conducteur_nom ?? ""}`.trim();
            const initiales = getInitiales(t.conducteur_prenom, t.conducteur_nom);
            const hasVoiture = t.voiture_marque;
            const voitureLabel = hasVoiture
              ? `${t.voiture_marque} ${t.voiture_modele}${t.voiture_couleur ? ` · ${t.voiture_couleur}` : ""}${t.voiture_annee ? ` · ${t.voiture_annee}` : ""}`
              : null;
            const isFull = t.places_dispo <= 0;

            return (
              <div
                key={t.id}
                className={`rounded-4 shadow-sm mb-3 overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}
                style={isFull ? { opacity: 0.85 } : {}}
              >
                {/* Top accent */}
                <div style={{ height: 3, background: isFull ? "linear-gradient(90deg, #6c757d, #adb5bd)" : "linear-gradient(90deg, #198754, #20c374)" }} />

                <div className="p-3 p-md-4">
                  {/* Route + heure */}
                  <div className="d-flex align-items-start gap-3 mb-3">
                    {/* Route line */}
                    <div className="d-flex flex-column align-items-center flex-shrink-0" style={{ paddingTop: 4 }}>
                      <div className="rounded-circle bg-success" style={{ width: 9, height: 9 }} />
                      <div
                        style={{
                          width: 2,
                          height: 28,
                          background: "repeating-linear-gradient(to bottom, #198754 0, #198754 4px, transparent 4px, transparent 8px)",
                          margin: "3px 0",
                        }}
                      />
                      <i className="bi bi-geo-alt-fill text-success" style={{ fontSize: "0.85rem" }} />
                    </div>

                    {/* Lieux */}
                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ fontSize: "0.95rem", lineHeight: 1.2 }}>
                        {t.lieu_depart}
                      </div>
                      <div className={`small mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ lineHeight: 1.2 }}>
                        {t.destination}
                      </div>
                    </div>

                    {/* Heure + date */}
                    <div className="text-end flex-shrink-0">
                      <div className="fw-bold text-success" style={{ fontSize: "1.1rem" }}>
                        {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                        {dateObj.toLocaleDateString("fr-CA", { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                  </div>

                  <hr className={`my-2 ${isDark ? "border-secondary" : ""}`} />

                  {/* Conducteur + voiture + places */}
                  <div className="d-flex align-items-center gap-3">
                    <button
                      className="btn p-0 border-0 bg-transparent flex-shrink-0"
                      title="Voir le profil"
                      onClick={() => t.conducteur_id && setProfileUserId(t.conducteur_id)}
                    >
                      {t.conducteur_photo_url ? (
                        <img
                          src={t.conducteur_photo_url}
                          alt={conducteurNom}
                          className="rounded-circle"
                          style={{ width: 38, height: 38, objectFit: "cover", border: "2px solid #198754" }}
                        />
                      ) : (
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{ width: 38, height: 38, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: "0.8rem", border: "2px solid #198754" }}
                        >
                          {initiales}
                        </div>
                      )}
                    </button>

                    {/* Infos conducteur */}
                    <div className="flex-grow-1 min-w-0">
                      <button
                        className="btn p-0 border-0 bg-transparent fw-semibold text-start"
                        style={{ fontSize: "0.88rem", color: "inherit" }}
                        onClick={() => t.conducteur_id && setProfileUserId(t.conducteur_id)}
                      >
                        {conducteurNom || "Conducteur"}
                      </button>
                      {voitureLabel && (
                        <div className={`small d-flex align-items-center gap-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>
                          <i className="bi bi-car-front" />
                          {voitureLabel}
                        </div>
                      )}
                    </div>

                    {/* Places dispo */}
                    <div className="flex-shrink-0 d-flex align-items-center gap-2">
                      {isFull ? (
                        <span className="badge rounded-pill px-3 py-2 fw-semibold" style={{ background: "#dc354520", color: "#dc3545", border: "1px solid #dc354540" }}>
                          <i className="bi bi-lock-fill me-1" />
                          Complet
                        </span>
                      ) : (
                        <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2 fw-semibold">
                          <i className="bi bi-people-fill me-1" />
                          {t.places_dispo} place{t.places_dispo > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Boutons Carte + Réserver + Signaler */}
                  <div className="d-flex gap-2 mt-3">
                    <button
                      type="button"
                      className={`btn btn-outline-secondary rounded-3 fw-semibold px-3 ${isDark ? "border-secondary" : ""}`}
                      onClick={() => setMapTrajet(t)}
                    >
                      <i className="bi bi-map me-2" />
                      Voir sur la carte
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 rounded-3 fw-semibold py-2 ${isFull ? "btn-secondary" : "btn-success"}`}
                      style={isFull ? {} : { background: "linear-gradient(135deg, #198754, #20c374)", border: "none" }}
                      onClick={() => isFull
                        ? showToast("Ce trajet est complet, toutes les places ont été réservées.")
                        : navigate("/passager/search", { state: { trajetId: t.id } })
                      }
                    >
                      {isFull ? (
                        <><i className="bi bi-lock-fill me-2" />Trajet complet</>
                      ) : (
                        <><i className="bi bi-check-circle me-2" />Réserver ce trajet</>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger rounded-3 px-2"
                      title="Signaler ce trajet"
                      onClick={() => setReportTrajet(t)}
                    >
                      <i className="bi bi-flag" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </main>

      <Footer isDark={isDark} />

      {/* Toast complet */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <div
          className={`toast align-items-center border-0 shadow-lg rounded-3 text-bg-danger ${toast.show ? "show" : ""}`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body fw-semibold" style={{ fontSize: "0.88rem" }}>
              <i className="bi bi-lock-fill me-2" />
              {toast.text}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((p) => ({ ...p, show: false }))} />
          </div>
        </div>
      </div>

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          isDark={isDark}
          onClose={() => setProfileUserId(null)}
        />
      )}

      {mapTrajet && (
        <TrajetMapModal
          trajet={{
            ...mapTrajet,
            conducteur_prenom: mapTrajet.conducteur_prenom,
            conducteur_nom: mapTrajet.conducteur_nom,
            conducteur_photo_url: mapTrajet.conducteur_photo_url,
            note_moyenne: mapTrajet.note_moyenne,
            marque: mapTrajet.voiture_marque,
            modele: mapTrajet.voiture_modele,
            couleur: mapTrajet.voiture_couleur,
            depart_lat: mapTrajet.depart_lat,
            depart_lng: mapTrajet.depart_lng,
            dest_lat: mapTrajet.dest_lat,
            dest_lng: mapTrajet.dest_lng,
          }}
          isDark={isDark}
          onClose={() => setMapTrajet(null)}
          showReserve={mapTrajet.places_dispo > 0}
          onReserve={() => { navigate("/passager/search", { state: { trajetId: mapTrajet.id } }); setMapTrajet(null); }}
        />
      )}

      {reportTrajet && (
        <ReportModal
          type="TRAJET"
          cible_id={reportTrajet.id}
          nomCible={`${reportTrajet.lieu_depart} → ${reportTrajet.destination}`}
          isDark={isDark}
          onClose={() => setReportTrajet(null)}
        />
      )}

      <EmergencyButton />
    </div>
  );
}
