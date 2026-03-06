// src/pages/Passager/Search.jsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";
import UserProfileModal from "../../components/UserProfileModal";
import TrajetMapModal from "../../components/TrajetMapModal";

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateFilters = location.state || {};

  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState({ show: false, text: "", type: "success" });
  const [profileUserId, setProfileUserId] = useState(null);
  const [mapTrajet, setMapTrajet] = useState(null);

  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  useEffect(() => {
    const fetchTrajets = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (stateFilters.depart)      params.set("depart", stateFilters.depart);
        if (stateFilters.destination) params.set("destination", stateFilters.destination);
        if (stateFilters.date)        params.set("date", stateFilters.date);
        if (stateFilters.departCoords) {
          params.set("depart_lat", stateFilters.departCoords.lat);
          params.set("depart_lng", stateFilters.departCoords.lng);
        }
        if (stateFilters.destCoords) {
          params.set("dest_lat", stateFilters.destCoords.lat);
          params.set("dest_lng", stateFilters.destCoords.lng);
        }
        const url = `/trajets/recherche${params.toString() ? "?" + params.toString() : ""}`;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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

  const showToast = (text, type = "success") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const handleReservation = async (trajetId) => {
    if (!token) { showToast("Vous devez être connecté.", "danger"); return; }
    try {
      setLoadingId(trajetId);
      const response = await fetch("/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trajet_id: trajetId }),
      });
      const data = await response.json();
      if (!response.ok) { showToast(data.message || "Erreur lors de la réservation.", "danger"); return; }
      showToast("Réservation envoyée ! En attente de confirmation.", "success");
      setTrajets((prev) => prev.map((t) => t.id === trajetId ? { ...t, places_dispo: t.places_dispo - 1 } : t));
    } catch {
      showToast("Erreur serveur.", "danger");
    } finally {
      setLoadingId(null);
    }
  };

  const handleMessage = (conducteurId) => {
    if (!token) { showToast("Vous devez être connecté.", "danger"); return; }
    navigate("/passager/messages", { state: { interlocuteurId: conducteurId } });
  };

  const getInitiales = (prenom, nom) =>
    ((prenom?.[0] ?? "") + (nom?.[0] ?? "")).toUpperCase() || "?";

  const hasFilters = stateFilters.depart || stateFilters.destination || stateFilters.date;

  return (
    <div className={`d-flex flex-column min-vh-100 ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <HeaderPrivate isDark={isDark} />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 720 }}>

          {/* Header */}
          <div className="mb-4">
            <h4 className="fw-bold mb-1">Trajets disponibles</h4>
            {hasFilters ? (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {stateFilters.depart && (
                  <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2" style={{ fontSize: "0.78rem" }}>
                    <i className="bi bi-geo-alt me-1" />{stateFilters.depart}
                  </span>
                )}
                {stateFilters.destination && (
                  <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2" style={{ fontSize: "0.78rem" }}>
                    <i className="bi bi-geo-alt-fill me-1" />{stateFilters.destination}
                  </span>
                )}
                {stateFilters.date && (
                  <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2" style={{ fontSize: "0.78rem" }}>
                    <i className="bi bi-calendar me-1" />
                    {new Date(stateFilters.date + "T00:00:00").toLocaleDateString("fr-CA", { day: "2-digit", month: "long" })}
                  </span>
                )}
              </div>
            ) : (
              <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
                Tous les trajets disponibles dès maintenant
              </p>
            )}
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
              <p className="mt-3 fw-semibold mb-1">Aucun trajet trouvé</p>
              <p className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                Essayez d'autres critères ou revenez plus tard.
              </p>
            </div>
          )}

          {/* Cards */}
          {!loading && trajets.map((trajet) => {
            const dateObj = new Date(trajet.dateheure_depart);
            const initiales = getInitiales(trajet.conducteur_prenom, trajet.conducteur_nom);
            const conducteurNom = `${trajet.conducteur_prenom ?? ""} ${trajet.conducteur_nom ?? ""}`.trim();
            const voitureLabel = trajet.voiture_marque
              ? `${trajet.voiture_marque} ${trajet.voiture_modele ?? ""}${trajet.voiture_couleur ? ` · ${trajet.voiture_couleur}` : ""}${trajet.voiture_annee ? ` · ${trajet.voiture_annee}` : ""}`
              : null;
            const isFull = trajet.places_dispo <= 0;
            const isAlmostFull = trajet.places_dispo === 1 && !isFull;
            const fillPct = ((trajet.places_total - trajet.places_dispo) / trajet.places_total) * 100;
            const hasCoords = stateFilters.departCoords != null;
            const matchScore = trajet.match_score;
            const departDist = trajet.depart_distance_km;

            return (
              <div
                key={trajet.id}
                className={`rounded-4 shadow-sm mb-3 overflow-hidden fade-in ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}
              >
                <div
                  style={{
                    height: 3,
                    background: isFull
                      ? "linear-gradient(90deg, #6c757d, #adb5bd)"
                      : isAlmostFull
                        ? "linear-gradient(90deg, #fd7e14, #ffc107)"
                        : "linear-gradient(90deg, #198754, #20c374)",
                  }}
                />

                <div className="p-3 p-md-4">
                  {/* Route + heure */}
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="d-flex flex-column align-items-center flex-shrink-0" style={{ paddingTop: 4 }}>
                      <div className="rounded-circle bg-success" style={{ width: 9, height: 9 }} />
                      <div style={{ width: 2, height: 28, background: "repeating-linear-gradient(to bottom, #198754 0, #198754 4px, transparent 4px, transparent 8px)", margin: "3px 0" }} />
                      <i className="bi bi-geo-alt-fill text-success" style={{ fontSize: "0.85rem" }} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ fontSize: "0.95rem", lineHeight: 1.2 }}>{trajet.lieu_depart}</div>
                      <div className={`small mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ lineHeight: 1.2 }}>{trajet.destination}</div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="fw-bold text-success" style={{ fontSize: "1.1rem" }}>
                        {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                        {dateObj.toLocaleDateString("fr-CA", { day: "2-digit", month: "short" })}
                      </div>
                      {hasCoords && matchScore != null && (
                        <div className="mt-1 d-flex flex-column align-items-end gap-1">
                          <span
                            className="badge rounded-pill"
                            style={{
                              fontSize: "0.68rem",
                              background: matchScore >= 80 ? "#198754" : matchScore >= 50 ? "#fd7e14" : "#6c757d",
                              color: "#fff",
                              padding: "2px 8px",
                            }}
                          >
                            {matchScore}% match
                          </span>
                          {departDist != null && (
                            <span className="badge rounded-pill bg-success-subtle text-success" style={{ fontSize: "0.65rem", padding: "2px 7px" }}>
                              <i className="bi bi-geo-alt me-1" />{departDist} km
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="progress rounded-pill" style={{ height: 5 }}>
                      <div
                        className={`progress-bar ${isFull ? "bg-secondary" : isAlmostFull ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <div className={`d-flex justify-content-between mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                      <span>{isFull ? "Complet 🔒" : isAlmostFull ? "Presque complet 🔥" : "Places disponibles"}</span>
                      <span className="fw-semibold">{trajet.places_dispo}/{trajet.places_total} dispo</span>
                    </div>
                  </div>

                  <hr className={`my-2 ${isDark ? "border-secondary" : ""}`} />

                  {/* Conducteur + bouton */}
                  <div className="d-flex align-items-center gap-3">
                    <button
                      className="btn p-0 border-0 bg-transparent flex-shrink-0"
                      title="Voir le profil"
                      onClick={() => trajet.conducteur_id && setProfileUserId(trajet.conducteur_id)}
                      style={{ cursor: "pointer" }}
                    >
                      {trajet.conducteur_photo_url ? (
                        <img
                          src={trajet.conducteur_photo_url}
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
                    <div className="flex-grow-1 min-w-0">
                      <button
                        className="btn p-0 border-0 bg-transparent fw-semibold text-start"
                        style={{ fontSize: "0.88rem", color: "inherit" }}
                        onClick={() => trajet.conducteur_id && setProfileUserId(trajet.conducteur_id)}
                      >
                        {conducteurNom || "Conducteur"}
                      </button>
                      {voitureLabel && (
                        <div className={`d-flex align-items-center gap-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>
                          <i className="bi bi-car-front" />{voitureLabel}
                        </div>
                      )}
                    </div>
                    <div className="d-flex gap-2 flex-shrink-0">
                      <button
                        className="btn btn-outline-secondary rounded-3 flex-shrink-0"
                        title="Voir sur la carte"
                        onClick={() => setMapTrajet(trajet)}
                        style={{ width: 40, height: 38, padding: 0 }}
                      >
                        <i className="bi bi-map" />
                      </button>
                      {trajet.conducteur_id && (
                        <button
                          className="btn btn-outline-success rounded-3 flex-shrink-0"
                          title={`Contacter ${conducteurNom}`}
                          onClick={() => handleMessage(trajet.conducteur_id)}
                          style={{ width: 40, height: 38, padding: 0 }}
                        >
                          <i className="bi bi-chat-dots-fill" />
                        </button>
                      )}
                      <button
                        className={`btn fw-semibold rounded-3 px-3 flex-shrink-0 ${isFull ? "btn-secondary" : "btn-success"}`}
                        disabled={isFull || loadingId === trajet.id}
                        onClick={() => handleReservation(trajet.id)}
                        style={{ fontSize: "0.88rem" }}
                      >
                        {loadingId === trajet.id
                          ? <><span className="spinner-border spinner-border-sm me-1" />Envoi...</>
                          : isFull ? "Complet"
                          : <><i className="bi bi-check-circle me-1" />Réserver</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </main>

      {/* Toast */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <div
          className={`toast align-items-center border-0 shadow-lg rounded-3 ${toast.type === "success" ? "text-bg-success" : "text-bg-danger"} ${toast.show ? "show" : ""}`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body fw-semibold" style={{ fontSize: "0.88rem" }}>
              <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
              {toast.text}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((p) => ({ ...p, show: false }))} />
          </div>
        </div>
      </div>

      <Footer isDark={isDark} />

      {/* Modal profil conducteur */}
      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          isDark={isDark}
          onClose={() => setProfileUserId(null)}
        />
      )}

      {/* Modal carte trajet */}
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
          onReserve={() => { handleReservation(mapTrajet.id); setMapTrajet(null); }}
        />
      )}
    </div>
  );
}
