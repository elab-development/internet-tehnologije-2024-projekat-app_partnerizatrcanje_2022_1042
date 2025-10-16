import React, { useState, useMemo } from "react";
import { NavLink, Link } from "react-router-dom";
import "./navbar.css";

export default function Navbar({
  brand = { label: "RunTogether", to: "/" },
  links = [
    { to: "/", label: "Početna" },
    { to: "/run-events", label: "Događaji" },
  ],
  guestLinks = [
    { to: "/login", label: "Prijava" },
    { to: "/register", label: "Registracija" },
  ],
  authedLinks = [
    // ovde možeš dodati npr. { to: "/run-plans", label: "Planovi" }
  ],
  onLogout,              // opciono: async () => {}
  showLogout = true,     // prikaz "Odjava" ako postoji token
}) {
  const [open, setOpen] = useState(false);

  // prost check — po želji kontrolu prebaci u globalni state/context
  const isAuthed = useMemo(() => !!localStorage.getItem("token"), []);

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        // default: samo ukloni token (ako želiš pravi logout API poziv, prosledi onLogout iz App-a)
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } finally {
      setOpen(false);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link to={brand.to} className="navbar__brand grad">
          {brand.label}
        </Link>

        <button
          className="navbar__burger"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar__menu ${open ? "is-open" : ""}`}>
          <ul className="navbar__links">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `navbar__link ${isActive ? "is-active" : ""}`
                  }
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="navbar__right">
            {!isAuthed &&
              guestLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `btn btn--ghost btn--tiny navbar__cta ${isActive ? "is-active" : ""}`
                  }
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}

            {isAuthed && (
              <>
                {authedLinks.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      `btn btn--ghost btn--tiny navbar__cta ${isActive ? "is-active" : ""}`
                    }
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </NavLink>
                ))}
                {showLogout && (
                  <button className="btn btn--primary btn--tiny" onClick={handleLogout}>
                    Odjava
                  </button>
                )}
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
