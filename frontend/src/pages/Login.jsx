import { useState } from "react";
import { api } from "../services/api";

export default function Login() {
  // 1) États du formulaire
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  // 2) États UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 3) Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // petite validation côté UI
    if (!email || !motDePasse) {
      setError("Email et mot de passe obligatoires");
      return;
    }
    try {
      setLoading(true);
      // Appel backend
      const res = await api.post("/auth/login", {
        email,
        motDePasse,
      });
      // res.data = { message, user, token }
      const { token, user } = res.data;
      // Stocker token + user (simple)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setSuccess("Connexion réussie ✅");
      setMotDePasse(""); // on vide le champ mot de passe
    } catch (err) {
      // Axios met souvent le message ici :
      const msg = err?.response?.data?.error || "Erreur de connexion";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2>Connexion</h2>

      {error && (
        <div style={{ background: "#ffe6e6", padding: 10, marginBottom: 10 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: "#e6ffea", padding: 10, marginBottom: 10 }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ex: musta@test.com"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <label>Mot de passe</label>
        <input
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="******"
          style={{ width: "100%", padding: 10, margin: "6px 0 12px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10, cursor: "pointer" }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
