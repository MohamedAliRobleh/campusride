// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Login() {
  const navigate = useNavigate();

  // ===== Theme (comme avant) =====
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  // ===== Form states (garde ta logique) =====
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== Submit (exemple) =====
 const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !motDePasse) {
      setError("Email et mot de passe obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Connexion impossible. Vérifiez vos informations.");
        setLoading(false);
        return;
      }

      // data = { message, user, token }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setLoading(false);
      navigate("/passager"); // ou "/dashboard"
    } catch (err) {
      console.error("LOGIN FETCH ERROR:", err);
      setLoading(false);
      setError("Erreur réseau/serveur. Vérifiez que le backend est lancé.");
    }
  };

  return (
    <div className={isDark ? "bg-dark text-light" : "bg-light text-dark"} style={{ minHeight: "100vh" }}>
      {/* ================= HEADER (réutilisable) ================= */}
      <Header
        isDark={isDark}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      {/* ================= MAIN ================= */}
      <main className="py-4">
        <div className="d-flex justify-content-center">
          <div className="w-100 px-3" style={{ maxWidth: 520 }}>
            {/* Header spécifique à la page Login (retour + titre) */}
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

              <h2 className="m-0 fw-bold" style={{ letterSpacing: "-0.2px" }}>
                Connexion
              </h2>

              {/* Pour garder le titre bien centré */}
              <span style={{ width: 34 }} />
            </div>

            {/* ✅ Ton bloc logo/intro identique */}
            <div className="text-center mb-4">
              <div
                className="mx-auto rounded-4 d-flex align-items-center justify-content-center border"
                style={{ width: 96, height: 96, background: "rgba(25,135,84,0.12)" }}
              >
                <i className="bi bi-car-front-fill" style={{ color: "#198754", fontSize: 34 }} />
              </div>

              <h1 className="mt-3 mb-1 fw-bold">CampusRide</h1>
              <p className={isDark ? "text-secondary mb-0" : "text-muted mb-0"}>
                Le covoiturage pour La Cité
              </p>
            </div>

            {/* ✅ Formulaire identique */}
            <form onSubmit={handleSubmit}  className="d-grid gap-3 p-4 rounded-4 shadow-sm border bg-dark bg-opacity-10 border-secondary">
              {error && (
                <div className="alert alert-danger py-2 mb-0" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label className="form-label fw-semibold">Courriel institutionnel</label>
                <input
                  className="form-control form-control-lg"
                  type="email"
                  placeholder="nom@lacite.on.ca"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="form-label fw-semibold">Mot de passe</label>
                <div className="input-group input-group-lg">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    className={`btn ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Afficher/Masquer le mot de passe"
                    title="Afficher/Masquer"
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
                  </button>
                </div>
              </div>

              <div className="text-end">
                <button type="button" className="btn btn-link p-0">
                  Mot de passe oublié ?
                </button>
              </div>

              <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className={isDark ? "text-secondary" : "text-muted"}>Pas encore de compte ?</span>
              <Link className="ms-2 fw-bold text-success text-decoration-none" to="/register">
                Créer un compte
              </Link>
            </div>

            <div style={{ height: 24 }} />
          </div>
        </div>
      </main>

      {/* ================= FOOTER (réutilisable) ================= */}
      <Footer
        isDark={isDark}
        style={{ backgroundColor: "#8ac55a" }}
      />

    </div>
  );
}