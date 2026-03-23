import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import HeaderPrivate from "../../components/HeaderPrivate.jsx";
import PlacesInput from "../../components/PlacesInput.jsx";
import EmergencyButton from "../../components/EmergencyButton";

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
  const [departCoords, setDepartCoords] = useState(null); // { lat, lng }
  const [destCoords,   setDestCoords]   = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!depart.trim() || !destination.trim() || !date) return;

    navigate("/passager/search", {
      state: { depart, destination, date, departCoords, destCoords },
    });
  };

  const [trips, setTrips] = useState([]);
  const [toast, setToast] = useState({ show: false, text: "" });

  const showToast = (text) => {
    setToast({ show: true, text });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
  };

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

  const heroHeight = isSmallLaptop
    ? "clamp(300px, 42vh, 480px)"
    : "clamp(360px, 52vh, 560px)";

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
          <div className="text-center mb-2">
            <h2
              className="m-0"
              style={{
                fontWeight: 650,
                letterSpacing: "-0.5px",
                fontSize: "clamp(1.2rem, 3vw, 1.75rem)",
              }}
            >
              Bienvenue sur CampusRide
            </h2>
          </div>

          <p className={`small ${isDark ? "text-secondary mb-2" : "text-muted mb-2"}`}>
            {user?.prenom ? `Bonjour, ${user.prenom} 👋` : "Bienvenue sur CampusRide"}
          </p>

          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <section className="position-relative overflow-hidden rounded-4 shadow-sm">
                {/* IMAGE BACKGROUND */}
                <div
                  style={{
                    minHeight: heroHeight,
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
                        className={`rounded-4 shadow-lg overflow-hidden ${isDark ? "bg-dark" : "bg-white"}`}
                        style={{ backdropFilter: "blur(8px)" }}
                      >
                        {/* Green header bar */}
                        <div
                          className="px-3 py-2 d-flex align-items-center gap-2"
                          style={{ background: "linear-gradient(90deg, #198754, #20c374)" }}
                        >
                          <i className="bi bi-car-front-fill text-white" style={{ fontSize: "0.95rem" }} />
                          <span className="text-white fw-semibold" style={{ fontSize: "0.82rem", letterSpacing: "0.03em" }}>
                            Trouver un trajet
                          </span>
                        </div>

                        <div className="p-3">
                          {/* Route fields row */}
                          <div className="d-flex gap-2 align-items-stretch">
                            {/* Route line visual */}
                            <div
                              className="d-flex flex-column align-items-center flex-shrink-0"
                              style={{ paddingTop: "0.9rem", gap: 0 }}
                            >
                              <div
                                className="rounded-circle bg-success"
                                style={{ width: 9, height: 9, flexShrink: 0 }}
                              />
                              <div
                                style={{
                                  width: 2,
                                  flexGrow: 1,
                                  background: "repeating-linear-gradient(to bottom, #198754 0, #198754 4px, transparent 4px, transparent 8px)",
                                  margin: "3px 0",
                                }}
                              />
                              <i
                                className="bi bi-geo-alt-fill text-success"
                                style={{ fontSize: "0.9rem", marginBottom: 2 }}
                              />
                            </div>

                            {/* Inputs */}
                            <div className="flex-grow-1 d-flex flex-column gap-1">
                              {/* Depart field */}
                              <div>
                                <div
                                  className="text-uppercase fw-bold mb-1"
                                  style={{
                                    fontSize: "0.65rem",
                                    letterSpacing: "0.06em",
                                    color: "#198754",
                                  }}
                                >
                                  Départ
                                </div>
                                <div
                                  className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light border border-0"}`}
                                  style={{ padding: "0.35rem 0.65rem" }}
                                >
                                  <PlacesInput
                                    className={`flex-grow-1 border-0 bg-transparent p-0 form-control shadow-none ${isDark ? "text-light" : ""}`}
                                    placeholder="Ex: Kanata, Orléans, Gatineau…"
                                    value={depart}
                                    onChange={(v) => { setDepart(v); setDepartCoords(null); }}
                                    onPlaceSelect={(p) => { setDepart(p.address); setDepartCoords({ lat: p.lat, lng: p.lng }); }}
                                  />
                                  <button
                                    type="button"
                                    className="btn p-0 ms-1 text-success opacity-75"
                                    style={{ lineHeight: 1 }}
                                    onClick={() => {
                                      if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                          setDepart("Ma position actuelle");
                                          setDepartCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                        });
                                      }
                                    }}
                                    aria-label="GPS départ"
                                    title="Ma position"
                                  >
                                    <i className="bi bi-crosshair" style={{ fontSize: "0.85rem" }} />
                                  </button>
                                </div>
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    onClick={() => setDepart("Collège La Cité")}
                                    className="badge border-0 rounded-pill fw-normal"
                                    style={{
                                      background: "rgba(25,135,84,0.1)",
                                      color: "#198754",
                                      fontSize: "0.72rem",
                                      padding: "3px 10px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📍 Collège La Cité
                                  </button>
                                </div>
                              </div>

                              {/* Destination field */}
                              <div className="mt-1">
                                <div
                                  className="text-uppercase fw-bold mb-1"
                                  style={{
                                    fontSize: "0.65rem",
                                    letterSpacing: "0.06em",
                                    color: "#198754",
                                  }}
                                >
                                  Destination
                                </div>
                                <div
                                  className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light border border-0"}`}
                                  style={{ padding: "0.35rem 0.65rem" }}
                                >
                                  <PlacesInput
                                    className={`flex-grow-1 border-0 bg-transparent p-0 form-control shadow-none ${isDark ? "text-light" : ""}`}
                                    placeholder="Où allez-vous ?"
                                    value={destination}
                                    onChange={(v) => { setDestination(v); setDestCoords(null); }}
                                    onPlaceSelect={(p) => { setDestination(p.address); setDestCoords({ lat: p.lat, lng: p.lng }); }}
                                  />
                                  <button
                                    type="button"
                                    className="btn p-0 ms-1 text-success opacity-75"
                                    style={{ lineHeight: 1 }}
                                    onClick={() => {
                                      if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                          setDestination("Ma position actuelle");
                                          setDestCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                        });
                                      }
                                    }}
                                    aria-label="GPS destination"
                                    title="Ma position"
                                  >
                                    <i className="bi bi-crosshair" style={{ fontSize: "0.85rem" }} />
                                  </button>
                                </div>
                                <div className="mt-1">
                                  <button
                                    type="button"
                                    onClick={() => setDestination("Collège La Cité")}
                                    className="badge border-0 rounded-pill fw-normal"
                                    style={{
                                      background: "rgba(25,135,84,0.1)",
                                      color: "#198754",
                                      fontSize: "0.72rem",
                                      padding: "3px 10px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    📍 Collège La Cité
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Swap button — right side */}
                            <div className="d-flex align-items-center flex-shrink-0">
                              <button
                                type="button"
                                className={`btn rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm ${isDark ? "btn-outline-secondary" : "btn-outline-secondary"}`}
                                style={{ width: 30, height: 30 }}
                                onClick={() => {
                                  const temp = depart;
                                  setDepart(destination);
                                  setDestination(temp);
                                  const tempC = departCoords;
                                  setDepartCoords(destCoords);
                                  setDestCoords(tempC);
                                }}
                                aria-label="Inverser départ/destination"
                                title="Inverser"
                              >
                                <i className="bi bi-arrow-down-up" style={{ fontSize: "0.75rem" }} />
                              </button>
                            </div>
                          </div>

                          {/* Date + Rechercher */}
                          <div className="d-flex gap-2 mt-3">
                            <div
                              className={`d-flex align-items-center rounded-3 flex-grow-1 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`}
                              style={{ padding: "0.35rem 0.65rem" }}
                            >
                              <i className="bi bi-calendar-event text-success me-2" style={{ fontSize: "0.85rem" }} />
                              <input
                                type="date"
                                className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                              />
                            </div>
                            <button
                              type="submit"
                              className="btn btn-success fw-semibold rounded-3 px-3 shadow-sm d-flex align-items-center gap-2 flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #198754, #20c374)", border: "none" }}
                            >
                              <i className="bi bi-search" />
                              <span className="d-none d-sm-inline">Rechercher</span>
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
                    style={{ width: 48, height: 48, background: "rgba(25,135,84,0.12)" }}
                  >
                    <i className="bi bi-gift-fill" style={{ color: "#198754", fontSize: 20 }} />
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
                    const conducteurNom = `${trajet.conducteur_prenom ?? ""} ${trajet.conducteur_nom ?? ""}`.trim();
                    const initiales = ((trajet.conducteur_prenom?.[0] ?? "") + (trajet.conducteur_nom?.[0] ?? "")).toUpperCase() || "?";
                    const voitureLabel = trajet.voiture_marque
                      ? `${trajet.voiture_marque} ${trajet.voiture_modele ?? ""}${trajet.voiture_couleur ? ` · ${trajet.voiture_couleur}` : ""}`
                      : null;
                    const isFull = trajet.places_dispo <= 0;

                    return (
                      <div
                        key={trajet.id}
                        className={`rounded-4 shadow-sm overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white border"}`}
                        style={isFull ? { opacity: 0.85 } : {}}
                      >
                        <div style={{ height: 3, background: isFull ? "linear-gradient(90deg, #6c757d, #adb5bd)" : "linear-gradient(90deg, #198754, #20c374)" }} />
                        <div className="p-3">
                          {/* Route */}
                          <div className="d-flex align-items-start gap-2 mb-2">
                            <div className="d-flex flex-column align-items-center flex-shrink-0" style={{ paddingTop: 4 }}>
                              <div className="rounded-circle bg-success" style={{ width: 8, height: 8 }} />
                              <div style={{ width: 2, height: 20, background: "repeating-linear-gradient(to bottom, #198754 0, #198754 3px, transparent 3px, transparent 7px)", margin: "2px 0" }} />
                              <i className="bi bi-geo-alt-fill text-success" style={{ fontSize: "0.75rem" }} />
                            </div>
                            <div className="flex-grow-1">
                              <div className="fw-semibold" style={{ fontSize: "0.88rem", lineHeight: 1.2 }}>{trajet.lieu_depart}</div>
                              <div className={`small mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.8rem", lineHeight: 1.2 }}>{trajet.destination}</div>
                            </div>
                            <div className="text-end flex-shrink-0">
                              <div className="fw-bold text-success" style={{ fontSize: "1rem" }}>
                                {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              <div className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                                {dateObj.toLocaleDateString("fr-CA", { day: "2-digit", month: "short" })}
                              </div>
                            </div>
                          </div>

                          <hr className={`my-2 ${isDark ? "border-secondary" : ""}`} />

                          {/* Conducteur + places + bouton */}
                          <div className="d-flex align-items-center gap-2">
                            {trajet.conducteur_photo_url ? (
                              <img
                                src={trajet.conducteur_photo_url}
                                alt={conducteurNom}
                                className="rounded-circle flex-shrink-0"
                                style={{ width: 30, height: 30, objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                                style={{ width: 30, height: 30, background: "linear-gradient(135deg, #198754, #20c374)", fontSize: "0.7rem" }}
                              >
                                {initiales}
                              </div>
                            )}
                            <div className="flex-grow-1 min-w-0">
                              <div className="fw-semibold" style={{ fontSize: "0.8rem" }}>{conducteurNom || "Conducteur"}</div>
                              {voitureLabel && (
                                <div className={`${isDark ? "text-secondary" : "text-muted"} d-flex align-items-center gap-1`} style={{ fontSize: "0.72rem" }}>
                                  <i className="bi bi-car-front" />
                                  {voitureLabel}
                                </div>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                              {isFull ? (
                                <span className="badge rounded-pill px-2 py-1 fw-semibold" style={{ fontSize: "0.72rem", background: "#dc354520", color: "#dc3545", border: "1px solid #dc354540" }}>
                                  <i className="bi bi-lock-fill me-1" />
                                  Complet
                                </span>
                              ) : (
                                <span className="badge rounded-pill bg-success-subtle text-success px-2 py-1" style={{ fontSize: "0.72rem" }}>
                                  <i className="bi bi-people-fill me-1" />
                                  {trajet.places_dispo}
                                </span>
                              )}
                              <button
                                type="button"
                                className={`btn btn-sm fw-semibold rounded-3 px-3 ${isFull ? "btn-secondary" : "btn-success"}`}
                                style={isFull ? { fontSize: "0.8rem" } : { background: "linear-gradient(135deg, #198754, #20c374)", border: "none", fontSize: "0.8rem" }}
                                onClick={() => isFull
                                  ? showToast("Ce trajet est complet, toutes les places ont été réservées.")
                                  : navigate("/passager/search")
                                }
                              >
                                {isFull ? <><i className="bi bi-lock-fill me-1" />Complet</> : "Réserver"}
                              </button>
                            </div>
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
      <EmergencyButton />

      {/* Toast trajet complet */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <div
          className={`toast align-items-center border-0 shadow-lg rounded-3 text-bg-danger ${toast.show ? "show" : ""}`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body fw-semibold" style={{ fontSize: "0.88rem" }}>
              <i className="bi bi-lock-fill me-2" />
              {toast.text}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToast((p) => ({ ...p, show: false }))} />
          </div>
        </div>
      </div>
    </div>
  );
}