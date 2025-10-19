import React, { useEffect, useState } from "react";
import axios from "axios";
import "./home.css";
import "./register.css";
import AuthHero from "../components/auth/AuthHero";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Button } from "../components/ui/Button";
import { Note } from "../components/ui/Note";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "mila@example.com", password: "password" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  // Ako postoji token, proveri rolu i preusmeri
  useEffect(() => {
    const existing = localStorage.getItem("token");
    if (!existing) {
      // animacije samo kad nije ulogovan
      const els = document.querySelectorAll(".reveal");
      const io = new IntersectionObserver(
        entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in")),
        { threshold: 0.12 }
      );
      els.forEach(el => io.observe(el));
      return () => io.disconnect();
    }

    // ako je token prisutan, probaj da dobiješ /me i odvedi na odgovarajuću rutu
    (async () => {
      try {
        const meRes = await axios.get(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${existing}` },
        });
        const me = meRes?.data?.data ?? meRes?.data ?? null;
        if (me?.role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/run-plans", { replace: true });
        }
      } catch {
        // ako token nije validan, očisti i ostani na loginu
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
      }
    })();
  }, [navigate]);

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
      // 1) login
      const res = await axios.post(`${API_BASE}/api/login`, form);
      const { token, user_id } = res.data || {};
      if (token) localStorage.setItem("token", token);
      if (user_id) localStorage.setItem("user_id", String(user_id));

      // 2) učitaj /me da vidiš rolu
      let role = null;
      try {
        const meRes = await axios.get(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const me = meRes?.data?.data ?? meRes?.data ?? null;
        role = me?.role ?? null;
        if (me?.id) localStorage.setItem("user_id", String(me.id));
      } catch {
        // ako padne /me, i dalje preusmeri korisnika na default non-admin rutu
      }

      // 3) preusmerenje po roli
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/run-plans", { replace: true });
      }
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
      <AuthHero
        title={
          <>
            Prijavi se i <span className="grad">nastavi gde si stao/la</span>
          </>
        }
        lead="Pristupi planovima, događajima i ličnoj statistici — sve na jednom mestu."
      />

      <section className="section reveal">
        <div className="auth">
          <form className="card auth__card" onSubmit={submit} noValidate>
            <h2 className="grad auth__title">Prijava</h2>

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="tvoj@email.com"
              value={form.email}
              onChange={onChange}
              error={errors.email?.[0]}
              required
            />

            <PasswordInput
              name="password"
              placeholder="unesi lozinku"
              value={form.password}
              onChange={onChange}
              error={errors.password?.[0]}
              required
            />

            {message ? <Note>{message}</Note> : null}

            <div className="auth__actions">
              <Button disabled={loading}>
                {loading ? "Prijavljujem..." : "Prijavi se"}
              </Button>
              <a href="/register" className="btn btn--ghost">
                Nemam nalog
              </a>
            </div>

            <p className="auth__tos" style={{ opacity: 0.8 }}>
              Zaboravljena lozinka?{" "}
              <a className="link" href="/forgot">
                Resetuj lozinku
              </a>
            </p>
          </form>

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

      <footer className="footer">
        <div className="footer__grid">
          <div>
            <h4 className="grad">RunTogether</h4>
            <p>Prijavi se i trči pametnije — zajednica, planovi i statistika.</p>
          </div>
          <nav>
            <h5>Navigacija</h5>
            <ul>
              <li>
                <a href="/">Početna</a>
              </li>
              <li>
                <a href="/run-events">Događaji</a>
              </li>
              <li>
                <a href="/run-plans">Planovi</a>
              </li>
            </ul>
          </nav>
          <div>
            <h5>Pomoć</h5>
            <ul>
              <li>
                <a href="/register">Registracija</a>
              </li>
              <li>
                <a href="/forgot">Zaboravljena lozinka</a>
              </li>
            </ul>
          </div>
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} RunTogether</p>
      </footer>
    </main>
  );
}
