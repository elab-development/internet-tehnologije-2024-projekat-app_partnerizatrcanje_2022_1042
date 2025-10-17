import "./App.css";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import RunEvents from "./pages/RunEvents";
import { Routes, Route, Navigate, Link, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Breadcrumbs from "./components/Breadcrumbs";
import RunEventDetail from "./pages/RunEventDetail";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}



export default function App() {
  return (
    <>
      <ScrollToTop />

        <Navbar />
          <Breadcrumbs></Breadcrumbs>
          <Routes>
            {/* Javno */}
            <Route path="/" element={<Home />} /> 
            <Route path="/run-events/:id" element={<RunEventDetail />} />
            <Route path="/run-events" element={<RunEvents />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />



            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </>
  );
}
