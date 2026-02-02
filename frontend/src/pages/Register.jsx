import { useState } from "react";
import { api } from "../services/api";

export default function Register() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!prenom || !nom || !email || !motDePasse) {
      setError("Tous les champs sont obligatoires");
      return;
    }
    if (motDePasse.length < 6) {
      setError("Mot de passe : minimum 6 caractères");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/register", {
        prenom,
        nom,
        email,
        motDePasse,
      });

      const token = res.data.token;
      const user = res.data.user || res.data.utilisateur;

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      setSuccess("Inscription réussie ✅");

      setPrenom("");
      setNom("");
      setEmail("");
      setMotDePasse("");
    } catch (err) {
      const msg = err?.response?.data?.error || "Erreur d'inscription";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Inscription</h2>

      {error && <div style={{ background: "#ffe6e6", padding: 10, marginBottom: 10 }}>{error}</div>}
      {success && <div style={{ background: "#e6ffea", padding: 10, marginBottom: 10 }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <label>Prénom</label>
        <input
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>Nom</label>
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>Mot de passe</label>
        <input
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Inscription..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
}
