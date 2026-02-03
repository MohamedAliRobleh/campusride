// src/pages/Register.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Register() {
  const navigate = useNavigate();

  // ===== Theme (comme avant) =====
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  // ===== Form states (garde ta logique) =====
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== Submit (exemple) =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // TODO: ta validation / API
    setLoading(true);
    try {
      // await register(...)
      setLoading(false);
      navigate("/login");
    } catch (err) {
      setLoading(false);
      setError("Inscription impossible. Vérifiez les informations.");
    }
  };

  return (
    <div className={isDark ? "bg-dark text-light" : "bg-light text-dark"} style={{ minHeight: "100vh" }}>
      {/* ================= HEADER ================= */}
      <Header
        isDark={isDark}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      {/* ================= MAIN ================= */}
      <main className="py-4">
        <div className="d-flex justify-content-center">
          <div className="w-100 px-3" style={{ maxWidth: 520 }}>
            {/* Bandeau spécifique Register (retour + titre) */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <button
                type="button"
                className={`btn btn-sm ${isDark ? "btn-outline-light" : "btn-outline-dark"}`}
                onClick={() => navigate("/")}
                aria-label="Retour"
                title="Retour"
              >
                <i className="bi bi-arrow-left" />
              </button>

              <h2 className="m-0 fw-bold">Inscription</h2>

              {/* espace pour garder le titre centré */}
              <span style={{ width: 34 }} />
            </div>

            {/* Brand */}
            <div className="text-center mb-4">
              <div
                className="mx-auto rounded-4 d-flex align-items-center justify-content-center border"
                style={{ width: 96, height: 96, background: "rgba(25,135,84,0.12)" }}
              >
                <i className="bi bi-person-plus-fill" style={{ color: "#198754", fontSize: 34 }} />
              </div>

              <h1 className="mt-3 mb-1 fw-bold">Créer un compte</h1>
              <p className={isDark ? "text-secondary mb-0" : "text-muted mb-0"}>
                @lacite.on.ca ou @collegelacite.ca
              </p>
            </div>

            <form onSubmit={handleSubmit} className="d-grid gap-3">
              {error && (
                <div className="alert alert-danger py-2 mb-0" role="alert">
                  {error}
                </div>
              )}

              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label fw-semibold">Prénom</label>
                  <input
                    className="form-control form-control-lg"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="Ex: Mohamed"
                    autoComplete="given-name"
                  />
                </div>

                <div className="col-6">
                  <label className="form-label fw-semibold">Nom</label>
                  <input
                    className="form-control form-control-lg"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Ex: Robleh"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="form-label fw-semibold">Courriel institutionnel</label>
                <input
                  className="form-control form-control-lg"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@lacite.on.ca"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="form-label fw-semibold">Mot de passe</label>
                <div className="input-group input-group-lg">
                  <input
                    className="form-control"
                    type={showPass ? "text" : "password"}
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                  />
                  <button
                    className={`btn ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label="Afficher/Masquer le mot de passe"
                    title="Afficher/Masquer"
                  >
                    <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label fw-semibold">Confirmer le mot de passe</label>
                <div className="input-group input-group-lg">
                  <input
                    className="form-control"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirmez votre mot de passe"
                    autoComplete="new-password"
                  />
                  <button
                    className={`btn ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label="Afficher/Masquer la confirmation"
                    title="Afficher/Masquer"
                  >
                    <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`} />
                  </button>
                </div>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="terms"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="terms">
                  J’accepte les conditions d’utilisation.
                </label>
              </div>

              <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
                {loading ? "Inscription..." : "S’inscrire"}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className={isDark ? "text-secondary" : "text-muted"}>Déjà un compte ?</span>
              <Link className="ms-2 fw-bold text-success text-decoration-none" to="/login">
                Se connecter
              </Link>
            </div>

            <div style={{ height: 24 }} />
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <Footer isDark={isDark} />
    </div>
  );
}
