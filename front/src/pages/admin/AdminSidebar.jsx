// src/pages/admin/AdminSidebar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../api";
import "./admin-sidebar.css";

import {
  FiHome,
  FiUsers,
  FiBarChart2,
  FiTrendingUp,
  FiMenu,
  FiLogOut,
} from "react-icons/fi";

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const linkCls = ({ isActive }) =>
    "admin-nav__link" + (isActive ? " is-active" : "");

  async function doLogout() {
    try { await api.post("/api/logout"); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    navigate("/login", { replace: true });
  }

  return (
    <aside className={`admin-aside ${open ? "is-open" : ""}`}>
      <div className="admin-aside__brand">
        <span>Admin</span>
        <button
          className="admin-aside__toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen((s) => !s)}
        >
          <FiMenu size={18} />
        </button>
      </div>

      <nav className="admin-nav">
        <NavLink end to="/admin" className={linkCls}>
          <FiHome className="admin-nav__icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/admin/users" className={linkCls}>
          <FiUsers className="admin-nav__icon" />
          <span>Users</span>
        </NavLink>

        <NavLink to="/admin/stats" className={linkCls}>
          <FiBarChart2 className="admin-nav__icon" />
          <span>Stats</span>
        </NavLink>

        <NavLink to="/admin/run-stats" className={linkCls}>
          <FiTrendingUp className="admin-nav__icon" />
          <span>Run stats</span>
        </NavLink>
      </nav>

      <div className="admin-aside__footer">
        <button className="btn btn--tiny" onClick={doLogout}>
          <FiLogOut style={{ marginRight: 6, verticalAlign: "-2px" }} />
          Odjava
        </button>
      </div>
    </aside>
  );
}
