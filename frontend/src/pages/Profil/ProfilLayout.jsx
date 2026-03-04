import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate.jsx";
import Footer from "../../components/Footer.jsx";
import ProfilMenu from "./ProfilMenu.jsx";

export default function ProfilLayout() {

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const isDark = theme === "dark";

  useEffect(() => {
    
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  const [user, setUser] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);

  const loadUser = async () => {
    try {
      setLoadingUser(true);

      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      const res = await fetch("http://localhost:5000/utilisateurs/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        return;
      }

      if (!res.ok) return;

      const data = await res.json();
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));

    } catch (err) {
      console.error("Erreur chargement utilisateur", err);
    } finally {
      setLoadingUser(false);
    }
  };
  useEffect(() => {
    loadUser();
  }, []);

  const panelClass =
    "p-4 rounded-4 shadow-sm border " +
    (isDark
      ? "bg-dark bg-opacity-10 border-secondary"
      : "bg-white border-light");

  const panelMinHeight = 280;

  return (
    <div
      className={isDark ? "bg-dark text-light" : "bg-light text-dark"}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <HeaderPrivate
        isDark={isDark}
        onToggleTheme={() =>
          setTheme((t) => (t === "dark" ? "light" : "dark"))
        }
      />

      <main className="py-2 py-md-4" style={{ flexGrow: 1 }}>
        <div className="d-flex justify-content-center">
          <div className="w-100 px-3" style={{ maxWidth: 980 }}>
            <div className="row g-3 g-lg-4 align-items-stretch">

              {/* MENU PROFIL */}
              <div className="col-12 col-lg-4 d-flex">
                <div
                  className={`${panelClass} w-100`}
                  style={{ minHeight: panelMinHeight }}
                >
                  {/* Affiche menu seulement si user chargé */}
                  {loadingUser ? (
                    <div>Chargement...</div>
                  ) : (
                    <ProfilMenu isDark={isDark} user={user} />
                  )}
                </div>
              </div>

              {/* CONTENU ONGLET */}
              <div className="col-12 col-lg-8 d-flex">
                <div
                  className={`${panelClass} w-100`}
                  style={{ minHeight: panelMinHeight }}
                >
                  {/* Transmet user + reloadUser aux enfants */}
                  <Outlet
                    context={{
                      isDark,
                      user,
                      reloadUser: loadUser
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer fixé en bas */}
      <div className="mt-auto">
        <Footer isDark={isDark} />
      </div>
    </div>
  );
}
