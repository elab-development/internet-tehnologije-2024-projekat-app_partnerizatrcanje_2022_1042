import "./App.css";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import RunEvents from "./pages/RunEvents";
import { Routes, Route, Navigate, Link, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

/* -------- helper: scroll na vrh na promenu rute -------- */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* -------- opcionalno: zaštita ruta (RequireAuth) -------- */
function RequireAuth() {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />

      <nav style={{padding:"10px 16px", borderBottom:"1px solid #1f2937", display:"flex", gap:12}}>
        <Link to="/">Početna</Link>
        <Link to="/run-events">Događaji</Link>
        <Link to="/login">Prijava</Link>
        <Link to="/register">Registracija</Link>
      </nav>

      <Routes>
        {/* Javno */}
        <Route path="/" element={<Home />} />
        <Route path="/run-events" element={<RunEvents />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />



        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
