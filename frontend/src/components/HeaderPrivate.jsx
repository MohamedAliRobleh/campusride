// src/components/HeaderPrivate.jsx
import { logout } from "../utils/auth.js";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function HeaderPrivate({ isDark, onToggleTheme }) {
  const navigate = useNavigate();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const token = localStorage.getItem("token");

  const userName = user?.prenom || user?.nom || "Utilisateur";
  const userInitial = (userName?.charAt(0) || "U").toUpperCase();

  const isDriver = user?.role === "CONDUCTEUR";

  const handleLogout = () => {
    logout(navigate);
  };

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const unreadOnly = (data.notifications || []).filter(
          (n) => !n.lu_le
        );
        setNotifications(unreadOnly);
      } catch (err) {
        console.error("Erreur notifications:", err);
      }
    };

    fetchNotifications();
  }, [token]);

  const markAsReadAndRedirect = async (notif) => {
    try {
      await fetch(`/notifications/${notif.id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications([]);

      if (notif.type === "DEMANDE_RESERVATION") {
        navigate("/conducteur/reservations-recues");
      }
    } catch (err) {
      console.error("Erreur markAsRead:", err);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div>
      <div style={{ height: 36, backgroundColor: "#009E57" }} />

      <header
        className={`sticky-top border-bottom ${isDark ? "bg-dark" : "bg-light"
          }`}
      >
        <nav
          className={`navbar navbar-expand-lg ${isDark ? "navbar-dark" : "navbar-light"
            }`}
        >
          <div className="container-fluid px-4">
            <Link
              className="navbar-brand fw-bold d-flex align-items-center gap-2"
              to="/passager"
            >
              <span style={{ fontSize: 20 }}>🚗</span>
              Tableau de Bord
            </Link>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#privateNavbar"
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div className="collapse navbar-collapse" id="privateNavbar">

              {/* LEFT MENU */}
              <ul className="navbar-nav me-auto gap-lg-3">

                <li className="nav-item">
                  <Link className="nav-link" to="/passager/search">
                    <i className="bi bi-search me-1" />
                    Trouver
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/passager/mes-reservations">
                    <span className="me-1">👤</span>
                    Mes réservations
                  </Link>
                </li>

                {isDriver && (
                  <li className="nav-item">
                    <Link
                      className="nav-link"
                      to="/conducteur/reservations-recues"
                    >
                      <span className="me-1">🚗</span>
                      Mes passagers
                    </Link>
                  </li>
                )}

                {isDriver && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/passager/post">
                      <span className="me-1">➕</span>
                      Publier
                    </Link>
                  </li>
                )}

              </ul>

              {/* RIGHT MENU */}
              <ul className="navbar-nav align-items-lg-center gap-lg-3 list-unstyled ps-0 mb-0">

                {/* Notifications */}
                <li className="nav-item dropdown">
                  <button
                    className="btn btn-link position-relative p-0 text-decoration-none"
                    data-bs-toggle="dropdown"
                    type="button"
                  >
                    <i className="bi bi-bell fs-5"></i>

                    {unreadCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: "0.65rem" }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <ul
                    className="dropdown-menu dropdown-menu-end shadow-sm"
                    style={{ minWidth: 320 }}
                  >
                    <li className="dropdown-header fw-semibold">
                      Notifications
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    {notifications.length === 0 ? (
                      <li className="px-3 py-2 text-muted small">
                        Aucune notification
                      </li>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <li key={notif.id}>
                          <button
                            className={`dropdown-item small ${!notif.lu_le ? "fw-bold" : ""
                              }`}
                            type="button"
                            onClick={() =>
                              markAsReadAndRedirect(notif)
                            }
                          >
                            {notif.message}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </li>

                {/* User */}
                <li className="nav-item dropdown">
                  <button
                    className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                    type="button"
                  >
                    <span
                      className="rounded-circle border d-flex align-items-center justify-content-center"
                      style={{ width: 32, height: 32 }}
                    >
                      <span className="fw-semibold">{userInitial}</span>
                    </span>

                    <span className="fw-semibold">{userName}</span>

                    {isDriver && (
                      <span className="badge bg-success">Conducteur</span>
                    )}

                    <i className="bi bi-chevron-down small opacity-75" />
                  </button>

                  <ul
                    className="dropdown-menu dropdown-menu-end shadow-sm"
                    style={{ minWidth: 240 }}
                  >
                    <li className="px-3 py-2 text-center">
                      <div className="fw-semibold">{userName}</div>
                      <div className="small text-muted">
                        {user?.email || ""}
                      </div>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => navigate("/profil")}
                      >
                        <i className="bi bi-gear me-2" />
                        Paramètres
                      </button>
                    </li>

                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2" />
                        Déconnexion
                      </button>
                    </li>
                  </ul>
                </li>

                {/* Theme */}
                <li className="nav-item">
                  <button
                    type="button"
                    className={`btn btn-sm ${isDark
                        ? "btn-outline-light"
                        : "btn-outline-dark"
                      }`}
                    onClick={onToggleTheme}
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