import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = useMemo(() => params.get("token") || "", [params]);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!token) {
      setError("Token manquant. Vérifie ton lien.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Mot de passe trop court (min 8 caractères).");
      return;
    }
    if (newPassword !== confirm) {
      setError("La confirmation ne correspond pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Lien invalide ou expiré.");
        setLoading(false);
        return;
      }

      setInfo(data?.message || "Mot de passe modifié avec succès.");
      setLoading(false);

      // Petit délai UX puis redirection login
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Erreur réseau/serveur.");
    }
  };

  return (
    <div className={isDark ? "bg-dark text-light" : "bg-light text-dark"} style={{ minHeight: "100vh" }}>
      <Header isDark={isDark} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />

      <main className="py-4">
        <div className="d-flex justify-content-center">
          <div className="w-100 px-3" style={{ maxWidth: 520 }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <button
                type="button"
                className={`btn btn-sm ${isDark ? "btn-outline-light" : "btn-outline-dark"}`}
                onClick={() => navigate("/login")}
                aria-label="Retour"
                title="Retour"
              >
                <i className="bi bi-arrow-left" />
              </button>

              <h2 className="m-0 fw-bold" style={{ letterSpacing: "-0.2px" }}>
                Nouveau mot de passe
              </h2>

              <span style={{ width: 34 }} />
            </div>

            <form
              onSubmit={handleReset}
              className="d-grid gap-3 p-4 rounded-4 shadow-sm border bg-dark bg-opacity-10 border-secondary"
            >
              {error && (
                <div className="alert alert-danger py-2 mb-0" role="alert">
                  {error}
                </div>
              )}

              {info && (
                <div className="alert alert-success py-2 mb-0" role="alert">
                  {info} Redirection vers connexion...
                </div>
              )}

              <div>
                <label className="form-label fw-semibold">Nouveau mot de passe</label>
                <div className="input-group input-group-lg">
                  <input
                    className="form-control"
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    className={`btn ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    aria-label="Afficher/Masquer"
                    title="Afficher/Masquer"
                  >
                    <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} />
                  </button>
                </div>
                <div className={isDark ? "text-secondary mt-2" : "text-muted mt-2"}>Minimum 8 caractères.</div>
              </div>

              <div>
                <label className="form-label fw-semibold">Confirmer</label>
                <input
                  className="form-control form-control-lg"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
                {loading ? "Validation..." : "Mettre à jour"}
              </button>

              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/login")}>
                Retour à la connexion
              </button>
            </form>

            <div style={{ height: 24 }} />
          </div>
        </div>
      </main>

      <Footer isDark={isDark} style={{ backgroundColor: "#268249 " }} />
    </div>
  );
}
