import React, { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import "./navbar.css";

export default function Navbar({
  brand = { label: "RunTogether", to: "/" },
  links = [{ to: "/", label: "Početna" }],
  guestLinks = [
    { to: "/login", label: "Prijava" },
    { to: "/register", label: "Registracija" },
  ],
  authedLinks = [
    { to: "/run-events", label: "Događaji" },
    { to: "/run-plans", label: "Planovi" },
    { to: "/run-plans/new", label: "Kreiraj plan" },
    { to: "/nearby", label: "Mapa" },
    { to: "/mojestatistike", label: "Moje statistike" },
  ],
  onLogout,
  showLogout = true,
}) {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(!!localStorage.getItem("token"));
  const { pathname } = useLocation();

  // Helper koji sinhronizuje stanje sa localStorage
  const refreshAuth = () => setIsAuthed(!!localStorage.getItem("token"));

  // Reaguj na promenu rute (npr. posle uspešnog logina redirect)
  useEffect(() => {
    refreshAuth();
  }, [pathname]);

  // Reaguj na promene u drugim tabovima + fokus + custom event "auth:changed"
  useEffect(() => {
    const handler = () => refreshAuth();
    window.addEventListener("storage", handler);       // drugi tabovi
    window.addEventListener("focus", handler);         // povratak u tab
    window.addEventListener("auth:changed", handler);  // ručno emitujemo posle logina/odjave
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("focus", handler);
      window.removeEventListener("auth:changed", handler);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        // default: očisti lokalno; ako imaš API /api/logout poziv, stavi ga u onLogout iz App-a
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
      }
    } finally {
      // obavesti sve (isti tab i ostali delovi app-a) da se auth promenio
      window.dispatchEvent(new Event("auth:changed"));
      setOpen(false);
      // po želji i navigacija:
      window.location.href = "/login";
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
                    `btn btn--ghost btn--tiny navbar__cta ${
                      isActive ? "is-active" : ""
                    }`
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
                      `btn btn--ghost btn--tiny navbar__cta ${
                        isActive ? "is-active" : ""
                      }`
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
