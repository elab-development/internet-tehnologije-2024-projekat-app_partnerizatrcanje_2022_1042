import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import "./run-plans.css";

function getCurrentUserId() {
 
  const raw = localStorage.getItem("user_id");
  return raw ? parseInt(raw, 10) : undefined;
}

export default function RunPlans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = getCurrentUserId();

  // URL init
  const initPage = parseInt(searchParams.get("page") || "1", 10) || 1;
  const initPerPage = parseInt(searchParams.get("per_page") || "12", 10) || 12;

  // filteri (zadržao minimalno: q + opseg datuma)
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("date_to") || "");
  const [page, setPage] = useState(initPage);
  const [perPage, setPerPage] = useState(initPerPage);

  // podaci
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // sync URL (da možeš share/refresh)
  useEffect(() => {
    const next = { page: String(page), per_page: String(perPage) };
    if (q) next.q = q;
    if (dateFrom) next.date_from = dateFrom;
    if (dateTo) next.date_to = dateTo;
    setSearchParams(next, { replace: true });
  }, [page, perPage, q, dateFrom, dateTo, setSearchParams]);

  const params = useMemo(() => {
    const p = { page, per_page: perPage, user_id: userId }; // **user scope**
    if (q) p.q = q;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  }, [page, perPage, q, dateFrom, dateTo, userId]);

  // učitavanje
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/api/run-plans", { params, signal: ctrl.signal });
        const body = res?.data ?? res;
        setItems(Array.isArray(body?.data) ? body.data : []);
        setMeta(body?.meta ?? null);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr("Ne mogu da učitam planove.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [params]);

  const gotoPage = (p) => {
    if (!meta) return;
    const n = Number(p);
    if (Number.isFinite(n) && n >= 1 && n <= meta.last_page) setPage(n);
  };

  const resetFilters = () => {
    setQ("");
    setDateFrom("");
    setDateTo("");
    setPerPage(12);
    setPage(1);
  };

  const fmtDate = (iso) => {
    if (!iso) return "TBA";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <main className="hp rp">
      <header className="rp__header">
        <h2>Moji planovi trčanja</h2>
        <Link to="/run-plans/new" className="btn btn--primary">+ Novi plan</Link>
      </header>

      <section className="rp__filters">
        <div className="rp__row">
          <div className="rp__col">
            <label className="rp__lbl">Pretraga (lokacija)</label>
            <input
              className="rp__input"
              placeholder="npr. Ada Ciganlija"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>

          <div className="rp__col">
            <label className="rp__lbl">Od datuma</label>
            <input
              type="date"
              className="rp__input"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>

          <div className="rp__col">
            <label className="rp__lbl">Do datuma</label>
            <input
              type="date"
              className="rp__input"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>

          <div className="rp__col rp__col--sm">
            <label className="rp__lbl">Po stranici</label>
            <select
              className="rp__input"
              value={perPage}
              onChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setPage(1); }}
            >
              {[6, 12, 24].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="rp__actions">
            <button className="btn" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </section>

      {loading && <div className="note">Učitavanje...</div>}
      {err && <div className="note">{err}</div>}

      {!loading && (
        <>
          <div className="rp__info">
            Pronađeno: <strong>{meta?.total ?? items.length}</strong>
            {meta && <> · Strana: <strong>{meta.current_page}</strong> / {meta.last_page}</>}
          </div>

          <div className="rp__tablewrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Datum/Vreme</th>
                  <th>Lokacija</th>
                  <th>Distanca (km)</th>
                  <th>Ciljani pace (sec/km)</th>
                  <th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="rp__empty">Nema planova.</td>
                  </tr>
                ) : (
                  items.map((p, i) => (
                    <tr key={p.id}>
                      <td className="ta-right">{(meta?.from ?? 1) + i}</td>
                      <td>{fmtDate(p.start_time)}</td>
                      <td>{p.location || "—"}</td>
                      <td className="ta-right">{p.distance_km ?? "—"}</td>
                      <td className="ta-right">{p.target_pace_sec ?? "—"}</td>
                      <td className="ta-center">
                        <Link className="link" to={`/run-plans/${p.id}`}>Detalj</Link>
                        {" · "}
                        <Link className="link" to={`/run-plans/${p.id}/edit`}>Izmeni</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="rp__pag">
              <button className="btn btn--tiny" onClick={() => gotoPage(meta.current_page - 1)} disabled={meta.current_page <= 1}>← Prethodna</button>
              <span>Strana {meta.current_page} / {meta.last_page}</span>
              <button className="btn btn--tiny" onClick={() => gotoPage(meta.current_page + 1)} disabled={meta.current_page >= meta.last_page}>Sledeća →</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
