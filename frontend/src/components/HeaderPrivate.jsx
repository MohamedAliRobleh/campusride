// src/components/HeaderPrivate.jsx
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function HeaderPrivate({ isDark, onToggleTheme }) {
  const navigate = useNavigate();

  // lire l'utilisateur ici (pas en dehors du composant)
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const userName = user?.prenom || user?.nom || "Utilisateur";
  const userInitial = (userName?.charAt(0) || "U").toUpperCase();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div>
      {/* ===== Barre de statut (même couleur que footer) ===== */}
      <div style={{ height: 36, backgroundColor: "#009E57" }} />

      <header className={`sticky-top border-bottom ${isDark ? "bg-dark" : "bg-light"}`}>
        <nav className={`navbar navbar-expand-lg ${isDark ? "navbar-dark" : "navbar-light"}`}>
          <div className="container-fluid px-4">
            {/* Logo */}
            <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/passager">
              <span style={{ fontSize: 20 }}>🚗</span>
              CampusRide
            </Link>

            {/* Mobile toggle */}
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#privateNavbar"
              aria-controls="privateNavbar"
              aria-expanded="false"
              aria-label="Ouvrir le menu"
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div className="collapse navbar-collapse" id="privateNavbar">
              {/* LEFT */}
              <ul className="navbar-nav me-auto gap-lg-3">
              <li className="nav-item">
                <Link className="nav-link" to="/search">
                  <i className="bi bi-search me-1" />
                  Rechercher
                </Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/post">
                  <i className="bi bi-car-front me-1" />
                  Publier
                </Link>
              </li>
            </ul>

              {/* RIGHT */}
              <ul className="navbar-nav align-items-lg-center gap-lg-3 list-unstyled ps-0 mb-0">
                {/* Panier / réservations */}
                <li className="nav-item">
                  <button type="button" className="btn btn-link p-0 text-decoration-none">
                    <i className="bi bi-cart fs-5 opacity-75" />
                  </button>
                </li>

                {/* Aide dropdown */}
                <li className="nav-item dropdown">
                  <button
                    className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    type="button"
                    
                  >
                    <span className="fw-semibold">aide</span>
                    <i className="bi bi-chevron-down small opacity-75" />
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2" type="button">
                        <i className="bi bi-question-circle" />
                        FAQ
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2" type="button">
                        <i className="bi bi-info-circle" />
                        comment ça fonctionne ?
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2" type="button">
                        <i className="bi bi-telephone" />
                        contact
                      </button>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li className="px-3 small text-muted">1-877-264-4697</li>
                  </ul>
                </li>

                {/* User dropdown */}
                <li className="nav-item dropdown">
                  <button
                    className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    type="button"
                    
                  >
                    <span
                      className="rounded-circle border d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32 }}
                    >
                      <span className="fw-semibold" onClick={() => navigate("/profil")}>{userInitial}</span>
                    </span>

                    <span className="fw-semibold">{userName}</span>
                    <i className="bi bi-chevron-down small opacity-75" />
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ minWidth: 260 }}>
                    <li className="px-3 py-2 text-center">
                      <div
                        className="mx-auto mb-1 rounded-circle border d-flex align-items-center justify-content-center"
                        style={{ width: 48, height: 48 }}
                      >
                        <span className="fw-bold" >{userInitial}</span>
                      </div>
                      <div className="fw-semibold">{userName}</div>
                      <div className="small text-muted">{user?.email || ""}</div>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2" type="button" onClick={() => navigate("/profil")}>
                        <i className="bi bi-gear" />
                        paramètres 
                        
                      </button>
                    </li>

                    <li>
                      <button
                        className="dropdown-item d-flex align-items-center gap-2 text-danger"
                        type="button"
                        onClick={logout}
                      >
                        <i className="bi bi-box-arrow-right" />
                        déconnexion
                      </button>
                    </li>
                  </ul>
                </li>

                {/* Theme toggle */}
                <li className="nav-item">
                  <button
                    type="button"
                    className={`btn btn-sm ${isDark ? "btn-outline-light" : "btn-outline-dark"}`}
                    onClick={onToggleTheme}
                    aria-label="Basculer mode jour/nuit"
                    title="Mode jour/nuit"
                  >
                    {isDark ? "☀️" : "🌙"}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}
