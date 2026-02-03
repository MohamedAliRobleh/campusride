// src/components/Header.jsx
import { Link } from "react-router-dom";

export default function Header({ isDark, onToggleTheme }) {
  return (
    <header className={`sticky-top border-bottom ${isDark ? "bg-dark" : "bg-light"}`}>
      <nav className={`navbar navbar-expand-lg ${isDark ? "navbar-dark" : "navbar-light"}`}>
        <div className="container-fluid px-4">
          {/* Logo */}
          <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
            <span style={{ fontSize: 20 }}>🚗</span>
            CampusRide
          </Link>

          {/* Mobile toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            {/* Left */}
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

            {/* Right */}
            <ul className="navbar-nav align-items-lg-center gap-lg-3">
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  <i className="bi bi-box-arrow-in-right me-1" />
                  Connexion
                </Link>
              </li>

              <li className="nav-item">
                <Link className="btn btn-success" to="/register">
                  <i className="bi bi-person-plus me-1" />
                  Créer un compte
                </Link>
              </li>

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
  );
}
