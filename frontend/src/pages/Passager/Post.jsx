import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate.jsx";
import Footer from "../../components/Footer.jsx";
import TripMap from "../../components/TripMap.jsx";

const LACITE = { nom: "Collège La Cité", lat: 45.4510, lng: -75.6414 };

const PLAZAS = [
  { nom: "Galeries de Hull",            lat: 45.4226, lng: -75.7388 },
  { nom: "Place Gatineau",              lat: 45.4659, lng: -75.6540 },
  { nom: "Les Promenades Gatineau",     lat: 45.4714, lng: -75.7191 },
  { nom: "Carrefour de l'Outaouais",    lat: 45.4789, lng: -75.7371 },
  { nom: "Place du Centre (Hull)",      lat: 45.4268, lng: -75.7027 },
  { nom: "Rideau Centre",               lat: 45.4253, lng: -75.6939 },
  { nom: "Place d'Orléans",             lat: 45.4723, lng: -75.5157 },
  { nom: "Barrhaven Town Centre",       lat: 45.2767, lng: -75.7564 },
  { nom: "Merivale Mall",               lat: 45.3530, lng: -75.7435 },
  { nom: "St. Laurent Shopping Centre", lat: 45.4205, lng: -75.6197 },
  { nom: "Bayshore Shopping Centre",    lat: 45.3494, lng: -75.8083 },
  { nom: "Billings Bridge",             lat: 45.3808, lng: -75.6679 },
  { nom: "Gare Fallowfield",            lat: 45.3192, lng: -75.7647 },
  { nom: "Aéroport d'Ottawa",           lat: 45.3202, lng: -75.6691 },
];

export default function Post() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const isDark = theme === "dark";

  const [toastMessage, setToastMessage] = useState(null);
  const [hasVehicule, setHasVehicule] = useState(null); // null = chargement

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/vehicules/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setHasVehicule(r.ok))
      .catch(() => setHasVehicule(false));
  }, []);

  const [formData, setFormData] = useState({ date: "", heure: "", places: 3 });
  const [direction, setDirection] = useState("vers_cite"); // "vers_cite" | "depuis_cite"
  const [plazaQuery, setPlazaQuery] = useState("");
  const [plazaSelected, setPlazaSelected] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const plazaRef = useRef(null);

  const filteredPlazas = plazaQuery.length > 0
    ? PLAZAS.filter(p => p.nom.toLowerCase().includes(plazaQuery.toLowerCase()))
    : PLAZAS;

  const departPoint  = direction === "vers_cite" ? (plazaSelected || null) : LACITE;
  const destPoint    = direction === "vers_cite" ? LACITE : (plazaSelected || null);
  const showMapPreview = !!plazaSelected;

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    const handler = (e) => { if (plazaRef.current && !plazaRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const dateHeure = new Date(
        `${formData.date}T${formData.heure}`
      ).toISOString();

      const response = await fetch("/trajets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lieu_depart:      departPoint?.nom ?? "",
          destination:      destPoint?.nom   ?? "",
          dateheure_depart: dateHeure,
          places_total:     Number(formData.places),
          depart_lat:       departPoint?.lat ?? null,
          depart_lng:       departPoint?.lng ?? null,
          dest_lat:         destPoint?.lat   ?? null,
          dest_lng:         destPoint?.lng   ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur publication");
      }

      // ✅ Toast succès
      setToastMessage("Trajet publié avec succès 🚗");

      setFormData({ date: "", heure: "", places: 3 });
      setPlazaSelected(null);
      setPlazaQuery("");

    } catch (error) {
      setToastMessage(error.message);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">

      <HeaderPrivate
        isDark={isDark}
        onToggleTheme={() =>
          setTheme((t) => (t === "dark" ? "light" : "dark"))
        }
      />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 720 }}>

          <div className="mb-4">
            <h4 className="fw-bold mb-1">Publier un trajet</h4>
            <p className={`small mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
              Partagez votre route avec d'autres étudiants du Collège La Cité.
            </p>
          </div>

          {hasVehicule === false && (
            <div className="alert alert-warning rounded-4 d-flex align-items-center gap-3 mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill fs-4 flex-shrink-0" />
              <div>
                <div className="fw-semibold">Aucun véhicule enregistré</div>
                <div className="small">Vous devez ajouter un véhicule avant de pouvoir publier un trajet.</div>
                <button className="btn btn-sm btn-warning mt-2 rounded-3 fw-semibold"
                  onClick={() => navigate("/profil/voitures")}>
                  <i className="bi bi-plus-circle me-1" />Ajouter un véhicule
                </button>
              </div>
            </div>
          )}

          <div className={`rounded-4 shadow-sm overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}>
            <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374)" }} />

            <form onSubmit={handleSubmit} className="p-3 p-md-4">

              {/* Itinéraire */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: 30, height: 30, background: "rgba(25,135,84,0.1)" }}>
                    <i className="bi bi-map text-success" style={{ fontSize: "0.85rem" }} />
                  </div>
                  <span className="fw-bold" style={{ fontSize: "0.88rem" }}>Itinéraire</span>
                </div>

                {/* Direction toggle */}
                <div className="d-flex gap-2 mb-3">
                  {[
                    { key: "vers_cite",   label: "Je vais au collège",   icon: "bi-arrow-right-circle" },
                    { key: "depuis_cite", label: "Je pars du collège",   icon: "bi-arrow-left-circle"  },
                  ].map(({ key, label, icon }) => {
                    const active = direction === key;
                    return (
                      <button key={key} type="button"
                        onClick={() => { setDirection(key); setPlazaSelected(null); setPlazaQuery(""); }}
                        className="btn flex-fill rounded-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                        style={{
                          fontSize: "0.82rem", padding: "9px 12px",
                          background: active ? "#198754" : "transparent",
                          color: active ? "#fff" : isDark ? "#adb5bd" : "#6c757d",
                          border: active ? "2px solid #198754" : `2px solid ${isDark ? "#495057" : "#dee2e6"}`,
                          transition: "all .15s",
                        }}>
                        <i className={`bi ${icon}`} />{label}
                        {active && <i className="bi bi-check-lg ms-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Champs départ / destination */}
                <div className="d-flex gap-3">
                  <div className="d-flex flex-column align-items-center flex-shrink-0" style={{ paddingTop: "0.85rem" }}>
                    <div className="rounded-circle bg-success" style={{ width: 9, height: 9 }} />
                    <div style={{ width: 2, flexGrow: 1, background: "repeating-linear-gradient(to bottom, #198754 0, #198754 4px, transparent 4px, transparent 8px)", margin: "3px 0" }} />
                    <i className="bi bi-geo-alt-fill text-success" style={{ fontSize: "0.85rem" }} />
                  </div>

                  <div className="flex-grow-1 d-flex flex-column gap-2">
                    {/* Départ */}
                    <div>
                      <label className="form-label" style={{ color: "#198754", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Départ</label>
                      {direction === "depuis_cite" ? (
                        <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.5rem 0.65rem" }}>
                          <i className="bi bi-building text-success me-2" style={{ fontSize: "0.85rem" }} />
                          <span className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.88rem" }}>Collège La Cité</span>
                          <span className="badge bg-success bg-opacity-10 text-success ms-auto" style={{ fontSize: "0.65rem" }}>Fixe</span>
                        </div>
                      ) : (
                        <div ref={plazaRef} className="position-relative">
                          <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                            <i className="bi bi-search text-success me-2" style={{ fontSize: "0.8rem" }} />
                            <input
                              className={`flex-grow-1 border-0 bg-transparent p-0 form-control shadow-none ${isDark ? "text-light" : ""}`}
                              placeholder="Tapez votre Plaza (ex: Gatineau, Orléans…)"
                              value={plazaSelected ? plazaSelected.nom : plazaQuery}
                              onChange={(e) => { setPlazaQuery(e.target.value); setPlazaSelected(null); setShowDropdown(true); }}
                              onFocus={() => setShowDropdown(true)}
                              required
                            />
                            {plazaSelected && <i className="bi bi-x text-muted ms-1" style={{ cursor: "pointer" }} onClick={() => { setPlazaSelected(null); setPlazaQuery(""); }} />}
                          </div>
                          {showDropdown && filteredPlazas.length > 0 && !plazaSelected && (
                            <ul className={`position-absolute w-100 rounded-3 shadow border mt-1 py-1 ${isDark ? "bg-dark border-secondary" : "bg-white"}`} style={{ zIndex: 999, maxHeight: 200, overflowY: "auto", listStyle: "none", padding: 0 }}>
                              {filteredPlazas.map(p => (
                                <li key={p.nom}
                                  className={`px-3 py-2 ${isDark ? "text-light" : "text-dark"}`}
                                  style={{ cursor: "pointer", fontSize: "0.85rem" }}
                                  onMouseDown={() => { setPlazaSelected(p); setPlazaQuery(""); setShowDropdown(false); }}>
                                  <i className="bi bi-geo-alt me-2 text-success" />{p.nom}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Destination */}
                    <div>
                      <label className="form-label" style={{ color: "#198754", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Destination</label>
                      {direction === "vers_cite" ? (
                        <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.5rem 0.65rem" }}>
                          <i className="bi bi-building text-success me-2" style={{ fontSize: "0.85rem" }} />
                          <span className={`${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.88rem" }}>Collège La Cité</span>
                          <span className="badge bg-success bg-opacity-10 text-success ms-auto" style={{ fontSize: "0.65rem" }}>Fixe</span>
                        </div>
                      ) : (
                        <div ref={plazaRef} className="position-relative">
                          <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                            <i className="bi bi-search text-success me-2" style={{ fontSize: "0.8rem" }} />
                            <input
                              className={`flex-grow-1 border-0 bg-transparent p-0 form-control shadow-none ${isDark ? "text-light" : ""}`}
                              placeholder="Tapez votre Plaza (ex: Gatineau, Orléans…)"
                              value={plazaSelected ? plazaSelected.nom : plazaQuery}
                              onChange={(e) => { setPlazaQuery(e.target.value); setPlazaSelected(null); setShowDropdown(true); }}
                              onFocus={() => setShowDropdown(true)}
                              required
                            />
                            {plazaSelected && <i className="bi bi-x text-muted ms-1" style={{ cursor: "pointer" }} onClick={() => { setPlazaSelected(null); setPlazaQuery(""); }} />}
                          </div>
                          {showDropdown && filteredPlazas.length > 0 && !plazaSelected && (
                            <ul className={`position-absolute w-100 rounded-3 shadow border mt-1 py-1 ${isDark ? "bg-dark border-secondary" : "bg-white"}`} style={{ zIndex: 999, maxHeight: 200, overflowY: "auto", listStyle: "none", padding: 0 }}>
                              {filteredPlazas.map(p => (
                                <li key={p.nom}
                                  className={`px-3 py-2 ${isDark ? "text-light" : "text-dark"}`}
                                  style={{ cursor: "pointer", fontSize: "0.85rem" }}
                                  onMouseDown={() => { setPlazaSelected(p); setPlazaQuery(""); setShowDropdown(false); }}>
                                  <i className="bi bi-geo-alt me-2 text-success" />{p.nom}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte preview live */}
              {showMapPreview && (
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: 30, height: 30, background: "rgba(25,135,84,0.1)" }}>
                      <i className="bi bi-map-fill text-success" style={{ fontSize: "0.85rem" }} />
                    </div>
                    <span className="fw-bold" style={{ fontSize: "0.88rem" }}>Aperçu du trajet</span>
                  </div>
                  <TripMap
                    depart={departPoint?.nom}
                    destination={destPoint?.nom}
                    fromCoords={departPoint ? { lat: departPoint.lat, lon: departPoint.lng } : null}
                    toCoords={destPoint   ? { lat: destPoint.lat,   lon: destPoint.lng   } : null}
                    isDark={isDark}
                    height={220}
                  />
                </div>
              )}

              <hr className={isDark ? "border-secondary" : ""} />

              {/* Horaire */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: 30, height: 30, background: "rgba(25,135,84,0.1)" }}>
                    <i className="bi bi-clock text-success" style={{ fontSize: "0.85rem" }} />
                  </div>
                  <span className="fw-bold" style={{ fontSize: "0.88rem" }}>Horaire de départ</span>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label">Date</label>
                    <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                      <i className="bi bi-calendar3 text-success me-2" style={{ fontSize: "0.85rem" }} />
                      <input type="date" name="date" className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`} value={formData.date} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Heure</label>
                    <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                      <i className="bi bi-clock text-success me-2" style={{ fontSize: "0.85rem" }} />
                      <input type="time" name="heure" className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`} value={formData.heure} onChange={handleChange} required />
                    </div>
                  </div>
                </div>
              </div>

              <hr className={isDark ? "border-secondary" : ""} />

              {/* Places */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{ width: 30, height: 30, background: "rgba(25,135,84,0.1)" }}>
                    <i className="bi bi-people text-success" style={{ fontSize: "0.85rem" }} />
                  </div>
                  <span className="fw-bold" style={{ fontSize: "0.88rem" }}>Nombre de places</span>
                </div>

                <div className="d-flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`btn flex-fill rounded-3 fw-semibold ${Number(formData.places) === n ? "btn-success" : "btn-outline-secondary"}`}
                      style={{ fontSize: "0.9rem" }}
                      onClick={() => setFormData((prev) => ({ ...prev, places: n }))}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className={`mt-2 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>
                  <i className="bi bi-info-circle me-1" />
                  {formData.places} place{formData.places > 1 ? "s" : ""} disponible{formData.places > 1 ? "s" : ""} pour les passagers
                </div>
              </div>

              <button type="submit" className="btn btn-success w-100 rounded-3 py-2 fw-bold" style={{ fontSize: "0.95rem" }}>
                <i className="bi bi-send-fill me-2" />
                Publier le trajet
              </button>

            </form>
          </div>
        </div>
      </main>

      {toastMessage && (
  <div
    className="position-fixed top-0 start-50 translate-middle-x mt-4"
    style={{ zIndex: 2000 }}
  >
    <div className="toast show shadow-lg border-0">
      <div className="d-flex align-items-center bg-success text-white rounded-3 px-4 py-3">
        <i className="bi bi-check-circle-fill me-2 fs-5"></i>
        <div className="flex-grow-1 fw-semibold">
          {toastMessage}
        </div>
        <button
          type="button"
          className="btn-close btn-close-white ms-3"
          onClick={() => setToastMessage(null)}
        ></button>
      </div>
    </div>
  </div>
)}


      <Footer isDark={isDark} />
    </div>
  );
}

