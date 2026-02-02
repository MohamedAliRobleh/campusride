// src/pages/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme; // Bootstrap 5.3+
  }, [theme]);

  const isDark = theme === "dark";

  const heroStyle = useMemo(
  () => ({
    backgroundImage:
      'linear-gradient(to top, rgba(0,0,0,0.60), rgba(0,0,0,0.10)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuC4DE62OFAtQHYBNcfSUjBHKdszlDKoKcQ3uaJkj5-FQ-iwVjU6CdZuKJ08cSbzaVR_7IPWOQPBC7GiZKxFVPRxVey183GVFCnZm7KcHNZE_4mbgwWk-u3yk7FLNd6JzeKCm2S3GpeyKNJEbClCDmHYIR_nLnbea69hQ1o0Y0LEnLa35NzuvRPlaQV8qOOPzlzjrBtVslvUC-hooTR8jdPpB59JhlMr-3l3HNSilhHBBsaUhgDd3UYwAfY-FDS_JfgmCe_yM4RMQFY")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: 280
  }),
  []
);

  return (
    <div
      className={isDark ? "bg-dark text-light" : "bg-light text-dark"}
      style={{ minHeight: "100vh", width: "100%", overflowX: "hidden" }}
    >
      {/* Top Navbar */}
      <nav className={`sticky-top border-bottom ${isDark ? "bg-dark" : "bg-light"}`}>
        <div className="container py-3">
          <div
            className="mx-auto d-flex align-items-center justify-content-between"
            style={{ maxWidth: 1200 }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded"
                style={{
                  width: 40,
                  height: 40,
                  background: isDark ? "rgba(40,167,69,0.15)" : "rgba(25,135,84,0.12)"
                }}
              >
                <span style={{ fontSize: 18 }}>🚗</span>
              </div>
              <span className="fw-bold" style={{ letterSpacing: "-0.2px" }}>
                CampusRide
              </span>
            </div>

            <button
              type="button"
              className={`btn btn-sm ${isDark ? "btn-outline-light" : "btn-outline-dark"}`}
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="Basculer mode jour/nuit"
              title="Mode jour/nuit"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          {/* Hero */}
          <div className="rounded-4 shadow-sm border overflow-hidden" style={heroStyle}>
            <div className="p-4 p-md-5">
              <span
                className="badge text-bg-success text-uppercase fw-semibold"
                style={{ letterSpacing: 1 }}
              >
                Communauté La Cité
              </span>
            </div>
          </div>

          {/* Headline */}
          <section className="text-center mt-4">
            <h1 className="fw-bold display-6">Le covoiturage exclusif au Collège La Cité</h1>
            <p
              className={`mt-3 mx-auto ${isDark ? "text-secondary" : "text-muted"}`}
              style={{ maxWidth: 520 }}
            >
              Facilitez vos déplacements entre campus et économisez ensemble tout en restant en sécurité.
            </p>
          </section>

          {/* CTA Buttons */}
          <section className="d-flex justify-content-center mt-4">
            <div className="w-100" style={{ maxWidth: 520 }}>
              <div className="d-grid gap-3">
                <Link to="/register" className="text-decoration-none">
                  <button type="button" className="btn btn-success btn-lg w-100">
                    S&apos;inscrire maintenant
                  </button>
                </Link>

                <Link to="/login" className="text-decoration-none">
                  <button
                    type="button"
                    className={`btn btn-lg w-100 ${
                      isDark ? "btn-outline-light" : "btn-outline-success"
                    }`}
                  >
                    Se connecter
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* Why choose */}
          <section className="mt-5">
          <h3 className="text-center fw-bold mb-4">Pourquoi choisir CampusRide ?</h3>

          <div className="row g-3">
            <div className="col-12">
              <div className={`card border ${isDark ? "bg-dark text-light" : "bg-white"}`}>
                <div className="card-body d-flex gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded"
                    style={{ width: 48, height: 48, background: "rgba(25,135,84,0.12)" }}
                  >
                    <i className="bi bi-shield-check" style={{ color: "#198754", fontSize: 22 }} />
                  </div>
                  <div>
                    <h5 className="card-title mb-1 fw-bold">Sécurité</h5>
                    <p className={`card-text mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
                      Trajets réservés exclusivement à la communauté étudiante et au personnel de La Cité.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className={`card border ${isDark ? "bg-dark text-light" : "bg-white"}`}>
                <div className="card-body d-flex gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded"
                    style={{ width: 48, height: 48, background: "rgba(25,135,84,0.12)" }}
                  >
                    <i className="bi bi-cash-coin" style={{ color: "#198754", fontSize: 22 }} />
                  </div>
                  <div>
                    <h5 className="card-title mb-1 fw-bold">Économie</h5>
                    <p className={`card-text mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
                      Partagez les frais d&apos;essence et de stationnement pour réduire votre budget transport.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className={`card border ${isDark ? "bg-dark text-light" : "bg-white"}`}>
                <div className="card-body d-flex gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded"
                    style={{ width: 48, height: 48, background: "rgba(25,135,84,0.12)" }}
                  >
                    <i className="bi bi-leaf" style={{ color: "#198754", fontSize: 22 }} />
                  </div>
                  <div>
                    <h5 className="card-title mb-1 fw-bold">Écologie</h5>
                    <p className={`card-text mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
                      Réduisez l&apos;empreinte carbone du campus en limitant le nombre de voitures sur la route.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* Footer */}
          <footer className="text-center mt-5 pt-4">
            <div className="d-flex justify-content-center gap-3 small text-uppercase fw-semibold opacity-75">
              <span>Collège La Cité</span>
              <span className="opacity-50">•</span>
              <span>Ottawa, Canada</span>
            </div>
            <p className={`mt-2 small ${isDark ? "text-secondary" : "text-muted"}`}>
              © {new Date().getFullYear()} CampusRide. Tous droits réservés. Conditions d&apos;utilisation |
              Confidentialité
            </p>

            <div className="d-flex justify-content-center mt-4">
              <div className="rounded-pill" style={{ height: 8, width: 140, background: "#198754" }} />
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
