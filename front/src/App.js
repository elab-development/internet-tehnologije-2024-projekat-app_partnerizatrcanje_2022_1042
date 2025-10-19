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
import RunPlans from "./pages/RunPlans";
import RunPlanUpsert from "./pages/RunPlanUpsert";
import RunPlanDetail from "./pages/RunPlanDetail";
import NearbyMap from "./pages/NearbyMap";
import MyStats from "./pages/MyStats";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStats from "./pages/admin/AdminStats";

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


            <Route path="/run-plans" element={<RunPlans />} />
            <Route path="/run-plans/new" element={<RunPlanUpsert />} />
            <Route path="/run-plans/:id" element={<RunPlanDetail />} />
            <Route path="/run-plans/:id/edit" element={<RunPlanUpsert />} />


            <Route path="/nearby" element={<NearbyMap />} />
            <Route path="/mojestatistike" element={<MyStats />} />


          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/stats" element={<AdminStats />} />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </>
  );
}
