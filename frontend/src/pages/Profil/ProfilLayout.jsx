import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate.jsx";
import Footer from "../../components/Footer.jsx";
import ProfilMenu from "./ProfilMenu.jsx";

export default function ProfilLayout() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.bsTheme = theme;
  }, [theme]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const panelClass =
    "p-4 rounded-4 shadow-sm border " +
    (isDark ? "bg-dark bg-opacity-10 border-secondary" : "bg-white border-light");

  // ✅ Même hauteur visuelle, peu importe l’onglet
  const panelMinHeight = 560;

  return (
    <div
      className={isDark ? "bg-dark text-light" : "bg-light text-dark"}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <HeaderPrivate
        isDark={isDark}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />

      {/* ✅ main prend tout l’espace disponible */}
      <main className="py-4" style={{ flexGrow: 1 }}>
        <div className="d-flex justify-content-center">
          <div className="w-100 px-3" style={{ maxWidth: 980 }}>
            <div className="row g-3 g-lg-4 align-items-stretch">
              <div className="col-12 col-lg-4 d-flex">
                <div className={`${panelClass} w-100`} style={{ minHeight: panelMinHeight }}>
                  <ProfilMenu isDark={isDark} user={user} />
                </div>
              </div>

              <div className="col-12 col-lg-8 d-flex">
                <div className={`${panelClass} w-100`} style={{ minHeight: panelMinHeight }}>
                  <Outlet context={{ isDark, user }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ✅ Le plus important: pousse le footer tout en bas */}
      <div className="mt-auto">
        <Footer isDark={isDark} style={{ backgroundColor: "#268249" }} />
      </div>
    </div>
  );
}
