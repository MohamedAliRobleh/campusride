// src/pages/Passager/MesReservations.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";


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
  EN_ATTENTE: { label: "En attente", cls: "bg-warning-subtle text-warning", icon: "bi-hourglass-split" },
  ACCEPTEE:   { label: "Acceptée",   cls: "bg-success-subtle text-success", icon: "bi-check-circle-fill" },
  REFUSEE:    { label: "Refusée",    cls: "bg-danger-subtle text-danger",   icon: "bi-x-circle-fill" },
  ANNULEE:    { label: "Annulée",    cls: "bg-secondary-subtle text-secondary", icon: "bi-slash-circle" },
  TERMINEE:   { label: "Terminée",   cls: "bg-secondary-subtle text-secondary", icon: "bi-flag-fill" },
};

export default function MesReservations() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ACTIVES");
  const [evalModal, setEvalModal] = useState(null); // { trajetId }
  const [dejasEvalues, setDejaEvalues] = useState(new Set());

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
            const canCancel = r.statut === "EN_ATTENTE" || r.statut === "ACCEPTEE";
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
                    background: r.statut === "ACCEPTEE"
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
                    {r.conducteur_photo_url ? (
                      <img
                        src={r.conducteur_photo_url}
                        alt={`${r.conducteur_prenom} ${r.conducteur_nom}`}
                        className="rounded-circle flex-shrink-0"
                        style={{ width: 40, height: 40, objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: 40, height: 40, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: "0.85rem" }}
                      >
                        {initiales}
                      </div>
                    )}

                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                        {r.conducteur_prenom} {r.conducteur_nom}
                      </div>
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

                  {/* Statut + boutons */}
                  <div className="d-flex justify-content-between align-items-center gap-2">
                    <span className={`badge rounded-pill px-3 py-2 fw-semibold ${statutCfg.cls}`} style={{ fontSize: "0.78rem" }}>
                      <i className={`bi ${statutCfg.icon} me-1`} />
                      {statutCfg.label}
                    </span>

                    <div className="d-flex gap-2 flex-wrap">
                      {r.statut === "TERMINEE" && !dejasEvalues.has(r.trajet_id) && (
                        <button
                          className="btn btn-outline-warning btn-sm rounded-3 fw-semibold"
                          onClick={() => setEvalModal({ trajetId: r.trajet_id })}
                        >
                          <i className="bi bi-star-fill me-1" />
                          Évaluer
                        </button>
                      )}
                      {r.statut === "TERMINEE" && dejasEvalues.has(r.trajet_id) && (
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
                          onClick={() => {
                            if (window.confirm("Confirmer l'annulation de cette réservation ?")) {
                              handleAnnuler(r.id);
                            }
                          }}
                        >
                          <i className="bi bi-x-lg me-1" />
                          Annuler
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
    </div>
  );
}
