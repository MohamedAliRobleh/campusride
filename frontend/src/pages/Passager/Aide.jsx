// src/pages/Passager/Aide.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";

export default function Aide() {

    const navigate = useNavigate();

    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
    const isDark = theme === "dark";

    useEffect(() => {
        document.body.dataset.bsTheme = theme;
    }, [theme]);

    return (
        <div className="d-flex flex-column min-vh-100">

            {/* ================= HEADER ================= */}
            <HeaderPrivate
                isDark={isDark}
                onToggleTheme={() =>
                    setTheme((t) => (t === "dark" ? "light" : "dark"))
                }
            />

            {/* ================= MAIN ================= */}
            <main className="flex-grow-1 py-5">

                <div className="container" style={{ maxWidth: 900 }}>

                    {/* ================= HERO ================= */}
                    <div className="text-center mb-5">
                        <h1 className="fw-bold mb-3">
                            Devenir Conducteur sur CampusRide
                        </h1>
                        <p className="text-muted fs-5">
                            Partagez vos trajets, réduisez vos coûts et contribuez
                            à une mobilité étudiante plus durable.
                        </p>
                    </div>

                    {/* ================= BENEFICES ================= */}
                    <div className="row g-4 mb-5">

                        <div className="col-md-4">
                            <div className={`p-4 rounded-4 shadow-sm h-100 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}>
                                <i className="bi bi-cash-coin fs-2 text-success mb-3"></i>
                                <h5 className="fw-bold">Économisez</h5>
                                <p className="text-muted">
                                    Réduisez vos frais d’essence et d’entretien en partageant vos trajets.
                                </p>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className={`p-4 rounded-4 shadow-sm h-100 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}>
                                <i className="bi bi-people fs-2 text-success mb-3"></i>
                                <h5 className="fw-bold">Rencontrez</h5>
                                <p className="text-muted">
                                    Voyagez avec d’autres étudiants et élargissez votre réseau.
                                </p>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className={`p-4 rounded-4 shadow-sm h-100 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}>
                                <i className="bi bi-globe fs-2 text-success mb-3"></i>
                                <h5 className="fw-bold">Impact écologique</h5>
                                <p className="text-muted">
                                    Réduisez l’empreinte carbone en limitant le nombre de voitures.
                                </p>
                            </div>
                        </div>

                    </div>
                    <div className="mb-5">
                        <h3 className="fw-bold mb-4 text-center">Comment ça fonctionne ?</h3>

                        <div className="row g-4 text-center">

                            <div className="col-md-4">
                                <div className="p-4">
                                    <div className="display-6 text-success fw-bold">1</div>
                                    <h6 className="fw-semibold mt-2">Publiez votre trajet</h6>
                                    <p className="text-muted small">
                                        Indiquez votre départ, destination et horaires.
                                    </p>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="p-4">
                                    <div className="display-6 text-success fw-bold">2</div>
                                    <h6 className="fw-semibold mt-2">Recevez des demandes</h6>
                                    <p className="text-muted small">
                                        Les passagers réservent vos places disponibles.
                                    </p>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="p-4">
                                    <div className="display-6 text-success fw-bold">3</div>
                                    <h6 className="fw-semibold mt-2">Voyagez ensemble</h6>
                                    <p className="text-muted small">
                                        Partagez le trajet et les frais en toute simplicité.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="mb-5">
                        <h3 className="fw-bold mb-4 text-center">
                            Comment devenir conducteur ?
                        </h3>

                        <div className="row g-4 text-center">

                            <div className="col-md-4">
                                <div className="p-4">
                                    <div className="display-6 text-success fw-bold">1</div>
                                    <h6 className="fw-semibold mt-2">Ajouter votre véhicule</h6>
                                    <p className="text-muted small">
                                        Enregistrez votre voiture dans votre profil.
                                    </p>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="p-4">
                                    <div className="display-6 text-success fw-bold">2</div>
                                    <h6 className="fw-semibold mt-2">Publier un trajet</h6>
                                    <p className="text-muted small">
                                        Indiquez votre départ, destination et horaires.
                                    </p>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="p-4">
                                    <div className="display-6 text-success fw-bold">3</div>
                                    <h6 className="fw-semibold mt-2">Recevoir des réservations</h6>
                                    <p className="text-muted small">
                                        Les passagers réservent vos places disponibles.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                    
                    <div className="text-center mt-4">
                        <button
                            className="btn btn-success btn-lg rounded-pill px-5 fw-bold"
                            onClick={() => navigate("/profil/voitures")}
                        >
                            Ajouter mon véhicule
                        </button>
                    </div>


                </div>
            </main>

            {/* ================= FOOTER ================= */}
            <Footer />
        </div>
    );
}
