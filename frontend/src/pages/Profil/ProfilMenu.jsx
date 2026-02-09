import { useLocation, useNavigate } from "react-router-dom";

export default function ProfilMenu({ isDark, user }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const userName = user?.prenom || user?.nom || "Utilisateur";
  const email = user?.email || "";
  const initial = (userName?.charAt(0) || "U").toUpperCase();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (to) => {
    // ✅ gère /profil (index), /profil/infos, et la route exacte
    if (to === "/profil") return pathname === "/profil" || pathname === "/profil/infos";
    return pathname === to;
  };

  const MenuItem = ({ to, icon, label }) => {
    const active = isActive(to);

    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        className="w-100 btn text-start d-flex align-items-center justify-content-between px-3 py-3 border-0"
        style={{
          borderRadius: 12,
          backgroundColor: active ? "#198754" : "transparent",
          color: active ? "#fff" : "inherit",
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <i
            className={`bi ${icon}`}
            style={{
              fontSize: 18,
              color: active ? "#fff" : "#198754",
              width: 22,
            }}
          />
          <span className="fw-semibold">{label}</span>
        </div>

        <i className={`bi bi-chevron-right ${active ? "" : "text-muted"}`} />
      </button>
    );
  };

  return (
    // ✅ flex column pour pousser “Déconnexion” en bas
    <div className="d-flex flex-column h-100">
      {/* Haut (profil) */}
      <div>
        <div className="text-center mb-3">
          <div className="position-relative d-inline-block">
            <div
              className="rounded-circle border d-flex align-items-center justify-content-center mx-auto"
              style={{
                width: 84,
                height: 84,
                fontSize: 28,
                fontWeight: 700,
                color: "#198754",
                background: isDark ? "rgba(25,135,84,0.08)" : "rgba(25,135,84,0.10)",
              }}
            >
              {initial}
            </div>

            <button
              type="button"
              className={`btn btn-sm ${isDark ? "btn-outline-light" : "btn-light"} border position-absolute`}
              style={{ right: -6, bottom: -6, borderRadius: 999 }}
              title="Changer la photo"
            >
              <i className="bi bi-camera" />
            </button>
          </div>

          <div className="mt-2 fw-bold">{userName}</div>
          <div className={isDark ? "text-secondary small" : "text-muted small"}>{email}</div>
          <div className={isDark ? "text-secondary small" : "text-muted small"}>Aucune évaluation</div>
        </div>

        <div className="row text-center g-2 mb-3">
          <div className="col-6">
            <div className="small fw-semibold">Compte passager</div>
            <div className={isDark ? "text-secondary small" : "text-muted small"}>Actif</div>
          </div>
          <div className="col-6">
            <div className="small fw-semibold">Compte conducteur</div>
            <div className={isDark ? "text-secondary small" : "text-muted small"}>Selon voiture</div>
          </div>
        </div>

        <div className="d-grid gap-2">
          <MenuItem to="/profil" icon="bi-person" label="Mes informations" />
          <MenuItem to="/profil/voitures" icon="bi-car-front" label="Mes voitures" />
          <MenuItem to="/profil/parametres" icon="bi-gear" label="Paramètres" />
        </div>
      </div>

      {/* ✅ Déconnexion collée en bas */}
      <div className="mt-auto pt-3">
      <hr className={isDark ? "border-secondary" : ""} />
      <button
        type="button"
        className={`btn w-100 fw-semibold ${isDark ? "btn-outline-light" : "btn-outline-danger"}`}
        onClick={logout}
      >
        <i className="bi bi-box-arrow-right me-2" />
        Déconnexion
      </button>
    </div>
  </div>
);
}
