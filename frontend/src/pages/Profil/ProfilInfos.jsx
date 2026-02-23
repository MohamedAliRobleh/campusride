import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export default function ProfilInfos() {

  const { isDark, user, reloadUser } = useOutletContext();

  const [editMode, setEditMode] = useState(false);

  const [telephone, setTelephone] = useState("");
  const [zones, setZones] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setTelephone(user.telephone || "");
      setZones(user.zones_depart_preferees?.join(", ") || "");
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/utilisateurs/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          telephone,
          zones_depart_preferees: zones
            .split(",")
            .map(z => z.trim())
            .filter(z => z !== "")
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur serveur");
        return;
      }

      setEditMode(false);
      reloadUser(); 

    } catch (err) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Chargement...</div>;

  return (
    <div className={`rounded-4 border shadow-sm p-4 ${isDark ? "bg-dark bg-opacity-25 border-secondary" : "bg-white"}`}>

      <h4 className="fw-bold mb-3">Informations personnelles</h4>

      <div className="mb-3">
        <strong>Nom:</strong> {user.prenom} {user.nom}
      </div>

      <div className="mb-3">
        <strong>Email:</strong> {user.email}
      </div>

      <div className="mb-3">
        <strong>Rôle:</strong> 
        <span className={`badge ms-2 ${user.role === "CONDUCTEUR" ? "bg-success" : "bg-secondary"}`}>
          {user.role}
        </span>
      </div>

      {/* TELEPHONE */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Téléphone</label>
        {editMode ? (
          <input
            className="form-control"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
          />
        ) : (
          <div>{user.telephone || "Non renseigné"}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">Zones préférées (séparées par virgule)</label>
        {editMode ? (
          <input
            className="form-control"
            value={zones}
            onChange={(e) => setZones(e.target.value)}
          />
        ) : (
          <div>{user.zones_depart_preferees?.join(", ") || "Aucune zone"}</div>
        )}
      </div>

      {error && <div className="text-danger mb-3">{error}</div>}

      <div className="d-flex gap-2">

        {editMode ? (
          <>
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              className="btn btn-outline-secondary"
              onClick={() => setEditMode(false)}
            >
              Annuler
            </button>
          </>
        ) : (
          <button
            className="btn btn-outline-primary"
            onClick={() => setEditMode(true)}
          >
            Modifier
          </button>
        )}

      </div>

    </div>
  );
}