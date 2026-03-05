import { useState, useEffect } from "react";

// ── Données voitures ──────────────────────────────────────────────────────────
const CAR_DATA = {
  "Toyota":      ["Camry", "Corolla", "RAV4", "Highlander", "Prius", "Yaris", "4Runner", "Sienna", "Tacoma", "Tundra", "Venza", "C-HR"],
  "Honda":       ["Civic", "Accord", "CR-V", "HR-V", "Pilot", "Fit", "Odyssey", "Ridgeline", "Insight", "Passport"],
  "Ford":        ["F-150", "Mustang", "Escape", "Explorer", "Edge", "Bronco", "Fusion", "Focus", "Expedition", "Ranger"],
  "Chevrolet":   ["Silverado", "Malibu", "Equinox", "Traverse", "Tahoe", "Suburban", "Spark", "Blazer", "Camaro", "Colorado"],
  "Hyundai":     ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Ioniq", "Venue", "Palisade", "Accent"],
  "Kia":         ["Forte", "K5", "Sportage", "Sorento", "Soul", "Stinger", "Telluride", "Seltos", "Carnival"],
  "Nissan":      ["Altima", "Sentra", "Rogue", "Murano", "Frontier", "Versa", "Pathfinder", "Kicks", "Armada", "Titan"],
  "Mazda":       ["Mazda3", "Mazda6", "CX-5", "CX-9", "CX-30", "MX-5 Miata", "CX-50"],
  "Volkswagen":  ["Jetta", "Golf", "Passat", "Tiguan", "Atlas", "Taos", "ID.4"],
  "Subaru":      ["Impreza", "Legacy", "Outback", "Forester", "Crosstrek", "WRX", "Ascent", "BRZ"],
  "BMW":         ["Série 3", "Série 5", "Série 1", "X3", "X5", "X1", "X6", "M3", "M5"],
  "Mercedes-Benz": ["Classe C", "Classe E", "Classe A", "GLC", "GLE", "GLA", "CLA", "AMG GT"],
  "Audi":        ["A3", "A4", "A6", "Q3", "Q5", "Q7", "TT", "e-tron"],
  "Dodge":       ["Charger", "Challenger", "Durango", "Ram 1500", "Hornet"],
  "Jeep":        ["Wrangler", "Cherokee", "Grand Cherokee", "Compass", "Renegade", "Gladiator"],
  "GMC":         ["Sierra", "Terrain", "Acadia", "Canyon", "Yukon", "Envoy"],
  "Chrysler":    ["300", "Pacifica", "Voyager"],
  "Mitsubishi":  ["Eclipse Cross", "Outlander", "RVR", "Galant"],
  "Volvo":       ["S60", "S90", "XC40", "XC60", "XC90", "V60"],
  "Lexus":       ["ES", "IS", "RX", "NX", "GX", "UX", "LS"],
  "Acura":       ["TLX", "MDX", "RDX", "ILX", "NSX"],
  "Infiniti":    ["Q50", "Q60", "QX50", "QX60", "QX80"],
  "Cadillac":    ["CT4", "CT5", "Escalade", "XT4", "XT5", "XT6"],
  "Lincoln":     ["Corsair", "Nautilus", "Aviator", "Navigator"],
  "Buick":       ["Envision", "Encore", "Enclave", "LeSabre"],
  "Pontiac":     ["G6", "Vibe", "Grand Prix", "Bonneville"],
  "Tesla":       ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  "Porsche":     ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Autre":       ["Autre modèle"],
};

const MARQUES = Object.keys(CAR_DATA).sort();

const COULEURS = [
  "Blanc", "Noir", "Gris", "Argent", "Rouge", "Bleu",
  "Vert", "Jaune", "Orange", "Beige", "Marron", "Bordeaux",
  "Violet", "Rose", "Turquoise", "Or",
];

const currentYear = new Date().getFullYear();
const ANNEES = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

const NB_PLACES = [2, 3, 4, 5, 6, 7, 8];

// ── Composant champ select ────────────────────────────────────────────────────
function SelectField({ label, icon, value, onChange, options, placeholder, isDark, disabled }) {
  const selectClass = `border-0 bg-transparent form-select p-0 shadow-none ${isDark ? "text-light" : ""}`;
  return (
    <div>
      <label className="form-label" style={{ color: "#198754", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
        {label}
      </label>
      <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
        <i className={`bi ${icon} text-success me-2`} style={{ fontSize: "0.85rem", flexShrink: 0 }} />
        <select
          className={selectClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{ fontSize: "0.88rem" }}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Composant champ texte ─────────────────────────────────────────────────────
function TextField({ label, icon, value, onChange, placeholder, isDark, hint }) {
  return (
    <div>
      <label className="form-label" style={{ color: "#198754", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
        {label}
      </label>
      <div className={`d-flex align-items-center rounded-3 ${isDark ? "bg-dark border border-secondary" : "bg-light"}`} style={{ padding: "0.35rem 0.65rem" }}>
        <i className={`bi ${icon} text-success me-2`} style={{ fontSize: "0.85rem", flexShrink: 0 }} />
        <input
          type="text"
          className={`border-0 bg-transparent form-control p-0 shadow-none ${isDark ? "text-light" : ""}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          style={{ fontSize: "0.88rem", fontFamily: "monospace", letterSpacing: "0.08em" }}
        />
      </div>
      {hint && <div className={`mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>{hint}</div>}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export default function ModalAjouterVoiture({ show, onClose, isDark, vehicule }) {
  const [marque, setMarque]   = useState("");
  const [modele, setModele]   = useState("");
  const [annee, setAnnee]     = useState("");
  const [couleur, setCouleur] = useState("");
  const [plaque, setPlaque]   = useState("");
  const [nbPlaces, setNbPlaces] = useState("4");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const modeles = marque ? (CAR_DATA[marque] || []) : [];

  useEffect(() => {
    if (vehicule) {
      setMarque(vehicule.marque || "");
      setModele(vehicule.modele || "");
      setAnnee(String(vehicule.annee || ""));
      setCouleur(vehicule.couleur || "");
      setPlaque(vehicule.plaque || "");
      setNbPlaces(String(vehicule.nb_places || "4"));
    } else {
      setMarque(""); setModele(""); setAnnee("");
      setCouleur(""); setPlaque(""); setNbPlaces("4");
    }
    setError(null);
  }, [vehicule, show]);

  // Reset modèle si marque change
  useEffect(() => {
    if (!vehicule || vehicule.marque !== marque) setModele("");
  }, [marque]);

  if (!show) return null;

  const handleSubmit = async () => {
    if (!marque) { setError("Veuillez sélectionner une marque."); return; }
    if (!modele) { setError("Veuillez sélectionner un modèle."); return; }
    if (!plaque.trim()) { setError("La plaque d'immatriculation est requise."); return; }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const method = vehicule ? "PATCH" : "POST";
      const url = vehicule ? "/vehicules/me" : "/vehicules";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          marque,
          modele,
          annee: annee ? Number(annee) : null,
          couleur: couleur || null,
          plaque: plaque.trim().toUpperCase(),
          nb_places: Number(nbPlaces),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || data.message || "Erreur serveur"); return; }
      onClose();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const isComplete = marque && modele && plaque.trim() && nbPlaces;

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ zIndex: 10000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className={`rounded-4 shadow-lg w-100 overflow-hidden ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}
          style={{ maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
        >
          {/* Header */}
          <div style={{ height: 3, background: "linear-gradient(90deg, #198754, #20c374)" }} />
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40, background: "rgba(25,135,84,0.1)" }}
              >
                <i className="bi bi-car-front-fill text-success" style={{ fontSize: "1.1rem" }} />
              </div>
              <div>
                <div className="fw-bold" style={{ fontSize: "1rem" }}>
                  {vehicule ? "Modifier le véhicule" : "Ajouter un véhicule"}
                </div>
                <div className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem" }}>
                  {vehicule ? "Mettez à jour les informations de votre voiture." : "Enregistrez votre voiture pour proposer des trajets."}
                </div>
              </div>
              <button
                type="button"
                className={`btn-close ms-auto ${isDark ? "btn-close-white" : ""}`}
                onClick={onClose}
              />
            </div>

            {/* Section Marque + Modèle */}
            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle bg-success d-flex align-items-center justify-content-center text-white flex-shrink-0" style={{ width: 20, height: 20, fontSize: "0.65rem", fontWeight: 700 }}>1</div>
                <span className="fw-semibold" style={{ fontSize: "0.82rem" }}>Identification du véhicule</span>
              </div>
              <div className="d-flex flex-column gap-2 ps-4">
                <SelectField
                  label="Marque"
                  icon="bi-car-front"
                  value={marque}
                  onChange={setMarque}
                  options={MARQUES}
                  placeholder="Sélectionner une marque"
                  isDark={isDark}
                />
                <SelectField
                  label="Modèle"
                  icon="bi-list-ul"
                  value={modele}
                  onChange={setModele}
                  options={modeles}
                  placeholder={marque ? "Sélectionner un modèle" : "Choisir une marque d'abord"}
                  isDark={isDark}
                  disabled={!marque}
                />
              </div>
            </div>

            <hr className={isDark ? "border-secondary" : ""} />

            {/* Section Détails */}
            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle bg-success d-flex align-items-center justify-content-center text-white flex-shrink-0" style={{ width: 20, height: 20, fontSize: "0.65rem", fontWeight: 700 }}>2</div>
                <span className="fw-semibold" style={{ fontSize: "0.82rem" }}>Détails du véhicule</span>
              </div>
              <div className="row g-2 ps-4">
                <div className="col-6">
                  <SelectField
                    label="Année"
                    icon="bi-calendar3"
                    value={annee}
                    onChange={setAnnee}
                    options={ANNEES.map(String)}
                    placeholder="Année"
                    isDark={isDark}
                  />
                </div>
                <div className="col-6">
                  <SelectField
                    label="Couleur"
                    icon="bi-palette"
                    value={couleur}
                    onChange={setCouleur}
                    options={COULEURS}
                    placeholder="Couleur"
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>

            <hr className={isDark ? "border-secondary" : ""} />

            {/* Section Immatriculation + Places */}
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle bg-success d-flex align-items-center justify-content-center text-white flex-shrink-0" style={{ width: 20, height: 20, fontSize: "0.65rem", fontWeight: 700 }}>3</div>
                <span className="fw-semibold" style={{ fontSize: "0.82rem" }}>Immatriculation & capacité</span>
              </div>
              <div className="d-flex flex-column gap-2 ps-4">
                <TextField
                  label="Plaque d'immatriculation"
                  icon="bi-credit-card-2-front"
                  value={plaque}
                  onChange={setPlaque}
                  placeholder="Ex: ABCD 123"
                  isDark={isDark}
                  hint="La plaque sera automatiquement mise en majuscules."
                />

                {/* Sélection nombre de places avec boutons */}
                <div>
                  <label className="form-label d-block" style={{ color: "#198754", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                    Nombre de places passagers
                  </label>
                  <div className="d-flex gap-1 flex-wrap">
                    {NB_PLACES.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`btn rounded-3 fw-semibold ${Number(nbPlaces) === n ? "btn-success" : isDark ? "btn-outline-secondary" : "btn-outline-secondary"}`}
                        style={{ fontSize: "0.85rem", minWidth: 42 }}
                        onClick={() => setNbPlaces(String(n))}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className={`mt-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                    <i className="bi bi-info-circle me-1" />
                    {nbPlaces} place{Number(nbPlaces) > 1 ? "s" : ""} disponible{Number(nbPlaces) > 1 ? "s" : ""} pour les passagers
                  </div>
                </div>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="alert alert-danger py-2 rounded-3 mb-3" style={{ fontSize: "0.85rem" }}>
                <i className="bi bi-exclamation-triangle-fill me-2" />
                {error}
              </div>
            )}

            {/* Boutons */}
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn rounded-3 fw-semibold flex-fill ${isDark ? "btn-outline-secondary" : "btn-outline-secondary"}`}
                style={{ fontSize: "0.88rem" }}
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-success rounded-3 fw-semibold flex-fill"
                style={{ fontSize: "0.88rem" }}
                onClick={handleSubmit}
                disabled={loading || !isComplete}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</>
                  : <><i className="bi bi-check-lg me-2" />{vehicule ? "Mettre à jour" : "Enregistrer"}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
