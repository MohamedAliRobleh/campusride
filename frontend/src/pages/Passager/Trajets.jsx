// src/pages/Passager/Trajets.jsx

import { useEffect, useState } from "react";
import HeaderPrivate from "../../components/HeaderPrivate";
import Footer from "../../components/Footer";

export default function Trajets() {

  const [trajets, setTrajets] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
  const fetchTrajets = async () => {
    try {
      const response = await fetch("/trajets/recherche", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setTrajets(data.trajets);

    } catch (err) {
      console.error(err);
    }
  };

  fetchTrajets();
}, []);


  return (
    <div className="d-flex flex-column min-vh-100">
      <HeaderPrivate />

      <main className="flex-grow-1 py-4">
        <div className="container" style={{ maxWidth: 720 }}>
          <h4 className="fw-bold mb-4">Tous les trajets disponibles</h4>

          {trajets.map((t) => (
            <div key={t.id} className="card shadow-sm mb-3 rounded-4">
              <div className="card-body">
                <h5 className="fw-bold">
                  {t.lieu_depart} → {t.destination}
                </h5>
                <p className="text-muted small mb-1">
                  {new Date(t.dateheure_depart).toLocaleString()}
                </p>
                <span className="badge bg-success">
                  {t.places_dispo} places disponibles
                </span>
              </div>
            </div>
          ))}

        </div>
      </main>

      <Footer />
    </div>
  );
}
