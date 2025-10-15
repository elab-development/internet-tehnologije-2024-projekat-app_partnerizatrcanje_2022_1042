import React, { useEffect } from "react";
import "./home.css";

export default function Home() {
  // jednostavan scroll-reveal (CSS klasama)
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main className="hp">
      {/* HERO */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <div className="brand reveal">
            <span className="brand__tag">RUN • CONNECT • THRIVE</span>
            <h1 className="brand__title">
              Pronađi partnera za trčanje.
              <span className="grad"> I postigni više.</span>
            </h1>
            <p className="brand__lead">
              Planiraj rutu, pridruži se događajima, beleži statistiku i neguj
              well-being rutinu uz zajednicu koja motiviše.
            </p>

            <div className="cta">
              <a href="/register" className="btn btn--primary">Kreiraj nalog</a>
              <a href="/run-events" className="btn btn--ghost">Istraži događaje</a>
            </div>

            <ul className="hero__stats">
              <li><strong>1.5k+</strong><span>trkača</span></li>
              <li><strong>12k</strong><span>zajedničkih km</span></li>
              <li><strong>92%</strong><span>više motivacije</span></li>
            </ul>
          </div>

          {/* “Running line” animacija */}
          <div className="track reveal">
            <div className="track__runner" aria-hidden="true" />
            <div className="track__line" />
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="grid benefits reveal">
        <article className="card tilt">
          <div className="icon">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </div>
          <h3>Plan trčanja</h3>
          <p>Kreiraj lični plan (vreme, lokacija, distanca), sačuvaj rutu i pozovi ekipu.</p>
        </article>

        <article className="card tilt">
          <div className="icon">
            <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
          </div>
          <h3>Događaji u blizini</h3>
          <p>Pridruži se grupnim treninzima. Vidljivost po vremenu, statusu i lokaciji.</p>
        </article>

        <article className="card tilt">
          <div className="icon">
            <svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18" /></svg>
          </div>
          <h3>Napredak &amp; well-being</h3>
          <p>Statistike, tempo i kalorije. Navike koje grade dugoročno zdravlje.</p>
        </article>
      </section>

      {/* FEATURE STRIP */}
      <section className="strip reveal">
        <div className="strip__item">
          <h4>Pronađi partnera</h4>
          <p>Trči u tandemu — lakše je istrajati kada vas je dvoje.</p>
        </div>
        <div className="strip__item">
          <h4>Mape &amp; rute</h4>
          <p>Interaktivna mapa sa tačkom susreta i planiranom trasom.</p>
        </div>
        <div className="strip__item">
          <h4>Posle trke</h4>
          <p>Komentari, opažanja i sledeći ciljevi — zajednica koja podržava.</p>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="section reveal">
        <header className="section__head">
          <h2 className="grad">Predstojeći događaji</h2>
          <a className="link" href="/run-events">Vidi sve</a>
        </header>
        <div className="events">
          {[
            { when: "Subota, 08:00", where: "Ada Ciganlija", km: 10, tag: "Umereno" },
            { when: "Nedelja, 09:30", where: "Košutnjak", km: 12, tag: "Brdsko" },
            { when: "Uto, 19:00", where: "Ušće", km: 5, tag: "Lagano" },
            { when: "Čet, 06:30", where: "Zemun Kej", km: 7, tag: "Tempo" },
          ].map((e, i) => (
            <article key={i} className="event card tilt">
              <div className="event__meta">
                <span className="event__when">{e.when}</span>
                <span className="badge">{e.tag}</span>
              </div>
              <h3 className="event__title">{e.where}</h3>
              <p className="event__desc">Planirana distanca: <strong>{e.km} km</strong></p>
              <a href="/run-events" className="btn btn--tiny">Pridruži se</a>
            </article>
          ))}
        </div>
      </section>

      {/* STATS / WELL-BEING */}
      <section className="section reveal">
        <header className="section__head">
          <h2>Well-being fokus</h2>
        </header>
        <div className="wb grid">
          <article className="wb__card card">
            <h3>Rutina i san</h3>
            <p>Postavi realne ciljeve. Spavaj 7–9h — oporavak je ključ napretka.</p>
          </article>
          <article className="wb__card card">
            <h3>Ishrana i hidracija</h3>
            <p>Balans proteina i ugljenih hidrata; voda pre i posle trčanja.</p>
          </article>
          <article className="wb__card card">
            <h3>Mobilnost i prevencija</h3>
            <p>Dinamičko zagrevanje + lagano istezanje posle trke smanjuju rizik.</p>
          </article>
          <article className="wb__card card">
            <h3>Mentalna izdržljivost</h3>
            <p>Kratki ciljevi po segmentima rute — fokus i konstantnost.</p>
          </article>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section reveal">
        <header className="section__head">
          <h2 className="grad">Iskustva trkača</h2>
        </header>
        <div className="testi">
          {[
            { name: "Mina", text: "Partneri iz aplikacije su me pogurali da pretrčim prvih 10K!" },
            { name: "Luka", text: "Statistike i tempo su me naučili da treniram pametnije, ne samo jače." },
            { name: "Sara", text: "Grupni treninzi su top — mnogo lakše ustajem rano." }
          ].map((t, i) => (
            <figure key={i} className="testi__item card">
              <blockquote>“{t.text}”</blockquote>
              <figcaption>— {t.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta__wrap reveal">
        <div className="cta__card">
          <h2>Pridruži se zajednici koja motiviše.</h2>
          <p>Od prvog kilometra do polumaratona — zajedno je lakše.</p>
          <div className="cta">
            <a href="/register" className="btn btn--primary pulse">Kreni odmah</a>
            <a href="/run-plans" className="btn btn--ghost">Napravi plan</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__grid">
          <div>
            <h4 className="grad">RunTogether</h4>
            <p>Aplikacija za trkače: planovi, događaji, statistika i podrška zajednice.</p>
          </div>
          <nav>
            <h5>Navigacija</h5>
            <ul>
              <li><a href="/run-events">Događaji</a></li>
              <li><a href="/run-plans">Planovi</a></li>
              <li><a href="/run-stats">Statistika</a></li>
              <li><a href="/login">Prijava</a></li>
            </ul>
          </nav>
          <div>
            <h5>Newsletter</h5>
            <form className="nl" onSubmit={(e)=>e.preventDefault()}>
              <input type="email" placeholder="tvoj@email.com" required />
              <button className="btn btn--tiny">Prijavi se</button>
            </form>
          </div>
        </div>
        <p className="footer__copy">© {new Date().getFullYear()} RunTogether</p>
      </footer>
    </main>
  );
}
