import React, { useState, useEffect } from "react";
import axios from "axios";
import "./home.css";      
import "./register.css";   

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  // small reveal anim
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((errs) => ({ ...errs, [e.target.name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage("");

    try {
    
      const res = await axios.post("/api/register", form);
      const { token, user } = res.data || {};
      if (token) localStorage.setItem("token", token);
      setMessage(`Dobrodošao/la, ${user?.name || "trkaču"}!`);
      // redirect po želji:
      // window.location.href = "/run-events";
    } catch (err) {
      // Laravel validation errors
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Nešto nije u redu. Pokušaj ponovo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hp auth-page">
      {/* HERO header */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <div className="brand reveal">
            <span className="brand__tag">RUN • CONNECT • THRIVE</span>
            <h1 className="brand__title">
              Napravi nalog — <span className="grad">pridruži se zajednici</span>
            </h1>
            <p className="brand__lead">
              Registruj se i kreni sa planovima trčanja, grupnim događajima i ličnom statistikom za well-being.
            </p>
          </div>
        </div>
      </section>

      {/* FORM CARD */}
      <section className="section reveal">
        <div className="auth">
          <form className="card auth__card" onSubmit={submit} noValidate>
            <h2 className="grad auth__title">Registracija</h2>

            {/* Name */}
            <label className="fld">
              <span>Ime i prezime</span>
              <input
                name="name"
                type="text"
                placeholder="npr. Ana Trkač"
                value={form.name}
                onChange={onChange}
                required
              />
              {errors.name && <small className="err">{errors.name[0]}</small>}
            </label>

            {/* Email */}
            <label className="fld">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="ana@example.com"
                value={form.email}
                onChange={onChange}
                required
              />
              {errors.email && <small className="err">{errors.email[0]}</small>}
            </label>

            {/* Password */}
            <label className="fld">
              <span>Lozinka</span>
              <div className="fld__pass">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="min 6 karaktera"
                  value={form.password}
                  onChange={onChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn--tiny fld__toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label="Prikaži sakrij lozinku"
                >
                  {showPass ? "Sakrij" : "Prikaži"}
                </button>
              </div>
              {errors.password && <small className="err">{errors.password[0]}</small>}
            </label>

            {/* Role (opciono) */}
            <label className="fld">
              <span>Uloga</span>
              <select name="role" value={form.role} onChange={onChange}>
                <option value="user">Korisnik</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <small className="err">{errors.role[0]}</small>}
            </label>

            {/* Status / poruke */}
            {message && <div className="note">{message}</div>}

            <div className="auth__actions">
              <button className="btn btn--primary" disabled={loading}>
                {loading ? "Kreiram nalog..." : "Registruj se"}
              </button>
              <a href="/login" className="btn btn--ghost">Imam nalog</a>
            </div>

            <p className="auth__tos">
              Registracijom prihvataš uslove korišćenja i politiku privatnosti.
            </p>
          </form>

          {/* B-side: benefits */}
          <aside className="auth__aside card">
            <h3>Zašto RunTogether?</h3>
            <ul className="bullets">
              <li>Planovi trčanja sa tačnom rutom i vremenom.</li>
              <li>Pridruži se grupnim događajima u tvom gradu.</li>
              <li>Statistike: tempo, distanca, kalorije, napredak.</li>
              <li>Well-being saveti: san, ishrana, mobilnost.</li>
            </ul>

            <div className="auth__highlights">
              <div className="hl">
                <strong>1.5k+</strong>
                <span>trkača</span>
              </div>
              <div className="hl">
                <strong>12k</strong>
                <span>zajedničkih km</span>
              </div>
              <div className="hl">
                <strong>92%</strong>
                <span>više motivacije</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FOOTER mini */}
      <footer className="footer">
        <div className="footer__grid">
          <div>
            <h4 className="grad">RunTogether</h4>
            <p>Kreiraj nalog i trči pametnije — uz zajednicu i dobre navike.</p>
          </div>
          <nav>
            <h5>Navigacija</h5>
            <ul>
              <li><a href="/run-events">Događaji</a></li>
              <li><a href="/run-plans">Planovi</a></li>
              <li><a href="/">Početna</a></li>
            </ul>
          </nav>
          <div>
            <h5>Pomoć</h5>
            <ul>
              <li><a href="/login">Prijava</a></li>
              <li><a href="/register">Registracija</a></li>
            </ul>
          </div>
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} RunTogether</p>
      </footer>
    </main>
  );
}
