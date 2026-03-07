// src/pages/Admin/AdminDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Constantes ───────────────────────────────────────────────────────────────
const ROLE_LABELS = { ADMIN: "Admin", CONDUCTEUR: "Conducteur", PASSAGER: "Passager" };
const ROLE_COLORS = { ADMIN: "#dc3545", CONDUCTEUR: "#198754", PASSAGER: "#6c757d" };

const STATUT_CFG = {
  PLANIFIE:  { label: "Planifié",  bg: "#198754", light: "#d1e7dd", text: "#0f5132" },
  EN_COURS:  { label: "En cours",  bg: "#fd7e14", light: "#fff3cd", text: "#664d03" },
  TERMINE:   { label: "Terminé",   bg: "#6c757d", light: "#e2e3e5", text: "#41464b" },
  ANNULE:    { label: "Annulé",    bg: "#dc3545", light: "#f8d7da", text: "#842029" },
};

const RESA_STATUT_CFG = {
  EN_ATTENTE: { label: "En attente", bg: "#fd7e14", light: "#fff3cd", text: "#664d03" },
  ACCEPTEE:   { label: "Acceptée",   bg: "#198754", light: "#d1e7dd", text: "#0f5132" },
  REFUSEE:    { label: "Refusée",    bg: "#dc3545", light: "#f8d7da", text: "#842029" },
  ANNULEE:    { label: "Annulée",    bg: "#6c757d", light: "#e2e3e5", text: "#41464b" },
};

const NAV_ITEMS = [
  { id: "dashboard",     icon: "bi-speedometer2",   label: "Tableau de bord" },
  { id: "utilisateurs",  icon: "bi-people-fill",    label: "Utilisateurs" },
  { id: "trajets",       icon: "bi-map-fill",       label: "Trajets" },
  { id: "reservations",  icon: "bi-bookmark-fill",  label: "Réservations" },
  { id: "signalements",  icon: "bi-flag-fill",      label: "Signalements" },
];

const SIGNAL_STATUT_CFG = {
  EN_ATTENTE: { label: "En attente", bg: "#fd7e14", light: "#fff3cd", text: "#664d03" },
  TRAITE:     { label: "Traité",     bg: "#198754", light: "#d1e7dd", text: "#0f5132" },
  REJETE:     { label: "Rejeté",     bg: "#6c757d", light: "#e2e3e5", text: "#41464b" },
};

// ─── Sous-composants légers ────────────────────────────────────────────────────
function Avatar({ prenom, nom, photo, size = 34 }) {
  const initials = ((prenom?.[0] ?? "") + (nom?.[0] ?? "")).toUpperCase() || "?";
  if (photo) return <img src={photo} alt="" className="rounded-circle flex-shrink-0"
    style={{ width: size, height: size, objectFit: "cover" }} />;
  return (
    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: "linear-gradient(135deg,#198754,#20c374)", fontSize: size * 0.32 }}>
      {initials}
    </div>
  );
}

function StatCard({ icon, value, label, color = "#198754", sub }) {
  return (
    <div className="rounded-4 p-3 h-100" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.07)" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: 2, marginBottom: 14 }} />
      <div className="d-flex align-items-center gap-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 46, height: 46, background: `${color}16` }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: "1.25rem" }} />
        </div>
        <div>
          <div className="fw-bold lh-1 mb-1" style={{ fontSize: "1.65rem", color }}>{value ?? "—"}</div>
          <div className="text-muted" style={{ fontSize: "0.73rem" }}>{label}</div>
          {sub && <div style={{ fontSize: "0.68rem", color: "#adb5bd", marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  return (
    <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
      <div className={`toast align-items-center border-0 shadow-lg rounded-3 ${toast.type === "success" ? "text-bg-success" : "text-bg-danger"} ${toast.show ? "show" : ""}`} role="alert">
        <div className="d-flex">
          <div className="toast-body fw-semibold" style={{ fontSize: "0.88rem" }}>
            <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"} me-2`} />
            {toast.text}
          </div>
          <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

// ─── Section : Tableau de bord ─────────────────────────────────────────────────
function SectionDashboard({ stats, loading }) {
  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success" /></div>;
  if (!stats) return null;

  const taux = stats.total_reservations > 0
    ? Math.round((Number(stats.reservations_acceptees) / Number(stats.total_reservations)) * 100)
    : 0;
  const tauxAnnul = stats.total_trajets > 0
    ? Math.round((Number(stats.trajets_annules) / Number(stats.total_trajets)) * 100)
    : 0;

  return (
    <>
      {/* KPI principaux */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard icon="bi-people-fill"        value={stats.total_utilisateurs} label="Utilisateurs actifs"  color="#198754" sub={`${stats.total_conducteurs} conducteurs · ${stats.total_passagers} passagers`} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon="bi-map-fill"            value={stats.total_trajets}      label="Trajets publiés"      color="#0d6efd" sub={`${stats.trajets_planifies} planifiés · ${stats.trajets_en_cours} en cours`} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon="bi-bookmark-check-fill" value={stats.total_reservations} label="Réservations totales"  color="#6f42c1" sub={`${stats.reservations_acceptees} acceptées (${taux}%)`} />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon="bi-star-fill"           value={stats.note_moyenne_globale ? `${stats.note_moyenne_globale}/5` : "—"} label="Note moyenne globale" color="#ffc107" sub={`${stats.total_evaluations} évaluation(s)`} />
        </div>
      </div>

      {/* Détail trajets + réservations */}
      <div className="row g-3 mb-4">
        {/* Distribution statuts trajets */}
        <div className="col-md-6">
          <div className="rounded-4 p-4 h-100" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.07)" }}>
            <div style={{ height: 3, background: "linear-gradient(90deg,#198754,#20c374)", borderRadius: 2, marginBottom: 16 }} />
            <h6 className="fw-bold mb-3" style={{ fontSize: "0.88rem" }}>
              <i className="bi bi-pie-chart-fill text-success me-2" />Répartition des trajets
            </h6>
            {[
              { key: "trajets_planifies",  label: "Planifiés",  ...STATUT_CFG.PLANIFIE },
              { key: "trajets_en_cours",   label: "En cours",   ...STATUT_CFG.EN_COURS },
              { key: "trajets_termines",   label: "Terminés",   ...STATUT_CFG.TERMINE  },
              { key: "trajets_annules",    label: "Annulés",    ...STATUT_CFG.ANNULE   },
            ].map(({ key, label, bg }) => {
              const val = Number(stats[key] || 0);
              const pct = stats.total_trajets > 0 ? Math.round((val / Number(stats.total_trajets)) * 100) : 0;
              return (
                <div key={key} className="mb-2">
                  <div className="d-flex justify-content-between mb-1" style={{ fontSize: "0.78rem" }}>
                    <span className="fw-semibold">{label}</span>
                    <span className="text-muted">{val} ({pct}%)</span>
                  </div>
                  <div className="progress rounded-pill" style={{ height: 6 }}>
                    <div className="progress-bar" style={{ width: `${pct}%`, background: bg }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chiffres clés */}
        <div className="col-md-6">
          <div className="rounded-4 p-4 h-100" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.07)" }}>
            <div style={{ height: 3, background: "linear-gradient(90deg,#6f42c1,#a855f7)", borderRadius: 2, marginBottom: 16 }} />
            <h6 className="fw-bold mb-3" style={{ fontSize: "0.88rem" }}>
              <i className="bi bi-bar-chart-fill text-purple me-2" style={{ color: "#6f42c1" }} />Chiffres clés
            </h6>
            {[
              { icon: "bi-person-badge-fill",   color: "#0d6efd", label: "Conducteurs actifs",       value: stats.total_conducteurs },
              { icon: "bi-person-fill",          color: "#198754", label: "Passagers actifs",          value: stats.total_passagers },
              { icon: "bi-shield-fill",          color: "#dc3545", label: "Administrateurs",           value: stats.total_admins },
              { icon: "bi-person-plus-fill",     color: "#20c374", label: "Nouveaux (7 derniers jours)", value: stats.nouveaux_7j ?? "—" },
              { icon: "bi-check2-all",           color: "#198754", label: "Taux acceptation réserv.",  value: `${taux}%` },
              { icon: "bi-x-circle-fill",        color: "#dc3545", label: "Taux annulation trajets",   value: `${tauxAnnul}%` },
              { icon: "bi-star-half",            color: "#ffc107", label: "Évaluations soumises",      value: stats.total_evaluations },
            ].map(({ icon, color, label, value }) => (
              <div key={label} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: "1px solid #f0f0f0", fontSize: "0.82rem" }}>
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${icon}`} style={{ color, fontSize: "1rem" }} />
                  <span className="text-muted">{label}</span>
                </div>
                <span className="fw-bold">{value ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application mobile — Installations PWA */}
      <div className="rounded-4 p-4 mb-4" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.07)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#0d6efd,#6610f2)", borderRadius: 2, marginBottom: 16 }} />
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0" style={{ fontSize: "0.88rem" }}>
            <i className="bi bi-phone-fill me-2" style={{ color: "#0d6efd" }} />Application mobile — Installations PWA
          </h6>
          <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: "rgba(13,110,253,0.12)", color: "#0d6efd", fontSize: "0.9rem" }}>
            {stats.pwa_total ?? 0} installation(s)
          </span>
        </div>
        {Number(stats.pwa_total) === 0 ? (
          <p className="text-muted small mb-0">Aucune installation enregistrée pour le moment.</p>
        ) : (
          <div className="row g-3">
            {[
              { label: "Via la bannière d'accueil", value: Number(stats.pwa_banniere ?? 0), color: "#198754", icon: "bi-bell-fill" },
              { label: "Via les Paramètres du profil", value: Number(stats.pwa_profil ?? 0), color: "#6f42c1", icon: "bi-gear-fill" },
              { label: "Autre / non identifié", value: Math.max(0, Number(stats.pwa_total ?? 0) - Number(stats.pwa_banniere ?? 0) - Number(stats.pwa_profil ?? 0)), color: "#6c757d", icon: "bi-question-circle-fill" },
            ].map(({ label, value, color, icon }) => {
              const pct = Number(stats.pwa_total) > 0 ? Math.round((value / Number(stats.pwa_total)) * 100) : 0;
              return (
                <div key={label} className="col-md-4">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className={`bi ${icon}`} style={{ color, fontSize: "0.85rem" }} />
                    <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{label}</span>
                  </div>
                  <div className="progress rounded-pill mb-1" style={{ height: 8 }}>
                    <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="d-flex justify-content-between" style={{ fontSize: "0.72rem", color: "#6c757d" }}>
                    <span>{value} installation(s)</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Section : Utilisateurs ────────────────────────────────────────────────────
function SectionUtilisateurs({ token, showToast, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("TOUS");
  const [confirmDeact, setConfirmDeact] = useState(null);
  const [pendingRoles, setPendingRoles] = useState({}); // { [userId]: newRole }
  const [savingRole, setSavingRole] = useState(null);

  const fetchUsers = useCallback(async (s = "") => {
    try {
      setLoading(true);
      const url = `/admin/users${s ? `?search=${encodeURIComponent(s)}` : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.users || []);
    } catch { showToast("Erreur chargement utilisateurs.", "danger"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActif = async (userId, actif) => {
    try {
      const res = await fetch(`/admin/users/${userId}/toggle-actif`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, actif: !actif } : u));
      showToast(actif ? "Compte désactivé." : "Compte réactivé.");
    } catch { showToast("Erreur.", "danger"); }
    finally { setConfirmDeact(null); }
  };

  const handleSaveRole = async (userId) => {
    const role = pendingRoles[userId];
    if (!role) return;
    try {
      setSavingRole(userId);
      const res = await fetch(`/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      setPendingRoles((p) => { const n = { ...p }; delete n[userId]; return n; });
      showToast("Rôle mis à jour.");
    } catch { showToast("Erreur.", "danger"); }
    finally { setSavingRole(null); }
  };

  const filtered = roleFilter === "TOUS" ? users : users.filter((u) => u.role === roleFilter);

  return (
    <>
      {/* Barre de filtres */}
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <div className="input-group rounded-3 overflow-hidden" style={{ maxWidth: 280, border: "1px solid #dee2e6" }}>
          <span className="input-group-text bg-white border-0"><i className="bi bi-search text-muted" /></span>
          <input
            type="text" className="form-control border-0 shadow-none" placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers(search)}
            style={{ fontSize: "0.85rem" }}
          />
          {search && <button className="btn btn-sm border-0 bg-white text-muted" onClick={() => { setSearch(""); fetchUsers(""); }}>✕</button>}
        </div>
        <button className="btn btn-success btn-sm rounded-3 px-3" onClick={() => fetchUsers(search)}>
          <i className="bi bi-search me-1" />Chercher
        </button>
        {["TOUS", "CONDUCTEUR", "PASSAGER", "ADMIN"].map((r) => (
          <button key={r}
            className={`btn btn-sm rounded-pill px-3 ${roleFilter === r ? "btn-dark fw-semibold" : "btn-outline-secondary"}`}
            style={{ fontSize: "0.78rem" }}
            onClick={() => setRoleFilter(r)}
          >
            {r === "TOUS" ? "Tous" : ROLE_LABELS[r]}
          </button>
        ))}
        <span className="ms-auto text-muted" style={{ fontSize: "0.78rem" }}>{filtered.length} résultat(s)</span>
      </div>

      {/* Tableau */}
      <div className="rounded-4 overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.07)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#198754,#20c374)" }} />
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-success" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people" style={{ fontSize: "2rem", opacity: .3 }} />
            <p className="mt-2 mb-0 small">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: "0.83rem" }}>
              <thead style={{ background: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                <tr>
                  <th className="ps-4 py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Utilisateur</th>
                  <th className="py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Email</th>
                  <th className="py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Rôle</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Trajets</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Réserv.</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Note</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Statut</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ verticalAlign: "middle" }}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-2">
                        <Avatar prenom={u.prenom} nom={u.nom} photo={u.photo_url} size={34} />
                        <div>
                          <div className="fw-semibold lh-1">{u.prenom} {u.nom}</div>
                          <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                            Depuis {new Date(u.cree_le).toLocaleDateString("fr-CA")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3" style={{ maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span className="text-muted">{u.email}</span>
                    </td>
                    <td className="py-3">
                      <div className="d-flex align-items-center gap-2">
                        <select
                          className="form-select form-select-sm rounded-3 border fw-semibold py-1"
                          value={pendingRoles[u.id] ?? u.role}
                          onChange={(e) => setPendingRoles((p) => ({ ...p, [u.id]: e.target.value }))}
                          style={{ color: ROLE_COLORS[pendingRoles[u.id] ?? u.role], width: "auto", minWidth: 120, fontSize: "0.78rem", borderColor: `${ROLE_COLORS[pendingRoles[u.id] ?? u.role]}44` }}
                        >
                          <option value="PASSAGER">Passager</option>
                          <option value="CONDUCTEUR">Conducteur</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        {pendingRoles[u.id] && pendingRoles[u.id] !== u.role && (
                          <button
                            className="btn btn-success btn-sm rounded-3 fw-semibold px-2 py-1"
                            style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}
                            onClick={() => handleSaveRole(u.id)}
                            disabled={savingRole === u.id}
                          >
                            {savingRole === u.id
                              ? <span className="spinner-border spinner-border-sm" />
                              : <><i className="bi bi-check-lg me-1" />Enregistrer</>
                            }
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-3 fw-semibold">{u.nb_trajets}</td>
                    <td className="text-center py-3 fw-semibold">{u.nb_reservations}</td>
                    <td className="text-center py-3">
                      {u.note_moyenne
                        ? <span className="fw-bold" style={{ color: "#ffc107" }}>{u.note_moyenne}<i className="bi bi-star-fill ms-1" style={{ fontSize: "0.65rem" }} /></span>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-center py-3">
                      <span className={`badge rounded-pill px-3 py-1 ${u.actif ? "text-success" : "text-danger"}`}
                        style={{ background: u.actif ? "#d1e7dd" : "#f8d7da", fontSize: "0.7rem", fontWeight: 600 }}>
                        <i className={`bi ${u.actif ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-1`} />
                        {u.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="text-center py-3">
                      {u.role === "ADMIN" || u.id === currentUser?.id ? (
                        <span className="text-muted" style={{ fontSize: "0.72rem" }} title={u.id === currentUser?.id ? "Votre propre compte" : "Compte administrateur protégé"}>
                          <i className="bi bi-shield-lock-fill me-1" />Protégé
                        </span>
                      ) : (
                        <button
                          className={`btn btn-sm rounded-3 fw-semibold ${u.actif ? "btn-outline-danger" : "btn-outline-success"}`}
                          style={{ fontSize: "0.72rem", padding: "3px 10px" }}
                          onClick={() => u.actif ? setConfirmDeact(u) : handleToggleActif(u.id, u.actif)}
                        >
                          {u.actif ? <><i className="bi bi-slash-circle me-1" />Désactiver</> : <><i className="bi bi-check-circle me-1" />Activer</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal confirmation désactivation */}
      {confirmDeact && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.45)", position: "fixed", inset: 0, zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content rounded-4 border-0">
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: 56, height: 56, background: "#fff3cd" }}>
                    <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: "1.5rem" }} />
                  </div>
                  <h6 className="fw-bold mb-1">Désactiver ce compte ?</h6>
                  <p className="text-muted small mb-0">
                    <strong>{confirmDeact.prenom} {confirmDeact.nom}</strong> ne pourra plus se connecter.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary rounded-3 flex-grow-1" onClick={() => setConfirmDeact(null)}>Annuler</button>
                  <button className="btn btn-danger rounded-3 flex-grow-1 fw-semibold" onClick={() => handleToggleActif(confirmDeact.id, confirmDeact.actif)}>
                    Désactiver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Section : Trajets ─────────────────────────────────────────────────────────
function SectionTrajets({ token, showToast }) {
  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState("TOUS");
  const [search, setSearch] = useState("");
  const [confirmAnnul, setConfirmAnnul] = useState(null);

  const fetchTrajets = useCallback(async (s = "", st = "TOUS") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (st && st !== "TOUS") params.set("statut", st);
      if (s) params.set("search", s);
      const res = await fetch(`/admin/trajets${params.toString() ? "?" + params : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTrajets(data.trajets || []);
    } catch { showToast("Erreur chargement trajets.", "danger"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchTrajets(); }, [fetchTrajets]);

  const handleAnnuler = async (trajetId) => {
    try {
      const res = await fetch(`/admin/trajets/${trajetId}/annuler`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); showToast(d.message || "Erreur.", "danger"); return; }
      setTrajets((prev) => prev.map((t) => t.id === trajetId ? { ...t, statut: "ANNULE" } : t));
      showToast("Trajet annulé.");
    } catch { showToast("Erreur.", "danger"); }
    finally { setConfirmAnnul(null); }
  };

  const counts = { TOUS: trajets.length };
  trajets.forEach((t) => { counts[t.statut] = (counts[t.statut] || 0) + 1; });

  const filtered = statutFilter === "TOUS" ? trajets : trajets.filter((t) => t.statut === statutFilter);

  return (
    <>
      {/* Onglets statut */}
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        {["TOUS", "PLANIFIE", "EN_COURS", "TERMINE", "ANNULE"].map((st) => {
          const cfg = st === "TOUS" ? { label: "Tous", bg: "#198754" } : STATUT_CFG[st];
          const count = counts[st] || 0;
          const active = statutFilter === st;
          return (
            <button key={st}
              className="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
              style={{
                fontSize: "0.78rem", fontWeight: active ? 700 : 500,
                background: active ? cfg.bg : "transparent",
                color: active ? "#fff" : "#6c757d",
                border: `1.5px solid ${active ? cfg.bg : "#dee2e6"}`,
              }}
              onClick={() => { setStatutFilter(st); fetchTrajets(search, st); }}
            >
              {cfg.label}
              <span className="badge rounded-pill ms-1"
                style={{ background: active ? "rgba(255,255,255,.25)" : "#e9ecef", color: active ? "#fff" : "#495057", fontSize: "0.65rem" }}>
                {count}
              </span>
            </button>
          );
        })}

        <div className="ms-auto input-group rounded-3 overflow-hidden" style={{ maxWidth: 260, border: "1px solid #dee2e6" }}>
          <span className="input-group-text bg-white border-0"><i className="bi bi-search text-muted" style={{ fontSize: "0.8rem" }} /></span>
          <input type="text" className="form-control border-0 shadow-none" placeholder="Lieu, destination, conducteur..."
            value={search} style={{ fontSize: "0.82rem" }}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTrajets(search, statutFilter)} />
          {search && <button className="btn btn-sm border-0 bg-white text-muted" onClick={() => { setSearch(""); fetchTrajets("", statutFilter); }}>✕</button>}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-4 overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.07)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#0d6efd,#6ea8fe)" }} />
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-map" style={{ fontSize: "2rem", opacity: .3 }} />
            <p className="mt-2 mb-0 small">Aucun trajet trouvé</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: "0.82rem" }}>
              <thead style={{ background: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                <tr>
                  <th className="ps-4 py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Itinéraire</th>
                  <th className="py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Date & heure</th>
                  <th className="py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Conducteur</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Places</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Réserv.</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Statut</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const cfg = STATUT_CFG[t.statut] || STATUT_CFG.ANNULE;
                  const dateObj = new Date(t.dateheure_depart);
                  const canCancel = t.statut === "PLANIFIE" || t.statut === "EN_COURS";
                  return (
                    <tr key={t.id} style={{ verticalAlign: "middle" }}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-start gap-2">
                          <div className="d-flex flex-column align-items-center flex-shrink-0 mt-1" style={{ gap: 2 }}>
                            <div className="rounded-circle bg-success" style={{ width: 7, height: 7 }} />
                            <div style={{ width: 1.5, height: 14, background: "#198754", opacity: .35 }} />
                            <i className="bi bi-geo-alt-fill text-success" style={{ fontSize: "0.7rem" }} />
                          </div>
                          <div>
                            <div className="fw-semibold lh-1 text-truncate" style={{ maxWidth: 180 }}>{t.lieu_depart}</div>
                            <div className="text-muted mt-1 text-truncate" style={{ fontSize: "0.75rem", maxWidth: 180 }}>{t.destination}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="fw-semibold">{dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>{dateObj.toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      </td>
                      <td className="py-3">
                        <div className="fw-semibold">{t.conducteur_prenom} {t.conducteur_nom}</div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>{t.conducteur_email}</div>
                      </td>
                      <td className="text-center py-3">
                        <span className="fw-semibold">{t.places_dispo}</span>
                        <span className="text-muted">/{t.places_total}</span>
                      </td>
                      <td className="text-center py-3 fw-semibold">{t.nb_reservations}</td>
                      <td className="text-center py-3">
                        <span className="badge rounded-pill px-3 py-1 fw-semibold"
                          style={{ background: cfg.light, color: cfg.text, fontSize: "0.7rem" }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="text-center py-3">
                        {canCancel ? (
                          <button
                            className="btn btn-sm btn-outline-danger rounded-3 fw-semibold"
                            style={{ fontSize: "0.72rem", padding: "3px 10px" }}
                            onClick={() => setConfirmAnnul(t)}
                          >
                            <i className="bi bi-x-circle me-1" />Annuler
                          </button>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-2 text-muted text-end" style={{ fontSize: "0.75rem", borderTop: "1px solid #f0f0f0" }}>
          {filtered.length} trajet(s) affiché(s)
        </div>
      </div>

      {/* Modal confirmation annulation */}
      {confirmAnnul && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.45)", position: "fixed", inset: 0, zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content rounded-4 border-0">
              <div className="modal-body text-center p-4">
                <div className="mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: 56, height: 56, background: "#f8d7da" }}>
                    <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: "1.5rem" }} />
                  </div>
                  <h6 className="fw-bold mb-1">Annuler ce trajet ?</h6>
                  <p className="text-muted small mb-0">
                    <strong>{confirmAnnul.lieu_depart} → {confirmAnnul.destination}</strong><br />
                    Cette action est irréversible.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary rounded-3 flex-grow-1" onClick={() => setConfirmAnnul(null)}>Annuler</button>
                  <button className="btn btn-danger rounded-3 flex-grow-1 fw-semibold" onClick={() => handleAnnuler(confirmAnnul.id)}>
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Section : Réservations ────────────────────────────────────────────────────
function SectionReservations({ token, showToast }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statutFilter, setStatutFilter] = useState("TOUS");
  const [search, setSearch] = useState("");

  const fetchReservations = useCallback(async (s = "", st = "TOUS") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (st && st !== "TOUS") params.set("statut", st);
      if (s) params.set("search", s);
      const res = await fetch(`/admin/reservations${params.toString() ? "?" + params : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch { showToast("Erreur chargement réservations.", "danger"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const counts = { TOUS: reservations.length };
  reservations.forEach((r) => { counts[r.statut] = (counts[r.statut] || 0) + 1; });

  const filtered = statutFilter === "TOUS" ? reservations : reservations.filter((r) => r.statut === statutFilter);

  return (
    <>
      {/* Onglets statut */}
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        {["TOUS", "EN_ATTENTE", "ACCEPTEE", "REFUSEE", "ANNULEE"].map((st) => {
          const cfg = st === "TOUS" ? { label: "Tous", bg: "#6f42c1" } : RESA_STATUT_CFG[st];
          const count = counts[st] || 0;
          const active = statutFilter === st;
          return (
            <button key={st}
              className="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
              style={{
                fontSize: "0.78rem", fontWeight: active ? 700 : 500,
                background: active ? cfg.bg : "transparent",
                color: active ? "#fff" : "#6c757d",
                border: `1.5px solid ${active ? cfg.bg : "#dee2e6"}`,
              }}
              onClick={() => { setStatutFilter(st); fetchReservations(search, st); }}
            >
              {cfg.label}
              <span className="badge rounded-pill ms-1"
                style={{ background: active ? "rgba(255,255,255,.25)" : "#e9ecef", color: active ? "#fff" : "#495057", fontSize: "0.65rem" }}>
                {count}
              </span>
            </button>
          );
        })}

        <div className="ms-auto input-group rounded-3 overflow-hidden" style={{ maxWidth: 280, border: "1px solid #dee2e6" }}>
          <span className="input-group-text bg-white border-0"><i className="bi bi-search text-muted" style={{ fontSize: "0.8rem" }} /></span>
          <input type="text" className="form-control border-0 shadow-none" placeholder="Passager, trajet..."
            value={search} style={{ fontSize: "0.82rem" }}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchReservations(search, statutFilter)} />
          {search && <button className="btn btn-sm border-0 bg-white text-muted" onClick={() => { setSearch(""); fetchReservations("", statutFilter); }}>✕</button>}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-4 overflow-hidden" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.07)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#6f42c1,#a855f7)" }} />
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border" style={{ color: "#6f42c1" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-bookmark" style={{ fontSize: "2rem", opacity: .3 }} />
            <p className="mt-2 mb-0 small">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: "0.82rem" }}>
              <thead style={{ background: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                <tr>
                  <th className="ps-4 py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Passager</th>
                  <th className="py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Trajet</th>
                  <th className="py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Conducteur</th>
                  <th className="py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Date départ</th>
                  <th className="py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Demandé le</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Statut réserv.</th>
                  <th className="text-center py-3 fw-semibold text-muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".5px" }}>Statut trajet</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const resaCfg   = RESA_STATUT_CFG[r.statut] || RESA_STATUT_CFG.ANNULEE;
                  const trajetCfg = STATUT_CFG[r.trajet_statut] || STATUT_CFG.ANNULE;
                  return (
                    <tr key={r.id} style={{ verticalAlign: "middle" }}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <Avatar prenom={r.passager_prenom} nom={r.passager_nom} photo={r.passager_photo_url} size={30} />
                          <div>
                            <div className="fw-semibold lh-1">{r.passager_prenom} {r.passager_nom}</div>
                            <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>{r.passager_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-start gap-1">
                          <div className="d-flex flex-column align-items-center flex-shrink-0 mt-1" style={{ gap: 2 }}>
                            <div className="rounded-circle bg-success" style={{ width: 6, height: 6 }} />
                            <div style={{ width: 1.5, height: 12, background: "#198754", opacity: .35 }} />
                            <i className="bi bi-geo-alt-fill text-success" style={{ fontSize: "0.62rem" }} />
                          </div>
                          <div>
                            <div className="fw-semibold lh-1 text-truncate" style={{ maxWidth: 170, fontSize: "0.8rem" }}>{r.lieu_depart}</div>
                            <div className="text-muted mt-1 text-truncate" style={{ fontSize: "0.73rem", maxWidth: 170 }}>{r.destination}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="fw-semibold">{r.conducteur_prenom} {r.conducteur_nom}</span>
                      </td>
                      <td className="py-3">
                        <div className="fw-semibold">{new Date(r.dateheure_depart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="text-muted" style={{ fontSize: "0.73rem" }}>{new Date(r.dateheure_depart).toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      </td>
                      <td className="py-3">
                        <div style={{ fontSize: "0.78rem" }}>{new Date(r.demande_le).toLocaleDateString("fr-CA", { day: "2-digit", month: "short" })}</div>
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>{new Date(r.demande_le).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="text-center py-3">
                        <span className="badge rounded-pill px-3 py-1 fw-semibold"
                          style={{ background: resaCfg.light, color: resaCfg.text, fontSize: "0.7rem" }}>
                          {resaCfg.label}
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <span className="badge rounded-pill px-2 py-1"
                          style={{ background: trajetCfg.light, color: trajetCfg.text, fontSize: "0.68rem" }}>
                          {trajetCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-2 text-muted text-end" style={{ fontSize: "0.75rem", borderTop: "1px solid #f0f0f0" }}>
          {filtered.length} réservation(s) affichée(s)
        </div>
      </div>
    </>
  );
}

// ─── Section : Signalements ────────────────────────────────────────────────────
function SectionSignalements({ token, showToast }) {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState("");
  const [updating, setUpdating] = useState(null);

  const fetchSignalements = useCallback(async () => {
    try {
      setLoading(true);
      const params = filterStatut ? `?statut=${filterStatut}` : "";
      const res = await fetch(`/admin/signalements${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSignalements(data.signalements || []);
    } catch { showToast("Erreur chargement signalements.", "danger"); }
    finally { setLoading(false); }
  }, [token, filterStatut, showToast]);

  useEffect(() => { fetchSignalements(); }, [fetchSignalements]);

  const updateStatut = async (id, statut) => {
    try {
      setUpdating(id);
      const res = await fetch(`/admin/signalements/${id}/statut`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) { showToast("Erreur mise à jour.", "danger"); return; }
      showToast("Statut mis à jour.", "success");
      fetchSignalements();
    } catch { showToast("Erreur réseau.", "danger"); }
    finally { setUpdating(null); }
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h5 className="fw-bold mb-0" style={{ fontSize: "1rem" }}>Signalements</h5>
          <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>Signalements soumis par les utilisateurs</p>
        </div>
        <select
          className="form-select rounded-3"
          style={{ width: "auto", fontSize: "0.82rem" }}
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="TRAITE">Traité</option>
          <option value="REJETE">Rejeté</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success" /></div>
      ) : signalements.length === 0 ? (
        <div className="text-center py-5 rounded-4 bg-white shadow-sm">
          <i className="bi bi-flag text-success" style={{ fontSize: "2.5rem", opacity: 0.3 }} />
          <p className="mt-3 fw-semibold mb-1">Aucun signalement</p>
        </div>
      ) : (
        <div className="rounded-4 bg-white shadow-sm overflow-hidden">
          <div style={{ height: 3, background: "linear-gradient(90deg,#dc3545,#fd7e14)" }} />
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: "#f8f9fa", fontSize: "0.75rem" }}>
                <tr>
                  <th className="px-4 py-3 fw-semibold text-muted">Date</th>
                  <th className="px-3 py-3 fw-semibold text-muted">Signaleur</th>
                  <th className="px-3 py-3 fw-semibold text-muted">Type</th>
                  <th className="px-3 py-3 fw-semibold text-muted">Motif</th>
                  <th className="px-3 py-3 fw-semibold text-muted">Description</th>
                  <th className="px-3 py-3 fw-semibold text-muted text-center">Statut</th>
                  <th className="px-3 py-3 fw-semibold text-muted text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {signalements.map((s) => {
                  const cfg = SIGNAL_STATUT_CFG[s.statut] || SIGNAL_STATUT_CFG.EN_ATTENTE;
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-3">
                        <div style={{ fontSize: "0.78rem" }}>{new Date(s.cree_le).toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div className="text-muted" style={{ fontSize: "0.7rem" }}>{new Date(s.cree_le).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="fw-semibold" style={{ fontSize: "0.82rem" }}>{s.signaleur_prenom} {s.signaleur_nom}</div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>{s.signaleur_email}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="badge rounded-pill px-2 py-1"
                          style={{ background: s.type === "TRAJET" ? "#0d6efd18" : "#dc354518", color: s.type === "TRAJET" ? "#0d6efd" : "#dc3545", fontSize: "0.7rem" }}>
                          <i className={`bi ${s.type === "TRAJET" ? "bi-map" : "bi-person"} me-1`} />{s.type}
                        </span>
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: "0.82rem" }}>{s.motif}</td>
                      <td className="px-3 py-3 text-muted" style={{ fontSize: "0.78rem", maxWidth: 180 }}>
                        {s.description || <em>—</em>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="badge rounded-pill px-3 py-1 fw-semibold"
                          style={{ background: cfg.light, color: cfg.text, fontSize: "0.7rem" }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          {s.statut !== "TRAITE" && (
                            <button
                              className="btn btn-sm rounded-3"
                              style={{ background: "#d1e7dd", color: "#0f5132", fontSize: "0.72rem", padding: "3px 10px" }}
                              disabled={updating === s.id}
                              onClick={() => updateStatut(s.id, "TRAITE")}
                            >
                              <i className="bi bi-check-lg me-1" />Traité
                            </button>
                          )}
                          {s.statut !== "REJETE" && (
                            <button
                              className="btn btn-sm rounded-3"
                              style={{ background: "#f8d7da", color: "#842029", fontSize: "0.72rem", padding: "3px 10px" }}
                              disabled={updating === s.id}
                              onClick={() => updateStatut(s.id, "REJETE")}
                            >
                              <i className="bi bi-x-lg me-1" />Rejeter
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-muted text-end" style={{ fontSize: "0.75rem", borderTop: "1px solid #f0f0f0" }}>
            {signalements.length} signalement(s)
          </div>
        </div>
      )}
    </>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [toast, setToast] = useState({ show: false, text: "", type: "success" });
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile

  const showToast = useCallback((text, type = "success") => {
    setToast({ show: true, text, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3500);
  }, []);

  useEffect(() => {
    document.body.dataset.bsTheme = "light";
    const fetchStats = async () => {
      try {
        const res = await fetch("/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { navigate("/"); return; }
        setStats(await res.json());
      } catch { showToast("Erreur chargement stats.", "danger"); }
      finally { setLoadingStats(false); }
    };
    fetchStats();
  }, [token, navigate, showToast]);

  const sectionTitles = {
    dashboard:    { icon: "bi-speedometer2",  title: "Tableau de bord",  sub: "Vue d'ensemble de la plateforme" },
    utilisateurs: { icon: "bi-people-fill",   title: "Utilisateurs",     sub: "Gérer les comptes et les rôles" },
    trajets:      { icon: "bi-map-fill",       title: "Trajets",          sub: "Consulter et modérer les trajets" },
    reservations: { icon: "bi-bookmark-fill", title: "Réservations",     sub: "Consulter toutes les réservations" },
    signalements: { icon: "bi-flag-fill",     title: "Signalements",     sub: "Gérer les signalements utilisateurs" },
  };
  const current = sectionTitles[activeSection];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f4f6f8" }}>

      {/* ── Sidebar desktop ── */}
      <aside
        style={{
          width: 240, flexShrink: 0,
          background: "linear-gradient(180deg,#0f4c2a 0%,#198754 60%,#20c374 100%)",
          display: "flex", flexDirection: "column",
          boxShadow: "2px 0 12px rgba(0,0,0,.18)",
          transition: "transform .25s",
          zIndex: 100,
        }}
        className="d-none d-md-flex"
      >
        {/* Logo */}
        <div style={{ padding: "24px 20px 16px" }}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="rounded-circle bg-white d-flex align-items-center justify-content-center"
              style={{ width: 38, height: 38, flexShrink: 0 }}>
              <i className="bi bi-shield-fill" style={{ color: "#198754", fontSize: "1.1rem" }} />
            </div>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: "0.95rem", lineHeight: 1.1 }}>CampusRide</div>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,.65)", letterSpacing: ".5px" }}>ADMIN PANEL</div>
            </div>
          </div>
        </div>

        {/* Admin info */}
        {currentUser && (
          <div style={{ margin: "0 12px 16px", padding: "10px 12px", background: "rgba(255,255,255,.12)", borderRadius: 10 }}>
            <div className="d-flex align-items-center gap-2">
              <Avatar prenom={currentUser.prenom} nom={currentUser.nom} size={28} />
              <div>
                <div className="text-white fw-semibold" style={{ fontSize: "0.78rem", lineHeight: 1.1 }}>
                  {currentUser.prenom} {currentUser.nom}
                </div>
                <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,.6)" }}>Administrateur</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0 10px" }}>
          {NAV_ITEMS.map(({ id, icon, label }) => {
            const active = activeSection === id;
            return (
              <button key={id}
                onClick={() => setActiveSection(id)}
                className="w-100 border-0 d-flex align-items-center gap-3 rounded-3 mb-1"
                style={{
                  padding: "10px 14px",
                  background: active ? "rgba(255,255,255,.95)" : "transparent",
                  color: active ? "#198754" : "rgba(255,255,255,.82)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all .15s",
                }}
              >
                <i className={`bi ${icon}`} style={{ fontSize: "1rem", flexShrink: 0 }} />
                {label}
                {active && <i className="bi bi-chevron-right ms-auto" style={{ fontSize: "0.65rem" }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: "12px 10px 20px" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,.15)", marginBottom: 12 }} />
          {/* Retour à l'app — session conservée */}
          <button
            onClick={() => navigate("/passager")}
            className="w-100 border-0 d-flex align-items-center gap-3 rounded-3 mb-2"
            style={{ padding: "9px 14px", background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.82)", fontSize: "0.82rem", cursor: "pointer" }}
            title="Revenir à l'application sans se déconnecter"
          >
            <i className="bi bi-box-arrow-left" style={{ fontSize: "0.9rem" }} />
            <div className="text-start">
              <div style={{ lineHeight: 1.1 }}>Quitter l'admin</div>
              <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,.5)", marginTop: 1 }}>Session conservée</div>
            </div>
          </button>
          {/* Se déconnecter — efface la session */}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/login");
            }}
            className="w-100 border-0 d-flex align-items-center gap-3 rounded-3"
            style={{ padding: "9px 14px", background: "rgba(220,53,69,.18)", color: "#ff8fa3", fontSize: "0.82rem", cursor: "pointer" }}
            title="Se déconnecter complètement"
          >
            <i className="bi bi-power" style={{ fontSize: "0.9rem" }} />
            <div className="text-start">
              <div style={{ lineHeight: 1.1 }}>Se déconnecter</div>
              <div style={{ fontSize: "0.62rem", color: "rgba(255,143,163,.6)", marginTop: 1 }}>Fermer la session</div>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Top bar MOBILE (d-md-none) ── */}
        <header
          className="d-flex d-md-none align-items-center justify-content-between flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,#0f4c2a,#198754)",
            padding: "10px 16px",
            minHeight: 56,
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-white d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 32, height: 32 }}>
              <i className="bi bi-shield-fill" style={{ color: "#198754", fontSize: "1rem" }} />
            </div>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: "0.88rem", lineHeight: 1.1 }}>CampusRide</div>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,.65)", letterSpacing: ".5px" }}>ADMIN PANEL</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            {currentUser && (
              <div className="d-flex align-items-center gap-1" style={{ background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "4px 8px" }}>
                <Avatar prenom={currentUser.prenom} nom={currentUser.nom} size={22} />
                <span className="text-white fw-semibold" style={{ fontSize: "0.75rem" }}>{currentUser.prenom}</span>
              </div>
            )}
            <button
              onClick={() => navigate("/passager")}
              className="btn btn-sm border-0 d-flex align-items-center gap-1"
              style={{ background: "rgba(255,255,255,.15)", color: "#fff", borderRadius: 8, fontSize: "0.75rem", padding: "5px 10px" }}
              title="Quitter l'admin"
            >
              <i className="bi bi-box-arrow-left" />
              <span className="d-none d-sm-inline">Quitter</span>
            </button>
            <button
              onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }}
              className="btn btn-sm border-0 d-flex align-items-center"
              style={{ background: "rgba(220,53,69,.3)", color: "#ff8fa3", borderRadius: 8, padding: "5px 8px" }}
              title="Se déconnecter"
            >
              <i className="bi bi-power" />
            </button>
          </div>
        </header>

        {/* ── Top bar DESKTOP (d-none d-md-flex) ── */}
        <header
          className="d-none d-md-flex align-items-center justify-content-between flex-shrink-0"
          style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "0 28px", height: 60 }}
        >
          <div>
            <div className="fw-bold" style={{ fontSize: "0.95rem", lineHeight: 1.1 }}>
              <i className={`bi ${current.icon} text-success me-2`} />{current.title}
            </div>
            <div className="text-muted" style={{ fontSize: "0.72rem" }}>{current.sub}</div>
          </div>
          {stats && (
            <div className="d-none d-lg-flex gap-4 align-items-center">
              {[
                { icon: "bi-people-fill",   val: stats.total_utilisateurs, label: "Users",    color: "#198754" },
                { icon: "bi-map-fill",       val: stats.total_trajets,      label: "Trajets",  color: "#0d6efd" },
                { icon: "bi-bookmark-fill",  val: stats.total_reservations, label: "Réserv.",  color: "#6f42c1" },
              ].map(({ icon, val, label, color }) => (
                <div key={label} className="d-flex align-items-center gap-2">
                  <i className={`bi ${icon}`} style={{ color, fontSize: "0.9rem" }} />
                  <span className="fw-bold" style={{ fontSize: "0.88rem" }}>{val}</span>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* ── Titre section — mobile seulement ── */}
        <div
          className="d-flex d-md-none align-items-center gap-2 flex-shrink-0"
          style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "10px 16px" }}
        >
          <i className={`bi ${current.icon} text-success`} />
          <div>
            <div className="fw-bold" style={{ fontSize: "0.88rem", lineHeight: 1.1 }}>{current.title}</div>
            <div className="text-muted" style={{ fontSize: "0.68rem" }}>{current.sub}</div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <main style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: 80 }}
          className="p-md-4">
          {activeSection === "dashboard" && (
            <SectionDashboard stats={stats} loading={loadingStats} />
          )}
          {activeSection === "utilisateurs" && (
            <SectionUtilisateurs token={token} showToast={showToast} currentUser={currentUser} />
          )}
          {activeSection === "trajets" && (
            <SectionTrajets token={token} showToast={showToast} />
          )}
          {activeSection === "reservations" && (
            <SectionReservations token={token} showToast={showToast} />
          )}
          {activeSection === "signalements" && (
            <SectionSignalements token={token} showToast={showToast} />
          )}
        </main>
      </div>

      {/* ── Bottom tab bar MOBILE ── */}
      <nav
        className="d-flex d-md-none"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff",
          borderTop: "1px solid #e9ecef",
          zIndex: 1000,
          height: 60,
          boxShadow: "0 -2px 12px rgba(0,0,0,.08)",
        }}
      >
        {NAV_ITEMS.map(({ id, icon, label }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "none",
                background: "none",
                color: active ? "#198754" : "#6c757d",
                gap: 2,
                padding: "6px 0",
                fontSize: "0.58rem",
                fontWeight: active ? 700 : 400,
                borderTop: active ? "2.5px solid #198754" : "2.5px solid transparent",
                transition: "color .15s",
              }}
            >
              <i className={`bi ${icon}`} style={{ fontSize: "1.15rem" }} />
              {label.replace("Tableau de bord", "Tableau")}
            </button>
          );
        })}
      </nav>

      <Toast toast={toast} onClose={() => setToast((p) => ({ ...p, show: false }))} />
    </div>
  );
}
