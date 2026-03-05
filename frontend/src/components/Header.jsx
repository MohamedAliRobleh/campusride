// src/components/Header.jsx — Public header
import { Link, NavLink, useNavigate } from "react-router-dom";
import { logout } from "../utils/auth.js";
import { useMemo } from "react";

export default function Header({ isDark, onToggleTheme }) {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  const initials = user
    ? ((user.prenom?.[0] ?? "") + (user.nom?.[0] ?? "")).toUpperCase() || "U"
    : null;

  return (
    <>
      <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374, #198754)" }} />

      <header
        className={`sticky-top ${isDark ? "bg-dark border-bottom border-secondary" : "bg-white"}`}
        style={{ boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.07)" }}
      >
        <nav className={`navbar navbar-expand-lg py-2 ${isDark ? "navbar-dark" : "navbar-light"}`}>
          <div className="container-fluid px-3 px-lg-4">

            {/* Logo */}
            <Link className="navbar-brand d-flex align-items-center gap-2 text-decoration-none" to="/">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 34, height: 34, background: "linear-gradient(135deg, #198754, #20c374)" }}
              >
                <i className="bi bi-car-front-fill text-white" style={{ fontSize: "1rem" }} />
              </div>
              <span className={`fw-bold fs-5 ${isDark ? "text-light" : "text-dark"}`} style={{ letterSpacing: "-0.3px" }}>
                CampusRide
              </span>
            </Link>

            <button
              className="navbar-toggler border-0"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNavbar"
              style={{ boxShadow: "none" }}
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div className="collapse navbar-collapse" id="mainNavbar">

              {/* Left nav */}
              <ul className="navbar-nav me-auto gap-lg-1 mt-2 mt-lg-0">
                <li className="nav-item">
                  <button
                    className={`nav-link cr-nav-link btn btn-link px-0 ${isDark ? "text-light" : "text-dark"}`}
                    style={{ textDecoration: "none" }}
                    onClick={() => navigate(user ? "/passager/search" : "/login")}
                  >
                    <i className="bi bi-search me-1" />
                    Rechercher
                  </button>
                </li>
                <li className="nav-item ms-lg-3">
                  <button
                    className={`nav-link cr-nav-link btn btn-link px-0 ${isDark ? "text-light" : "text-dark"}`}
                    style={{ textDecoration: "none" }}
                    onClick={() => {
                      if (!user) { navigate("/login"); return; }
                      navigate(user.role === "CONDUCTEUR" ? "/conducteur/mes-trajets" : "/passager/aide");
                    }}
                  >
                    <i className="bi bi-car-front me-1" />
                    Publier
                  </button>
                </li>
              </ul>

              {/* Right nav */}
              <ul className="navbar-nav align-items-lg-center gap-lg-2 mt-2 mt-lg-0">
                {!user ? (
                  <>
                    <li className="nav-item">
                      <NavLink
                        className={`nav-link cr-nav-link px-0 ${isDark ? "text-light" : "text-dark"}`}
                        to="/login"
                      >
                        <i className="bi bi-box-arrow-in-right me-1" />
                        Connexion
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <Link
                        className="btn btn-success btn-sm px-3 rounded-3 fw-semibold"
                        to="/register"
                        style={{ fontSize: "0.85rem" }}
                      >
                        <i className="bi bi-person-plus me-1" />
                        Créer un compte
                      </Link>
                    </li>
                  </>
                ) : (
                  <li className="nav-item dropdown">
                    <button
                      className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
                      data-bs-toggle="dropdown"
                      type="button"
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: 34, height: 34, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: "0.8rem" }}
                      >
                        {initials}
                      </div>
                      <span className={`fw-semibold d-none d-lg-inline ${isDark ? "text-light" : "text-dark"}`} style={{ fontSize: "0.88rem" }}>
                        {user.prenom}
                      </span>
                      <i className={`bi bi-chevron-down opacity-50 ${isDark ? "text-light" : "text-dark"}`} style={{ fontSize: "0.7rem" }} />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 180 }}>
                      <li>
                        <button className="dropdown-item" onClick={() => navigate("/passager")}>
                          <i className="bi bi-house me-2 text-success" />
                          Tableau de bord
                        </button>
                      </li>
                      <li><hr className="dropdown-divider my-1" /></li>
                      <li>
                        <button className="dropdown-item text-danger" onClick={() => logout(navigate)}>
                          <i className="bi bi-box-arrow-right me-2" />
                          Déconnexion
                        </button>
                      </li>
                    </ul>
                  </li>
                )}

                {/* Theme toggle */}
                <li className="nav-item">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-3 px-2 py-1 ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                    onClick={onToggleTheme}
                    aria-label="Basculer mode"
                    style={{ fontSize: "0.85rem", lineHeight: 1 }}
                  >
                    <i className={`bi ${isDark ? "bi-sun-fill" : "bi-moon-stars-fill"}`} />
                  </button>
                </li>
              </ul>

            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
