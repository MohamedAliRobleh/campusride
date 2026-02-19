// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth.js";

import { useMemo } from "react";

export default function Header({ isDark, onToggleTheme }) {
  const navigate = useNavigate();

  // ===== Récupération utilisateur =====
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // ===== Navigation intelligente =====
  const handleSearch = () => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/passager/search");
    }
  };

  const handlePublish = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role === "CONDUCTEUR") {
      navigate("/conducteur/mes-trajets");
    } else {
      navigate("/passager/aide");
    }
  };

  const handleDashboard = () => {
    navigate("/passager");
  };

  const handleLogout = () => {
  logout(navigate);
};

  return (
    <header className={`sticky-top border-bottom ${isDark ? "bg-dark" : "bg-light"}`}>
      <nav className={`navbar navbar-expand-lg ${isDark ? "navbar-dark" : "navbar-light"}`}>
        <div className="container-fluid px-4">

          {/* ===== Logo ===== */}
          <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
            <span style={{ fontSize: 20 }}>🚗</span>
            CampusRide
          </Link>

          {/* ===== Mobile Toggle ===== */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">

            {/* ===== LEFT MENU ===== */}
            <ul className="navbar-nav me-auto gap-lg-3">

              <li className="nav-item">
                <button
                  className="nav-link btn btn-link p-0"
                  onClick={handleSearch}
                >
                  <i className="bi bi-search me-1" />
                  Rechercher
                </button>
              </li>

              <li className="nav-item">
                <button
                  className="nav-link btn btn-link p-0"
                  onClick={handlePublish}
                >
                  <i className="bi bi-car-front me-1" />
                  Publier
                </button>
              </li>

            </ul>

            {/* ===== RIGHT MENU ===== */}
            <ul className="navbar-nav align-items-lg-center gap-lg-3">

              {!user ? (
                <>
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
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <button
                      className="nav-link btn btn-link p-0"
                      onClick={handleDashboard}
                    >
                      <i className="bi bi-speedometer2 me-1" />
                      Dashboard
                    </button>
                  </li>

                  <li className="nav-item">
                    <button
                      className="nav-link btn btn-link text-danger p-0"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-1" />
                      Déconnexion
                    </button>
                  </li>
                </>
              )}

              {/* ===== Theme Toggle ===== */}
              <li className="nav-item">
                <button
                  type="button"
                  className={`btn btn-sm ${isDark ? "btn-outline-light" : "btn-outline-dark"
                    }`}
                  onClick={onToggleTheme}
                  aria-label="Basculer mode jour/nuit"
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