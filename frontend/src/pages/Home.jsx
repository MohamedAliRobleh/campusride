// src/pages/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ImageHome from "../assets/collegelacite.jpg";
import Header from "../components/Header.jsx"

export default function Home() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  const isDark = theme === "dark";

  const heroStyle = useMemo(
    () => ({
      backgroundImage: `linear-gradient(to top, rgba(27, 26, 26, 0.6), rgba(0,0,0,0.10)), url(${ImageHome})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "clamp(120px, 18vh, 280px)",
    }),
    []
  );

  return (
    <div
      className={isDark ? "bg-dark text-light" : "bg-light text-dark"}
      style={{ minHeight: "100vh", width: "100%", overflowX: "hidden" }}
    >
      {/* ================= HEADER ================= */}
      <Header
        isDark={isDark}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />
      {/* ================= MAIN ================= */}
      <main className="container py-2 py-md-4">
        <div className="mx-auto">
          {/* Hero */}
          <section className="rounded-4 shadow-sm border overflow-hidden" style={heroStyle}>
            <div className="p-4 p-md-5">
              <span
                className="badge text-bg-success text-uppercase fw-semibold"
                style={{ letterSpacing: 1 }}
              >
                Communauté La Cité
              </span>
            </div>
          </section>

          {/* Headline */}
          <section className="text-center mt-3 mt-md-4">
            <h1 className="fw-bold fs-3 fs-md-2 fs-lg-1">Le covoiturage exclusif au Collège La Cité</h1>
            <p
              className={`mt-2 mx-auto small ${isDark ? "text-secondary" : "text-muted"}`}
              style={{ maxWidth: 480 }}
            >
              Facilitez vos déplacements entre campus et économisez ensemble tout en restant en sécurité.
            </p>
          </section>

          {/* CTA Buttons */}
          <section className="d-flex justify-content-center mt-3">
            <div className="w-100" style={{ maxWidth: 440 }}>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Link to="/register" className="text-decoration-none flex-fill">
                  <button type="button" className="btn btn-success w-100">
                    S&apos;inscrire maintenant
                  </button>
                </Link>

                <Link to="/login" className="text-decoration-none flex-fill">
                  <button
                    type="button"
                    className={`btn w-100 ${isDark ? "btn-outline-light" : "btn-outline-success"}`}
                  >
                    Se connecter
                  </button>
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-3 mt-md-4">
            <h3 className="text-center fw-bold mb-3 fs-5">Pourquoi choisir CampusRide ?</h3>

            <div className="row g-2 g-md-3">
              <div className="col-12 col-md-4">
                <div className={`card border ${isDark ? "bg-dark text-light" : "bg-white"}`}>
                  <div className="card-body d-flex gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                      style={{ width: 40, height: 40, background: "rgba(25,135,84,0.12)" }}
                    >
                      <i className="bi bi-shield-check" style={{ color: "#198754", fontSize: 18 }} />
                    </div>
                    <div>
                      <h5 className="card-title mb-1 fw-bold fs-6">Sécurité</h5>
                      <p className={`card-text mb-0 small ${isDark ? "text-secondary" : "text-muted"}`}>
                        Trajets réservés exclusivement à la communauté étudiante et au personnel de La Cité.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className={`card border ${isDark ? "bg-dark text-light" : "bg-white"}`}>
                  <div className="card-body d-flex gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                      style={{ width: 40, height: 40, background: "rgba(25,135,84,0.12)" }}
                    >
                      <i className="bi bi-cash-coin" style={{ color: "#198754", fontSize: 18 }} />
                    </div>
                    <div>
                      <h5 className="card-title mb-1 fw-bold fs-6">Économie</h5>
                      <p className={`card-text mb-0 small ${isDark ? "text-secondary" : "text-muted"}`}>
                        Partagez les frais d&apos;essence et de stationnement pour réduire votre budget transport.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className={`card border ${isDark ? "bg-dark text-light" : "bg-white"}`}>
                  <div className="card-body d-flex gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded flex-shrink-0"
                      style={{ width: 40, height: 40, background: "rgba(25,135,84,0.12)" }}
                    >
                      <i className="bi bi-leaf" style={{ color: "#198754", fontSize: 18 }} />
                    </div>
                    <div>
                      <h5 className="card-title mb-1 fw-bold fs-6">Écologie</h5>
                      <p className={`card-text mb-0 small ${isDark ? "text-secondary" : "text-muted"}`}>
                        Réduisez l&apos;empreinte carbone du campus en limitant le nombre de voitures sur la route.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="text-center mt-3 mt-md-5 pt-3 pb-2">
        <div className="d-flex justify-content-center gap-3 small text-uppercase fw-semibold opacity-75">
          <span>Collège La Cité</span>
          <span className="opacity-50">•</span>
          <span>Ottawa, Canada</span>
        </div>

        <p className={`mt-2 small ${isDark ? "text-secondary" : "text-muted"}`}>
          © {new Date().getFullYear()} CampusRide. Tous droits réservés.
        </p>

        <div className="d-flex justify-content-center mt-2">
          <div className="rounded-pill" style={{ height: 4, width: 80, background: "#198754" }} />
        </div>
      </footer>
    </div>
  );
}
