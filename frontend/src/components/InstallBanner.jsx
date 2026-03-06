import { useState } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";

export default function InstallBanner() {
  const { canShowBanner, isIos, install, dismiss } = usePWAInstall();
  const [visible, setVisible] = useState(true);

  if (!canShowBanner || !visible) return null;

  const handleInstall = async () => {
    const accepted = await install("banniere");
    if (accepted) handleClose(0);
  };

  const handleClose = (days = 30) => {
    setVisible(false);
    dismiss(days);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        padding: "0 12px 12px",
        animation: "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(110%); }
          to   { transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: "linear-gradient(135deg, #0f5132 0%, #198754 60%, #20c374 100%)",
          borderRadius: 18,
          padding: "14px 16px",
          boxShadow: "0 8px 32px rgba(25,135,84,0.35), 0 2px 8px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "#fff",
        }}
      >
        {/* Icône app */}
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1.5px solid rgba(255,255,255,0.25)",
          }}
        >
          <i className="bi bi-car-front-fill" style={{ fontSize: "1.4rem" }} />
        </div>

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.2 }}>
            Installer CampusRide
          </div>
          {isIos ? (
            <div style={{ fontSize: "0.72rem", opacity: 0.88, marginTop: 3, lineHeight: 1.4 }}>
              Appuie sur <i className="bi bi-box-arrow-up" style={{ fontSize: "0.75rem" }} />{" "}
              puis <strong>« Ajouter à l'écran d'accueil »</strong>
            </div>
          ) : (
            <div style={{ fontSize: "0.72rem", opacity: 0.88, marginTop: 3 }}>
              Accès rapide depuis votre écran d'accueil
            </div>
          )}
        </div>

        {/* Bouton installer (Android) */}
        {!isIos && (
          <button
            onClick={handleInstall}
            style={{
              background: "#fff",
              color: "#198754",
              border: "none",
              borderRadius: 10,
              padding: "7px 14px",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Installer
          </button>
        )}

        {/* Fermer */}
        <button
          onClick={() => handleClose(30)}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            borderRadius: 999,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            color: "#fff",
          }}
        >
          <i className="bi bi-x" style={{ fontSize: "1rem" }} />
        </button>
      </div>
    </div>
  );
}
