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
        window.scrollTo(0, 0);
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
            <main className="flex-grow-1 py-3 py-md-5">

                <div className="container" style={{ maxWidth: 900 }}>

                    {/* ================= HERO ================= */}
                    <div className="text-center mb-3 mb-md-5">
                        <h1 className="fw-bold mb-2 fs-4 fs-md-2">
                            Devenir Conducteur sur CampusRide
                        </h1>
                        <p className="text-muted small">
                            Partagez vos trajets, réduisez vos coûts et contribuez
                            à une mobilité étudiante plus durable.
                        </p>
                    </div>

                    {/* ================= BENEFICES ================= */}
                    <div className="row g-3 mb-3 mb-md-5">

                        <div className="col-12 col-md-4">
                            <div className={`p-3 rounded-4 shadow-sm h-100 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}>
                                <i className="bi bi-cash-coin fs-4 text-success mb-2 d-block"></i>
                                <h5 className="fw-bold fs-6">Économisez</h5>
                                <p className="text-muted small mb-0">
                                    Réduisez vos frais d’essence et d’entretien en partageant vos trajets.
                                </p>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className={`p-3 rounded-4 shadow-sm h-100 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}>
                                <i className="bi bi-people fs-4 text-success mb-2 d-block"></i>
                                <h5 className="fw-bold fs-6">Rencontrez</h5>
                                <p className="text-muted small mb-0">
                                    Voyagez avec d’autres étudiants et élargissez votre réseau.
                                </p>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className={`p-3 rounded-4 shadow-sm h-100 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}>
                                <i className="bi bi-globe fs-4 text-success mb-2 d-block"></i>
                                <h5 className="fw-bold fs-6">Impact écologique</h5>
                                <p className="text-muted small mb-0">
                                    Réduisez l’empreinte carbone en limitant le nombre de voitures.
                                </p>
                            </div>
                        </div>

                    </div>
                    <div className="mb-3 mb-md-5">
                        <h3 className="fw-bold mb-3 text-center fs-5">Comment ça fonctionne ?</h3>

                        <div className="row g-2 text-center">

                            <div className="col-12 col-md-4">
                                <div className="p-3">
                                    <div className="fs-2 text-success fw-bold">1</div>
                                    <h6 className="fw-semibold mt-1">Publiez votre trajet</h6>
                                    <p className="text-muted small mb-0">
                                        Indiquez votre départ, destination et horaires.
                                    </p>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="p-3">
                                    <div className="fs-2 text-success fw-bold">2</div>
                                    <h6 className="fw-semibold mt-1">Recevez des demandes</h6>
                                    <p className="text-muted small mb-0">
                                        Les passagers réservent vos places disponibles.
                                    </p>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="p-3">
                                    <div className="fs-2 text-success fw-bold">3</div>
                                    <h6 className="fw-semibold mt-1">Voyagez ensemble</h6>
                                    <p className="text-muted small mb-0">
                                        Partagez le trajet et les frais en toute simplicité.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="mb-3 mb-md-5">
                        <h3 className="fw-bold mb-3 text-center fs-5">
                            Comment devenir conducteur ?
                        </h3>

                        <div className="row g-2 text-center">

                            <div className="col-12 col-md-4">
                                <div className="p-3">
                                    <div className="fs-2 text-success fw-bold">1</div>
                                    <h6 className="fw-semibold mt-1">Ajouter votre véhicule</h6>
                                    <p className="text-muted small mb-0">
                                        Enregistrez votre voiture dans votre profil.
                                    </p>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="p-3">
                                    <div className="fs-2 text-success fw-bold">2</div>
                                    <h6 className="fw-semibold mt-1">Publier un trajet</h6>
                                    <p className="text-muted small mb-0">
                                        Indiquez votre départ, destination et horaires.
                                    </p>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="p-3">
                                    <div className="fs-2 text-success fw-bold">3</div>
                                    <h6 className="fw-semibold mt-1">Recevoir des réservations</h6>
                                    <p className="text-muted small mb-0">
                                        Les passagers réservent vos places disponibles.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="text-center mt-3">
                        <button
                            className="btn btn-success rounded-pill px-4 fw-bold"
                            onClick={() => navigate("/profil/voitures")}
                        >
                            Ajouter mon véhicule
                        </button>
                    </div>


                </div>
            </main>

            {/* ================= FOOTER ================= */}
            <Footer isDark={isDark} />
        </div>
    );
}
