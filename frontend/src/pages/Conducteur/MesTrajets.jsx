// src/pages/Conducteur/MesTrajets.jsx

import { useEffect, useState } from "react";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";

export default function MesTrajets() {

    const [trajets, setTrajets] = useState([]);
    const [filtre, setFiltre] = useState("TOUS"); // TOUS | ACTIFS | TERMINES
    const [theme] = useState(() => localStorage.getItem("theme") || "light");
    const isDark = theme === "dark";
    const token = localStorage.getItem("token");

    useEffect(() => {
        document.body.dataset.bsTheme = theme;
    }, [theme]);

    // ===============================
    // Charger trajets
    // ===============================
    useEffect(() => {
        const fetchMesTrajets = async () => {
            try {
                const response = await fetch("/trajets/mes-trajets", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const data = await response.json();
                setTrajets(data);

            } catch (err) {
                console.error(err);
            }
        };

        fetchMesTrajets();
    }, []);

    // ===============================
    // Séparation Actifs / Terminés
    // ===============================
    const trajetsActifs = trajets.filter(
        t => t.statut === "PLANIFIE" || t.statut === "EN_COURS"
    );

    const trajetsTermines = trajets.filter(
        t => t.statut === "TERMINE"
    );

    const handleTerminer = async (id) => {
        try {
            const response = await fetch(`/trajets/${id}/terminer`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error();

            setTrajets(prev =>
                prev.map(t =>
                    t.id === id ? { ...t, statut: "TERMINE" } : t
                )
            );

        } catch (err) {
            alert("Impossible de terminer ce trajet.");
        }
    };

    const renderCard = (trajet) => {

        const dateObj = new Date(trajet.dateheure_depart);
        const isActif =
            trajet.statut === "PLANIFIE" ||
            trajet.statut === "EN_COURS";

        const pourcentage =
            trajet.places_total > 0
                ? (trajet.places_reservees / trajet.places_total) * 100
                : 0;

        return (
            <div
                key={trajet.id}
                className={`rounded-4 shadow-sm p-4 mb-4 transition-card fade-in ${isDark ? "bg-dark border border-secondary" : "bg-white"
                    }`} >
                <div className="d-flex justify-content-between align-items-start mb-3">

                    <div>
                        <span className="text-success fw-bold small text-uppercase">
                            Conducteur
                        </span>

                        <h5 className="fw-bold mb-1">
                            {trajet.lieu_depart}{" "}
                            <span className="text-success">→</span>{" "}
                            {trajet.destination}
                        </h5>
                    </div>

                    <span
                        className={`badge rounded-pill px-3 py-2 fw-semibold transition-card ${trajet.statut === "TERMINE"
                                ? "bg-secondary-subtle text-secondary"
                                : "bg-success-subtle text-success"
                            }`}
                    >


                        {trajet.statut === "TERMINE" ? "Terminé" : "Actif"}
                    </span>
                </div>

                <div className="d-flex gap-4 text-muted small mb-4">
                    <div>
                        <i className="bi bi-calendar-event me-2" />
                        {dateObj.toLocaleDateString()}
                    </div>
                    <div>
                        <i className="bi bi-clock me-2" />
                        {dateObj.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                </div>

                <div className="mb-4">
                    <div className="d-flex justify-content-between small mb-2">
                        <span className="text-muted">Places réservées</span>
                        <span className="fw-bold text-success">
                            {trajet.places_reservees}/{trajet.places_total}
                        </span>
                    </div>

                    <div className="progress rounded-pill" style={{ height: 8 }}>
                        <div
                            className="progress-bar bg-success"
                            style={{ width: `${pourcentage}%` }}
                        />
                    </div>
                </div>

                <button
                    className={`btn w-100 rounded-4 fw-semibold py-3 ${isActif ? "btn-outline-danger" : "btn-secondary"}`}
                    disabled={!isActif}
                    onClick={() => handleTerminer(trajet.id)}
                >
                    {isActif ? "Terminer le trajet" : "Trajet terminé"}
                </button>
            </div>
        );
    };

    return (
        <div className="d-flex flex-column min-vh-100">

            <HeaderPrivate isDark={isDark} />

            <main className="flex-grow-1 py-4">
                <div className="container" style={{ maxWidth: 720 }}>

                    <h4 className="fw-bold mb-4">Mes Trajets</h4>

                    {/* ================= TOGGLE ================= */}
                    <div className="d-flex gap-2 mb-4">
                        <button
                            className={`btn btn-sm ${filtre === "TOUS" ? "btn-success" : "btn-outline-success"}`}
                            onClick={() => setFiltre("TOUS")}
                        >
                            Tous
                        </button>

                        <button
                            className={`btn btn-sm ${filtre === "ACTIFS" ? "btn-success" : "btn-outline-success"}`}
                            onClick={() => setFiltre("ACTIFS")}
                        >
                            Actifs
                        </button>

                        <button
                            className={`btn btn-sm ${filtre === "TERMINES" ? "btn-success" : "btn-outline-success"}`}
                            onClick={() => setFiltre("TERMINES")}
                        >
                            Historique
                        </button>
                    </div>

                    {/* ================= AFFICHAGE ================= */}
                    <div className="fade show">

                        {(filtre === "TOUS" || filtre === "ACTIFS") &&
                            trajetsActifs.map(renderCard)
                        }

                        {(filtre === "TOUS" || filtre === "TERMINES") &&
                            trajetsTermines.map(renderCard)
                        }

                    </div>

                </div>
            </main>

            <Footer />

        </div>
    );
}