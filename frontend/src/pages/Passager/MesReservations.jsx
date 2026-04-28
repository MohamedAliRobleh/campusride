// src/pages/Passager/MesReservations.jsx

import { useEffect, useRef, useState } from "react";
import { useConfirm } from "../../components/ConfirmModal";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";
import UserProfileModal from "../../components/UserProfileModal";
import TrajetMapModal from "../../components/TrajetMapModal";
import EmergencyButton from "../../components/EmergencyButton";
import ReportModal from "../../components/ReportModal";
import LiveTrackingMap from "../../components/LiveTrackingMap";


function EvaluationModal({ trajetId, token, onClose, isDark }) {
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!note) { setError("Choisissez une note."); return; }
    try {
      setLoading(true);
      const res = await fetch("/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trajet_id: trajetId, note, commentaire }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Erreur."); return; }
      onClose(true);
    } catch { setError("Erreur serveur."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, zIndex: 9999 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className={`modal-content rounded-4 border-0 ${isDark ? "bg-dark text-light" : ""}`}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">Évaluer le conducteur</h5>
            <button type="button" className="btn-close" onClick={() => onClose(false)} />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <p className={`small mb-3 ${isDark ? "text-secondary" : "text-muted"}`}>Donnez une note à ce trajet :</p>
            <div className="d-flex gap-2 justify-content-center mb-3">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="btn p-1"
                  style={{ fontSize: "2rem", color: n <= note ? "#ffc107" : "#dee2e6", lineHeight: 1 }}
                  onClick={() => setNote(n)}
                >★</button>
              ))}
            </div>
            <textarea
              className={`form-control rounded-3 ${isDark ? "bg-dark text-light border-secondary" : ""}`}
              rows={3}
              placeholder="Commentaire optionnel..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-outline-secondary rounded-3" onClick={() => onClose(false)}>Annuler</button>
            <button className="btn btn-success rounded-3 fw-semibold" onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-1" /> : null}
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUT_CONFIG = {
  EN_ATTENTE: { label: "En attente",  cls: "bg-warning-subtle text-warning",    icon: "bi-hourglass-split" },
  ACCEPTEE:   { label: "Acceptée",    cls: "bg-success-subtle text-success",    icon: "bi-check-circle-fill" },
  REFUSEE:    { label: "Refusée",     cls: "bg-danger-subtle text-danger",      icon: "bi-x-circle-fill" },
  ANNULEE:    { label: "Annulée",     cls: "bg-secondary-subtle text-secondary", icon: "bi-slash-circle" },
  TERMINEE:   { label: "Terminée",    cls: "bg-secondary-subtle text-secondary", icon: "bi-flag-fill" },
};

export default function MesReservations() {
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirm();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ACTIVES");
  const [evalModal, setEvalModal] = useState(null); // { trajetId }
  const [dejasEvalues, setDejaEvalues] = useState(new Set());
  const [profileModal, setProfileModal] = useState(null); // { userId, roleContext, vehicule }
  const [mapReservation, setMapReservation] = useState(null);
  const [reportRes, setReportRes] = useState(null);

  // Live tracking (passager)
  const [liveResaId, setLiveResaId]       = useState(null);
  const [conducteurPos, setConducteurPos] = useState(null);
  const [liveDestCoords, setLiveDestCoords] = useState(null);
  const pollIntervalRef = useRef(null);

  const stopLiveTracking = () => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    setLiveResaId(null);
    setConducteurPos(null);
    setLiveDestCoords(null);
  };

  const startLiveTracking = (trajetId, resaId, destCoords) => {
    stopLiveTracking();
    setLiveResaId(resaId);
    setLiveDestCoords(destCoords);

    const poll = async () => {
      try {
        const res = await fetch(`/trajets/${trajetId}/live`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.statut !== "EN_COURS") { stopLiveTracking(); return; }
        if (data.conducteur_lat != null && data.conducteur_lng != null) {
          setConducteurPos({ lat: data.conducteur_lat, lng: data.conducteur_lng });
        }
      } catch { /* silencieux */ }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 5000);
  };

  useEffect(() => () => stopLiveTracking(), []);

  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/reservations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) { setError(data.message || "Erreur lors du chargement."); return; }
        setReservations(data.reservations || []);
      } catch (err) {
        console.error(err);
        setError("Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [token, navigate]);

  const handleAnnuler = async (reservationId) => {
    try {
      const response = await fetch(`/reservations/${reservationId}/annuler`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "Erreur lors de l'annulation."); return; }
      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, statut: "ANNULEE" } : r))
      );
    } catch (err) {
      console.error(err);
      setError("Erreur serveur.");
    }
  };

  const actives   = reservations.filter((r) => r.statut === "EN_ATTENTE" || r.statut === "ACCEPTEE");
  const historique = reservations.filter((r) => r.statut === "ANNULEE" || r.statut === "REFUSEE" || r.statut === "TERMINEE");
  const reservationsAffichees = filter === "ACTIVES" ? actives : historique;

  const handleMessage = (conducteurId) => {
    navigate("/passager/messages", { state: { interlocuteurId: conducteurId } });
  };

  const getInitiales = (prenom, nom) =>
    ((prenom?.[0] ?? "") + (nom?.[0] ?? "")).toUpperCase() || "?";

  return (
    <div className={`d-flex flex-column min-vh-100 ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      {ConfirmDialog}
      <HeaderPrivate isDark={isDark} />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 720 }}>

          {/* Header */}
          <div className="mb-4">
            <h4 className="fw-bold mb-1">Mes Réservations</h4>
            <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
              Suivez l'état de vos demandes de covoiturage.
            </p>
          </div>

          {/* Toggle */}
          <div className="d-flex gap-2 mb-4">
            <button
              className={`btn btn-sm rounded-pill fw-semibold px-3 ${filter === "ACTIVES" ? "btn-success" : "btn-outline-success"}`}
              onClick={() => setFilter("ACTIVES")}
            >
              Actives
              <span className={`ms-2 badge rounded-pill ${filter === "ACTIVES" ? "bg-white text-success" : "bg-success text-white"}`}>
                {actives.length}
              </span>
            </button>
            <button
              className={`btn btn-sm rounded-pill fw-semibold px-3 ${filter === "HISTORIQUE" ? "btn-secondary" : "btn-outline-secondary"}`}
              onClick={() => setFilter("HISTORIQUE")}
            >
              Historique
              <span className={`ms-2 badge rounded-pill ${filter === "HISTORIQUE" ? "bg-white text-secondary" : "bg-secondary text-white"}`}>
                {historique.length}
              </span>
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-success" />
            </div>
          )}

          {/* Error */}
          {error && <div className="alert alert-danger text-center">{error}</div>}

          {/* Empty */}
          {!loading && reservationsAffichees.length === 0 && !error && (
            <div className={`text-center py-5 rounded-4 ${isDark ? "bg-dark border border-secondary" : "bg-white"} shadow-sm`}>
              <i className="bi bi-calendar-x text-success" style={{ fontSize: "2.5rem" }} />
              <p className="mt-3 fw-semibold mb-1">Aucune réservation ici</p>
              <p className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                {filter === "ACTIVES"
                  ? "Vous n'avez pas de réservation active pour le moment."
                  : "Votre historique est vide."}
              </p>
            </div>
          )}

          {/* Cards */}
          {!loading && reservationsAffichees.map((r) => {
            const dateObj = new Date(r.dateheure_depart);
            const initiales = getInitiales(r.conducteur_prenom, r.conducteur_nom);
            const statutCfg = STATUT_CONFIG[r.statut] ?? { label: r.statut, cls: "bg-secondary-subtle text-secondary", icon: "bi-circle" };
            const canCancel = (r.statut === "EN_ATTENTE" || r.statut === "ACCEPTEE")
              && r.trajet_statut !== "EN_COURS" && r.trajet_statut !== "TERMINE" && r.trajet_statut !== "ANNULE";
            const voitureLabel = r.marque
              ? `${r.marque} ${r.modele ?? ""}${r.couleur ? ` · ${r.couleur}` : ""}`
              : null;

            return (
              <div
                key={r.id}
                className={`rounded-4 shadow-sm mb-3 overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}
              >
                {/* Top accent — couleur selon statut */}
                <div
                  style={{
                    height: 3,
                    background: r.trajet_statut === "EN_COURS"
                      ? "linear-gradient(90deg, #0d6efd, #6ea8fe)"
                      : r.statut === "ACCEPTEE"
                        ? "linear-gradient(90deg, #198754, #20c374)"
                        : r.statut === "EN_ATTENTE"
                          ? "linear-gradient(90deg, #ffc107, #ffda6a)"
                          : "linear-gradient(90deg, #6c757d, #adb5bd)",
                  }}
                />

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

                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ fontSize: "0.95rem", lineHeight: 1.2 }}>
                        {r.lieu_depart}
                      </div>
                      <div className={`small mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ lineHeight: 1.2 }}>
                        {r.destination}
                      </div>
                    </div>

                    <div className="text-end flex-shrink-0">
                      <div className="fw-bold text-success" style={{ fontSize: "1.1rem" }}>
                        {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                        {dateObj.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <hr className={`my-2 ${isDark ? "border-secondary" : ""}`} />

                  {/* Conducteur + voiture */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <button
                      className="btn p-0 border-0 bg-transparent flex-shrink-0"
                      title="Voir le profil du conducteur"
                      onClick={() => r.conducteur_id && setProfileModal({
                        userId: r.conducteur_id,
                        roleContext: "CONDUCTEUR",
                        vehicule: r.marque ? { marque: r.marque, modele: r.modele, couleur: r.couleur, plaque: r.plaque } : null,
                      })}
                    >
                      {r.conducteur_photo_url ? (
                        <img
                          src={r.conducteur_photo_url}
                          alt={`${r.conducteur_prenom} ${r.conducteur_nom}`}
                          className="rounded-circle"
                          style={{ width: 40, height: 40, objectFit: "cover", border: "2px solid #198754" }}
                        />
                      ) : (
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{ width: 40, height: 40, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: "0.85rem", border: "2px solid #198754" }}
                        >
                          {initiales}
                        </div>
                      )}
                    </button>

                    <div className="flex-grow-1 min-w-0">
                      <button
                        className="btn p-0 border-0 bg-transparent fw-semibold text-start"
                        style={{ fontSize: "0.9rem", color: "inherit" }}
                        onClick={() => r.conducteur_id && setProfileModal({
                          userId: r.conducteur_id,
                          roleContext: "CONDUCTEUR",
                          vehicule: r.marque ? { marque: r.marque, modele: r.modele, couleur: r.couleur, plaque: r.plaque } : null,
                        })}
                      >
                        {r.conducteur_prenom} {r.conducteur_nom}
                      </button>
                      {voitureLabel && (
                        <div className={`d-flex align-items-center gap-1 small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.8rem" }}>
                          <i className="bi bi-car-front" />
                          {voitureLabel}
                        </div>
                      )}
                      {r.plaque && (
                        <span
                          className="d-inline-block mt-1 fw-bold"
                          style={{
                            fontSize: "0.7rem",
                            background: isDark ? "#343a40" : "#212529",
                            color: "#f8f9fa",
                            borderRadius: 4,
                            padding: "2px 8px",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {r.plaque}
                        </span>
                      )}
                    </div>

                    <span className="badge bg-success-subtle text-success flex-shrink-0" style={{ fontSize: "0.72rem" }}>
                      <i className="bi bi-patch-check-fill me-1" />
                      Vérifié
                    </span>
                  </div>

                  {/* Code de confirmation embarquement */}
                  {r.statut === "ACCEPTEE" && r.trajet_statut === "EN_COURS" && r.code_confirmation && !r.embarquement_confirme && (
                    <div className="rounded-3 p-3 mb-3 text-center" style={{ background: "linear-gradient(135deg,#0f4c2a,#198754)" }}>
                      <div className="text-white fw-semibold mb-1" style={{ fontSize: "0.78rem", letterSpacing: "0.05em" }}>
                        <i className="bi bi-qr-code me-1" />VOTRE CODE D'EMBARQUEMENT
                      </div>
                      <div className="fw-bold text-white" style={{ fontSize: "2.8rem", letterSpacing: "0.3em", fontFamily: "monospace" }}>
                        {r.code_confirmation}
                      </div>
                      <div className="text-white opacity-75" style={{ fontSize: "0.72rem" }}>
                        Montrez ce code à votre conducteur
                      </div>
                    </div>
                  )}
                  {r.statut === "ACCEPTEE" && r.embarquement_confirme && (
                    <div className="rounded-3 p-2 mb-3 d-flex align-items-center gap-2" style={{ background: "#d1e7dd" }}>
                      <i className="bi bi-check-circle-fill text-success fs-5" />
                      <span className="fw-semibold text-success" style={{ fontSize: "0.82rem" }}>Embarquement confirmé par le conducteur</span>
                    </div>
                  )}

                  {/* Panel suivi en direct passager */}
                  {r.statut === "ACCEPTEE" && r.trajet_statut === "EN_COURS" && (
                    <div className={`rounded-3 p-3 mb-3 ${isDark ? "bg-dark border border-primary border-opacity-25" : "bg-light border border-primary border-opacity-25"}`}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-semibold small d-flex align-items-center gap-2">
                          <i className="bi bi-broadcast text-primary" />
                          Trajet en direct
                        </span>
                        {liveResaId === r.id ? (
                          <button className="btn btn-outline-secondary btn-sm rounded-3" onClick={stopLiveTracking}>
                            <i className="bi bi-x-lg me-1" />Fermer
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm rounded-3 fw-semibold"
                            onClick={() => startLiveTracking(
                              r.trajet_id,
                              r.id,
                              r.dest_lat != null ? { lat: r.dest_lat, lng: r.dest_lng } : null
                            )}
                          >
                            <i className="bi bi-broadcast me-1" />Voir en direct
                          </button>
                        )}
                      </div>
                      {liveResaId === r.id && (
                        <LiveTrackingMap
                          conducteurPos={conducteurPos}
                          destCoords={liveDestCoords}
                          destination={r.destination}
                          isDark={isDark}
                          height={240}
                        />
                      )}
                    </div>
                  )}

                  {/* Statut + boutons */}
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <span className={`badge rounded-pill px-3 py-2 fw-semibold ${statutCfg.cls}`} style={{ fontSize: "0.78rem" }}>
                        <i className={`bi ${statutCfg.icon} me-1`} />
                        {statutCfg.label}
                      </span>
                      {r.statut === "ACCEPTEE" && r.trajet_statut === "EN_COURS" && (
                        <span className="badge rounded-pill bg-primary px-3 py-2 fw-semibold" style={{ fontSize: "0.78rem" }}>
                          <i className="bi bi-car-front-fill me-1" />
                          En route !
                        </span>
                      )}
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        className="btn btn-outline-secondary btn-sm rounded-3"
                        title="Voir sur la carte"
                        onClick={() => setMapReservation(r)}
                      >
                        <i className="bi bi-map" />
                      </button>
                      {r.statut === "ACCEPTEE" && r.trajet_statut === "TERMINE" && !dejasEvalues.has(r.trajet_id) && (
                        <button
                          className="btn btn-outline-warning btn-sm rounded-3 fw-semibold"
                          onClick={() => setEvalModal({ trajetId: r.trajet_id })}
                        >
                          <i className="bi bi-star-fill me-1" />
                          Évaluer
                        </button>
                      )}
                      {r.statut === "ACCEPTEE" && r.trajet_statut === "TERMINE" && dejasEvalues.has(r.trajet_id) && (
                        <span className="badge bg-warning-subtle text-warning px-2 py-2" style={{ fontSize: "0.72rem" }}>
                          <i className="bi bi-star-fill me-1" />Évalué
                        </span>
                      )}
                      {r.conducteur_id && (r.statut === "ACCEPTEE" || r.statut === "EN_ATTENTE") && (
                        <button
                          className="btn btn-outline-success btn-sm rounded-3 fw-semibold"
                          onClick={() => handleMessage(r.conducteur_id)}
                          title={`Contacter ${r.conducteur_prenom}`}
                        >
                          <i className="bi bi-chat-dots-fill me-1" />
                          Message
                        </button>
                      )}
                      {canCancel && (
                        <button
                          className="btn btn-outline-danger btn-sm rounded-3 fw-semibold"
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Annuler la réservation",
                              message: "Cette action est irréversible. Souhaitez-vous vraiment annuler votre réservation pour ce trajet ?",
                              confirmLabel: "Annuler la réservation",
                              cancelLabel: "Garder",
                              variant: "danger",
                            });
                            if (ok) handleAnnuler(r.id);
                          }}
                        >
                          <i className="bi bi-x-lg me-1" />
                          Annuler
                        </button>
                      )}
                      {/* Signaler le conducteur — pendant ou après le trajet */}
                      {r.statut === "ACCEPTEE" && r.conducteur_id && (
                        <button
                          className="btn btn-outline-danger btn-sm rounded-3"
                          title="Signaler le conducteur"
                          onClick={() => setReportRes(r)}
                        >
                          <i className="bi bi-flag" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      </main>

      <Footer isDark={isDark} />

      {evalModal && (
        <EvaluationModal
          trajetId={evalModal.trajetId}
          token={token}
          isDark={isDark}
          onClose={(submitted) => {
            if (submitted) setDejaEvalues((prev) => new Set([...prev, evalModal.trajetId]));
            setEvalModal(null);
          }}
        />
      )}

      {profileModal && (
        <UserProfileModal
          userId={profileModal.userId}
          isDark={isDark}
          roleContext={profileModal.roleContext}
          vehicule={profileModal.vehicule}
          onClose={() => setProfileModal(null)}
        />
      )}

      {mapReservation && (
        <TrajetMapModal
          trajet={{
            lieu_depart: mapReservation.lieu_depart,
            destination: mapReservation.destination,
            dateheure_depart: mapReservation.dateheure_depart,
            conducteur_prenom: mapReservation.conducteur_prenom,
            conducteur_nom: mapReservation.conducteur_nom,
            conducteur_photo_url: mapReservation.conducteur_photo_url,
            marque: mapReservation.marque,
            modele: mapReservation.modele,
            couleur: mapReservation.couleur,
          }}
          isDark={isDark}
          onClose={() => setMapReservation(null)}
          showReserve={false}
        />
      )}
      {reportRes && (
        <ReportModal
          type="UTILISATEUR"
          cible_id={reportRes.conducteur_id}
          nomCible={`${reportRes.conducteur_prenom} ${reportRes.conducteur_nom}`}
          isDark={isDark}
          onClose={() => setReportRes(null)}
        />
      )}

      <EmergencyButton />
    </div>
  );
}
