import {Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login"; 
import Dashboard from "./pages/Passager/Dashboard.jsx";
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
    </Routes>
  );
}