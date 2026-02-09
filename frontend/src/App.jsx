import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Passager/Dashboard.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";


import ProfilLayout from "./pages/Profil/ProfilLayout.jsx";
import ProfilInfos from "./pages/Profil/ProfilInfos.jsx";
import ProfilVoitures from "./pages/Profil/ProfilVoitures.jsx";
import ProfilParametres from "./pages/Profil/ProfilParametres.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";


export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    localStorage.setItem("theme", theme);

    // Tailwind dark mode
    document.documentElement.classList.toggle("dark", theme === "dark");

    // Optionnel : bootstrap
    document.body.dataset.bsTheme = theme;
  }, [theme]);
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/passager" element={<Dashboard />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />


      <Route path="/profil" element={<ProfilLayout />}>
        <Route index element={<ProfilInfos />} />
        <Route path="infos" element={<ProfilInfos />} />
        <Route path="voitures" element={<ProfilVoitures />} />
        <Route path="parametres" element={<ProfilParametres />} />
      </Route>
    </Routes>
  );
}