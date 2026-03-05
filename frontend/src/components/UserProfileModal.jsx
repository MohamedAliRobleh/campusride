// src/components/UserProfileModal.jsx
// Modal de profil public — style BlaBlaCar
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function StarRating({ value, max = 5, size = "1rem" }) {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    if (value >= i) {
      stars.push(<i key={i} className="bi bi-star-fill text-warning" style={{ fontSize: size }} />);
    } else if (value >= i - 0.5) {
      stars.push(<i key={i} className="bi bi-star-half text-warning" style={{ fontSize: size }} />);
    } else {
      stars.push(<i key={i} className="bi bi-star text-warning" style={{ fontSize: size }} />);
    }
  }
  return <span className="d-inline-flex gap-1">{stars}</span>;
}

export default function UserProfileModal({ userId, isDark, onClose }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState({ moyenne: null, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    // Charger d'abord le profil, puis les évals selon le rôle
    fetch(`/utilisateurs/${userId}/public`)
      .then(r => r.json())
      .then(userData => {
        const user = userData.user || null;
        setProfile(user);
        // Choisir le bon endpoint selon le rôle
        const evalUrl = (user?.role === "PASSAGER")
          ? `/evaluations/passager/${userId}`
          : `/evaluations/conducteur/${userId}`;
        return fetch(evalUrl).then(r => r.json());
      })
      .then(evalData => {
        setEvaluations(evalData.evaluations || []);
        setStats(evalData.stats || { moyenne: null, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleMessage = () => {
    onClose();
    navigate("/passager/messages", { state: { interlocuteurId: userId } });
  };

  const initials = profile
    ? ((profile.prenom?.[0] ?? "") + (profile.nom?.[0] ?? "")).toUpperCase()
    : "?";

  const moyenneNum = parseFloat(stats?.moyenne) || 0;
  const totalEvals = parseInt(stats?.total) || 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ background: "rgba(0,0,0,0.55)", zIndex: 1050, backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="position-fixed top-50 start-50 translate-middle"
        style={{ zIndex: 1055, width: "min(92vw, 460px)", maxHeight: "88vh", overflowY: "auto" }}
      >
        <div className={`rounded-4 shadow-lg overflow-hidden ${isDark ? "bg-dark text-light border border-secondary" : "bg-white"}`}>

          {/* Header gradient */}
          <div style={{ height: 4, background: "linear-gradient(90deg, #198754, #20c374, #198754)" }} />

          {/* Close button */}
          <button
            className="btn btn-link position-absolute text-muted text-decoration-none"
            style={{ top: 12, right: 12, fontSize: "1.2rem", zIndex: 1 }}
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" />
            </div>
          ) : !profile ? (
            <div className="text-center py-5">
              <i className="bi bi-exclamation-circle text-danger d-block mb-2" style={{ fontSize: "2rem" }} />
              <p className="fw-semibold">Profil introuvable</p>
            </div>
          ) : (
            <div className="p-4">

              {/* Avatar + nom + rôle */}
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block mb-3">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={`${profile.prenom} ${profile.nom}`}
                      className="rounded-circle"
                      style={{ width: 84, height: 84, objectFit: "cover", border: "3px solid #198754" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mx-auto"
                      style={{ width: 84, height: 84, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: "1.6rem", border: "3px solid #198754" }}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Badge rôle */}
                  <span
                    className="position-absolute bottom-0 end-0 badge rounded-pill"
                    style={{ fontSize: "0.6rem", background: "#198754", border: "2px solid white", padding: "3px 7px" }}
                  >
                    {profile.role === "CONDUCTEUR" ? (
                      <><i className="bi bi-car-front-fill me-1" />Conducteur</>
                    ) : (
                      <><i className="bi bi-person-fill me-1" />Passager</>
                    )}
                  </span>
                </div>

                <h5 className="fw-bold mb-1">{profile.prenom} {profile.nom}</h5>
                <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
                  <i className="bi bi-calendar3 me-1" />
                  Membre depuis {new Date(profile.cree_le).toLocaleDateString("fr-CA", { month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Stats cards */}
              <div className="row g-2 mb-4">
                {/* Note moyenne */}
                <div className="col-4">
                  <div
                    className={`rounded-3 text-center p-2 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`}
                  >
                    <div className="fw-bold" style={{ fontSize: "1.4rem", color: "#198754" }}>
                      {moyenneNum > 0 ? moyenneNum.toFixed(1) : "—"}
                    </div>
                    <StarRating value={moyenneNum} size="0.65rem" />
                    <div className={`mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.68rem" }}>Note</div>
                  </div>
                </div>

                {/* Nombre d'avis */}
                <div className="col-4">
                  <div className={`rounded-3 text-center p-2 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`}>
                    <div className="fw-bold" style={{ fontSize: "1.4rem", color: "#198754" }}>
                      {totalEvals}
                    </div>
                    <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.68rem", marginTop: 2 }}>
                      <i className="bi bi-chat-quote me-1" />
                      Avis
                    </div>
                  </div>
                </div>

                {/* Trajets conduits */}
                <div className="col-4">
                  <div className={`rounded-3 text-center p-2 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`}>
                    <div className="fw-bold" style={{ fontSize: "1.4rem", color: "#198754" }}>
                      {parseInt(profile.trajets_conduits) || 0}
                    </div>
                    <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.68rem", marginTop: 2 }}>
                      <i className="bi bi-map me-1" />
                      Trajets
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton contacter */}
              <button
                className="btn btn-success w-100 rounded-3 fw-semibold mb-4 py-2"
                style={{ background: "linear-gradient(135deg, #198754, #20c374)", border: "none" }}
                onClick={handleMessage}
              >
                <i className="bi bi-chat-dots-fill me-2" />
                Envoyer un message
              </button>

              {/* Avis */}
              {evaluations.length > 0 && (
                <div>
                  <div className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.9rem" }}>
                    <i className="bi bi-star-fill text-warning" />
                    Avis des passagers
                    <span className={`badge rounded-pill ms-1 ${isDark ? "bg-secondary" : "bg-light text-dark border"}`} style={{ fontSize: "0.7rem" }}>
                      {totalEvals}
                    </span>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    {evaluations.slice(0, 5).map((ev) => {
                      const evInitials = ((ev.evaluateur_prenom?.[0] ?? "") + (ev.evaluateur_nom?.[0] ?? "")).toUpperCase();
                      return (
                        <div
                          key={ev.id}
                          className={`rounded-3 p-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`}
                        >
                          <div className="d-flex align-items-center gap-2 mb-2">
                            {ev.evaluateur_photo_url ? (
                              <img
                                src={ev.evaluateur_photo_url}
                                alt={ev.evaluateur_prenom}
                                className="rounded-circle flex-shrink-0"
                                style={{ width: 30, height: 30, objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                style={{ width: 30, height: 30, background: "linear-gradient(135deg, #6c757d, #adb5bd)", fontSize: "0.7rem" }}
                              >
                                {evInitials || "?"}
                              </div>
                            )}
                            <div className="flex-grow-1">
                              <div className="fw-semibold" style={{ fontSize: "0.82rem" }}>
                                {ev.evaluateur_prenom} {ev.evaluateur_nom}
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <StarRating value={ev.note} size="0.7rem" />
                                <span className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.68rem" }}>
                                  {new Date(ev.cree_le).toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                              </div>
                            </div>
                          </div>
                          {ev.commentaire && (
                            <p className={`mb-0 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
                              "{ev.commentaire}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {evaluations.length === 0 && (
                <div className="text-center py-3">
                  <i className={`bi bi-star d-block mb-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "1.8rem" }} />
                  <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>Aucun avis pour le moment</p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
