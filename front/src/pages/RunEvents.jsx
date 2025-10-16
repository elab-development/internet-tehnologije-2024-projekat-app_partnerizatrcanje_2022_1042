import React, { useEffect, useMemo, useState } from "react";
 
import "./home.css";
import "./run-events.css";  
import api from "../api";
 
const STATUS_OPTS = [
  { value: "", label: "Svi statusi" },
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const MINE_OPTS = [
  { value: "", label: "Svi događaji" },
  { value: "organized", label: "Moji (organizovani)" },
  { value: "participating", label: "Na koje idem" },
];

function useDebouncedValue(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function RunEvents() {
  // filteri
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q);
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mine, setMine] = useState("");
  const [perPage, setPerPage] = useState(12);

  // podaci
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // stranica iz URL-a
  const getPageFromUrl = () => {
    const p = new URLSearchParams(window.location.search).get("page");
    const n = parseInt(p || "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };
  const [page, setPage] = useState(getPageFromUrl());

  // sync page u URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page));
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [page]);

  const queryParams = useMemo(() => {
    const p = {
      page,
      per_page: perPage,
    };
    if (dq) p.q = dq;
    if (status) p.status = status;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    if (mine) p.mine = mine;
    return p;
  }, [dq, status, dateFrom, dateTo, perPage, mine, page]);

  const fetchEvents = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await api.get("/api/run-events", { params: queryParams });
      const data = res.data;
      // Laravel resource pagination: data, meta, links
      setItems(data.data || []);
      setMeta(data.meta || null);
    } catch (err) {
      setErrMsg("Neuspešno učitavanje događaja. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  };

  // učitaj na promenu filtera/stranice
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const resetFilters = () => {
    setQ("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setMine("");
    setPerPage(12);
    setPage(1);
  };

  const gotoPage = (p) => {
    if (!meta) return;
    if (p >= 1 && p <= meta.last_page) setPage(p);
  };

  return (
    <main className="hp">
      {/* HERO */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="hero__content">
          <div className="brand reveal">
            <span className="brand__tag">RUN • EVENTS • COMMUNITY</span>
            <h1 className="brand__title">
              Događaji u tvojoj blizini <span className="grad">— pridruži se</span>
            </h1>
            <p className="brand__lead">
              Pretraži trke i treninge, filtriraj po statusu i terminu i nađi ekipu.
            </p>
          </div>
        </div>
      </section>

      {/* FILTER TRAKA */}
      <section className="section reveal">
        <div className="re-bar card">
          <div className="re-row">
            <div className="re-col">
              <label className="re-lbl">Pretraga (lokacija)</label>
              <input
                className="re-input"
                type="text"
                placeholder="npr. Ada Ciganlija"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
              />
            </div>

            <div className="re-col">
              <label className="re-lbl">Status</label>
              <select
                className="re-input"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="re-col">
              <label className="re-lbl">Od datuma</label>
              <input
                className="re-input"
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>

            <div className="re-col">
              <label className="re-lbl">Do datuma</label>
              <input
                className="re-input"
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>

            <div className="re-col">
              <label className="re-lbl">Moji događaji</label>
              <select
                className="re-input"
                value={mine}
                onChange={(e) => { setMine(e.target.value); setPage(1); }}
              >
                {MINE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="re-col re-col--small">
              <label className="re-lbl">Po stranici</label>
              <select
                className="re-input"
                value={perPage}
                onChange={(e) => { setPerPage(parseInt(e.target.value,10)); setPage(1); }}
              >
                {[6, 12, 24].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="re-actions">
            <button className="btn btn--ghost" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </section>

      {/* LISTA DOGAĐAJA */}
      <section className="section reveal">
        {loading && <div className="note">Učitavanje...</div>}
        {errMsg && <div className="note">{errMsg}</div>}
        {!loading && !items.length && !errMsg && (
          <div className="note">Nema rezultata za odabrane filtere.</div>
        )}

        <div className="events">
          {items.map((e) => (
            <EventCard key={e.id} ev={e} />
          ))}
        </div>

        {/* PAGINACIJA */}
        {meta && meta.last_page > 1 && (
          <Pagination meta={meta} onGoto={gotoPage} />
        )}
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer__grid">
          <div>
            <h4 className="grad">RunTogether</h4>
            <p>Pridruži se treningu i trči pametnije — zajedno je lakše.</p>
          </div>
          <nav>
            <h5>Navigacija</h5>
            <ul>
              <li><a href="/">Početna</a></li>
              <li><a href="/run-plans">Planovi</a></li>
              <li><a href="/run-stats">Statistika</a></li>
            </ul>
          </nav>
          <div>
            <h5>Nalog</h5>
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

/* ---- pomoćne komponente ---- */

function EventCard({ ev }) {
  // ev dolazi iz RunEventResource u index() sa withCount i organizer
  const start = ev.start_time ? new Date(ev.start_time) : null;
  const when =
    start
      ? start.toLocaleString(undefined, {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "short",
        })
      : "TBA";

  const distance = ev.distance_km != null ? `${Number(ev.distance_km)} km` : "–";

  return (
    <article className="event card tilt">
      <div className="event__meta">
        <span className="event__when">{when}</span>
        <span className="badge">{ev.status}</span>
      </div>
      <h3 className="event__title">{ev.location || "Nepoznata lokacija"}</h3>
      <p className="event__desc">
        Distanca: <strong>{distance}</strong>
      </p>

      <div className="event__extra">
        <span className="pill">
          👥 {ev.participants_count ?? 0}
        </span>
        <span className="pill">
          💬 {ev.comments_count ?? 0}
        </span>
        <span className="pill">
          👤 {ev.organizer?.name || "Organizator"}
        </span>
      </div>

      <div className="event__actions">
        <a className="btn btn--tiny" href={`/run-events/${ev.id}`}>Detalj</a>
        <a className="btn btn--ghost btn--tiny" href={`/run-events/${ev.id}#join`}>Pridruži se</a>
      </div>
    </article>
  );
}

function Pagination({ meta, onGoto }) {
  const pages = useMemo(() => {
    const max = meta.last_page;
    const cur = meta.current_page;
    const arr = [];
    // kompaktan range: oko trenutne po 2
    const from = Math.max(1, cur - 2);
    const to = Math.min(max, cur + 2);
    for (let i = from; i <= to; i++) arr.push(i);
    if (!arr.includes(1)) arr.unshift(1);
    if (!arr.includes(max)) arr.push(max);
    return [...new Set(arr)].sort((a,b)=>a-b);
  }, [meta]);

  return (
    <div className="re-pag">
      <button className="btn btn--tiny" onClick={() => onGoto(meta.current_page - 1)} disabled={meta.current_page <= 1}>
        ← Prethodna
      </button>

      <div className="re-pages">
        {pages.map((p, i) => {
          const isGap =
            i > 0 && pages[i] - pages[i - 1] > 1;
          return (
            <React.Fragment key={p}>
              {isGap && <span className="re-gap">…</span>}
              <button
                className={`re-page ${p === meta.current_page ? "is-active" : ""}`}
                onClick={() => onGoto(p)}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <button className="btn btn--tiny" onClick={() => onGoto(meta.current_page + 1)} disabled={meta.current_page >= meta.last_page}>
        Sledeća →
      </button>
    </div>
  );
}
