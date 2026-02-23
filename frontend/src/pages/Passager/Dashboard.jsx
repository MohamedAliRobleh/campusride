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

  // ===== Form recherche =====
  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");


  const handleSearch = (e) => {
    e.preventDefault();

    
    if (!depart.trim() || !destination.trim() || !date) {
      return; // on ne fait rien
    }

    navigate("/passager/search", {
      state: { depart, destination, date }
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

          <p className={isDark ? "text-secondary mb-4" : "text-muted mb-4"}>
            {user?.prenom ? `Bonjour, ${user.prenom} 👋` : "Bienvenue sur CampusRide"}
          </p>

          <div className="row g-4">
            {/* LEFT (Hero + Search Premium) */}
            <div className="col-12 col-lg-6">

              <section className="position-relative overflow-hidden rounded-4 shadow-sm">

                {/* IMAGE BACKGROUND */}
                <div
                  style={{
                    height: "75vh",
                    backgroundImage: `url(${heroImg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "16px"
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "16px",
                      background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.45))"
                    }}
                    className="d-flex flex-column justify-content-start"
                  >

                    {/* TEXTE PLUS HAUT */}
                    <div className="text-white px-4 pt-5 mt-3">
                      <h1 className="fw-bold mb-2" style={{ fontSize: "2.2rem" }}>
                        Voyagez ensemble au Collège
                      </h1>
                      <p className="lead mb-0">
                        Covoiturage étudiant simple, rapide et sécurisé
                      </p>
                    </div>

                    <div className="mt-auto px-4 pb-4">
                      <form
                        onSubmit={handleSearch}
                        className={`p-4 rounded-4 shadow-lg border ${isDark ? "bg-dark bg-opacity-75 border-secondary" : "bg-white border-light"
                          }`}
                      >
                        <div className="row g-3">

                          <div className="col-12 position-relative">
                            <label className="small fw-semibold mb-1">Départ</label>

                            <div className="input-group input-group-lg">

                              <span className={`input-group-text ${inputGroupTextClass}`}>
                                <i className="bi bi-geo-alt-fill text-success" />
                              </span>

                              <input
                                className={`form-control ${inputClass}`}
                                placeholder="Ma position, Collège La Cité, 1485 Caldwell..."
                                value={depart}
                                onChange={(e) => setDepart(e.target.value)}
                              />

                              {/* 📍 GPS */}
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

                          <div className="col-12 text-center">
                            <button
                              type="button"
                              className="btn btn-outline-secondary rounded-circle"
                              onClick={() => {
                                const temp = depart;
                                setDepart(destination);
                                setDestination(temp);
                              }}
                            >
                              <i className="bi bi-arrow-down-up"></i>
                            </button>
                          </div>

                          <div className="col-12 position-relative">
                            <label className="small fw-semibold mb-1">Destination</label>

                            <div className="input-group input-group-lg">

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
                            <div className="input-group input-group-lg">
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
                              className="btn btn-success btn-lg fw-semibold rounded-4 shadow-sm"
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


            <div className="col-12 col-lg-6">
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
                    {isConducteur ? (
                      <>
                        <h3 className="h5 fw-bold mb-1">Mes Trajets</h3>
                        <p className={isDark ? "text-secondary mb-3" : "text-muted mb-3"} style={{ lineHeight: 1.35 }}>
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

                              <div className="fw-bold fs-4 mb-1">
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

                            <div className="small text-muted">
                              Départ aujourd’hui
                            </div>

                            {/* Bouton */}
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

          <div style={{ height: 24 }} />
        </div>
      </main>

      <Footer isDark={isDark} style={{ backgroundColor: "#8ac55a" }} />
    </div>
  );
}