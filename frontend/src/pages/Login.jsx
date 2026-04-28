
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function Login() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);
  const [prefix, setPrefix] = useState("");
  const [domain, setDomain] = useState("@lacitec.on.ca");
  const [motDePasse, setMotDePasse] = useState("");
  const email = prefix.trim() + domain;
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountDisabled, setAccountDisabled] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!prefix.trim() || !motDePasse) {
      setError("Courriel et mot de passe obligatoires.");
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
        if (res.status === 403 && data?.error === "Compte désactivé") {
          setAccountDisabled(true);
          setLoading(false);
          return;
        }
        setError(data?.error || "Connexion impossible. Vérifiez vos informations.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setLoading(false);
if (data?.user?.role === "ADMIN") {
  navigate("/admin");

} else {
  navigate("/passager");
}
    } catch (err) {
      console.error("LOGIN FETCH ERROR:", err);
      setLoading(false);
      setError("Erreur réseau/serveur. Vérifiez que le backend est lancé.");
    }
  };

  const handleContactAdmin = async (e) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setContactLoading(true);
    setContactError("");
    try {
      const res = await fetch("/auth/contact-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message: contactMessage }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setContactSent(true);
      } else {
        setContactError(data?.error || "Erreur lors de l'envoi. Réessayez.");
      }
    } catch {
      setContactError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setContactLoading(false);
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
      <main className="py-2 py-md-4">
        <div className="d-flex justify-content-center">
          <div className="w-100 px-3" style={{ maxWidth: 480 }}>
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

            <div className="text-center mb-3">
              <div
                className="mx-auto rounded-4 d-flex align-items-center justify-content-center border"
                style={{ width: 72, height: 72, background: "rgba(25,135,84,0.12)" }}
              >
                <i className="bi bi-car-front-fill" style={{ color: "#198754", fontSize: 28 }} />
              </div>

              <h1 className="mt-2 mb-1 fw-bold fs-3">CampusRide</h1>
              <p className={isDark ? "text-secondary mb-0" : "text-muted mb-0"}>
                Le covoiturage pour La Cité
              </p>
            </div>
            {accountDisabled ? (
              <div className={`rounded-4 shadow-sm border p-4 ${isDark ? "bg-dark border-secondary" : "bg-white border-warning"}`}>
                <div style={{ height: 3, background: "linear-gradient(90deg, #dc3545, #fd7e14)", borderRadius: "4px 4px 0 0", margin: "-16px -16px 16px -16px" }} />
                <div className="text-center mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 56, height: 56, background: "rgba(220,53,69,0.12)" }}>
                    <i className="bi bi-slash-circle" style={{ color: "#dc3545", fontSize: 24 }} />
                  </div>
                  <h5 className="fw-bold mb-1">Compte désactivé</h5>
                  <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
                    Votre compte a été désactivé par l'administrateur. Envoyez un message pour demander la réactivation.
                  </p>
                </div>

                {contactSent ? (
                  <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
                    <i className="bi bi-check-circle-fill" />
                    <span>Message envoyé ! L'administrateur vous contactera par courriel.</span>
                  </div>
                ) : (
                  <form onSubmit={handleContactAdmin} className="d-grid gap-2">
                    {contactError && (
                      <div className="alert alert-danger py-2 mb-0 small" role="alert">
                        <i className="bi bi-exclamation-triangle me-1" />{contactError}
                      </div>
                    )}
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Expliquez pourquoi vous souhaitez réactiver votre compte..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-danger w-100" disabled={contactLoading || !contactMessage.trim()}>
                      {contactLoading
                        ? <><span className="spinner-border spinner-border-sm me-2" />Envoi...</>
                        : <><i className="bi bi-envelope me-2" />Contacter l'administrateur</>}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  className={`btn btn-link btn-sm p-0 mt-3 w-100 text-center ${isDark ? "text-secondary" : "text-muted"}`}
                  onClick={() => { setAccountDisabled(false); setContactSent(false); setContactMessage(""); setContactError(""); }}
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="d-grid gap-3 p-4 rounded-4 shadow-sm border bg-dark bg-opacity-10 border-secondary">
              {error && (
                <div className="alert alert-danger py-2 mb-0" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label className="form-label fw-semibold">Courriel institutionnel</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="votre.nom ou 123456"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    className={`btn btn-sm fw-semibold px-2 ${domain === "@lacitec.on.ca" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setDomain("@lacitec.on.ca")}
                    style={{ fontSize: "0.75rem" }}
                  >
                    @lacitec.on.ca
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm fw-semibold px-2 ${domain === "@collegelacite.ca" ? "btn-success" : "btn-outline-success"}`}
                    onClick={() => setDomain("@collegelacite.ca")}
                    style={{ fontSize: "0.75rem" }}
                  >
                    @collegelacite.ca
                  </button>
                </div>
                {prefix.trim() && (
                  <div className="mt-1 text-muted" style={{ fontSize: "0.78rem" }}>
                    <i className="bi bi-envelope me-1" />{email}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label fw-semibold">Mot de passe</label>
                <div className="input-group">
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
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={() => navigate("/forgot-password")}
                >
                  Mot de passe oublié ?
                </button>

              </div>

              <button type="submit" className="btn btn-success w-100" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
            )}

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
        style={{ backgroundColor: "#268249 " }}
      />

    </div>
  );
}