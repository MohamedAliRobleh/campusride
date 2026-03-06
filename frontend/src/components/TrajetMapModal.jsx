// src/components/TrajetMapModal.jsx
// Modal détail d'un trajet avec carte interactive
import TripMap from "./TripMap";

function StarRating({ value, size = "0.8rem" }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push(<i key={i} className="bi bi-star-fill text-warning" style={{ fontSize: size }} />);
    else if (value >= i - 0.5) stars.push(<i key={i} className="bi bi-star-half text-warning" style={{ fontSize: size }} />);
    else stars.push(<i key={i} className="bi bi-star text-warning" style={{ fontSize: size }} />);
  }
  return <span className="d-inline-flex gap-1">{stars}</span>;
}

/**
 * Props:
 *  trajet  — objet trajet (lieu_depart, destination, dateheure_depart, places_dispo, prix, conducteur_prenom, conducteur_nom, conducteur_photo_url, note_moyenne, marque, modele, couleur,
 *                          depart_lat, depart_lng, dest_lat, dest_lng)
 *  isDark  — boolean
 *  onClose — fn
 *  onReserve — fn optionnel (bouton Réserver)
 *  showReserve — boolean (afficher bouton réserver)
 */
export default function TrajetMapModal({ trajet, isDark, onClose, onReserve, showReserve = false }) {
  if (!trajet) return null;

  const initials = ((trajet.conducteur_prenom?.[0] ?? "") + (trajet.conducteur_nom?.[0] ?? "")).toUpperCase();
  const note = parseFloat(trajet.note_moyenne) || 0;
  const dateStr = new Date(trajet.dateheure_depart).toLocaleDateString("fr-CA", {
    weekday: "long", day: "numeric", month: "long",
  });
  const heureStr = new Date(trajet.dateheure_depart).toLocaleTimeString("fr-CA", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ background: "rgba(0,0,0,0.6)", zIndex: 1050, backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="position-fixed top-50 start-50 translate-middle"
        style={{ zIndex: 1055, width: "min(95vw, 520px)", maxHeight: "92vh", overflowY: "auto" }}
      >
        <div className={`rounded-4 shadow-lg overflow-hidden ${isDark ? "bg-dark text-light border border-secondary" : "bg-white"}`}>

          {/* Barre verte */}
          <div style={{ height: 4, background: "linear-gradient(90deg, #198754, #20c374, #198754)" }} />

          {/* Bouton fermer */}
          <button
            className="btn btn-link position-absolute text-muted"
            style={{ top: 10, right: 10, fontSize: "1.2rem", zIndex: 1 }}
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>

          <div className="p-4">

            {/* En-tête trajet */}
            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-calendar3 text-success" style={{ fontSize: "0.85rem" }} />
                <span className={`small text-capitalize ${isDark ? "text-secondary" : "text-muted"}`}>
                  {dateStr} à {heureStr}
                </span>
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex flex-column align-items-center" style={{ gap: 3 }}>
                  <div className="rounded-circle bg-success" style={{ width: 10, height: 10 }} />
                  <div style={{ width: 2, height: 22, background: "repeating-linear-gradient(to bottom, #198754 0px, #198754 4px, transparent 4px, transparent 8px)" }} />
                  <i className="bi bi-geo-alt-fill text-danger" style={{ fontSize: "0.9rem" }} />
                </div>
                <div className="d-flex flex-column" style={{ gap: 8 }}>
                  <span className="fw-semibold" style={{ fontSize: "1rem" }}>{trajet.lieu_depart}</span>
                  <span className="fw-semibold" style={{ fontSize: "1rem" }}>{trajet.destination}</span>
                </div>
              </div>
            </div>

            {/* Carte */}
            <div className="mb-3">
              <TripMap
                depart={trajet.lieu_depart}
                destination={trajet.destination}
                fromCoords={trajet.depart_lat ? { lat: trajet.depart_lat, lon: trajet.depart_lng } : null}
                toCoords={trajet.dest_lat ? { lat: trajet.dest_lat, lon: trajet.dest_lng } : null}
                isDark={isDark}
                height={260}
              />
            </div>

            {/* Info conducteur + voiture */}
            <div className={`rounded-3 p-3 mb-3 d-flex align-items-center gap-3 ${isDark ? "border border-secondary" : "bg-light"}`}>
              {trajet.conducteur_photo_url ? (
                <img
                  src={trajet.conducteur_photo_url}
                  alt={trajet.conducteur_prenom}
                  className="rounded-circle flex-shrink-0"
                  style={{ width: 46, height: 46, objectFit: "cover", border: "2px solid #198754" }}
                />
              ) : (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                  style={{ width: 46, height: 46, background: "linear-gradient(135deg,#198754,#20c374)", fontSize: "1rem", border: "2px solid #198754" }}
                >
                  {initials || "?"}
                </div>
              )}
              <div className="flex-grow-1 min-w-0">
                <div className="fw-semibold">{trajet.conducteur_prenom} {trajet.conducteur_nom}</div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <StarRating value={note} size="0.72rem" />
                  {note > 0 && (
                    <span className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                      {note.toFixed(1)}
                    </span>
                  )}
                </div>
                {(trajet.marque || trajet.modele) && (
                  <div className={`small mt-1 ${isDark ? "text-secondary" : "text-muted"}`}>
                    <i className="bi bi-car-front me-1" />
                    {[trajet.marque, trajet.modele, trajet.couleur].filter(Boolean).join(" • ")}
                  </div>
                )}
              </div>
            </div>

            {/* Places + prix */}
            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className={`rounded-3 p-3 text-center ${isDark ? "border border-secondary" : "bg-light"}`}>
                  <div className="fw-bold" style={{ fontSize: "1.3rem", color: "#198754" }}>
                    {trajet.places_dispo ?? "—"}
                  </div>
                  <div className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                    <i className="bi bi-people me-1" />Place{trajet.places_dispo > 1 ? "s" : ""} dispo
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className={`rounded-3 p-3 text-center ${isDark ? "border border-secondary" : "bg-light"}`}>
                  <div className="fw-bold" style={{ fontSize: "1.3rem", color: "#198754" }}>
                    {trajet.prix != null ? `${parseFloat(trajet.prix).toFixed(2)} $` : "—"}
                  </div>
                  <div className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                    <i className="bi bi-tag me-1" />Par place
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton réserver (optionnel) */}
            {showReserve && onReserve && (
              <button
                className="btn btn-success w-100 rounded-3 fw-semibold py-2"
                style={{ background: "linear-gradient(135deg,#198754,#20c374)", border: "none" }}
                onClick={onReserve}
              >
                <i className="bi bi-check-circle me-2" />
                Réserver ce trajet
              </button>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
