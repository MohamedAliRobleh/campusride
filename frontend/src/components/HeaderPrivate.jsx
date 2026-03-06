// src/components/HeaderPrivate.jsx
import { logout } from "../utils/auth.js";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function HeaderPrivate({ isDark, onToggleTheme }) {
  const navigate = useNavigate();

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { user = null; }

  const token = localStorage.getItem("token");
  const userName = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Utilisateur";
  const initials = ((user?.prenom?.[0] ?? "") + (user?.nom?.[0] ?? "")).toUpperCase() || "U";
  const isDriver = user?.role === "CONDUCTEUR";
  const isAdmin = user?.role === "ADMIN";
  const photoUrl = user?.photo_url || null;

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [messagesNonLus, setMessagesNonLus] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch("/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { notifications: [] })
      .then((d) => setNotifications((d.notifications || []).filter((n) => !n.lu_le)))
      .catch(() => {});
    // Charger le nombre de messages non lus
    fetch("/messages/non-lus", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { non_lus: 0 })
      .then((d) => setMessagesNonLus(d.non_lus || 0))
      .catch(() => {});
  }, [token]);

  const markAllRead = async (notif) => {
    try {
      await fetch(`/notifications/${notif.id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setNotifOpen(false);
      if (notif.type === "DEMANDE_RESERVATION") navigate("/conducteur/reservations-recues");
    } catch {}
  };

  const unreadCount = notifications.length;

  const navLinkClass = ({ isActive }) =>
    `nav-link cr-nav-link px-0 ${isDark ? "text-light" : "text-dark"} ${isActive ? "active fw-semibold" : ""}`;

  return (
    <>
      {/* Thin gradient top bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374, #198754)" }} />

      <header
        className={`sticky-top ${isDark ? "bg-dark border-bottom border-secondary" : "bg-white"}`}
        style={{ boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.07)" }}
      >
        <nav className={`navbar navbar-expand-lg py-2 ${isDark ? "navbar-dark" : "navbar-light"}`}>
          <div className="container-fluid px-3 px-lg-4">

            {/* ===== LOGO ===== */}
            <NavLink
              className="navbar-brand d-flex align-items-center gap-2 text-decoration-none"
              to="/passager"
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 34, height: 34, background: "linear-gradient(135deg, #198754, #20c374)" }}
              >
                <i className="bi bi-car-front-fill text-white" style={{ fontSize: "1rem" }} />
              </div>
              <span className={`fw-bold fs-5 ${isDark ? "text-light" : "text-dark"}`} style={{ letterSpacing: "-0.3px" }}>
                CampusRide
              </span>
            </NavLink>

            {/* ===== HAMBURGER ===== */}
            <button
              className={`navbar-toggler border-0 ${isDark ? "text-light" : ""}`}
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#privateNavbar"
              style={{ boxShadow: "none" }}
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div className="collapse navbar-collapse" id="privateNavbar">

              {/* ===== LEFT NAV ===== */}
              <ul className="navbar-nav me-auto gap-lg-1 mt-2 mt-lg-0">
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/passager/search">
                    <i className="bi bi-search me-1" />
                    Trouver
                  </NavLink>
                </li>

                <li className="nav-item ms-lg-3">
                  <NavLink className={navLinkClass} to="/passager/mes-reservations">
                    <i className="bi bi-bookmark me-1" />
                    Réservations
                  </NavLink>
                </li>

                <li className="nav-item ms-lg-3">
                  <NavLink className={navLinkClass} to="/passager/messages">
                    <span className="position-relative d-inline-flex align-items-center gap-1">
                      <i className="bi bi-chat-dots me-1" />
                      Messages
                      {messagesNonLus > 0 && (
                        <span
                          className="badge rounded-pill bg-danger"
                          style={{ fontSize: "0.6rem", minWidth: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}
                        >
                          {messagesNonLus}
                        </span>
                      )}
                    </span>
                  </NavLink>
                </li>

                {isDriver && (
                  <li className="nav-item ms-lg-3">
                    <NavLink className={navLinkClass} to="/conducteur/reservations-recues">
                      <i className="bi bi-people me-1" />
                      Passagers
                    </NavLink>
                  </li>
                )}

                {isDriver && (
                  <li className="nav-item ms-lg-3">
                    <NavLink className={navLinkClass} to="/conducteur/mes-trajets">
                      <i className="bi bi-map me-1" />
                      Mes trajets
                    </NavLink>
                  </li>
                )}

                {isDriver && (
                  <li className="nav-item ms-lg-3">
                    <NavLink
                      to="/passager/post"
                      className="nav-link cr-nav-link px-0"
                    >
                      <span
                        className="btn btn-success btn-sm px-3 rounded-3 fw-semibold"
                        style={{ fontSize: "0.82rem" }}
                      >
                        <i className="bi bi-plus-lg me-1" />
                        Publier
                      </span>
                    </NavLink>
                  </li>
                )}
              </ul>

              {/* ===== RIGHT NAV ===== */}
              <ul className="navbar-nav align-items-lg-center gap-lg-2 mt-2 mt-lg-0">

                {/* Notifications */}
                <li className="nav-item dropdown">
                  <button
                    className={`btn btn-link p-1 position-relative text-decoration-none ${isDark ? "text-light" : "text-dark"}`}
                    data-bs-toggle="dropdown"
                    type="button"
                    aria-label="Notifications"
                  >
                    <i className="bi bi-bell" style={{ fontSize: "1.1rem" }} />
                    {unreadCount > 0 && (
                      <span
                        className="position-absolute badge rounded-pill bg-danger"
                        style={{ fontSize: "0.6rem", top: 0, right: 0, minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 300 }}>
                    <li className="px-3 pt-2 pb-1">
                      <div className="fw-bold" style={{ fontSize: "0.85rem" }}>
                        <i className="bi bi-bell-fill text-success me-2" />
                        Notifications
                        {unreadCount > 0 && (
                          <span className="badge bg-success ms-2 rounded-pill" style={{ fontSize: "0.65rem" }}>
                            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>

                    {notifications.length === 0 ? (
                      <li className="px-3 py-3 text-center">
                        <i className="bi bi-bell-slash text-muted d-block mb-1" style={{ fontSize: "1.3rem" }} />
                        <span className="text-muted small">Aucune notification</span>
                      </li>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <li key={notif.id}>
                          <button
                            className="dropdown-item d-flex align-items-start gap-2 py-2"
                            onClick={() => markAllRead(notif)}
                          >
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                              style={{ width: 28, height: 28, background: "rgba(25,135,84,0.12)" }}
                            >
                              <i className="bi bi-bell-fill text-success" style={{ fontSize: "0.7rem" }} />
                            </div>
                            <span className="fw-semibold" style={{ fontSize: "0.82rem", lineHeight: 1.35 }}>
                              {notif.message}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </li>

                {/* User dropdown */}
                <li className="nav-item dropdown">
                  <button
                    className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                    type="button"
                  >
                    {/* Avatar */}
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Photo de profil"
                        className="rounded-circle flex-shrink-0"
                        style={{ width: 34, height: 34, objectFit: "cover" }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: 34, height: 34, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: "0.8rem" }}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="d-none d-lg-block text-start">
                      <div className={`fw-semibold lh-1 mb-1 ${isDark ? "text-light" : "text-dark"}`} style={{ fontSize: "0.85rem" }}>
                        {userName}
                      </div>
                      {isAdmin && (
                        <div>
                          <span
                            className="badge rounded-pill px-2"
                            style={{ fontSize: "0.62rem", background: "rgba(25,135,84,0.15)", color: "#198754" }}
                          >
                            Admin
                          </span>
                        </div>
                      )}
                      {isDriver && !isAdmin && (
                        <div>
                          <span
                            className="badge rounded-pill px-2"
                            style={{ fontSize: "0.62rem", background: "rgba(25,135,84,0.12)", color: "#198754" }}
                          >
                            Conducteur
                          </span>
                        </div>
                      )}
                    </div>
                    <i className={`bi bi-chevron-down small opacity-50 ${isDark ? "text-light" : "text-dark"}`} style={{ fontSize: "0.7rem" }} />
                  </button>

                  <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 240 }}>
                    {/* User info header */}
                    <li className="px-3 py-2">
                      <div className="d-flex align-items-center gap-2">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="Photo de profil"
                            className="rounded-circle flex-shrink-0"
                            style={{ width: 40, height: 40, objectFit: "cover" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                            style={{ width: 40, height: 40, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: "0.85rem" }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="fw-bold text-truncate" style={{ fontSize: "0.88rem", maxWidth: 150 }}>{userName}</div>
                          <div className="text-muted text-truncate" style={{ fontSize: "0.73rem", maxWidth: 150 }}>{user?.email || ""}</div>
                          {isAdmin && (
                            <span
                              className="badge rounded-pill mt-1"
                              style={{ fontSize: "0.6rem", background: "rgba(25,135,84,0.15)", color: "#198754" }}
                            >
                              Administrateur
                            </span>
                          )}
                          {isDriver && !isAdmin && (
                            <span
                              className="badge rounded-pill mt-1"
                              style={{ fontSize: "0.6rem", background: "rgba(25,135,84,0.12)", color: "#198754" }}
                            >
                              Conducteur
                            </span>
                          )}
                        </div>
                      </div>
                    </li>

                    <li><hr className="dropdown-divider my-1" /></li>

                    {isAdmin && (
                      <>
                        <li>
                          <button
                            className="dropdown-item d-flex align-items-center gap-2 fw-semibold"
                            onClick={() => navigate("/admin")}
                            style={{ color: "#198754" }}
                          >
                            <div
                              className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                              style={{ width: 22, height: 22, background: "linear-gradient(135deg, #198754, #20c374)" }}
                            >
                              <i className="bi bi-shield-fill text-white" style={{ fontSize: "0.65rem" }} />
                            </div>
                            Panneau Admin
                          </button>
                        </li>
                        <li><hr className="dropdown-divider my-1" /></li>
                      </>
                    )}

                    <li>
                      <button className="dropdown-item" onClick={() => navigate("/profil")}>
                        <i className="bi bi-person-circle me-2 text-success" />
                        Mon profil
                      </button>
                    </li>

                    <li>
                      <button className="dropdown-item" onClick={() => navigate("/profil/voitures")}>
                        <i className="bi bi-car-front me-2 text-success" />
                        Mon véhicule
                      </button>
                    </li>

                    <li>
                      <button className="dropdown-item" onClick={() => navigate("/passager/messages")}>
                        <i className="bi bi-chat-dots me-2 text-success" />
                        Messages
                      </button>
                    </li>

                    <li>
                      <button className="dropdown-item" onClick={() => navigate("/profil/parametres")}>
                        <i className="bi bi-gear me-2 text-success" />
                        Paramètres
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

                {/* Theme toggle */}
                <li className="nav-item">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-3 px-2 py-1 ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                    onClick={onToggleTheme}
                    aria-label="Basculer mode jour/nuit"
                    title={isDark ? "Mode clair" : "Mode sombre"}
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
