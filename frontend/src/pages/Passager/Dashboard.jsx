import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import HeaderPrivate from "../../components/HeaderPrivate.jsx";

export default function Dashboard() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const role = user?.role;
  const isConducteur = role === "CONDUCTEUR";

  const heroImg =
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1600&auto=format&fit=crop";

  const [isSmallLaptop, setIsSmallLaptop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1200px)");
    const onChange = () => setIsSmallLaptop(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!depart.trim() || !destination.trim() || !date) return;

    navigate("/passager/search", {
      state: { depart, destination, date },
    });
  };

  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const fetchPopulaires = async () => {
      try {
        const response = await fetch("/trajets/populaires");
        const data = await response.json();
        setTrips(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPopulaires();
  }, []);

  const inputGroupTextClass = isDark ? "bg-dark text-light border-secondary" : "";
  const inputClass = isDark ? "bg-dark text-light border-secondary" : "";

  const heroHeight = isSmallLaptop
    ? "clamp(420px, 52vh, 540px)"
    : "clamp(460px, 58vh, 620px)";

  return (
    <div
      className={isDark ? "bg-dark text-light" : "bg-light text-dark"}
      style={{ minHeight: "100vh" }}
    >
      {/* ================= HEADER ================= */}
      <HeaderPrivate
        isDark={isDark}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      {/* ================= MAIN ================= */}
      <main className="py-3 py-md-4">
        <div className="container">
          <div className="text-center mb-3">
            <h2
              className="m-0"
              style={{
                fontWeight: 650,
                letterSpacing: "-0.5px",
                fontSize: "1.75rem",
              }}
            >
              Bienvenue sur CampusRide
            </h2>
          </div>

          <p className={isDark ? "text-secondary mb-3" : "text-muted mb-3"}>
            {user?.prenom ? `Bonjour, ${user.prenom} 👋` : "Bienvenue sur CampusRide"}
          </p>

          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <section className="position-relative overflow-hidden rounded-4 shadow-sm">
                {/* IMAGE BACKGROUND */}
                <div
                  style={{
                    height: heroHeight,
                    backgroundImage: `url(${heroImg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "16px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.45))",
                    }}
                    className="d-flex flex-column"
                  >
                    {/* TEXTE */}
                    <div className="text-white px-3 px-md-4 pt-4">
                      <h1 className="fw-bold mb-2" style={{ fontSize: "1.85rem" }}>
                        Voyagez ensemble au Collège
                      </h1>
                      <p className="mb-0" style={{ fontSize: "1.02rem", opacity: 0.95 }}>
                        Covoiturage étudiant simple, rapide et sécurisé
                      </p>
                    </div>

                    <div className="mt-auto px-3 px-md-4 pb-3 pb-md-4">
                      <form
                        onSubmit={handleSearch}
                        className={`p-3 rounded-4 shadow-lg border ${isDark
                            ? "bg-dark bg-opacity-75 border-secondary"
                            : "bg-white border-light"
                          }`}
                      >
                        <div className="row g-3">
                          {/* Départ */}
                          <div className="col-12">
                            <label className="small fw-semibold mb-1">Départ</label>

                            <div className="input-group">
                              <span className={`input-group-text ${inputGroupTextClass}`}>
                                <i className="bi bi-geo-alt-fill text-success" />
                              </span>

                              <input
                                className={`form-control ${inputClass}`}
                                placeholder="Ma position, Collège La Cité, 1485 Caldwell..."
                                value={depart}
                                onChange={(e) => setDepart(e.target.value)}
                              />

                              <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={() => {
                                  if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition(() => {
                                      setDepart("Ma position actuelle");
                                    });
                                  }
                                }}
                                aria-label="Utiliser GPS pour départ"
                              >
                                <i className="bi bi-crosshair"></i>
                              </button>
                            </div>

                            <div className="mt-2 d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-success-subtle text-success rounded-pill"
                                onClick={() => setDepart("Collège La Cité")}
                              >
                                📍 Collège La Cité
                              </button>
                            </div>
                          </div>

                          {/* swap */}
                          <div className="col-12 text-center">
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-circle"
                              style={{ width: 42, height: 42 }}
                              onClick={() => {
                                const temp = depart;
                                setDepart(destination);
                                setDestination(temp);
                              }}
                              aria-label="Inverser départ/destination"
                            >
                              <i className="bi bi-arrow-down-up"></i>
                            </button>
                          </div>

                          {/* Destination */}
                          <div className="col-12">
                            <label className="small fw-semibold mb-1">Destination</label>

                            <div className="input-group">
                              <span className={`input-group-text ${inputGroupTextClass}`}>
                                <i className="bi bi-pin-map-fill text-success" />
                              </span>

                              <input
                                className={`form-control ${inputClass}`}
                                placeholder="Où allez-vous ?"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                              />

                              <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={() => {
                                  if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition(() => {
                                      setDestination("Ma position actuelle");
                                    });
                                  }
                                }}
                                aria-label="Utiliser GPS pour destination"
                              >
                                <i className="bi bi-crosshair"></i>
                              </button>
                            </div>

                            <div className="mt-2 d-flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-success-subtle text-success rounded-pill"
                                onClick={() => setDestination("Collège La Cité")}
                              >
                                📍 Collège La Cité
                              </button>
                            </div>
                          </div>

                          <div className="col-12 col-md-7">
                            <label className="small fw-semibold mb-1">Date</label>
                            <div className="input-group">
                              <span className={`input-group-text ${inputGroupTextClass}`}>
                                <i className="bi bi-calendar-event" />
                              </span>
                              <input
                                type="date"
                                className={`form-control ${inputClass}`}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="col-12 col-md-5 d-grid">
                            <button
                              type="submit"
                              className="btn btn-success fw-semibold rounded-4 shadow-sm py-2"
                            >
                              <i className="bi bi-search me-2" />
                              Rechercher
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT */}
            <div className="col-12 col-lg-6">
              <section
                className={`p-3 p-md-4 rounded-4 border shadow-sm ${isDark ? "bg-dark bg-opacity-25 border-secondary" : "bg-white"
                  }`}
              >
                <div className="d-flex gap-3 align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 64, height: 64, background: "rgba(25,135,84,0.12)" }}
                  >
                    <i className="bi bi-gift-fill" style={{ color: "#198754", fontSize: 24 }} />
                  </div>

                  <div className="flex-grow-1">
                    {isConducteur ? (
                      <>
                        <h3 className="h5 fw-bold mb-1">Mes Trajets</h3>
                        <p
                          className={isDark ? "text-secondary mb-3" : "text-muted mb-3"}
                          style={{ lineHeight: 1.35 }}
                        >
                          Gérez les trajets que vous avez publiés.
                        </p>
                        <button
                          type="button"
                          className="btn btn-outline-success fw-semibold"
                          onClick={() => navigate("/conducteur/mes-trajets")}
                        >
                          Voir mes trajets <i className="bi bi-arrow-right ms-1" />
                        </button>
                      </>
                    ) : (
                      <>
                        <h3 className="h5 fw-bold mb-1">Devenir Conducteur</h3>
                        <p
                          className={isDark ? "text-secondary mb-3" : "text-muted mb-3"}
                          style={{ lineHeight: 1.35 }}
                        >
                          Partagez vos trajets en quelques clics et contribuez à une mobilité plus
                          accessible pour la communauté étudiante de La Cité.
                        </p>
                        <button
                          type="button"
                          className="btn btn-outline-success fw-semibold"
                          onClick={() => navigate("/passager/aide")}
                        >
                          En savoir plus <i className="bi bi-arrow-right ms-1" />
                        </button>
                      </>
                    )}
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
                  {trips.map((trajet) => {
                    const dateObj = new Date(trajet.dateheure_depart);

                    return (
                      <div
                        key={trajet.id}
                        className={`card border shadow-sm rounded-4 ${isDark ? "bg-dark bg-opacity-25 border-secondary" : ""
                          }`}
                      >
                        <div className="card-body p-3 p-md-4">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              {/* ✅ un peu moins gros */}
                              <div className="fw-bold fs-5 mb-1">
                                {dateObj.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>

                              <div className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                                <i className="bi bi-geo-alt-fill text-success me-1"></i>
                                {trajet.lieu_depart}
                                <span className="mx-2 text-success fw-bold">→</span>
                                {trajet.destination}
                              </div>
                            </div>

                            <div className="text-end">
                              <span className="badge rounded-pill bg-success-subtle text-success px-3 py-2">
                                <i className="bi bi-people-fill me-1"></i>
                                {trajet.places_dispo} dispo
                              </span>
                            </div>
                          </div>

                          <hr className={isDark ? "border-secondary my-3" : "my-3"} />

                          <div className="d-flex justify-content-between align-items-center">
                            <div className={`small ${isDark ? "text-secondary" : "text-muted"}`}>
                              Départ aujourd’hui
                            </div>

                            <button
                              type="button"
                              className="btn btn-success fw-semibold px-4 rounded-pill"
                              onClick={() => navigate("/passager/search")}
                            >
                              Réserver
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          <div style={{ height: 16 }} />
        </div>
      </main>

      <Footer isDark={isDark} style={{ backgroundColor: "#8ac55a" }} />
    </div>
  );
}