import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export default function ProfilInfos() {
  const { isDark, user, loadingUser, reloadUser } = useOutletContext();

  const [editMode, setEditMode] = useState(false);
  const [telephone, setTelephone] = useState("");
  const [zones, setZones] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setTelephone(user.telephone || "");
      setZones(user.zones_depart_preferees?.join(", ") || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch("/utilisateurs/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          telephone,
          zones_depart_preferees: zones.split(",").map(z => z.trim()).filter(Boolean),
          bio: bio.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Erreur serveur"); return; }
      setEditMode(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      reloadUser();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  // ── États de chargement / erreur ──────────────────────────────────────────
  if (loadingUser) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-exclamation-circle text-danger d-block mb-2" style={{ fontSize: "2rem" }} />
        <p className="fw-semibold mb-1">Impossible de charger le profil</p>
        <p className={`small mb-3 ${isDark ? "text-secondary" : "text-muted"}`}>
          Vérifiez votre connexion ou reconnectez-vous.
        </p>
        <button className="btn btn-outline-success btn-sm rounded-3" onClick={reloadUser}>
          <i className="bi bi-arrow-clockwise me-1" /> Réessayer
        </button>
      </div>
    );
  }

  // ── Champ de lecture ──────────────────────────────────────────────────────
  const InfoRow = ({ icon, label, value, badge }) => (
    <div className={`d-flex align-items-center gap-3 py-2 ${isDark ? "border-secondary" : ""}`}>
      <div
        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 32, height: 32, background: "rgba(25,135,84,0.08)" }}
      >
        <i className={`bi ${icon} text-success`} style={{ fontSize: "0.85rem" }} />
      </div>
      <div className="flex-grow-1 min-w-0">
        <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</div>
        {badge ? badge : <div className="fw-semibold" style={{ fontSize: "0.92rem" }}>{value || <span className={isDark ? "text-secondary" : "text-muted"}>Non renseigné</span>}</div>}
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1">Mes informations</h4>
          <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
            Consultez et modifiez vos informations personnelles.
          </p>
        </div>
        {!editMode && (
          <button
            className="btn btn-outline-success btn-sm rounded-3 fw-semibold"
            style={{ fontSize: "0.82rem" }}
            onClick={() => setEditMode(true)}
          >
            <i className="bi bi-pencil me-1" />
            Modifier
          </button>
        )}
      </div>

      {success && (
        <div className="alert alert-success py-2 rounded-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
          <i className="bi bi-check-circle-fill" />
          Profil mis à jour avec succès.
        </div>
      )}

      {/* ── Informations fixes ── */}
      <div className={`rounded-4 overflow-hidden mb-3 ${isDark ? "bg-dark border border-secondary" : "bg-white border"}`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374)" }} />
        <div className="p-3 p-md-4">
          <div className="fw-bold mb-2" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#198754" }}>
            Identité
          </div>
          <InfoRow icon="bi-person" label="Prénom & Nom" value={`${user.prenom} ${user.nom}`} />
          <hr className={`my-1 ${isDark ? "border-secondary" : ""}`} />
          <InfoRow icon="bi-envelope" label="Adresse courriel" value={user.email} />
          <hr className={`my-1 ${isDark ? "border-secondary" : ""}`} />
          <InfoRow
            icon="bi-shield-check"
            label="Rôle"
            badge={
              <span
                className="badge rounded-pill px-2 py-1 mt-1"
                style={{
                  fontSize: "0.7rem",
                  background: user.role === "CONDUCTEUR" ? "rgba(25,135,84,0.12)" : "rgba(108,117,125,0.12)",
                  color: user.role === "CONDUCTEUR" ? "#198754" : "#6c757d",
                }}
              >
                <i className={`bi ${user.role === "CONDUCTEUR" ? "bi-car-front-fill" : "bi-person-fill"} me-1`} />
                {user.role === "CONDUCTEUR" ? "Conducteur" : "Passager"}
              </span>
            }
          />
          <hr className={`my-1 ${isDark ? "border-secondary" : ""}`} />
          <InfoRow
            icon="bi-calendar-check"
            label="Membre depuis"
            value={new Date(user.cree_le).toLocaleDateString("fr-CA", { day: "2-digit", month: "long", year: "numeric" })}
          />
        </div>
      </div>

      {/* ── Informations modifiables ── */}
      <div className={`rounded-4 overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white border"}`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374)" }} />
        <div className="p-3 p-md-4">
          <div className="fw-bold mb-3" style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#198754" }}>
            Coordonnées & préférences
          </div>

          {/* Téléphone */}
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
              <i className="bi bi-telephone me-1 text-success" />
              Numéro de téléphone
            </label>
            {editMode ? (
              <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                <i className="bi bi-telephone text-success me-2" style={{ fontSize: "0.85rem" }} />
                <input
                  type="tel"
                  className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`}
                  placeholder="Ex: 613-555-0123"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  style={{ fontSize: "0.88rem" }}
                />
              </div>
            ) : (
              <div className={`fw-semibold ${!user.telephone ? (isDark ? "text-secondary" : "text-muted") : ""}`} style={{ fontSize: "0.92rem" }}>
                {user.telephone || "Non renseigné"}
              </div>
            )}
          </div>

          {/* Zones préférées */}
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
              <i className="bi bi-geo-alt me-1 text-success" />
              Zones de départ préférées
            </label>
            {editMode ? (
              <>
                <div className={`d-flex align-items-start rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                  <i className="bi bi-geo-alt text-success me-2 mt-1" style={{ fontSize: "0.85rem" }} />
                  <textarea
                    className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`}
                    placeholder="Ex: Orléans, Barrhaven, Kanata"
                    value={zones}
                    onChange={(e) => setZones(e.target.value)}
                    rows={2}
                    style={{ fontSize: "0.88rem", resize: "none" }}
                  />
                </div>
                <div className={`mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                  <i className="bi bi-info-circle me-1" />
                  Séparez les zones par des virgules.
                </div>
              </>
            ) : (
              <div>
                {user.zones_depart_preferees?.length > 0 ? (
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {user.zones_depart_preferees.map((z) => (
                      <span
                        key={z}
                        className="badge rounded-pill px-2 py-1"
                        style={{ fontSize: "0.75rem", background: "rgba(25,135,84,0.1)", color: "#198754" }}
                      >
                        <i className="bi bi-geo-alt me-1" />
                        {z}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={`fw-semibold ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.92rem" }}>
                    Aucune zone
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
              <i className="bi bi-person-lines-fill me-1 text-success" />
              Bio <span className={`fw-normal ${isDark ? "text-secondary" : "text-muted"}`}>(visible par les autres membres)</span>
            </label>
            {editMode ? (
              <>
                <textarea
                  className={`form-control rounded-3 ${isDark ? "bg-dark text-light border-secondary" : ""}`}
                  rows={4}
                  placeholder="Parlez de vous : études, langues parlées, centres d'intérêt, style de conduite…"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  style={{ fontSize: "0.88rem", resize: "vertical" }}
                />
                <div className={`d-flex justify-content-end mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                  {bio.length}/500 caractères
                </div>
              </>
            ) : (
              <div
                className={`rounded-3 p-3 ${isDark ? "bg-dark border border-secondary" : "bg-light border"}`}
                style={{ fontSize: "0.88rem", lineHeight: 1.65, minHeight: 60 }}
              >
                {user.bio ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{user.bio}</span>
                ) : (
                  <span className={isDark ? "text-secondary" : "text-muted"}>
                    <i className="bi bi-pencil me-1" />
                    Aucune bio — cliquez sur Modifier pour en ajouter une.
                  </span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-danger py-2 rounded-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          {editMode && (
            <div className="d-flex gap-2">
              <button
                className={`btn rounded-3 fw-semibold flex-fill ${isDark ? "btn-outline-secondary" : "btn-outline-secondary"}`}
                style={{ fontSize: "0.88rem" }}
                onClick={() => { setEditMode(false); setError(null); }}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                className="btn btn-success rounded-3 fw-semibold flex-fill"
                style={{ fontSize: "0.88rem" }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</>
                  : <><i className="bi bi-check-lg me-2" />Enregistrer</>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
