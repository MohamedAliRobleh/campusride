// src/components/ReportModal.jsx
import { useState } from "react";

const MOTIFS_TRAJET = [
  "Trajet frauduleux",
  "Informations incorrectes",
  "Comportement inapproprié",
  "Non-présentation du conducteur",
  "Autre",
];

const MOTIFS_UTILISATEUR = [
  "Comportement inapproprié",
  "Harcèlement",
  "Usurpation d'identité",
  "Non-présentation",
  "Autre",
];

export default function ReportModal({ type, cible_id, nomCible, onClose, isDark }) {
  const token = localStorage.getItem("token");
  const [motif, setMotif] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const motifs = type === "TRAJET" ? MOTIFS_TRAJET : MOTIFS_UTILISATEUR;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motif) { setError("Veuillez choisir un motif."); return; }
    try {
      setSending(true);
      setError("");
      const res = await fetch("/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type, cible_id, motif, description: description.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur lors de l'envoi."); return; }
      setSuccess(true);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="modal d-block"
      style={{ background: "rgba(0,0,0,0.5)", zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-content rounded-4 border-0 shadow-lg ${isDark ? "bg-dark text-light" : ""}`}>
          {/* Header */}
          <div className="px-4 pt-4 pb-3 d-flex align-items-center gap-2 border-bottom" style={{ borderColor: isDark ? "#495057" : undefined }}>
            <i className="bi bi-flag-fill text-danger" />
            <span className="fw-bold" style={{ fontSize: "0.95rem" }}>
              Signaler {type === "TRAJET" ? "ce trajet" : "cet utilisateur"}
            </span>
            {nomCible && (
              <span className={`ms-1 small ${isDark ? "text-secondary" : "text-muted"}`}>— {nomCible}</span>
            )}
            <button type="button" className={`btn-close ms-auto ${isDark ? "btn-close-white" : ""}`} onClick={onClose} />
          </div>

          <div className="p-4">
            {success ? (
              <div className="text-center py-3">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "2.5rem" }} />
                <p className="fw-semibold mt-3 mb-1">Signalement envoyé</p>
                <p className={`small mb-3 ${isDark ? "text-secondary" : "text-muted"}`}>
                  Notre équipe va examiner votre signalement. Merci de contribuer à la sécurité de CampusRide.
                </p>
                <button type="button" className="btn btn-success rounded-3 px-4" onClick={onClose}>
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="d-grid gap-3">
                {error && (
                  <div className="alert alert-danger py-2 mb-0 small">{error}</div>
                )}

                <div>
                  <label className="form-label fw-semibold small">Motif du signalement</label>
                  <select
                    className={`form-select rounded-3 ${isDark ? "bg-dark text-light border-secondary" : ""}`}
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    required
                  >
                    <option value="">— Choisir un motif —</option>
                    {motifs.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label fw-semibold small">Description <span className={`fw-normal ${isDark ? "text-secondary" : "text-muted"}`}>(optionnel)</span></label>
                  <textarea
                    className={`form-control rounded-3 ${isDark ? "bg-dark text-light border-secondary" : ""}`}
                    rows={3}
                    placeholder="Décrivez brièvement la situation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <div className={`rounded-3 p-3 d-flex gap-2 align-items-start ${isDark ? "bg-warning bg-opacity-10" : "bg-warning-subtle"}`} style={{ fontSize: "0.78rem" }}>
                  <i className="bi bi-info-circle-fill text-warning flex-shrink-0 mt-1" />
                  <span className={isDark ? "text-warning-emphasis" : "text-warning-emphasis"}>
                    Les faux signalements peuvent entraîner la suspension de votre compte.
                  </span>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn rounded-3 flex-grow-1 ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger rounded-3 flex-grow-1 fw-semibold"
                    disabled={sending || !motif}
                  >
                    {sending
                      ? <span className="spinner-border spinner-border-sm" />
                      : <><i className="bi bi-flag me-2" />Envoyer</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
