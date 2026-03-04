import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";

export default function ReservationsRecues() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await fetch("/reservations/recues", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Erreur lors du chargement.");
          return;
        }

        setReservations(data.reservations || []);
      } catch (err) {
        console.error(err);
        setError("Erreur serveur.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [token, navigate]);

  const handleAction = async (id, action) => {
    try {
      const response = await fetch(
        `/reservations/${id}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur.");
        return;
      }

      setReservations((prev) =>
        prev.map((r) =>
          r.reservation_id === id
            ? { ...r, statut: action === "accepter" ? "ACCEPTEE" : "REFUSEE" }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      setError("Erreur serveur.");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <HeaderPrivate isDark={isDark} />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 720 }}>
          <h4 className="fw-bold mb-2">Mes passagers</h4>
          <p className="text-muted mb-4">
            Gérez les demandes envoyées par les passagers.
          </p>

          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-success" />
            </div>
          )}

          {error && (
            <div className="alert alert-danger text-center">
              {error}
            </div>
          )}

          {!loading && reservations.length === 0 && (
            <div className="alert alert-light text-center">
              Aucune demande pour le moment.
            </div>
          )}

          {!loading &&
            reservations.map((r) => {
              const dateObj = new Date(r.dateheure_depart);

              return (
                <div
                  key={r.reservation_id}
                  className={`rounded-4 shadow-sm p-3 p-md-4 mb-3 ${
                    isDark
                      ? "bg-dark border border-secondary"
                      : "bg-white"
                  }`}
                >
                  <h5 className="fw-bold mb-1">
                    {r.prenom} {r.nom}
                  </h5>

                  <div className="small text-muted mb-2">
                    {r.email}
                  </div>

                  <div className="mb-2">
                    <strong>
                      {r.lieu_depart} → {r.destination}
                    </strong>
                  </div>

                  <div className="text-muted small mb-3">
                    <i className="bi bi-calendar-event me-2" />
                    {dateObj.toLocaleDateString()} —{" "}
                    {dateObj.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <span
                      className={`badge ${
                        r.statut === "ACCEPTEE"
                          ? "bg-success"
                          : r.statut === "EN_ATTENTE"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {r.statut}
                    </span>

                    {r.statut === "EN_ATTENTE" && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() =>
                            handleAction(r.reservation_id, "accepter")
                          }
                        >
                          Accepter
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() =>
                            handleAction(r.reservation_id, "refuser")
                          }
                        >
                          Refuser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
