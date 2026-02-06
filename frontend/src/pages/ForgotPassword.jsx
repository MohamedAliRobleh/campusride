import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
    const isDark = theme === "dark";

    useEffect(() => {
        localStorage.setItem("theme", theme);
        document.body.dataset.bsTheme = theme;
    }, [theme]);

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState("");
    const [error, setError] = useState("");

    const handleSend = async (e) => {
        e.preventDefault();
        setError("");
        setInfo("");

        if (!email) {
            setError("Email obligatoire.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setError(data?.error || "Erreur lors de l’envoi.");
                setLoading(false);
                return;
            }

            // Message générique (même si email inexistant)
            setInfo(data?.message || "Si le compte existe, un email a été envoyé.");
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
            setError("Erreur réseau/serveur.");
        }
    };

    return (
        <div className={isDark ? "bg-dark text-light" : "bg-light text-dark"} style={{ minHeight: "100vh" }}>
            <Header isDark={isDark} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />

            <main className="py-4">
                <div className="d-flex justify-content-center">
                    <div className="w-100 px-3" style={{ maxWidth: 520 }}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <button
                                type="button"
                                className={`btn btn-sm ${isDark ? "btn-outline-light" : "btn-outline-dark"}`}
                                onClick={() => navigate("/login")}
                                aria-label="Retour"
                                title="Retour"
                            >
                                <i className="bi bi-arrow-left" />
                            </button>

                            <h2 className="m-0 fw-bold" style={{ letterSpacing: "-0.2px" }}>
                                Mot de passe oublié
                            </h2>

                            <span style={{ width: 34 }} />
                        </div>

                        <form
                            onSubmit={handleSend}
                            className="d-grid gap-3 p-4 rounded-4 shadow-sm border bg-dark bg-opacity-10 border-secondary"
                        >
                            {error && (
                                <div className="alert alert-danger py-2 mb-0" role="alert">
                                    {error}
                                </div>
                            )}

                            {info && (
                                <div className="alert alert-success py-2 mb-0" role="alert">
                                    {info}
                                </div>
                            )}

                            <div>
                                <label className="form-label fw-semibold">Courriel</label>
                                <input
                                    className="form-control form-control-lg"
                                    type="email"
                                    placeholder="nom@lacite.on.ca"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                                <div className={isDark ? "text-secondary mt-2" : "text-muted mt-2"}>
                                    On t’enverra un lien de réinitialisation si le compte existe.
                                </div>
                            </div>

                            <button type="submit" className="btn btn-success btn-lg" disabled={loading}>
                                {loading ? "Envoi..." : "Envoyer le lien"}
                            </button>

                            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/login")}>
                                Retour à la connexion
                            </button>
                        </form>

                        <div style={{ height: 24 }} />
                    </div>
                </div>
            </main>

            <Footer isDark={isDark} style={{ backgroundColor: "#268249 " }} />
        </div>
    );
}
