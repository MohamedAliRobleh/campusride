// src/components/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer({ isDark }) {
  const year = new Date().getFullYear();

  const bg = isDark
    ? { backgroundColor: "#111827" }
    : { background: "linear-gradient(135deg, #198754 0%, #157347 100%)" };

  return (
    <footer style={bg}>
      <div className="container py-4 py-md-5">
        <div className="row g-4">

          {/* Logo + tagline */}
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{ width: 36, height: 36, background: "rgba(255,255,255,0.18)" }}
              >
                <i className="bi bi-car-front-fill text-white" style={{ fontSize: "1.05rem" }} />
              </div>
              <span className="fw-bold text-white fs-5" style={{ letterSpacing: "-0.3px" }}>
                CampusRide
              </span>
            </div>
            <p className="text-white mb-0" style={{ opacity: 0.72, fontSize: "0.85rem", lineHeight: 1.6 }}>
              Le covoiturage étudiant du Collège La Cité.
              Simple, sécurisé et gratuit.
            </p>
            <div className="mt-3 d-flex gap-2">
              <span
                className="badge rounded-pill px-3 py-2"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", fontSize: "0.72rem" }}
              >
                <i className="bi bi-shield-check me-1" />
                Sécurisé
              </span>
              <span
                className="badge rounded-pill px-3 py-2"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", fontSize: "0.72rem" }}
              >
                <i className="bi bi-people me-1" />
                Étudiant
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="col-6 col-md-4">
            <h6 className="text-white fw-bold mb-3" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.6 }}>
              Navigation
            </h6>
            <ul className="list-unstyled mb-0">
              {[
                { to: "/passager", icon: "bi-house", label: "Tableau de bord" },
                { to: "/passager/search", icon: "bi-search", label: "Trouver un trajet" },
                { to: "/passager/mes-reservations", icon: "bi-bookmark", label: "Mes réservations" },
                { to: "/passager/trajets", icon: "bi-list-ul", label: "Tous les trajets" },
              ].map(({ to, icon, label }) => (
                <li key={to} className="mb-2">
                  <Link
                    to={to}
                    className="text-decoration-none d-flex align-items-center gap-2"
                    style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", transition: "opacity 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                  >
                    <i className={`bi ${icon}`} style={{ fontSize: "0.75rem", opacity: 0.7 }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="col-6 col-md-4">
            <h6 className="text-white fw-bold mb-3" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.6 }}>
              Contact
            </h6>
            <ul className="list-unstyled mb-0">
              {[
                { icon: "bi-building", text: "Collège La Cité" },
                { icon: "bi-geo-alt", text: "Ottawa, Ontario, Canada" },
                { icon: "bi-envelope", text: "campusride@lacitec.on.ca" },
              ].map(({ icon, text }) => (
                <li key={text} className="mb-2 d-flex align-items-center gap-2" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem" }}>
                  <i className={`bi ${icon}`} style={{ fontSize: "0.75rem", opacity: 0.7, flexShrink: 0 }} />
                  {text}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom row */}
        <div
          className="mt-4 pt-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
        >
          <p className="mb-0 text-white" style={{ opacity: 0.5, fontSize: "0.78rem" }}>
            © {year} CampusRide — Tous droits réservés
          </p>
          <p className="mb-0 text-white" style={{ opacity: 0.5, fontSize: "0.78rem" }}>
            Collège La Cité · Ottawa, Canada
          </p>
        </div>
      </div>
    </footer>
  );
}
