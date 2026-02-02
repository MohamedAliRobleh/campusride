import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Register() {
  const navigate = useNavigate();

  // Thème (même logique que ton Login)
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  // Form
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirm, setConfirm] = useState("");

  // UI
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validateEmailDomain(value) {
    const v = String(value || "").trim().toLowerCase();
    const at = v.lastIndexOf("@");
    if (at === -1) return false;
    const domain = v.slice(at + 1);
    return domain === "lacite.on.ca" || domain === "collegelacite.ca";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!prenom || !nom || !email || !motDePasse || !confirm) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (!validateEmailDomain(email)) {
      setError("Veuillez utiliser un courriel institutionnel (@lacite.on.ca ou @collegelacite.ca).");
      return;
    }

    if (motDePasse.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (motDePasse !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!terms) {
      setError("Vous devez accepter les conditions d’utilisation.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prenom,
    nom,
    email,
    motDePasse
  })
});
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setError(data?.error || `Erreur serveur (${res.status})`);
        return;
      }

      if (!data?.utilisateur) {
        setError("Réponse serveur invalide (utilisateur manquant).");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.utilisateur));
      navigate("/passager");
    } catch (err) {
      console.error(err);
      setError(`Erreur réseau: ${err?.message || "inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={isDark ? "bg-dark text-light" : "bg-light text-dark"} style={{ minHeight: "100vh" }}>
      <div className="d-flex justify-content-center">
        <div className="w-100 px-3" style={{ maxWidth: 520 }}>
          {/* Top bar */}
          <div className="d-flex align-items-center justify-content-between pt-3 pb-2 sticky-top">
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

            <button
              type="button"
              className={`btn btn-sm ${isDark ? "btn-outline-light" : "btn-outline-dark"}`}
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="Basculer mode jour/nuit"
              title="Mode jour/nuit"
            >
              <i className={`bi ${isDark ? "bi-sun-fill" : "bi-moon-stars-fill"}`} />
            </button>
          </div>

          <main className="py-4">
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
          </main>
        </div>
      </div>
    </div>
  );
}
