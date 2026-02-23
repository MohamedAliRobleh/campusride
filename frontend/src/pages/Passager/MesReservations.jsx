// src/pages/Passager/MesReservations.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";

export default function MesReservations() {

    const navigate = useNavigate();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filter, setFilter] = useState("ACTIVES");

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
                setError(null);

                const response = await fetch("/reservations", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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

    const handleAnnuler = async (reservationId) => {
        try {

            const response = await fetch(`/reservations/${reservationId}/annuler`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Erreur lors de l'annulation.");
                return;
            }

            setReservations(prev =>
                prev.map(r =>
                    r.id === reservationId ? { ...r, statut: "ANNULEE" } : r
                )
            );

        } catch (err) {
            console.error(err);
            setError("Erreur serveur.");
        }
    };

    const actives = reservations.filter(r =>
        r.statut === "EN_ATTENTE" || r.statut === "ACCEPTEE"
    );

    const historique = reservations.filter(r =>
        r.statut === "ANNULEE" || r.statut === "REFUSEE" || r.statut === "TERMINEE"
    );

    const reservationsAffichees =
        filter === "ACTIVES" ? actives : historique;

    return (
        <div className="d-flex flex-column min-vh-100">
            <HeaderPrivate isDark={isDark} />

            <main className="flex-grow-1 py-4">
                <div className="container" style={{ maxWidth: 720 }}>

                    <h4 className="fw-bold mb-4">Mes Réservations</h4>

                    {/* Toggle */}
                    <div className="d-flex gap-2 mb-4">
                        <button
                            className={`btn btn-sm rounded-pill ${filter === "ACTIVES"
                                ? "btn-success"
                                : "btn-outline-success"
                                }`}
                            onClick={() => setFilter("ACTIVES")}
                        >
                            Actives ({actives.length})
                        </button>

                        <button
                            className={`btn btn-sm rounded-pill ${filter === "HISTORIQUE"
                                ? "btn-secondary"
                                : "btn-outline-secondary"
                                }`}
                            onClick={() => setFilter("HISTORIQUE")}
                        >
                            Historique ({historique.length})
                        </button>
                    </div>

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

                    {!loading && reservationsAffichees.length === 0 && !error && (
                        <div className={`alert ${isDark ? "alert-dark" : "alert-light"} text-center`}>
                            Aucune réservation dans cette section.
                        </div>
                    )}

                    {!loading && reservationsAffichees.map((reservation) => {

                        const dateObj = new Date(reservation.dateheure_depart);

                        return (
                            <div
                                key={reservation.id}
                                className={`rounded-4 shadow-sm p-4 mb-4 transition-card fade-in ${isDark
                                        ? "bg-dark border border-secondary"
                                        : "bg-white"
                                    }`}
                            >
                                <h5 className="fw-bold mb-2">
                                    {reservation.lieu_depart}{" "}
                                    <span className="text-success">→</span>{" "}
                                    {reservation.destination}
                                </h5>

                                <div className="d-flex align-items-center gap-3 mb-3">

                                    {/* Avatar */}
                                    <div
                                        className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center"
                                        style={{ width: 40, height: 40 }}
                                    >
                                        <i className="bi bi-person-fill text-success"></i>
                                    </div>

                                    <div>
                                        <div className="fw-semibold">
                                            {reservation.conducteur_prenom} {reservation.conducteur_nom}
                                        </div>

                                        {reservation.marque && (
                                            <div className="small text-muted">
                                                <div>
                                                    🚗 {reservation.marque} {reservation.modele}
                                                    {reservation.couleur && ` — ${reservation.couleur}`}
                                                </div>

                                                {reservation.plaque && (
                                                    <div className="mt-1">
                                                        <span className="badge bg-dark text-light px-2 py-1">
                                                            {reservation.plaque}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>

                                    <span className="badge bg-success-subtle text-success ms-auto">
                                        Conducteur vérifié
                                    </span>
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

                                    <span className={`badge ${reservation.statut === "ACCEPTEE"
                                            ? "bg-success"
                                            : reservation.statut === "EN_ATTENTE"
                                                ? "bg-warning text-dark"
                                                : "bg-secondary"
                                        }`}>
                                        {reservation.statut}
                                    </span>

                                    {(reservation.statut === "EN_ATTENTE" ||
                                        reservation.statut === "ACCEPTEE") && (
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleAnnuler(reservation.id)}
                                            >
                                                Annuler
                                            </button>
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
