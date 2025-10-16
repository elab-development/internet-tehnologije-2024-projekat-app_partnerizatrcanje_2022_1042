import React, { useEffect, useState } from "react";
import axios from "axios";
import "./home.css";
import "./register.css"; // reuse stilova za formu/kartice

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

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
      // axios.defaults.baseURL = 'http://localhost:8000'; // po potrebi
      const res = await axios.post("/api/login", form);
      const { token, user } = res.data || {};
      if (token) localStorage.setItem("token", token);
      setMessage(`Dobrodošao/la nazad, ${user?.name || "trkaču"}!`);
      // window.location.href = "/run-events"; // ili tvoj dashboard
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Greška pri prijavi. Pokušaj ponovo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hp auth-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <div className="brand reveal">
            <span className="brand__tag">RUN • CONNECT • THRIVE</span>
            <h1 className="brand__title">
              Prijavi se i <span className="grad">nastavi gde si stao/la</span>
            </h1>
            <p className="brand__lead">
              Pristupi planovima, događajima i ličnoj statistici — sve na jednom mestu.
            </p>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="section reveal">
        <div className="auth">
          <form className="card auth__card" onSubmit={submit} noValidate>
            <h2 className="grad auth__title">Prijava</h2>

            {/* Email */}
            <label className="fld">
              <span>Email</span>
              <input
                name="email"
                type="email"
                placeholder="tvoj@email.com"
                value={form.email}
                onChange={onChange}
                required
              />
              {errors.email && <small className="err">{errors.email[0]}</small>}
            </label>

            {/* Lozinka */}
            <label className="fld">
              <span>Lozinka</span>
              <div className="fld__pass">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="unesi lozinku"
                  value={form.password}
                  onChange={onChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn--tiny fld__toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label="Prikaži/sakrij lozinku"
                >
                  {showPass ? "Sakrij" : "Prikaži"}
                </button>
              </div>
              {errors.password && <small className="err">{errors.password[0]}</small>}
            </label>

            {message && <div className="note">{message}</div>}

            <div className="auth__actions">
              <button className="btn btn--primary" disabled={loading}>
                {loading ? "Prijavljujem..." : "Prijavi se"}
              </button>
              <a href="/register" className="btn btn--ghost">Nemam nalog</a>
            </div>

            <p className="auth__tos" style={{opacity:.8}}>
              Zaboravljena lozinka? <a className="link" href="/forgot">Resetuj lozinku</a>
            </p>
          </form>

          {/* Info panel */}
          <aside className="auth__aside card">
            <h3>Vrati se u ritam</h3>
            <ul className="bullets">
              <li>Proveri predstojeće događaje i prijavi se.</li>
              <li>Pregledaj svoj plan nedeljnog trčanja.</li>
              <li>Analiziraj tempo i ukupnu distancu.</li>
            </ul>

            <div className="auth__highlights">
              <div className="hl">
                <strong>+10%</strong>
                <span>više trčanja</span>
              </div>
              <div className="hl">
                <strong>+15%</strong>
                <span>brži pace</span>
              </div>
              <div className="hl">
                <strong>100%</strong>
                <span>podrška ekipe</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__grid">
          <div>
            <h4 className="grad">RunTogether</h4>
            <p>Prijavi se i trči pametnije — zajednica, planovi i statistika.</p>
          </div>
          <nav>
            <h5>Navigacija</h5>
            <ul>
              <li><a href="/">Početna</a></li>
              <li><a href="/run-events">Događaji</a></li>
              <li><a href="/run-plans">Planovi</a></li>
            </ul>
          </nav>
          <div>
            <h5>Pomoć</h5>
            <ul>
              <li><a href="/register">Registracija</a></li>
              <li><a href="/forgot">Zaboravljena lozinka</a></li>
            </ul>
          </div>
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} RunTogether</p>
      </footer>
    </main>
  );
}
