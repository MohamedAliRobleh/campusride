// src/pages/Passager/Post.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate.jsx";
import Footer from "../../components/Footer.jsx";

export default function Post() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  const isDark = theme === "dark";

  // ✅ Toast state (DOIT être en haut du composant)
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    depart: "",
    destination: "",
    date: "",
    heure: "",
    places: 3,
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  // ✅ Auto hide toast après 3 secondes
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

      const response = await fetch("http://localhost:8000/trajets", {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur publication");
      }

      // ✅ Toast succès
      setToastMessage("Trajet publié avec succès 🚗");

      // Reset formulaire
      setFormData({
        depart: "",
        destination: "",
        date: "",
        heure: "",
        places: 3,
      });

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

          <h4 className="fw-bold mb-3">Publier un trajet</h4>
          <p className="text-muted">
            Partagez votre route avec d'autres étudiants.
          </p>

          <form onSubmit={handleSubmit} className="mt-4">

            {/* Départ */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Lieu de départ
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-geo-alt text-success"></i>
                </span>
                <input
                  type="text"
                  name="depart"
                  className="form-control"
                  value={formData.depart}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Destination */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Destination
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-geo-alt text-success"></i>
                </span>
                <input
                  type="text"
                  name="destination"
                  className="form-control"
                  value={formData.destination}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Date & Heure */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Date</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">Heure</label>
                <input
                  type="time"
                  name="heure"
                  className="form-control"
                  value={formData.heure}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Places */}
            <div className="mb-4">
              <label className="form-label fw-semibold">
                Places disponibles
              </label>
              <select
                name="places"
                className="form-select"
                value={formData.places}
                onChange={handleChange}
              >
                <option value="1">1 place</option>
                <option value="2">2 places</option>
                <option value="3">3 places</option>
                <option value="4">4 places</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-success w-100 rounded-pill py-3 fw-bold"
            >
              Publier le trajet
            </button>

          </form>
        </div>
      </main>

      {/* ✅ TOAST PRO */}
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


      <Footer />
    </div>
  );
}
