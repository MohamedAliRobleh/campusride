// src/components/HeaderPrivate.jsx
import { logout } from "../utils/auth.js";
import { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const FILL_ICON = {
  "bi-search":    "bi-search",
  "bi-bookmark":  "bi-bookmark-fill",
  "bi-chat-dots": "bi-chat-dots-fill",
  "bi-person":    "bi-person-fill",
  "bi-map":       "bi-map-fill",
  "bi-people":    "bi-people-fill",
};

export default function HeaderPrivate({ isDark, onToggleTheme }) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { user = null; }

  const token    = localStorage.getItem("token");
  const userName = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Utilisateur";
  const initials = ((user?.prenom?.[0] ?? "") + (user?.nom?.[0] ?? "")).toUpperCase() || "U";
  const isDriver = user?.role === "CONDUCTEUR";
  const isAdmin  = user?.role === "ADMIN";
  const photoUrl = user?.photo_url || null;

  const [notifications,  setNotifications]  = useState([]);
  const [messagesNonLus, setMessagesNonLus] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch("/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { notifications: [] })
      .then((d) => setNotifications((d.notifications || []).filter((n) => !n.lu_le)))
      .catch(() => {});
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
      if (notif.type === "DEMANDE_RESERVATION") navigate("/conducteur/reservations-recues");
    } catch {}
  };

  const unreadCount = notifications.length;

  /* ── Desktop nav-link class ── */
  const navLinkClass = ({ isActive }) =>
    `nav-link cr-nav-link px-0 ${isDark ? "text-light" : "text-dark"} ${isActive ? "active fw-semibold" : ""}`;

  /* ── Bottom tab active check ── */
  const isTabActive = (paths) =>
    paths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  /* ── Avatar ── */
  const Avatar = ({ size = 34 }) =>
    photoUrl ? (
      <img
        src={photoUrl}
        alt="Photo de profil"
        className="rounded-circle flex-shrink-0"
        style={{ width: size, height: size, objectFit: "cover" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    ) : (
      <div
        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
        style={{ width: size, height: size, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: size * 0.24 }}
      >
        {initials}
      </div>
    );

  /* ── Notifications dropdown ── */
  const NotifDropdown = () => (
    <div className="dropdown">
      <button
        className={`btn btn-link p-1 position-relative text-decoration-none ${isDark ? "text-light" : "text-dark"}`}
        data-bs-toggle="dropdown"
        type="button"
        aria-label="Notifications"
      >
        <i className="bi bi-bell" style={{ fontSize: "1.2rem" }} />
        {unreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill bg-danger"
            style={{ fontSize: "0.55rem", top: 1, right: 1, minWidth: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}
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
    </div>
  );

  /* ── User dropdown (desktop) ── */
  const UserDropdown = () => (
    <div className="dropdown">
      <button
        className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
        data-bs-toggle="dropdown"
        type="button"
      >
        <Avatar size={34} />
        <div className="text-start">
          <div className={`fw-semibold lh-1 mb-1 ${isDark ? "text-light" : "text-dark"}`} style={{ fontSize: "0.85rem" }}>
            {userName}
          </div>
          {isAdmin && (
            <span className="badge rounded-pill px-2" style={{ fontSize: "0.62rem", background: "rgba(25,135,84,0.15)", color: "#198754" }}>
              Admin
            </span>
          )}
          {isDriver && !isAdmin && (
            <span className="badge rounded-pill px-2" style={{ fontSize: "0.62rem", background: "rgba(25,135,84,0.12)", color: "#198754" }}>
              Conducteur
            </span>
          )}
        </div>
        <i className={`bi bi-chevron-down small opacity-50 ${isDark ? "text-light" : "text-dark"}`} style={{ fontSize: "0.7rem" }} />
      </button>
      <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 240 }}>
        <li className="px-3 py-2">
          <div className="d-flex align-items-center gap-2">
            <Avatar size={40} />
            <div className="min-w-0">
              <div className="fw-bold text-truncate" style={{ fontSize: "0.88rem", maxWidth: 150 }}>{userName}</div>
              <div className="text-muted text-truncate" style={{ fontSize: "0.73rem", maxWidth: 150 }}>{user?.email || ""}</div>
              {isAdmin && (
                <span className="badge rounded-pill mt-1" style={{ fontSize: "0.6rem", background: "rgba(25,135,84,0.15)", color: "#198754" }}>
                  Administrateur
                </span>
              )}
              {isDriver && !isAdmin && (
                <span className="badge rounded-pill mt-1" style={{ fontSize: "0.6rem", background: "rgba(25,135,84,0.12)", color: "#198754" }}>
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
            <i className="bi bi-person-circle me-2 text-success" />Mon profil
          </button>
        </li>
        <li>
          <button className="dropdown-item" onClick={() => navigate("/profil/voitures")}>
            <i className="bi bi-car-front me-2 text-success" />Mon véhicule
          </button>
        </li>
        <li>
          <button className="dropdown-item" onClick={() => navigate("/passager/messages")}>
            <i className="bi bi-chat-dots me-2 text-success" />Messages
          </button>
        </li>
        <li>
          <button className="dropdown-item" onClick={() => navigate("/profil/parametres")}>
            <i className="bi bi-gear me-2 text-success" />Paramètres
          </button>
        </li>
        <li><hr className="dropdown-divider my-1" /></li>
        <li>
          <button className="dropdown-item text-danger" onClick={() => logout(navigate)}>
            <i className="bi bi-box-arrow-right me-2" />Déconnexion
          </button>
        </li>
      </ul>
    </div>
  );

  /* ════════════════════════════════════════════════════════════ */

  const tabBg     = isDark ? "#1a1a2e" : "#ffffff";
  const tabBorder = isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid #e9ecef";
  const inactiveColor = isDark ? "#8a9bb0" : "#6c757d";

  /* ── Driver bottom tabs ── */
  const driverTabs = [
    { to: "/passager/search",               icon: "bi-search",    label: "Trouver",   paths: ["/passager/search"] },
    { to: "/conducteur/mes-trajets",        icon: "bi-map",       label: "Trajets",   paths: ["/conducteur/mes-trajets"] },
    { isPublish: true },
    { to: "/conducteur/reservations-recues",icon: "bi-people",    label: "Passagers", paths: ["/conducteur/reservations-recues"] },
    { to: "/passager/messages",             icon: "bi-chat-dots", label: "Messages",  paths: ["/passager/messages"], badge: messagesNonLus },
  ];

  /* ── Passenger bottom tabs (5 items, FAB au centre) ── */
  const passengerTabs = [
    { to: "/passager/search",       icon: "bi-search",    label: "Trouver",  paths: ["/passager/search"] },
    { to: "/passager/messages",     icon: "bi-chat-dots", label: "Messages", paths: ["/passager/messages"], badge: messagesNonLus },
    { isReservation: true },
    { to: "/profil",                icon: "bi-person",    label: "Profil",   paths: ["/profil"] },
    { to: "/profil/parametres",     icon: "bi-gear",      label: "Réglages", paths: ["/profil/parametres"] },
  ];

  const tabs = isDriver ? driverTabs : passengerTabs;

  return (
    <>
      {/* ── Gradient accent ── */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374, #198754)" }} />

      {/* ════════════════════════════════════════════════════════
          TOP HEADER
      ════════════════════════════════════════════════════════ */}
      <header
        className={`sticky-top ${isDark ? "bg-dark border-bottom border-secondary" : "bg-white"}`}
        style={{ boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.07)", zIndex: 1040 }}
      >
        <div
          className="container-fluid px-3 px-lg-4 d-flex align-items-center gap-2"
          style={{ height: 56 }}
        >

          {/* Logo */}
          <NavLink
            className="navbar-brand d-flex align-items-center gap-2 text-decoration-none me-auto me-lg-4"
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

          {/* ── Desktop left nav ── */}
          <ul className="navbar-nav d-none d-lg-flex flex-row align-items-center me-auto gap-1">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/passager/search">
                <i className="bi bi-search me-1" />Trouver
              </NavLink>
            </li>
            <li className="nav-item ms-3">
              <NavLink className={navLinkClass} to="/passager/mes-reservations">
                <i className="bi bi-bookmark me-1" />Réservations
              </NavLink>
            </li>
            <li className="nav-item ms-3">
              <NavLink className={navLinkClass} to="/passager/messages">
                <span className="d-inline-flex align-items-center gap-1">
                  <i className="bi bi-chat-dots me-1" />Messages
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
              <li className="nav-item ms-3">
                <NavLink className={navLinkClass} to="/conducteur/reservations-recues">
                  <i className="bi bi-people me-1" />Passagers
                </NavLink>
              </li>
            )}
            {isDriver && (
              <li className="nav-item ms-3">
                <NavLink className={navLinkClass} to="/conducteur/mes-trajets">
                  <i className="bi bi-map me-1" />Mes trajets
                </NavLink>
              </li>
            )}
            {isDriver && (
              <li className="nav-item ms-3">
                <NavLink to="/passager/post" className="nav-link cr-nav-link px-0">
                  <span className="btn btn-success btn-sm px-3 rounded-3 fw-semibold" style={{ fontSize: "0.82rem" }}>
                    <i className="bi bi-plus-lg me-1" />Publier
                  </span>
                </NavLink>
              </li>
            )}
          </ul>

          {/* ── Right actions — desktop: full dropdown / mobile: icons ── */}

          {/* Notifications (always) */}
          <NotifDropdown />

          {/* Desktop: user dropdown */}
          <div className="d-none d-lg-flex align-items-center gap-2">
            <UserDropdown />
          </div>

          {/* Mobile: logout button */}
          <button
            type="button"
            className={`d-lg-none btn btn-link p-1 text-decoration-none ${isDark ? "text-light" : "text-dark"}`}
            onClick={() => logout(navigate)}
            title="Déconnexion"
            aria-label="Déconnexion"
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: "1.2rem" }} />
          </button>

          {/* Theme toggle (always) */}
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

        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          MOBILE BOTTOM TAB BAR  (hidden on lg+)
      ════════════════════════════════════════════════════════ */}
      <nav
        className="d-lg-none"
        style={{
          position:      "fixed",
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        1035,
          background:    tabBg,
          borderTop:     tabBorder,
          boxShadow:     "0 -2px 12px rgba(0,0,0,0.08)",
          height:        60,
          display:       "flex",
          alignItems:    "stretch",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {tabs.map((tab, idx) => {

          /* ── FAB générique ── */
          if (tab.isPublish || tab.isReservation) {
            const isRes      = tab.isReservation;
            const fabActive  = isRes
              ? pathname.startsWith("/passager/mes-reservations")
              : pathname.startsWith("/passager/post");
            const fabIcon    = isRes ? "bi-bookmark-fill" : "bi-plus-lg";
            const fabLabel   = isRes ? "Réserver" : "Publier";
            const fabDest    = isRes ? "/passager/mes-reservations" : "/passager/post";
            return (
              <button
                key={isRes ? "reservation" : "publish"}
                type="button"
                onClick={() => navigate(fabDest)}
                style={{
                  flex: 1,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  border: "none", background: "none",
                  gap: 0,
                  padding: "0 0 4px",
                  borderTop: fabActive ? "2.5px solid #198754" : "2.5px solid transparent",
                }}
              >
                <div
                  style={{
                    width: 46, height: 46,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #198754, #20c374)",
                    boxShadow: "0 4px 16px rgba(25,135,84,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: -14,
                    marginBottom: 2,
                    border: `3px solid ${tabBg}`,
                  }}
                >
                  <i className={`bi ${fabIcon} text-white`} style={{ fontSize: isRes ? "1rem" : "1.2rem" }} />
                </div>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#198754", letterSpacing: "0.01em" }}>
                  {fabLabel}
                </span>
              </button>
            );
          }

          /* ── Regular tab ── */
          const active     = isTabActive(tab.paths);
          const iconClass  = active ? (FILL_ICON[tab.icon] || tab.icon) : tab.icon;
          const color      = active ? "#198754" : inactiveColor;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => navigate(tab.to)}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "none", background: "none",
                color,
                gap: 2,
                padding: "6px 0",
                fontSize: "0.58rem",
                fontWeight: active ? 700 : 400,
                borderTop: active ? "2.5px solid #198754" : "2.5px solid transparent",
                transition: "color .15s",
              }}
            >
              <div className="position-relative" style={{ lineHeight: 1 }}>
                <i className={`bi ${iconClass}`} style={{ fontSize: "1.15rem" }} />
                {tab.badge > 0 && (
                  <span
                    className="position-absolute badge rounded-pill bg-danger"
                    style={{ fontSize: "0.48rem", top: -3, right: -8, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
