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
import Notifications from "./pages/Passager/Notifications.jsx";


//Conducteur
import MesTrajets from "./pages/Conducteur/MesTrajets.jsx";
import ReservationsRecues from "./pages/Conducteur/ReservationsRecues.jsx";


import ProfilLayout from "./pages/Profil/ProfilLayout.jsx";
import ProfilInfos from "./pages/Profil/ProfilInfos.jsx";
import ProfilVoitures from "./pages/Profil/ProfilVoitures.jsx";
import ProfilParametres from "./pages/Profil/ProfilParametres.jsx";


import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
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
      <Route path="/passager" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/passager/search" element={<PrivateRoute><Search /></PrivateRoute>} />
      <Route path="/passager/post" element={<PrivateRoute><Post /></PrivateRoute>} />
      <Route path="/passager/trajets" element={<PrivateRoute><Trajets /></PrivateRoute>} />
      <Route path="/passager/aide" element={<PrivateRoute><Aide /></PrivateRoute>} />
      <Route path="/passager/mes-reservations" element={<PrivateRoute><MesReservations /></PrivateRoute>} />
      <Route path="/passager/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
      <Route path="/passager/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

      <Route path="/conducteur/mes-trajets" element={<PrivateRoute><MesTrajets /></PrivateRoute>} />
      <Route path="/conducteur/reservations-recues" element={<PrivateRoute><ReservationsRecues /></PrivateRoute>} />

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

      <Route path="/profil" element={<PrivateRoute><ProfilLayout /></PrivateRoute>}>
        <Route index element={<ProfilInfos />} />
        <Route path="infos" element={<ProfilInfos />} />
        <Route path="voitures" element={<ProfilVoitures />} />
        <Route path="parametres" element={<ProfilParametres />} />
      </Route>
    </Routes>
    </>
  );
}