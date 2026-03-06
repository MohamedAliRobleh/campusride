import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../utils/auth.js";
import CropPhotoModal from "../../components/CropPhotoModal.jsx";

export default function ProfilMenu({ isDark, user, onPhotoUpdated }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/utilisateurs/me/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, [user?.id]);

  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Utilisateur";
  const email = user?.email || "";
  const initial = (user?.prenom?.[0] ?? user?.nom?.[0] ?? "U").toUpperCase();
  const photoUrl = user?.photo_url;
  const isDriver = user?.role === "CONDUCTEUR";

  // 1. Sélection du fichier → ouvre le modal de recadrage
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // 2. Après recadrage → upload du blob
  const handleCropSave = async (blob) => {
    setCropSrc(null);
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("photo", blob, "profile.jpg");
      const res = await fetch("/utilisateurs/me/photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) onPhotoUpdated?.();
    } catch (err) {
      console.error("Erreur upload photo", err);
    } finally {
      setUploading(false);
    }
  };

  const isActive = (to) => {
    if (to === "/profil") return pathname === "/profil" || pathname === "/profil/infos";
    return pathname === to;
  };

  const MenuItem = ({ to, icon, label }) => {
    const active = isActive(to);
    return (
      <button
        type="button"
        onClick={() => navigate(to)}
        className="w-100 btn text-start d-flex align-items-center justify-content-between px-3 py-2 border-0"
        style={{
          borderRadius: 10,
          backgroundColor: active ? "#198754" : "transparent",
          color: active ? "#fff" : "inherit",
          fontSize: "0.88rem",
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <i
            className={`bi ${icon}`}
            style={{ fontSize: 17, color: active ? "#fff" : "#198754", width: 20 }}
          />
          <span className="fw-semibold">{label}</span>
        </div>
        <i className={`bi bi-chevron-right small ${active ? "text-white" : "text-muted"}`} />
      </button>
    );
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* ── Avatar + infos ── */}
      <div className="text-center mb-3">
        <div className="position-relative d-inline-block mb-2">
          {/* Photo ou initiales */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Photo de profil"
              className="rounded-circle border"
              style={{ width: 84, height: 84, objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
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
          )}

          {/* Bouton caméra */}
          <button
            type="button"
            className={`btn btn-sm border position-absolute d-flex align-items-center justify-content-center p-0 ${isDark ? "btn-dark" : "btn-white"}`}
            style={{ right: -4, bottom: -4, borderRadius: 999, width: 28, height: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
            title="Changer la photo"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading
              ? <span className="spinner-border spinner-border-sm text-success" style={{ width: 12, height: 12 }} />
              : <i className="bi bi-camera-fill text-success" style={{ fontSize: "0.7rem" }} />
            }
          </button>

          {/* Input fichier caché */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="d-none"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="fw-bold" style={{ fontSize: "0.95rem" }}>{fullName}</div>
        <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>{email}</div>

        {/* Badge rôle */}
        <div className="mt-1">
          <span
            className="badge rounded-pill px-2 py-1"
            style={{
              fontSize: "0.68rem",
              background: isDriver ? "rgba(25,135,84,0.12)" : "rgba(108,117,125,0.12)",
              color: isDriver ? "#198754" : "#6c757d",
            }}
          >
            <i className={`bi ${isDriver ? "bi-car-front-fill" : "bi-person-fill"} me-1`} />
            {isDriver ? "Conducteur" : "Passager"}
          </span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={`rounded-3 p-2 mb-3 text-center ${isDark ? "bg-dark border border-secondary" : "bg-light"}`}>
        <div className="row g-0">
          <div className="col-4 border-end">
            <div className="fw-bold" style={{ fontSize: "1rem", color: "#198754" }}>
              {stats ? (Number(stats.trajets_conduits) + Number(stats.trajets_passager)) : "—"}
            </div>
            <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.65rem" }}>Trajets</div>
          </div>
          <div className="col-4 border-end">
            <div className="fw-bold" style={{ fontSize: "1rem", color: "#198754" }}>
              {stats?.note_moyenne ? `${stats.note_moyenne}★` : "—"}
            </div>
            <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.65rem" }}>Note</div>
          </div>
          <div className="col-4">
            <div className="fw-bold" style={{ fontSize: "1rem", color: "#198754" }}>
              {stats ? Number(stats.nb_evaluations) : "—"}
            </div>
            <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.65rem" }}>Avis</div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="d-grid gap-1">
        <MenuItem to="/profil" icon="bi-person" label="Mes informations" />
        <MenuItem to="/profil/voitures" icon="bi-car-front" label="Mon véhicule" />
        <MenuItem to="/profil/parametres" icon="bi-gear" label="Paramètres" />
      </div>

      {/* ── Déconnexion ── */}
      <div className="mt-auto pt-3">
        <hr className={isDark ? "border-secondary" : ""} />
        <button
          type="button"
          className="btn w-100 fw-semibold btn-outline-danger rounded-3"
          style={{ fontSize: "0.88rem" }}
          onClick={() => logout(navigate)}
        >
          <i className="bi bi-box-arrow-right me-2" />
          Déconnexion
        </button>
      </div>

      {/* Modal de recadrage photo profil */}
      {cropSrc && (
        <CropPhotoModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onClose={() => setCropSrc(null)}
          isDark={isDark}
          circular={true}
          title="Recadrer la photo de profil"
        />
      )}
    </div>
  );
}
