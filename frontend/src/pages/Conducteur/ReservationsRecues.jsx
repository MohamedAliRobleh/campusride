import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";

const STATUT_CONFIG = {
  EN_ATTENTE: { label: "En attente", cls: "bg-warning-subtle text-warning", icon: "bi-hourglass-split" },
  ACCEPTEE:   { label: "Acceptée",   cls: "bg-success-subtle text-success", icon: "bi-check-circle-fill" },
  REFUSEE:    { label: "Refusée",    cls: "bg-danger-subtle text-danger",   icon: "bi-x-circle-fill" },
  ANNULEE:    { label: "Annulée",    cls: "bg-secondary-subtle text-secondary", icon: "bi-slash-circle" },
};

export default function ReservationsRecues() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("EN_ATTENTE");
  const [toast, setToast] = useState({ show: false, text: "", type: "success" });

  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";
  const token = localStorage.getItem("token");

  useEffect(() => { document.body.dataset.bsTheme = theme; }, [theme]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const res = await fetch("/reservations/recues", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) { showToast(data.message || "Erreur chargement.", "danger"); return; }
        setReservations(data.reservations || []);
      } catch { showToast("Erreur serveur.", "danger"); }
      finally { setLoading(false); }
    };
    fetchReservations();
  }, [token, navigate]);

  const showToast = (text, type = "success") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/reservations/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || "Erreur.", "danger"); return; }
      setReservations((prev) =>
        prev.map((r) =>
          r.reservation_id === id
            ? { ...r, statut: action === "accepter" ? "ACCEPTEE" : "REFUSEE" }
            : r
        )
      );
      showToast(action === "accepter" ? "Réservation acceptée !" : "Réservation refusée.");
    } catch { showToast("Erreur serveur.", "danger"); }
  };

  const handleMessage = (passagerId) => {
    navigate("/passager/messages", { state: { interlocuteurId: passagerId } });
  };

  const getInitiales = (prenom, nom) =>
    ((prenom?.[0] ?? "") + (nom?.[0] ?? "")).toUpperCase() || "?";

  const enAttente = reservations.filter((r) => r.statut === "EN_ATTENTE");
  const traitees  = reservations.filter((r) => r.statut !== "EN_ATTENTE");
  const affichees = filter === "EN_ATTENTE" ? enAttente : traitees;

  return (
    <div className={`d-flex flex-column min-vh-100 ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <HeaderPrivate isDark={isDark} />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 720 }}>

          {/* Header */}
          <div className="mb-4">
            <h4 className="fw-bold mb-1">Mes passagers</h4>
            <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
              Gérez les demandes de réservation reçues.
            </p>
          </div>

          {/* Toggle */}
          <div className="d-flex gap-2 mb-4">
            <button
              className={`btn btn-sm rounded-pill fw-semibold px-3 ${filter === "EN_ATTENTE" ? "btn-warning" : "btn-outline-warning"}`}
              onClick={() => setFilter("EN_ATTENTE")}
            >
              <i className="bi bi-hourglass-split me-1" />
              En attente
              <span className={`ms-2 badge rounded-pill ${filter === "EN_ATTENTE" ? "bg-white text-warning" : "bg-warning text-white"}`}>
                {enAttente.length}
              </span>
            </button>
            <button
              className={`btn btn-sm rounded-pill fw-semibold px-3 ${filter === "TRAITEES" ? "btn-secondary" : "btn-outline-secondary"}`}
              onClick={() => setFilter("TRAITEES")}
            >
              Traitées
              <span className={`ms-2 badge rounded-pill ${filter === "TRAITEES" ? "bg-white text-secondary" : "bg-secondary text-white"}`}>
                {traitees.length}
              </span>
            </button>
          </div>

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-success" />
            </div>
          )}

          {!loading && affichees.length === 0 && (
            <div className={`text-center py-5 rounded-4 ${isDark ? "bg-dark border border-secondary" : "bg-white"} shadow-sm`}>
              <i className="bi bi-people text-success" style={{ fontSize: "2.5rem" }} />
              <p className="mt-3 fw-semibold mb-1">
                {filter === "EN_ATTENTE" ? "Aucune demande en attente" : "Aucune demande traitée"}
              </p>
              <p className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                {filter === "EN_ATTENTE"
                  ? "Les nouvelles demandes apparaîtront ici."
                  : "Les demandes acceptées/refusées apparaîtront ici."}
              </p>
            </div>
          )}

          {!loading && affichees.map((r) => {
            const dateObj = new Date(r.dateheure_depart);
            const initiales = getInitiales(r.prenom, r.nom);
            const statutCfg = STATUT_CONFIG[r.statut] ?? { label: r.statut, cls: "bg-secondary-subtle text-secondary", icon: "bi-circle" };

            return (
              <div
                key={r.reservation_id}
                className={`rounded-4 shadow-sm mb-3 overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}
              >
                {/* Accent bar */}
                <div style={{
                  height: 3,
                  background: r.statut === "ACCEPTEE"
                    ? "linear-gradient(90deg, #198754, #20c374)"
                    : r.statut === "EN_ATTENTE"
                      ? "linear-gradient(90deg, #ffc107, #ffda6a)"
                      : "linear-gradient(90deg, #6c757d, #adb5bd)",
                }} />

                <div className="p-3 p-md-4">
                  {/* Passager info */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                      style={{ width: 44, height: 44, background: "linear-gradient(135deg, #0d6efd, #6ea8fe)", fontSize: "0.85rem" }}
                    >
                      {initiales}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold" style={{ fontSize: "0.95rem" }}>
                        {r.prenom} {r.nom}
                      </div>
                      <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.8rem" }}>
                        {r.email}
                      </div>
                    </div>
                    <span className={`badge rounded-pill px-3 py-2 fw-semibold ${statutCfg.cls}`} style={{ fontSize: "0.78rem" }}>
                      <i className={`bi ${statutCfg.icon} me-1`} />
                      {statutCfg.label}
                    </span>
                  </div>

                  {/* Trajet */}
                  <div className={`rounded-3 p-2 mb-3 ${isDark ? "bg-black bg-opacity-25" : "bg-light"}`}>
                    <div className="d-flex align-items-start gap-3">
                      <div className="d-flex flex-column align-items-center flex-shrink-0" style={{ paddingTop: 4 }}>
                        <div className="rounded-circle bg-success" style={{ width: 8, height: 8 }} />
                        <div style={{ width: 2, height: 20, background: "repeating-linear-gradient(to bottom, #198754 0, #198754 4px, transparent 4px, transparent 8px)", margin: "2px 0" }} />
                        <i className="bi bi-geo-alt-fill text-success" style={{ fontSize: "0.8rem" }} />
                      </div>
                      <div>
                        <div className="fw-semibold" style={{ fontSize: "0.88rem" }}>{r.lieu_depart}</div>
                        <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.82rem" }}>{r.destination}</div>
                      </div>
                      <div className="ms-auto text-end flex-shrink-0">
                        <div className="fw-bold text-success" style={{ fontSize: "0.95rem" }}>
                          {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                          {dateObj.toLocaleDateString("fr-CA", { day: "2-digit", month: "short" })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <button
                      className="btn btn-outline-success btn-sm rounded-3 fw-semibold"
                      onClick={() => handleMessage(r.passager_id)}
                      title={`Envoyer un message à ${r.prenom}`}
                    >
                      <i className="bi bi-chat-dots-fill me-1" />
                      Message
                    </button>

                    {r.statut === "EN_ATTENTE" && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm rounded-3 fw-semibold"
                          onClick={() => handleAction(r.reservation_id, "accepter")}
                        >
                          <i className="bi bi-check-lg me-1" />
                          Accepter
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm rounded-3 fw-semibold"
                          onClick={() => handleAction(r.reservation_id, "refuser")}
                        >
                          <i className="bi bi-x-lg me-1" />
                          Refuser
                        </button>
                      </div>
                    )}
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
    </div>
  );
}
