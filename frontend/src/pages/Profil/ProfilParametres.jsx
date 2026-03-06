// src/pages/Profil/ProfilParametres.jsx
import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { logout } from "../../utils/auth.js";
import { usePWAInstall } from "../../hooks/usePWAInstall.js";

// ─── Composant section ────────────────────────────────────────────────────────
function Section({ icon, title, subtitle, isDark, children }) {
  return (
    <div className={`rounded-4 overflow-hidden mb-3 ${isDark ? "bg-dark border border-secondary" : "bg-white border"}`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374)" }} />
      <div className="p-3 p-md-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 36, height: 36, background: "rgba(25,135,84,0.1)" }}
          >
            <i className={`bi ${icon} text-success`} style={{ fontSize: "1rem" }} />
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: "0.95rem" }}>{title}</div>
            {subtitle && <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>{subtitle}</div>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Composant toggle switch ──────────────────────────────────────────────────
function ToggleRow({ label, description, checked, onChange, isDark }) {
  return (
    <div className={`d-flex align-items-center justify-content-between py-2 ${isDark ? "border-secondary" : ""}`}>
      <div className="me-3">
        <div className="fw-semibold" style={{ fontSize: "0.88rem" }}>{label}</div>
        {description && (
          <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>{description}</div>
        )}
      </div>
      <div className="form-check form-switch mb-0 flex-shrink-0">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: "2.5rem", height: "1.3rem", cursor: "pointer", accentColor: "#198754" }}
        />
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ProfilParametres() {
  const { isDark, user } = useOutletContext();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // === Apparence ===
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.body.dataset.bsTheme = newTheme;
  };

  // === Notifications ===
  const [notifReservation, setNotifReservation] = useState(
    () => localStorage.getItem("notif_reservation") !== "false"
  );
  const [notifTrajet, setNotifTrajet] = useState(
    () => localStorage.getItem("notif_trajet") !== "false"
  );
  const [notifRappel, setNotifRappel] = useState(
    () => localStorage.getItem("notif_rappel") !== "false"
  );

  const handleNotif = (key, setter) => (val) => {
    setter(val);
    localStorage.setItem(key, String(val));
  };

  // === Mot de passe ===
  const [pwForm, setPwForm] = useState({ actuel: "", nouveau: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwToast, setPwToast] = useState(null);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.nouveau !== pwForm.confirm) {
      setPwToast({ type: "danger", text: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }
    if (pwForm.nouveau.length < 6) {
      setPwToast({ type: "danger", text: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }
    try {
      setPwLoading(true);
      const res = await fetch("/utilisateurs/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mot_de_passe_actuel: pwForm.actuel, nouveau_mot_de_passe: pwForm.nouveau }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwToast({ type: "danger", text: data.message || "Erreur." });
        return;
      }
      setPwToast({ type: "success", text: "Mot de passe mis à jour avec succès !" });
      setPwForm({ actuel: "", nouveau: "", confirm: "" });
    } catch {
      setPwToast({ type: "danger", text: "Erreur serveur." });
    } finally {
      setPwLoading(false);
      setTimeout(() => setPwToast(null), 4000);
    }
  };

  // === Mode conducteur ===
  const [currentRole, setCurrentRole] = useState(user?.role || "PASSAGER");
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleToast, setRoleToast] = useState(null);

  const handleToggleRole = async () => {
    if (currentRole === "ADMIN") return;
    try {
      setRoleLoading(true);
      const res = await fetch("/utilisateurs/me/mode-conducteur", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setRoleToast({ type: "danger", text: data.message || "Erreur." });
        return;
      }
      setCurrentRole(data.role);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, role: data.role }));
      setRoleToast({
        type: "success",
        text: data.role === "CONDUCTEUR"
          ? "Mode conducteur activé ! Vous pouvez maintenant publier des trajets."
          : "Mode passager activé.",
      });
      setTimeout(() => { setRoleToast(null); window.location.reload(); }, 2000);
    } catch {
      setRoleToast({ type: "danger", text: "Erreur serveur." });
    } finally {
      setRoleLoading(false);
    }
  };

  // === PWA Install ===
  const { isMobile, isIos, isStandalone, deferredPrompt, install, dismiss, isDismissed } = usePWAInstall();
  const [pwaToast, setPwaToast] = useState(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  const handlePwaInstall = async () => {
    if (isIos) { setShowIosInstructions(true); return; }
    if (!deferredPrompt) return;
    const accepted = await install("profil");
    if (accepted) {
      dismiss(0);
      setPwaToast({ type: "success", text: "Application installée avec succès !" });
      setTimeout(() => setPwaToast(null), 4000);
    }
  };

  const handleReshowBanner = () => {
    dismiss(0); // supprime le délai de 30 jours
    setPwaToast({ type: "success", text: "La bannière d'installation réapparaîtra à la prochaine visite." });
    setTimeout(() => setPwaToast(null), 4000);
  };

  // === Supprimer le compte ===
  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDeleteAccount = async () => {
    if (!deletePw) { setDeleteError("Le mot de passe est requis."); return; }
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      const res = await fetch("/utilisateurs/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mot_de_passe: deletePw }),
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.message || "Erreur."); return; }
      logout(navigate);
    } catch {
      setDeleteError("Erreur serveur.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const inputClass = `form-control rounded-3 ${isDark ? "bg-dark text-light border-secondary" : ""}`;

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Paramètres</h4>
        <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
          Personnalisez votre expérience CampusRide.
        </p>
      </div>

      {/* ── 1. APPARENCE ─────────────────────────────────────────── */}
      <Section icon="bi-palette" title="Apparence" subtitle="Choisissez le thème de l'interface" isDark={isDark}>
        <div className="d-flex gap-2">
          {[
            { key: "light", icon: "bi-sun-fill", label: "Clair" },
            { key: "dark",  icon: "bi-moon-stars-fill", label: "Sombre" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              className={`btn flex-fill rounded-3 d-flex align-items-center justify-content-center gap-2 ${theme === key ? "btn-success" : isDark ? "btn-outline-secondary" : "btn-outline-secondary"}`}
              onClick={() => handleThemeChange(key)}
              style={{ fontSize: "0.88rem" }}
            >
              <i className={`bi ${icon}`} />
              {label}
              {theme === key && <i className="bi bi-check-lg ms-1" />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── 2. NOTIFICATIONS ─────────────────────────────────────── */}
      <Section icon="bi-bell" title="Notifications" subtitle="Gérez vos préférences de notifications" isDark={isDark}>
        <div className="d-flex flex-column gap-1">
          <ToggleRow
            label="Demandes de réservation"
            description="Recevoir une alerte quand un passager demande à rejoindre votre trajet"
            checked={notifReservation}
            onChange={handleNotif("notif_reservation", setNotifReservation)}
            isDark={isDark}
          />
          <hr className={`my-1 ${isDark ? "border-secondary" : ""}`} />
          <ToggleRow
            label="Mises à jour de trajet"
            description="Être notifié si un trajet est modifié ou annulé"
            checked={notifTrajet}
            onChange={handleNotif("notif_trajet", setNotifTrajet)}
            isDark={isDark}
          />
          <hr className={`my-1 ${isDark ? "border-secondary" : ""}`} />
          <ToggleRow
            label="Rappels de départ"
            description="Recevoir un rappel 1h avant votre trajet"
            checked={notifRappel}
            onChange={handleNotif("notif_rappel", setNotifRappel)}
            isDark={isDark}
          />
        </div>
      </Section>

      {/* ── 3. SÉCURITÉ — CHANGER MOT DE PASSE ───────────────────── */}
      <Section icon="bi-shield-lock" title="Sécurité" subtitle="Modifiez votre mot de passe" isDark={isDark}>
        {pwToast && (
          <div className={`alert alert-${pwToast.type} py-2 rounded-3 mb-3`} style={{ fontSize: "0.85rem" }}>
            <i className={`bi ${pwToast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
            {pwToast.text}
          </div>
        )}

        <form onSubmit={handlePwChange}>
          <div className="mb-3">
            <label className="form-label">Mot de passe actuel</label>
            <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
              <i className="bi bi-lock text-success me-2" style={{ fontSize: "0.85rem" }} />
              <input
                type="password"
                className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`}
                placeholder="••••••••"
                value={pwForm.actuel}
                onChange={(e) => setPwForm((p) => ({ ...p, actuel: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6">
              <label className="form-label">Nouveau mot de passe</label>
              <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                <i className="bi bi-lock-fill text-success me-2" style={{ fontSize: "0.85rem" }} />
                <input
                  type="password"
                  className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`}
                  placeholder="Min. 6 caractères"
                  value={pwForm.nouveau}
                  onChange={(e) => setPwForm((p) => ({ ...p, nouveau: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="col-12 col-sm-6">
              <label className="form-label">Confirmer</label>
              <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"} ${pwForm.confirm && pwForm.confirm !== pwForm.nouveau ? "border border-danger" : ""}`} style={{ padding: "0.35rem 0.65rem" }}>
                <i className={`bi bi-check-circle me-2 ${pwForm.confirm && pwForm.confirm === pwForm.nouveau ? "text-success" : "text-muted"}`} style={{ fontSize: "0.85rem" }} />
                <input
                  type="password"
                  className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`}
                  placeholder="Répéter le mot de passe"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success rounded-3 fw-semibold px-4"
            disabled={pwLoading}
            style={{ fontSize: "0.88rem" }}
          >
            {pwLoading
              ? <><span className="spinner-border spinner-border-sm me-2" />Mise à jour...</>
              : <><i className="bi bi-check-lg me-2" />Mettre à jour le mot de passe</>
            }
          </button>
        </form>
      </Section>

      {/* ── 4. MODE CONDUCTEUR ───────────────────────────────────── */}
      {currentRole !== "ADMIN" && (
        <Section
          icon="bi-car-front-fill"
          title="Mode conducteur"
          subtitle="Activez ou désactivez votre rôle de conducteur"
          isDark={isDark}
        >
          {roleToast && (
            <div className={`alert alert-${roleToast.type} py-2 rounded-3 mb-3`} style={{ fontSize: "0.85rem" }}>
              <i className={`bi ${roleToast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
              {roleToast.text}
            </div>
          )}

          <div className={`rounded-3 p-3 d-flex align-items-center justify-content-between gap-3 ${isDark ? "bg-dark border border-secondary" : "bg-light border"}`}>
            <div>
              <div className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.92rem" }}>
                {currentRole === "CONDUCTEUR" ? (
                  <>
                    <span className="badge rounded-pill px-2 py-1" style={{ background: "rgba(25,135,84,0.15)", color: "#198754", fontSize: "0.7rem" }}>
                      <i className="bi bi-car-front-fill me-1" />Conducteur actif
                    </span>
                  </>
                ) : (
                  <>
                    <span className="badge rounded-pill px-2 py-1 bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: "0.7rem" }}>
                      <i className="bi bi-person-fill me-1" />Mode passager
                    </span>
                  </>
                )}
              </div>
              <p className={`small mb-0 mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>
                {currentRole === "CONDUCTEUR"
                  ? "Vous pouvez publier des trajets et accepter des passagers."
                  : "Activez le mode conducteur pour proposer des trajets."}
              </p>
            </div>

            <button
              type="button"
              className={`btn rounded-3 fw-semibold flex-shrink-0 ${currentRole === "CONDUCTEUR" ? "btn-outline-secondary" : "btn-success"}`}
              onClick={handleToggleRole}
              disabled={roleLoading}
              style={{ fontSize: "0.85rem", minWidth: 130 }}
            >
              {roleLoading
                ? <><span className="spinner-border spinner-border-sm me-2" />Mise à jour...</>
                : currentRole === "CONDUCTEUR"
                  ? <><i className="bi bi-person me-2" />Passer passager</>
                  : <><i className="bi bi-car-front-fill me-2" />Devenir conducteur</>
              }
            </button>
          </div>
        </Section>
      )}

      {/* ── 5. APPLICATION ───────────────────────────────────────── */}
      {!isStandalone && (
        <Section icon="bi-phone" title="Application mobile" subtitle="Installez CampusRide sur votre téléphone" isDark={isDark}>
          {pwaToast && (
            <div className={`alert alert-${pwaToast.type} py-2 rounded-3 mb-3`} style={{ fontSize: "0.85rem" }}>
              <i className={`bi ${pwaToast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
              {pwaToast.text}
            </div>
          )}

          {showIosInstructions && (
            <div className={`rounded-3 p-3 mb-3 ${isDark ? "bg-dark border border-secondary" : "bg-light border"}`}>
              <div className="fw-semibold mb-2" style={{ fontSize: "0.88rem" }}>
                <i className="bi bi-apple me-2 text-success" />Comment installer sur iOS :
              </div>
              <ol className={`small mb-0 ps-3 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.82rem", lineHeight: 1.8 }}>
                <li>Ouvre cette page dans <strong>Safari</strong></li>
                <li>Appuie sur le bouton <i className="bi bi-box-arrow-up text-success" /> <strong>Partager</strong></li>
                <li>Sélectionne <strong>« Ajouter à l'écran d'accueil »</strong></li>
                <li>Confirme en appuyant sur <strong>Ajouter</strong></li>
              </ol>
            </div>
          )}

          <div className={`rounded-3 p-3 d-flex align-items-center justify-content-between gap-3 ${isDark ? "bg-dark border border-secondary" : "bg-light border"}`}>
            <div>
              <div className="fw-semibold" style={{ fontSize: "0.88rem" }}>
                <i className="bi bi-download me-2 text-success" />Installer l'application
              </div>
              <p className={`small mb-0 mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>
                Accès rapide depuis votre écran d'accueil, sans navigateur
              </p>
            </div>
            {isIos ? (
              <button
                type="button"
                className="btn btn-success rounded-3 fw-semibold flex-shrink-0"
                onClick={handlePwaInstall}
                style={{ fontSize: "0.82rem" }}
              >
                <i className="bi bi-info-circle me-1" />Comment faire
              </button>
            ) : deferredPrompt ? (
              <button
                type="button"
                className="btn btn-success rounded-3 fw-semibold flex-shrink-0"
                onClick={handlePwaInstall}
                style={{ fontSize: "0.82rem" }}
              >
                <i className="bi bi-download me-1" />Installer
              </button>
            ) : (
              <span className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem", textAlign: "right", maxWidth: 120 }}>
                Utilisez le menu de votre navigateur pour installer
              </span>
            )}
          </div>

          {isDismissed() && (
            <button
              type="button"
              className={`btn btn-link p-0 mt-2 ${isDark ? "text-secondary" : "text-muted"}`}
              style={{ fontSize: "0.78rem" }}
              onClick={handleReshowBanner}
            >
              <i className="bi bi-arrow-clockwise me-1" />Réafficher la bannière d'installation
            </button>
          )}
        </Section>
      )}

      {/* ── 6. COMPTE ────────────────────────────────────────────── */}
      <Section icon="bi-person-x" title="Compte" subtitle="Actions irréversibles concernant votre compte" isDark={isDark}>
        <div className={`rounded-3 p-3 mb-3 ${isDark ? "bg-danger bg-opacity-10 border border-danger" : "bg-danger bg-opacity-10 border border-danger border-opacity-25"}`}>
          <div className="d-flex align-items-start gap-3">
            <i className="bi bi-exclamation-triangle-fill text-danger mt-1" />
            <div>
              <div className="fw-bold text-danger" style={{ fontSize: "0.88rem" }}>Supprimer mon compte</div>
              <p className={`small mb-2 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.8rem" }}>
                Cette action est irréversible. Toutes vos données (trajets, réservations, profil) seront supprimées définitivement.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-3 fw-semibold"
                onClick={() => setDeleteModal(true)}
                style={{ fontSize: "0.82rem" }}
              >
                <i className="bi bi-trash3 me-1" />
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── MODAL CONFIRMATION SUPPRESSION ───────────────────────── */}
      {deleteModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 10000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteModal(false); }}
        >
          <div
            className={`rounded-4 shadow-lg p-4 w-100 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}
            style={{ maxWidth: 420 }}
          >
            <div className="text-center mb-4">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 56, height: 56, background: "rgba(220,53,69,0.12)" }}
              >
                <i className="bi bi-trash3-fill text-danger" style={{ fontSize: "1.5rem" }} />
              </div>
              <h5 className="fw-bold mb-1">Confirmer la suppression</h5>
              <p className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                Entrez votre mot de passe pour confirmer la suppression définitive de votre compte.
              </p>
            </div>

            {deleteError && (
              <div className="alert alert-danger py-2 rounded-3 mb-3" style={{ fontSize: "0.85rem" }}>
                <i className="bi bi-exclamation-triangle-fill me-2" />{deleteError}
              </div>
            )}

            <div className={`d-flex align-items-center rounded-3 mb-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
              <i className="bi bi-lock text-danger me-2" style={{ fontSize: "0.85rem" }} />
              <input
                type="password"
                className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`}
                placeholder="Votre mot de passe"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
                autoFocus
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn flex-fill rounded-3 fw-semibold ${isDark ? "btn-outline-secondary" : "btn-outline-secondary"}`}
                onClick={() => { setDeleteModal(false); setDeletePw(""); setDeleteError(null); }}
                disabled={deleteLoading}
                style={{ fontSize: "0.88rem" }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger flex-fill rounded-3 fw-semibold"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePw}
                style={{ fontSize: "0.88rem" }}
              >
                {deleteLoading
                  ? <><span className="spinner-border spinner-border-sm me-1" />Suppression...</>
                  : <><i className="bi bi-trash3 me-1" />Supprimer définitivement</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
