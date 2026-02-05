// src/pages/Passager/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import HeaderPrivate from "../../components/HeaderPrivate.jsx";


export default function Dashboard() {
  const navigate = useNavigate();

  // ===== Theme (identique à Login.jsx) =====
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  // ===== user (optionnel) =====
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // ===== Hero image (URL conservée) =====
  const heroImg =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCNs7aTIYts1akY-gqVVZ6yGYVoda9yXu4T66Wg06pJCv5__XmCD2KKqTV4fGxBl1PrUOLoIS7rQOnnte_RerZfo2sW5nE1pvY-q-tPHqPLjxItMOyuXXDqfSMW3IAEc0HfmhyqzBh6-0CoU9Z57CT-NaQ_WdrjyWAnrinRJo9PMVSfJcBCpVCCwZW-sFZN6EeK9BYoLywO_vajRmyUcq024B5BvhuQO1WtoSHTyTKY-ozBgkm5Q7Kunolc-OGL8J_jPvdS-LCITf4";

  // ===== Form recherche =====
  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [dateLabel, setDateLabel] = useState("Aujourd'hui");

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/passager/rechercher", { state: { depart, destination, dateLabel } });
  };

  const trips = useMemo(
    () => [
      {
        id: "t1",
        depart: "Orléans",
        destination: "Campus",
        heureDepart: "08:30",
        heureArrivee: "09:05",
        badge: { text: "Disponible", variant: "success" },
        conducteur: "Marc Lemieux",
        note: "4.8",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuA0ygwXPN_m-JdTjdmg-zi-uUYHLuYIvuIAHvAU9xao5Vut28im2Wpho3t_mBl81tzGtPjeKTzHrTQHX5aEnA4-DPgmPhhvE5wuQy4beEp6D_bkvSMdDIkZeH4mznwBFKT1wGqWSzMNFWTh2jho3FVRbQGh9JLqHyWEkR5OKe_CpXmEhvQZqes9Vj24_qXE64hibJR34s6VJl8pnV6u8HSsAwE_tIS6JKlcZEbt0woKLCx-3GIWUTdigwI7WexkL2KJ7JooTUTBd4c",
      },
      {
        id: "t2",
        depart: "Gatineau",
        destination: "Pavillon",
        heureDepart: "10:15",
        heureArrivee: "10:45",
        badge: { text: "3 places", variant: "warning" },
        conducteur: "Sarah Tremblay",
        note: "5.0",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCNs7aTIYts1akY-gqVVZ6yGYVoda9yXu4T66Wg06pJCv5__XmCD2KKqTV4fGxBl1PrUOLoIS7rQOnnte_RerZfo2sW5nE1pvY-q-tPHqPLjxItMOyuXXDqfSMW3IAEc0HfmhyqzBh6-0CoU9Z57CT-NaQ_WdrjyWAnrinRJo9PMVSfJcBCpVCCwZW-sFZN6EeK9BYoLywO_vajRmyUcq024B5BvhuQO1WtoSHTyTKY-ozBgkm5Q7Kunolc-OGL8J_jPvdS-LCITf4",
      },
      {
        id: "t3",
        depart: "Kanata",
        destination: "Campus",
        heureDepart: "12:30",
        heureArrivee: "13:10",
        badge: { text: "2 places", variant: "warning" },
        conducteur: "Kevin Martin",
        note: "4.5",
        avatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB3tvhXJYK2MDDELct9S7lL_2lN5luhGb8rTxp2lsVOcU3VPRa2xLOnTfoqutY7BXQmwSs9pqtOt9g7z61EhOjIgJ8zSotHuK0S0wXQiMWrK3gWVrxA0wbET9gH8Gf4vW60zCCokSb6X7d9GtiLQDAoGyZroNdzqN5rT5GjTOUFN_lzI6YqGDvF7sUzAhjRRoyOYLOhgXWFUFE7Hm12_au9KiItgIRSW8u4bjU3GOMRwc1NRBvgwFgP1u2HvHrry64HbLcPM4YbEbk",
      },
    ],
    []
  );

  const badgeClass = (variant) => {
    if (variant === "warning") return "text-bg-warning";
    if (variant === "success") return "text-bg-success";
    return "text-bg-secondary";
  };

  const inputGroupTextClass = isDark ? "bg-dark text-light border-secondary" : "";
  const inputClass = isDark ? "bg-dark text-light border-secondary" : "";

  return (
    <div className={isDark ? "bg-dark text-light" : "bg-light text-dark"} style={{ minHeight: "100vh" }}>
      {/* ================= HEADER ================= */}
      <HeaderPrivate
        isDark={isDark}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      {/* ================= MAIN ================= */}
      <main className="py-4">
        <div className="container">
          {/* Titre centré global */}
          <div className="text-center mb-4">
            <h2
              className="m-0"
              style={{
                fontWeight: 600,
                letterSpacing: "-0.6px",
                fontSize: "1.9rem",
              }}
            >
              Bienvenue sur CampusRide
            </h2>
          </div>

          {/* Texte utilisateur aligné à gauche */}
          <p className={isDark ? "text-secondary mb-4" : "text-muted mb-4"}>
            {user?.prenom ? `Bonjour, ${user.prenom} 👋` : "Bienvenue sur CampusRide"}
          </p>

          {/* ✅ Layout WEB responsive :
              - Mobile: 1 colonne
              - LG+: 2 colonnes (Hero/Search à gauche, Promo + Trips à droite)
          */}
          <div className="row g-4">
            {/* LEFT (Hero + Search) */}
            <div className="col-12 col-lg-6">
              <section
                className="position-relative overflow-hidden rounded-4 border shadow-sm"
                style={{ minHeight: 420 }}
              >
                <img
                  src={heroImg}
                  alt="Winter road"
                  className="w-100 h-100 position-absolute top-0 start-0"
                  style={{ objectFit: "cover" }}
                />
                <div
                  className="position-absolute top-0 start-0 w-100 h-100"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.60) 100%)",
                  }}
                />

                <div className="position-relative p-3 p-md-4 d-flex flex-column justify-content-end h-100">
                  <h1 className="text-white fw-bold mb-3" style={{ letterSpacing: "-0.3px" }}>
                    Voyagez ensemble au Collège
                  </h1>

                  <form
                    onSubmit={handleSearch}
                    className={`p-3 rounded-4 shadow-sm border ${isDark ? "bg-dark bg-opacity-75 border-secondary" : "bg-white border-light"
                      }`}
                  >
                    <div className="row g-2">
                      <div className="col-12">
                        <div className="input-group input-group-lg">
                          <span className={`input-group-text ${inputGroupTextClass}`}>
                            <i className="bi bi-geo-alt" />
                          </span>
                          <input
                            className={`form-control ${inputClass}`}
                            placeholder="Départ"
                            value={depart}
                            onChange={(e) => setDepart(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="input-group input-group-lg">
                          <span className={`input-group-text ${inputGroupTextClass}`}>
                            <i className="bi bi-pin-map" />
                          </span>
                          <input
                            className={`form-control ${inputClass}`}
                            placeholder="Destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-7">
                        <div className="input-group input-group-lg">
                          <span className={`input-group-text ${inputGroupTextClass}`}>
                            <i className="bi bi-calendar-event" />
                          </span>
                          <input
                            className={`form-control ${inputClass}`}
                            placeholder="Aujourd'hui"
                            value={dateLabel}
                            onChange={(e) => setDateLabel(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-5 d-grid">
                        <button type="submit" className="btn btn-success btn-lg">
                          <i className="bi bi-search me-2" />
                          Rechercher
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </section>
            </div>

            {/* RIGHT (Promo + Trips) */}
            <div className="col-12 col-lg-6">
              {/* Promo */}
              <section
                className={`p-3 p-md-4 rounded-4 border shadow-sm ${isDark ? "bg-dark bg-opacity-25 border-secondary" : "bg-white"
                  }`}
              >
                <div className="d-flex gap-3 align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 72, height: 72, background: "rgba(25,135,84,0.12)" }}
                  >
                    <i className="bi bi-gift-fill" style={{ color: "#198754", fontSize: 28 }} />
                  </div>

                  <div className="flex-grow-1">
                    <h3 className="h5 fw-bold mb-1">Devenir Conducteur</h3>
                    <p className={isDark ? "text-secondary mb-3" : "text-muted mb-3"} style={{ lineHeight: 1.35 }}>
                      Partagez vos trajets en quelques clics et contribuez à une mobilité plus accessible pour la communauté étudiante de La Cité.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline-success fw-semibold"
                      onClick={() => navigate("/passager/aide")}
                    >
                      En savoir plus <i className="bi bi-arrow-right ms-1" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Trips */}
              <section className="mt-4">
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <h2 className="h4 fw-bold mb-1">Trajets populaires aujourd&apos;hui</h2>
                    <p className={isDark ? "text-secondary mb-0" : "text-muted mb-0"}>
                      Rejoignez le Collège La Cité en toute simplicité
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-link text-success text-decoration-none fw-semibold p-0"
                    onClick={() => navigate("/passager/trajets")}
                  >
                    Voir tout <i className="bi bi-chevron-right" />
                  </button>
                </div>

                <div className="d-grid gap-3 mt-3">
                  {trips.map((t) => (
                    <div
                      key={t.id}
                      className={`card border shadow-sm rounded-4 ${isDark ? "bg-dark bg-opacity-25 border-secondary" : ""
                        }`}
                    >
                      <div className="card-body p-3 p-md-4">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold fs-5">{t.heureDepart}</span>
                              <i className="bi bi-arrow-right text-success" />
                              <span className="fw-bold fs-5">{t.heureArrivee}</span>
                            </div>

                            <div className={isDark ? "text-secondary mt-1" : "text-muted mt-1"}>
                              <i className="bi bi-geo-alt me-1" />
                              {t.depart} → {t.destination}
                            </div>
                          </div>

                          {t.badge?.text ? (
                            <span className={`badge rounded-pill ${badgeClass(t.badge.variant)}`}>
                              {t.badge.text}
                            </span>
                          ) : null}
                        </div>

                        <hr className={isDark ? "border-secondary my-3" : "my-3"} />

                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle border"
                              style={{
                                width: 48,
                                height: 48,
                                backgroundImage: `url("${t.avatar}")`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            />
                            <div>
                              <div className="fw-semibold">{t.conducteur}</div>
                              <div className={isDark ? "text-secondary small" : "text-muted small"}>
                                <i className="bi bi-star-fill text-warning me-1" />
                                {t.note}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-success fw-semibold"
                            onClick={() => navigate(`/passager/trajets/${t.id}`)}
                          >
                            Réserver
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div style={{ height: 24 }} />
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <Footer isDark={isDark} style={{ backgroundColor: "#8ac55a" }} />
    </div>
  );
}
