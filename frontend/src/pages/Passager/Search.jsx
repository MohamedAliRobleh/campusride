// src/pages/Passager/Search.jsx

import { useEffect, useState } from "react";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";

export default function Search() {
  const [trajets, setTrajets] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showToast, setShowToast] = useState(false);

  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  useEffect(() => {
    const fetchTrajets = async () => {
      try {
        const response = await fetch("/trajets/recherche", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        setTrajets(data.trajets || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTrajets();
  }, []);

  const showToastMessage = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleReservation = async (trajetId) => {
    try {
      if (!token) {
        showToastMessage("Vous devez être connecté.", "danger");
        return;
      }

      setLoadingId(trajetId);

      const response = await fetch("/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trajet_id: trajetId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToastMessage(data.message || "Erreur lors de la réservation", "danger");
        setLoadingId(null);
        return;
      }

      showToastMessage("Réservation effectuée avec succès !", "success");

      // Mise à jour visuelle des places
      setTrajets((prev) =>
        prev.map((t) =>
          t.id === trajetId
            ? { ...t, places_dispo: t.places_dispo - 1 }
            : t
        )
      );

      setLoadingId(null);
    } catch (error) {
      console.error(error);
      showToastMessage("Erreur serveur", "danger");
      setLoadingId(null);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <HeaderPrivate isDark={isDark} />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 720 }}>
          <h4 className="fw-bold mb-4">Trajets disponibles</h4>

          {trajets.length === 0 && (
            <div className="alert alert-light text-center">
              Aucun trajet disponible pour le moment.
            </div>
          )}

          {trajets.map((trajet) => {
            const dateObj = new Date(trajet.dateheure_depart);

            return (
              <div
                key={trajet.id}
                className={`rounded-4 shadow-sm p-4 mb-4 transition-card ${isDark ? "bg-dark border border-secondary" : "bg-white"
                  }`}
              >
                {/* ===== HEADER ===== */}
                <div className="d-flex justify-content-between align-items-start mb-3">

                  <div>
                    <h5 className="fw-bold mb-1">
                      {trajet.lieu_depart}
                      <span className="mx-2 text-success fw-bold">→</span>
                      {trajet.destination}
                    </h5>

                    <div className="small text-muted">
                      <i className="bi bi-calendar-event me-1"></i>
                      {dateObj.toLocaleDateString()} •{" "}
                      {dateObj.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Badge disponibilité */}
                  <span
                    className={`badge rounded-pill px-3 py-2 ${trajet.places_dispo <= 1
                        ? "bg-danger-subtle text-danger"
                        : "bg-success-subtle text-success"
                      }`}
                  >
                    <i className="bi bi-people-fill me-1"></i>
                    {trajet.places_dispo} dispo
                  </span>

                </div>

                {/* ===== PROGRESS BAR ===== */}
                <div className="mb-3">
                  <div className="progress rounded-pill" style={{ height: 6 }}>
                    <div
                      className={`progress-bar ${trajet.places_dispo <= 1 ? "bg-danger" : "bg-success"
                        }`}
                      style={{
                        width: `${((trajet.places_total - trajet.places_dispo) /
                            trajet.places_total) *
                          100
                          }%`,
                      }}
                    />
                  </div>
                </div>

                {/* ===== FOOTER ACTION ===== */}
                <div className="d-flex justify-content-between align-items-center">

                  <div className="small text-muted">
                    {trajet.places_dispo <= 1
                      ? "Presque complet 🔥"
                      : "Disponible"}
                  </div>

                  <button
                    className="btn btn-success rounded-pill px-4 fw-semibold"
                    disabled={
                      trajet.places_dispo <= 0 ||
                      loadingId === trajet.id
                    }
                    onClick={() => handleReservation(trajet.id)}
                  >
                    {loadingId === trajet.id ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Réservation...
                      </>
                    ) : trajet.places_dispo <= 0 ? (
                      "Complet"
                    ) : (
                      "Réserver"
                    )}
                  </button>
                </div>
              </div>
            );

          })}
        </div>
      </main>

      {/* ✅ Toast moderne */}
      <div
        className="position-fixed bottom-0 end-0 p-3"
        style={{ zIndex: 9999 }}
      >
        <div
          className={`toast align-items-center text-bg-${toastType} border-0 shadow-lg ${showToast ? "show" : ""
            }`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">
              <i
                className={`bi ${toastType === "success"
                    ? "bi-check-circle-fill"
                    : "bi-exclamation-triangle-fill"
                  } me-2`}
              ></i>
              {toastMessage}
            </div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              onClick={() => setShowToast(false)}
            ></button>
          </div>
        </div>
      </div>

      <Footer
        isDark={isDark}
        style={{ backgroundColor: "#268249 " }}
      />
    </div>
  );
}
