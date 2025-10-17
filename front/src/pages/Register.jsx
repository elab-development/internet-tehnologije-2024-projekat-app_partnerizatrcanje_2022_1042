import React, { useState, useEffect } from "react";
import axios from "axios";
import "./home.css";
import "./register.css";
import AuthHero from "../components/auth/AuthHero";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Note } from "../components/ui/Note";

export default function Register() {
  const [form, setForm] = useState({ name: "Test", email: "test@gmail.com", password: "password", role: "user" });
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
      const res = await axios.post("http://127.0.0.1:8000/api/register", form);
      const { token, user } = res.data || {};
      if (token) localStorage.setItem("token", token);
      setMessage(`Dobrodošao/la, ${user?.name || "trkaču"}!`);
      // window.location.href = "/run-events";
    } catch (err) {
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
      <AuthHero
        title={<>Napravi nalog — <span className="grad">pridruži se zajednici</span></>}
        lead="Registruj se i kreni sa planovima, događajima i ličnom statistikom za well-being."
      />

      <section className="section reveal">
        <div className="auth">
          <form className="card auth__card" onSubmit={submit} noValidate>
            <h2 className="grad auth__title">Registracija</h2>

            <Input
              label="Ime i prezime"
              name="name"
              placeholder="npr. Ana Trkač"
              value={form.name}
              onChange={onChange}
              error={errors.name?.[0]}
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="ana@example.com"
              value={form.email}
              onChange={onChange}
              error={errors.email?.[0]}
              required
            />

            <PasswordInput
              name="password"
              placeholder="min 6 karaktera"
              value={form.password}
              onChange={onChange}
              error={errors.password?.[0]}
              required
            />

            <Select
              label="Uloga"
              name="role"
              value={form.role}
              onChange={onChange}
              options={[
                { value: "user", label: "Korisnik" },
                { value: "admin", label: "Admin" },
              ]}
              error={errors.role?.[0]}
            />

            <Note>{message}</Note>

            <div className="auth__actions">
              <Button disabled={loading}>{loading ? "Kreiram nalog..." : "Registruj se"}</Button>
              <a href="/login" className="btn btn--ghost">Imam nalog</a>
            </div>

            <p className="auth__tos">
              Registracijom prihvataš uslove korišćenja i politiku privatnosti.
            </p>
          </form>

          <aside className="auth__aside card">
            <h3>Zašto RunTogether?</h3>
            <ul className="bullets">
              <li>Planovi trčanja sa tačnom rutom i vremenom.</li>
              <li>Pridruži se grupnim događajima u tvom gradu.</li>
              <li>Statistike: tempo, distanca, kalorije, napredak.</li>
              <li>Well-being saveti: san, ishrana, mobilnost.</li>
            </ul>

            <div className="auth__highlights">
              <div className="hl"><strong>1.5k+</strong><span>trkača</span></div>
              <div className="hl"><strong>12k</strong><span>zajedničkih km</span></div>
              <div className="hl"><strong>92%</strong><span>više motivacije</span></div>
            </div>
          </aside>
        </div>
      </section>

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
