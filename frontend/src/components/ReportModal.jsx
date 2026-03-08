// src/components/ReportModal.jsx
import { useState } from "react";

// Motifs classés par niveau de gravité
// niveau 1 = mineur, 2 = modéré, 3 = grave
const MOTIFS = {
  TRAJET: [
    { label: "Non-présentation du conducteur", niveau: 1, desc: "Le conducteur ne s'est pas présenté au lieu de rendez-vous." },
    { label: "Retard important", niveau: 1, desc: "Le départ a eu lieu avec un retard significatif sans prévenir." },
    { label: "Informations incorrectes", niveau: 2, desc: "L'heure, le lieu ou les détails du trajet étaient inexacts." },
    { label: "Comportement inapproprié", niveau: 2, desc: "Attitude déplacée, impolitesse ou manque de respect." },
    { label: "Trajet frauduleux", niveau: 3, desc: "Trajet publié dans le but de tromper ou d'arnaquer." },
    { label: "Mise en danger", niveau: 3, desc: "Conduite dangereuse mettant en péril la sécurité des passagers." },
    { label: "Autre", niveau: 1, desc: "" },
  ],
  UTILISATEUR: [
    { label: "Non-présentation", niveau: 1, desc: "L'utilisateur ne s'est pas présenté sans prévenir." },
    { label: "Communication difficile", niveau: 1, desc: "Pas de réponse ou communication problématique." },
    { label: "Comportement inapproprié", niveau: 2, desc: "Attitude déplacée, impolitesse ou manque de respect." },
    { label: "Non-respect des règles", niveau: 2, desc: "Contournement des règles de la plateforme." },
    { label: "Harcèlement", niveau: 3, desc: "Propos ou comportement harcelants, insistants ou menaçants." },
    { label: "Discrimination", niveau: 3, desc: "Propos discriminatoires (racisme, sexisme, etc.)." },
    { label: "Usurpation d'identité", niveau: 3, desc: "Faux profil ou utilisation de l'identité d'une autre personne." },
    { label: "Violence ou menace", niveau: 3, desc: "Comportement violent ou menaces explicites." },
    { label: "Autre", niveau: 1, desc: "" },
  ],
};

const NIVEAU_CONFIG = {
  1: { label: "Mineur",  color: "#ffc107", bg: "#fff8e1", text: "#6c4a00" },
  2: { label: "Modéré",  color: "#fd7e14", bg: "#fff3e8", text: "#7a3b00" },
  3: { label: "Grave",   color: "#dc3545", bg: "#fdf0f0", text: "#7a0000" },
};

export default function ReportModal({ type, cible_id, nomCible, onClose, isDark }) {
  const token = localStorage.getItem("token");
  const [motifObj, setMotifObj] = useState(null);
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const motifs = MOTIFS[type] ?? MOTIFS.UTILISATEUR;
  const niveauCfg = motifObj ? NIVEAU_CONFIG[motifObj.niveau] : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motifObj) { setError("Veuillez choisir un motif."); return; }
    try {
      setSending(true);
      setError("");
      const res = await fetch("/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type,
          cible_id,
          motif: motifObj.label,
          niveau: motifObj.niveau,
          description: description.trim() || undefined,
        }),
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
        style={{ maxWidth: 440 }}
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
                {error && <div className="alert alert-danger py-2 mb-0 small">{error}</div>}

                {/* Sélection du motif */}
                <div>
                  <label className="form-label fw-semibold small mb-2">Motif du signalement</label>
                  <div className="d-grid gap-2">
                    {motifs.map((m) => {
                      const cfg = NIVEAU_CONFIG[m.niveau];
                      const selected = motifObj?.label === m.label;
                      return (
                        <button
                          key={m.label}
                          type="button"
                          onClick={() => setMotifObj(m)}
                          className="text-start rounded-3 border-0 p-0"
                          style={{
                            background: selected ? cfg.bg : isDark ? "#2b3035" : "#f8f9fa",
                            outline: selected ? `2px solid ${cfg.color}` : "none",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <div className="d-flex align-items-center gap-2 px-3 py-2">
                            <span
                              className="rounded-pill flex-shrink-0"
                              style={{
                                width: 8, height: 8,
                                background: cfg.color,
                                display: "inline-block",
                              }}
                            />
                            <span style={{ fontSize: "0.85rem", color: selected ? cfg.text : isDark ? "#dee2e6" : "#212529" }}>
                              {m.label}
                            </span>
                            <span
                              className="ms-auto rounded-pill px-2"
                              style={{ fontSize: "0.65rem", background: `${cfg.color}22`, color: cfg.text, whiteSpace: "nowrap" }}
                            >
                              N{m.niveau} — {cfg.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Badge niveau sélectionné + explication */}
                {motifObj && (
                  <div
                    className="rounded-3 p-3 d-flex gap-2 align-items-start"
                    style={{ background: niveauCfg.bg, fontSize: "0.78rem" }}
                  >
                    <i className="bi bi-info-circle-fill flex-shrink-0 mt-1" style={{ color: niveauCfg.color }} />
                    <div style={{ color: niveauCfg.text }}>
                      {motifObj.desc && <div className="mb-1">{motifObj.desc}</div>}
                      {motifObj.niveau === 3 && (
                        <div className="fw-semibold">
                          Signalement grave — une action immédiate sera prise si confirmé.
                        </div>
                      )}
                      {motifObj.niveau === 2 && (
                        <div>Des avertissements répétés peuvent entraîner la suspension du compte.</div>
                      )}
                      {motifObj.niveau === 1 && (
                        <div>Ce signalement sera noté au dossier et examiné par notre équipe.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description optionnelle */}
                <div>
                  <label className="form-label fw-semibold small">
                    Description <span className={`fw-normal ${isDark ? "text-secondary" : "text-muted"}`}>(optionnel)</span>
                  </label>
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
                  <i className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0 mt-1" />
                  <span className={isDark ? "text-warning-emphasis" : "text-warning-emphasis"}>
                    Les faux signalements peuvent entraîner la suspension de votre propre compte.
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
                    className="btn rounded-3 flex-grow-1 fw-semibold"
                    style={{
                      background: niveauCfg ? niveauCfg.color : "#dc3545",
                      color: "#fff",
                      border: "none",
                    }}
                    disabled={sending || !motifObj}
                  >
                    {sending
                      ? <span className="spinner-border spinner-border-sm" />
                      : <><i className="bi bi-flag me-2" />Envoyer le signalement</>
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
