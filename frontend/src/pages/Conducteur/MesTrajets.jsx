import { useEffect, useState } from "react";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";
import PlacesInput from "../../components/PlacesInput";

export default function MesTrajets() {
    const [trajets, setTrajets] = useState([]);
    const [filtre, setFiltre] = useState("TOUS");
    const [theme] = useState(() => localStorage.getItem("theme") || "light");
    const isDark = theme === "dark";
    const token = localStorage.getItem("token");

    // ===== Edition inline =====
    const [editId, setEditId] = useState(null);
    const [draft, setDraft] = useState({
        lieu_depart: "",
        destination: "",
        dateheure_depart: "",
    });
    const [loadingSave, setLoadingSave] = useState(false);

    // ===== Toast (popup) =====
    const [toast, setToast] = useState({
        show: false,
        text: "",
        variant: "success",
    });

    const showToast = (text, variant = "success") => {
        setToast({ show: true, text, variant });
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => {
            setToast((p) => ({ ...p, show: false }));
        }, 2500);
    };

    useEffect(() => {
        document.body.dataset.bsTheme = theme;
    }, [theme]);

    // Helpers
    const toDatetimeLocalValue = (isoString) => {
        if (!isoString) return "";
        const d = new Date(isoString);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
            d.getHours()
        )}:${pad(d.getMinutes())}`;
    };

    // Fetch trajets
    const fetchMesTrajets = async () => {
        try {
            const response = await fetch("/trajets/mes-trajets", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setTrajets(data);
        } catch (err) {
            console.error(err);
            showToast("Erreur chargement trajets.", "danger");
        }
    };

    useEffect(() => {
        fetchMesTrajets();
    }, [token]);

    // Filtres
    const trajetsActifs = trajets.filter(
        (t) => t.statut === "PLANIFIE" || t.statut === "EN_COURS"
    );
    const trajetsTermines = trajets.filter((t) => t.statut === "TERMINE");
    const trajetsAnnules = trajets.filter((t) => t.statut === "ANNULE");

    // Terminer
    const handleTerminer = async (id) => {
        try {
            const response = await fetch(`/trajets/${id}/terminer`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.message || "Impossible de terminer.");

            setTrajets((prev) =>
                prev.map((t) => (t.id === id ? { ...t, statut: "TERMINE" } : t))
            );

            showToast("Trajet terminé ✅", "success");
        } catch (err) {
            showToast(err.message || "Impossible de terminer ce trajet.", "danger");
        }
    };

    // Annuler
    const handleAnnuler = async (id) => {
        try {
            const response = await fetch(`/trajets/${id}/annuler`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.message || "Impossible d'annuler.");

            setTrajets((prev) =>
                prev.map((t) => (t.id === id ? { ...t, statut: "ANNULE" } : t))
            );

            showToast("Trajet annulé ✅", "secondary");
        } catch (err) {
            showToast(err.message || "Impossible d'annuler ce trajet.", "danger");
        }
    };

    // Edition
    const startEdit = (trajet) => {
        setEditId(trajet.id);
        setDraft({
            lieu_depart: trajet.lieu_depart || "",
            destination: trajet.destination || "",
            dateheure_depart: toDatetimeLocalValue(trajet.dateheure_depart),
        });
    };

    const cancelEdit = () => {
        setEditId(null);
        setDraft({ lieu_depart: "", destination: "", dateheure_depart: "" });
    };

    const saveEdit = async () => {
        try {
            setLoadingSave(true);

            if (!draft.lieu_depart.trim() || !draft.destination.trim()) {
                showToast("Lieu de départ et destination sont requis.", "danger");
                return;
            }
            if (!draft.dateheure_depart) {
                showToast("Date & heure de départ est requise.", "danger");
                return;
            }

            const iso = new Date(draft.dateheure_depart).toISOString();

            const response = await fetch(`/trajets/${editId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    lieu_depart: draft.lieu_depart,
                    destination: draft.destination,
                    dateheure_depart: iso,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || "Erreur modification.");
            }

            setTrajets((prev) => prev.map((t) => (t.id === editId ? data.trajet : t)));

            cancelEdit();
            showToast("Trajet modifié ✅", "success");
        } catch (err) {
            showToast(err.message || "Erreur modification trajet.", "danger");
        } finally {
            setLoadingSave(false);
        }
    };

    // Badge UI

    const getBadge = (statut) => {
        if (statut === "TERMINE") return { cls: "bg-secondary-subtle text-secondary", label: "Terminé" };
        if (statut === "ANNULE") return { cls: "bg-danger-subtle text-danger", label: "Annulé" };
        return { cls: "bg-success-subtle text-success", label: "Actif" };
    };

    // Card
    const renderCard = (trajet) => {
        const dateObj = new Date(trajet.dateheure_depart);
        const isActif = trajet.statut === "PLANIFIE" || trajet.statut === "EN_COURS";
        const isEditing = editId === trajet.id;

        const pourcentage =
            trajet.places_total > 0
                ? (trajet.places_reservees / trajet.places_total) * 100
                : 0;

        const badge = getBadge(trajet.statut);

        const showActionsRow = !isEditing && isActif && trajet.statut !== "ANNULE" && trajet.statut !== "TERMINE";

        return (
            <div
                key={trajet.id}
                className={`rounded-4 shadow-sm p-3 p-md-4 mb-3 transition-card fade-in ${isDark ? "bg-dark border border-secondary" : "bg-white"
                    }`}
            >
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="w-100">
                        <span className="text-success fw-bold small text-uppercase">Conducteur</span>

                        {!isEditing ? (
                            <h5 className="fw-bold mb-1">
                                {trajet.lieu_depart} <span className="text-success">→</span> {trajet.destination}
                            </h5>
                        ) : (
                            <div className="d-flex flex-column gap-2 mt-2">
                                <PlacesInput
                                    className="form-control"
                                    placeholder="Lieu de départ"
                                    value={draft.lieu_depart}
                                    onChange={(val) => setDraft((p) => ({ ...p, lieu_depart: val }))}
                                />
                                <PlacesInput
                                    className="form-control"
                                    placeholder="Destination"
                                    value={draft.destination}
                                    onChange={(val) => setDraft((p) => ({ ...p, destination: val }))}
                                />
                            </div>
                        )}
                    </div>

                    <span className={`badge rounded-pill px-3 py-2 fw-semibold transition-card ${badge.cls}`}>
                        {badge.label}
                    </span>
                </div>

                {/* Date / Heure */}
                {!isEditing ? (
                    <div className="d-flex gap-4 text-muted small mb-4">
                        <div>
                            <i className="bi bi-calendar-event me-2" />
                            {dateObj.toLocaleDateString()}
                        </div>
                        <div>
                            <i className="bi bi-clock me-2" />
                            {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                    </div>
                ) : (
                    <div className="mb-4">
                        <label className="form-label text-muted small">Date & heure de départ</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            value={draft.dateheure_depart}
                            onChange={(e) => setDraft((p) => ({ ...p, dateheure_depart: e.target.value }))}
                        />
                        <div className="text-muted small mt-2">
                            Les passagers acceptés seront notifiés après sauvegarde (si réservations acceptées).
                        </div>
                    </div>
                )}

                {/* Places */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between small mb-2">
                        <span className="text-muted">Places réservées</span>
                        <span className="fw-bold text-success">
                            {trajet.places_reservees}/{trajet.places_total}
                        </span>
                    </div>

                    <div className="progress rounded-pill" style={{ height: 8 }}>
                        <div className="progress-bar bg-success" style={{ width: `${pourcentage}%` }} />
                    </div>
                </div>

                {/* ===== Actions ===== */}
                {trajet.statut === "PLANIFIE" && isEditing && (
                    <div className="d-flex gap-2 mb-2">
                        <button
                            className="btn btn-success btn-sm flex-fill rounded-3 fw-semibold"
                            onClick={saveEdit}
                            disabled={loadingSave}
                        >
                            {loadingSave ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                        <button
                            className="btn btn-outline-secondary btn-sm flex-fill rounded-3 fw-semibold"
                            onClick={cancelEdit}
                            disabled={loadingSave}
                        >
                            Annuler
                        </button>
                    </div>
                )}

                {showActionsRow && (
                    <div className="d-flex gap-2 mb-2">
                        <button
                            className="btn btn-outline-success btn-sm flex-fill rounded-3 fw-semibold"
                            disabled={trajet.statut !== "PLANIFIE"}
                            onClick={() => startEdit(trajet)}
                            title={trajet.statut !== "PLANIFIE" ? "Modification possible فقط قبل départ" : ""}
                        >
                            Modifier
                        </button>

                        <button
                            className="btn btn-outline-danger btn-sm flex-fill rounded-3 fw-semibold"
                            onClick={() => {
                                if (window.confirm("Confirmer l'annulation de ce trajet ?")) {
                                    handleAnnuler(trajet.id);
                                }
                            }}
                        >
                            Annuler
                        </button>

                        <button
                            className="btn btn-outline-danger btn-sm flex-fill rounded-3 fw-semibold"
                            onClick={() => handleTerminer(trajet.id)}
                        >
                            Terminer
                        </button>
                    </div>
                )}

                {/* Fallback: si pas en ligne (ex: terminé/annulé) on garde un bouton info */}
                {!showActionsRow && !isEditing && (
                    <button
                        className={`btn w-100 rounded-4 fw-semibold py-2 ${trajet.statut === "TERMINE"
                                ? "btn-secondary"
                                : trajet.statut === "ANNULE"
                                    ? "btn-outline-danger"
                                    : "btn-outline-danger"
                            }`}
                        disabled
                    >
                        {trajet.statut === "TERMINE"
                            ? "Trajet terminé"
                            : trajet.statut === "ANNULE"
                                ? "Trajet annulé"
                                : "—"}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <HeaderPrivate isDark={isDark} />

            {/* Toast (popup) */}
            {toast.show && (
                <div className="position-fixed top-0 start-50 translate-middle-x p-3" style={{ zIndex: 9999 }}>
                    <div
                        className={`toast show align-items-center text-white border-0 shadow ${toast.variant === "success"
                                ? "bg-success"
                                : toast.variant === "danger"
                                    ? "bg-danger"
                                    : "bg-secondary"
                            }`}
                        role="alert"
                    >
                        <div className="d-flex">
                            <div className="toast-body fw-semibold">{toast.text}</div>
                            <button
                                type="button"
                                className="btn-close btn-close-white me-2 m-auto"
                                aria-label="Close"
                                onClick={() => setToast((p) => ({ ...p, show: false }))}
                            />
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow-1 py-4">
                <div className="container" style={{ maxWidth: 720 }}>
                    <h4 className="fw-bold mb-3">Mes Trajets</h4>

                    {/* Toggle */}
                    <div className="d-flex gap-2 mb-3">
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

                    {/* Affichage */}
                    <div className="fade show">
                        {(filtre === "TOUS" || filtre === "ACTIFS") && trajetsActifs.map(renderCard)}

                        {(filtre === "TOUS" || filtre === "TERMINES") &&
                            [...trajetsTermines, ...trajetsAnnules].map(renderCard)}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}