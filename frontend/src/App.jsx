import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Passager/Dashboard.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

// Passager 
import Search from "./pages/Passager/Search.jsx";
import Post from "./pages/Passager/Post.jsx";
import Trajets from "./pages/Passager/Trajets.jsx";
import Aide from "./pages/Passager/Aide.jsx";
import MesReservations from "./pages/Passager/MesReservations.jsx";
import Messages from "./pages/Passager/Messages.jsx";


//Conducteur
import MesTrajets from "./pages/Conducteur/MesTrajets.jsx";
import ReservationsRecues from "./pages/Conducteur/ReservationsRecues.jsx";


import ProfilLayout from "./pages/Profil/ProfilLayout.jsx";
import ProfilInfos from "./pages/Profil/ProfilInfos.jsx";
import ProfilVoitures from "./pages/Profil/ProfilVoitures.jsx";
import ProfilParametres from "./pages/Profil/ProfilParametres.jsx";


import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import InstallBanner from "./components/InstallBanner.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";

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
    <>
    <InstallBanner />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/passager" element={<Dashboard />} />
      <Route path="/passager/search" element={<Search />} />
      <Route path="/passager/post" element={<Post />} />
      <Route path="/passager/trajets" element={<Trajets />} />
      <Route path="/passager/aide" element={<Aide />} />
      <Route path="/passager/mes-reservations" element={<MesReservations />} />
      <Route path="/passager/messages" element={<Messages />} />

    
      <Route path="/conducteur/mes-trajets" element={<MesTrajets />} />
      <Route path="/conducteur/reservations-recues" element={<ReservationsRecues />}
/>


      <Route path="/disclaimer" element={<Disclaimer />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route path="/profil" element={<ProfilLayout />}>
        <Route index element={<ProfilInfos />} />
        <Route path="infos" element={<ProfilInfos />} />
        <Route path="voitures" element={<ProfilVoitures />} />
        <Route path="parametres" element={<ProfilParametres />} />
      </Route>
    </Routes>
    </>
  );
}