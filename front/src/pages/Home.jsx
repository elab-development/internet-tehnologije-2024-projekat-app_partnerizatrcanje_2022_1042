import React, { useEffect, useState } from "react";

export default function Home() {
  // reveal animacija (samo fade/translate)
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

  // ---- Spoljni API: Unsplash galerija ----
  const [photos, setPhotos] = useState([]);
  const [galleryErr, setGalleryErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Možeš koristiti .env umesto hardkodovanog ključa
        const key =
          import.meta?.env?.VITE_UNSPLASH_ACCESS_KEY ||
          "uXtZdwbexabEXQQQmvTC68aMpSEHk2sIancwrIv2sXM";

        const url = `https://api.unsplash.com/search/photos?query=marathon%20running&per_page=8&orientation=landscape&client_id=${key}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error("unsplash fail");
        const data = await r.json();
        const list = Array.isArray(data?.results) ? data.results : [];
        setPhotos(
          list.map((p) => ({
            id: p.id,
            src: p.urls?.small,
            full: p.urls?.regular,
            alt: p.alt_description || "Marathon photo",
            author: p.user?.name || "Unsplash",
            link: p.links?.html || "#",
          }))
        );
      } catch {
        setGalleryErr("Ne mogu da učitam galeriju.");
        // fallback 4 fotke
        setPhotos([
          { id: "f1", src: "https://images.unsplash.com/photo-1546549039-49e05c58acfb?q=80&w=1200&auto=format&fit=crop", full: "https://images.unsplash.com/photo-1546549039-49e05c58acfb?q=80&w=1600&auto=format&fit=crop", alt: "Finish line", author: "Unsplash", link: "#" },
          { id: "f2", src: "https://images.unsplash.com/photo-1445384763658-0400939829cd?q=80&w=1200&auto=format&fit=crop", full: "https://images.unsplash.com/photo-1445384763658-0400939829cd?q=80&w=1600&auto=format&fit=crop", alt: "Runner city", author: "Unsplash", link: "#" },
          { id: "f3", src: "https://images.unsplash.com/photo-1502810190503-8303352d3bdc?q=80&w=1200&auto=format&fit=crop", full: "https://images.unsplash.com/photo-1502810190503-8303352d3bdc?q=80&w=1600&auto=format&fit=crop", alt: "Morning run", author: "Unsplash", link: "#" },
          { id: "f4", src: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1200&auto=format&fit=crop", full: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1600&auto=format&fit=crop", alt: "Trail", author: "Unsplash", link: "#" },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const gradientTitle = {
    fontSize: 32,
    margin: 0,
    lineHeight: 1.15,
    letterSpacing: .2,
    backgroundImage: "linear-gradient(90deg,#86efac,#60a5fa)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  };
  const section = { padding: "56px 24px", maxWidth: 1180, margin: "0 auto" };
  const card = {
    background: "#0f1311",
    border: "1px solid #1d2a24",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 6px 30px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.02)",
  };

  return (
    <main className="hp home">
      {/* HERO */}
      <section style={{ position: "relative", padding: "72px 24px 48px" }}>
        <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto" }}>
          <div className="reveal">
            <div style={{ textAlign: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, letterSpacing: 3, opacity: .8 }}>RUN • CONNECT • THRIVE</span>
            </div>
            <h1 style={{ textAlign: "center", margin: "8px auto 12px", fontSize: 44, lineHeight: 1.1, maxWidth: 960 }}>
              Pronađi partnera za trčanje.
              <span style={{ backgroundImage: "linear-gradient(90deg,#86efac,#60a5fa)", WebkitBackgroundClip: "text", color: "transparent" }}> I postigni više.</span>
            </h1>
            <p style={{ opacity: .9, maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
              Planiraj rutu, pridruži se događajima, beleži statistiku i neguj well-being rutinu uz zajednicu koja motiviše.
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "center" }}>
              <a href="/register" className="btn btn--primary">Kreiraj nalog</a>
            </div>

            <ul style={{ display: "flex", gap: 24, marginTop: 18, padding: 0, listStyle: "none", justifyContent: "center" }}>
              <li style={{ textAlign: "center" }}>
                <strong style={{ fontSize: 20 }}>1.5k+</strong>
                <span style={{ display: "block", opacity: .7 }}>trkača</span>
              </li>
              <li style={{ textAlign: "center" }}>
                <strong style={{ fontSize: 20 }}>12k</strong>
                <span style={{ display: "block", opacity: .7 }}>zajedničkih km</span>
              </li>
              <li style={{ textAlign: "center" }}>
                <strong style={{ fontSize: 20 }}>92%</strong>
                <span style={{ display: "block", opacity: .7 }}>više motivacije</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="reveal" style={{ ...section }}>
        <div className="grid-3">
          {[
            { title: "Plan trčanja", desc: "Kreiraj lični plan (vreme, lokacija, distanca), sačuvaj rutu i pozovi ekipu." },
            { title: "Događaji u blizini", desc: "Pridruži se grupnim treninzima. Vidljivost po vremenu, statusu i lokaciji." },
            { title: "Napredak & well-being", desc: "Statistike, tempo i kalorije. Navike koje grade dugoročno zdravlje." }
          ].map((b, i) => (
            <article key={i} style={{ ...card, transition: "transform .15s ease, box-shadow .15s ease" }} className="lift">
              <h3 style={{ margin: "0 0 6px" }}>{b.title}</h3>
              <p style={{ opacity: .9, margin: 0 }}>{b.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* MARATHON GALERIJA */}
      <section className="reveal" style={{ ...section, paddingTop: 12 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={gradientTitle}>Marathon galerija</h2>
          {galleryErr && <span style={{ fontSize: 12, opacity: .8 }}>{galleryErr}</span>}
        </header>

        <div className="grid-4">
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={`ph${i}`} style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div className="img-wrap skeleton" />
              <div style={{ padding: 10, height: 34 }} />
            </div>
          ))}

          {!loading && photos.map((p) => (
            <a
              key={p.id}
              href={p.full || p.link || "#"}
              target="_blank"
              rel="noreferrer"
              title={p.alt}
              style={{ ...card, padding: 0, overflow: "hidden", display: "block", textDecoration: "none" }}
              className="lift"
            >
              <div className="img-wrap">
                <img
                  src={p.src}
                  alt={p.alt}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: "linear-gradient(90deg,#60a5fa,#86efac)" }} />
                <span style={{ fontSize: 12, opacity: .85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.author}
                </span>
              </div>
            </a>
          ))}
        </div>

        <p style={{ opacity: .6, fontSize: 12, marginTop: 10 }}>
          Fotografije putem Unsplash API-ja. Za produkciju koristi <code>VITE_UNSPLASH_ACCESS_KEY</code> u <code>.env</code>.
        </p>
      </section>

      {/* CTA */}
      <section className="reveal" style={{ ...section, paddingBottom: 80 }}>
        <div style={{
          ...card,
          textAlign: "center",
          background: "linear-gradient(180deg,#0b0f0d,#0f1311)",
          borderColor: "#1d2a24"
        }} className="lift">
          <h2 style={{ margin: "0 0 8px" }}>Pridruži se zajednici koja motiviše.</h2>
          <p style={{ opacity: .9, marginBottom: 12 }}>Od prvog kilometra do polumaratona — zajedno je lakše.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a href="/register" className="btn btn--primary">Kreni odmah</a>
            <a href="/register" className="btn btn--ghost">Napravi plan</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "36px 24px", borderTop: "1px solid #17211d" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
          <div>
            <h4 style={{ backgroundImage: "linear-gradient(90deg,#86efac,#60a5fa)", WebkitBackgroundClip: "text", color: "transparent", margin: 0 }}>RunTogether</h4>
            <p style={{ opacity: .8 }}>Aplikacija za trkače: planovi, događaji, statistika i podrška zajednice.</p>
          </div>
          <nav>
            <h5>Navigacija</h5>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, opacity: .9 }}>
              <li><a href="/run-events">Događaji</a></li>
              <li><a href="/run-plans">Planovi</a></li>
              <li><a href="/run-stats">Statistika</a></li>
              <li><a href="/login">Prijava</a></li>
            </ul>
          </nav>
          <div>
            <h5>Newsletter</h5>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: 8 }}>
              <input type="email" placeholder="tvoj@email.com" required
                     style={{ flex: 1, background: "#0c0f0e", border: "1px solid #1f2d26", color: "#eee", padding: "8px 10px", borderRadius: 8 }} />
              <button className="btn btn--tiny">Prijavi se</button>
            </form>
          </div>
        </div>
        <p style={{ opacity: .6, textAlign: "center", marginTop: 16 }}>© {new Date().getFullYear()} RunTogether</p>
      </footer>

      {/* lokalni stilovi */}
      <style>{`
        /* reveal */
        .reveal { opacity: 0; transform: translateY(8px); transition: opacity .5s ease, transform .5s ease; }
        .reveal.in { opacity: 1; transform: translateY(0); }

        /* suptilni hover-lift na karticama */
        .lift:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.03); }

        /* gridi */
        .grid-4 { display: grid; grid-template-columns: repeat(4, minmax(220px,1fr)); gap: 14px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(220px,1fr)); gap: 14px; }

        /* fiksna visina slike + skeleton */
        .img-wrap { height: 200px; background: linear-gradient(90deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); }
        .skeleton { position: relative; overflow: hidden; }
        .skeleton::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.05), rgba(255,255,255,0));
          transform: translateX(-100%); animation: shine 1.2s linear infinite;
        }
        @keyframes shine { to { transform: translateX(100%); } }

        /* responsive */
        @media (max-width: 1100px) {
          .grid-4 { grid-template-columns: repeat(3, minmax(200px,1fr)); }
        }
        @media (max-width: 900px) {
          .grid-4 { grid-template-columns: repeat(2, minmax(200px,1fr)); }
          .grid-3 { grid-template-columns: repeat(2, minmax(200px,1fr)); }
          .home h1 { font-size: 36px !important; }
        }
        @media (max-width: 620px) {
          .grid-4, .grid-3 { grid-template-columns: 1fr; }
          .img-wrap { height: 180px; }
        }
      `}</style>
    </main>
  );
}
