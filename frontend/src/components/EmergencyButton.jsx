// src/components/EmergencyButton.jsx
import { useState } from "react";

const CONTACTS = [
  {
    icon: "bi-telephone-fill",
    color: "#dc3545",
    label: "911",
    detail: "Police · Ambulance · Pompiers",
    href: "tel:911",
  },
  {
    icon: "bi-shield-fill",
    color: "#fd7e14",
    label: "Sécurité — Collège La Cité",
    detail: "(613) 742-2483 poste 2200",
    href: "tel:+16137422483",
  },
  {
    icon: "bi-envelope-fill",
    color: "#198754",
    label: "Support CampusRide",
    detail: "campusride@lacitec.on.ca",
    href: "mailto:campusride@lacitec.on.ca",
  },
];

export default function EmergencyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Urgence / Contacts d'urgence"
        aria-label="Urgence"
        style={{
          position: "fixed",
          bottom: "calc(60px + 16px)",
          right: 20,
          zIndex: 1050,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #dc3545, #b02a37)",
          border: "none",
          boxShadow: "0 4px 16px rgba(220,53,69,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <i className="bi bi-telephone-fill text-white" style={{ fontSize: "1.1rem" }} />
      </button>

      {/* Modal urgence */}
      {open && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content rounded-4 overflow-hidden border-0 shadow-lg">
              {/* Header rouge */}
              <div
                className="px-4 py-3 d-flex align-items-center gap-2"
                style={{ background: "linear-gradient(135deg, #dc3545, #b02a37)" }}
              >
                <i className="bi bi-exclamation-triangle-fill text-white fs-5" />
                <span className="fw-bold text-white fs-6">Contacts d'urgence</span>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                />
              </div>

              <div className="p-4 d-flex flex-column gap-3">
                <p className="text-muted small mb-0" style={{ fontSize: "0.8rem" }}>
                  En cas de danger immédiat, appelez le <strong>911</strong> en premier.
                </p>

                {CONTACTS.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    className="d-flex align-items-center gap-3 text-decoration-none rounded-3 p-3"
                    style={{ background: "#f8f9fa", border: `1.5px solid ${c.color}20` }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 42, height: 42, background: `${c.color}18` }}
                    >
                      <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: "1.1rem" }} />
                    </div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: "0.9rem", color: "#212529" }}>{c.label}</div>
                      <div className="text-muted" style={{ fontSize: "0.78rem" }}>{c.detail}</div>
                    </div>
                    <i className="bi bi-chevron-right text-muted ms-auto" style={{ fontSize: "0.75rem" }} />
                  </a>
                ))}

                <p className="text-muted mb-0 text-center" style={{ fontSize: "0.72rem" }}>
                  CampusRide décline toute responsabilité pour les incidents survenus lors des trajets.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
