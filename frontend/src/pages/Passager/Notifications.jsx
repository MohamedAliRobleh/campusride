// src/pages/Passager/Notifications.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";
import EmergencyButton from "../../components/EmergencyButton";

const TYPE_CONFIG = {
  RESERVATION_ACCEPTEE: { icon: "bi-check-circle-fill", color: "#198754", bg: "rgba(25,135,84,0.1)" },
  RESERVATION_REFUSEE:  { icon: "bi-x-circle-fill",     color: "#dc3545", bg: "rgba(220,53,69,0.1)"  },
  RESERVATION_ANNULEE:  { icon: "bi-dash-circle-fill",   color: "#6c757d", bg: "rgba(108,117,125,0.1)" },
  DEMANDE_RESERVATION:  { icon: "bi-person-plus-fill",   color: "#0d6efd", bg: "rgba(13,110,253,0.1)" },
  TRAJET_ANNULE:        { icon: "bi-x-octagon-fill",     color: "#dc3545", bg: "rgba(220,53,69,0.1)"  },
  TRAJET_MODIFIE:       { icon: "bi-pencil-fill",        color: "#fd7e14", bg: "rgba(253,126,20,0.1)" },
  TRAJET_TERMINE:       { icon: "bi-flag-fill",          color: "#6c757d", bg: "rgba(108,117,125,0.1)" },
  RAPPEL_TRAJET:        { icon: "bi-alarm-fill",         color: "#fd7e14", bg: "rgba(253,126,20,0.1)" },
  MESSAGE_RECU:         { icon: "bi-chat-dots-fill",     color: "#0d6efd", bg: "rgba(13,110,253,0.1)" },
};

const NAV_DEST = {
  DEMANDE_RESERVATION:  "/conducteur/reservations-recues",
  RESERVATION_ANNULEE:  "/conducteur/reservations-recues",
  RESERVATION_ACCEPTEE: "/passager/mes-reservations",
  RESERVATION_REFUSEE:  "/passager/mes-reservations",
  TRAJET_MODIFIE:       "/passager/mes-reservations",
  TRAJET_TERMINE:       "/passager/mes-reservations",
  TRAJET_ANNULE:        "/passager/mes-reservations",
  RAPPEL_TRAJET:        "/passager/mes-reservations",
  MESSAGE_RECU:         "/passager/messages",
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [token]);

  const handleClick = async (notif) => {
    if (!notif.lu_le) {
      try {
        await fetch(`/notifications/${notif.id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, lu_le: new Date().toISOString() } : n))
        );
      } catch {}
    }
    const dest = NAV_DEST[notif.type];
    if (dest) navigate(dest);
  };

  const markAllRead = async () => {
    try {
      await fetch("/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, lu_le: n.lu_le || new Date().toISOString() })));
    } catch {}
  };

  // Grouper par date
  const groupByDate = (notifs) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {};
    notifs.forEach((n) => {
      const d = new Date(n.cree_le);
      d.setHours(0, 0, 0, 0);
      let label;
      if (d.getTime() === today.getTime()) label = "Aujourd'hui";
      else if (d.getTime() === yesterday.getTime()) label = "Hier";
      else label = new Date(n.cree_le).toLocaleDateString("fr-CA", { day: "2-digit", month: "long", year: "numeric" });
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });
    return groups;
  };

  const unreadCount = notifications.filter((n) => !n.lu_le).length;
  const groups = groupByDate(notifications);

  return (
    <div className={`d-flex flex-column min-vh-100 ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}>
      <HeaderPrivate isDark={isDark} />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 680 }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-1">
                <i className="bi bi-bell-fill text-success me-2" />
                Notifications
              </h4>
              <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                className="btn btn-outline-success btn-sm rounded-3 fw-semibold"
                onClick={markAllRead}
              >
                <i className="bi bi-check2-all me-1" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-success" />
            </div>
          )}

          {/* Empty */}
          {!loading && notifications.length === 0 && (
            <div className={`text-center py-5 rounded-4 ${isDark ? "bg-dark border border-secondary" : "bg-white"} shadow-sm`}>
              <i className="bi bi-bell-slash text-success" style={{ fontSize: "2.5rem" }} />
              <p className="mt-3 fw-semibold mb-1">Aucune notification</p>
              <p className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                Vous serez notifié ici pour vos réservations et trajets.
              </p>
            </div>
          )}

          {/* Groupes */}
          {!loading && Object.entries(groups).map(([label, notifs]) => (
            <div key={label} className="mb-4">
              <p className={`small fw-semibold mb-2 ${isDark ? "text-secondary" : "text-muted"}`} style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.72rem" }}>
                {label}
              </p>
              <div className={`rounded-4 shadow-sm overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}>
                {notifs.map((notif, idx) => {
                  const cfg = TYPE_CONFIG[notif.type] || { icon: "bi-bell-fill", color: "#198754", bg: "rgba(25,135,84,0.1)" };
                  const isUnread = !notif.lu_le;
                  return (
                    <div key={notif.id}>
                      <button
                        className={`w-100 border-0 bg-transparent text-start d-flex align-items-start gap-3 px-3 py-3 ${isDark ? "text-light" : "text-dark"}`}
                        style={{ cursor: NAV_DEST[notif.type] ? "pointer" : "default", transition: "background 0.15s" }}
                        onClick={() => handleClick(notif)}
                        onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {/* Icône */}
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                          style={{ width: 36, height: 36, background: cfg.bg }}
                        >
                          <i className={`bi ${cfg.icon}`} style={{ color: cfg.color, fontSize: "0.85rem" }} />
                        </div>

                        {/* Contenu */}
                        <div className="flex-grow-1 min-w-0">
                          <p className={`mb-0 ${isUnread ? "fw-semibold" : ""}`} style={{ fontSize: "0.88rem", lineHeight: 1.4 }}>
                            {notif.message}
                          </p>
                          <p className={`mb-0 mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                            {new Date(notif.cree_le).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>

                        {/* Point non lu */}
                        {isUnread && (
                          <div
                            className="rounded-circle bg-success flex-shrink-0 mt-2"
                            style={{ width: 8, height: 8 }}
                          />
                        )}
                      </button>
                      {idx < notifs.length - 1 && (
                        <hr className={`my-0 mx-3 ${isDark ? "border-secondary" : ""}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        </div>
      </main>

      <Footer isDark={isDark} />
      <EmergencyButton />
    </div>
  );
}
