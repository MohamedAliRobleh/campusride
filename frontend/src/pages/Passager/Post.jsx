import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate.jsx";
import Footer from "../../components/Footer.jsx";
import PlacesInput from "../../components/PlacesInput.jsx";
import TripMap from "../../components/TripMap.jsx";

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

  const [formData, setFormData] = useState({
    depart: "",
    destination: "",
    date: "",
    heure: "",
    places: 3,
  });

  // Coordonnées GPS des points de départ et destination
  const [departCoords, setDepartCoords] = useState(null);  // { lat, lng }
  const [destCoords,   setDestCoords]   = useState(null);

  // Afficher la carte preview si les deux champs sont remplis
  const showMapPreview = formData.depart.length > 3 && formData.destination.length > 3;

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
          lieu_depart: formData.depart,
          destination: formData.destination,
          dateheure_depart: dateHeure,
          places_total: Number(formData.places),
          depart_lat: departCoords?.lat ?? null,
          depart_lng: departCoords?.lng ?? null,
          dest_lat:   destCoords?.lat   ?? null,
          dest_lng:   destCoords?.lng   ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur publication");
      }

      // ✅ Toast succès
      setToastMessage("Trajet publié avec succès 🚗");

      // Reset formulaire
      setFormData({ depart: "", destination: "", date: "", heure: "", places: 3 });
      setDepartCoords(null);
      setDestCoords(null);

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
                  onClick={() => navigate("/profil/vehicule")}>
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

                <div className="d-flex gap-3">
                  <div className="d-flex flex-column align-items-center flex-shrink-0" style={{ paddingTop: "0.85rem" }}>
                    <div className="rounded-circle bg-success" style={{ width: 9, height: 9 }} />
                    <div style={{ width: 2, flexGrow: 1, background: "repeating-linear-gradient(to bottom, #198754 0, #198754 4px, transparent 4px, transparent 8px)", margin: "3px 0" }} />
                    <i className="bi bi-geo-alt-fill text-success" style={{ fontSize: "0.85rem" }} />
                  </div>

                  <div className="flex-grow-1 d-flex flex-column gap-2">
                    <div>
                      <label className="form-label" style={{ color: "#198754", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Départ</label>
                      <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                        <PlacesInput
                          className={`flex-grow-1 border-0 bg-transparent p-0 form-control shadow-none ${isDark ? "text-light" : ""}`}
                          placeholder="Ex: Kanata, Orléans, Gatineau…"
                          value={formData.depart}
                          onChange={(val) => setFormData((prev) => ({ ...prev, depart: val }))}
                          onPlaceSelect={(p) => { setFormData((prev) => ({ ...prev, depart: p.address })); setDepartCoords({ lat: p.lat, lng: p.lng }); }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label" style={{ color: "#198754", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Destination</label>
                      <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
                        <PlacesInput
                          className={`flex-grow-1 border-0 bg-transparent p-0 form-control shadow-none ${isDark ? "text-light" : ""}`}
                          placeholder="Ex: Place d'Orléans, Ottawa"
                          value={formData.destination}
                          onChange={(val) => setFormData((prev) => ({ ...prev, destination: val }))}
                          onPlaceSelect={(p) => { setFormData((prev) => ({ ...prev, destination: p.address })); setDestCoords({ lat: p.lat, lng: p.lng }); }}
                        />
                      </div>
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
                    depart={formData.depart}
                    destination={formData.destination}
                    fromCoords={departCoords ? { lat: departCoords.lat, lon: departCoords.lng } : null}
                    toCoords={destCoords ? { lat: destCoords.lat, lon: destCoords.lng } : null}
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

