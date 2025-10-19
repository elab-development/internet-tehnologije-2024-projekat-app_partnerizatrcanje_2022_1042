import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api";
import { FiDownload, FiFilter, FiRefreshCw, FiChevronDown, FiChevronUp } from "react-icons/fi";
import AdminSidebar from "./AdminSidebar";

export default function AdminRunStats() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filteri
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [userId, setUserId] = useState("");
  const [eventId, setEventId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // combobox opcije
  const [userOpts, setUserOpts] = useState([]);
  const [userQ, setUserQ] = useState("");
  const [eventOpts, setEventOpts] = useState([]);
  const [eventQ, setEventQ] = useState("");

  // sortiranje (klijentsko)
  const [sortBy, setSortBy] = useState("recorded_at");
  const [sortDir, setSortDir] = useState("desc");

  const abortRef = useRef(null);

  // ------- inline STYLES -------
  const S = {
    page: { display: "flex" },
    main: { padding: 24, flex: 1 },
    headRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
    title: { margin: 0 },
    actions: { marginLeft: "auto", display: "flex", gap: 8 },
    card: {
      background: "#0e1411",
      border: "1px solid #1f2b24",
      borderRadius: 12,
      padding: 12,
    },
    filtersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "10px 12px",
      alignItems: "end",
    },
    field: { display: "flex", flexDirection: "column", gap: 6 },
    fieldRow: { display: "flex", gap: 8, alignItems: "center" },
    label: {
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: ".04em",
      color: "#a9b8b0",
    },
    input: {
      width: "100%",
      height: 36,
      padding: "0 10px",
      border: "1px solid #23342b",
      borderRadius: 8,
      background: "#0b110e",
      color: "#e6efe9",
      outline: "none",
    },
    inputFocus: { borderColor: "#2e6d4b" },
    tableWrap: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 780 },
    th: {
      textAlign: "left",
      padding: "10px 12px",
      borderBottom: "1px solid #213027",
      color: "#cfe3d8",
      whiteSpace: "nowrap",
      position: "sticky",
      top: 0,
      background: "#0e1411",
      zIndex: 1,
    },
    td: {
      padding: "8px 12px",
      borderBottom: "1px solid #18231d",
      whiteSpace: "nowrap",
    },
    tinyBtn: { height: 36 },
  };

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (userId) p.user_id = userId;
    if (eventId) p.run_event_id = eventId;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  }, [page, perPage, userId, eventId, dateFrom, dateTo]);

  // učitaj run-stats kad se promeni filter/paginacija
  useEffect(() => {
    loadPage();
    return () => { if (abortRef.current) abortRef.current.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // korisnici (za combobox)
  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await api.get("/api/users", {
          params: userQ ? { q: userQ, per_page: 100 } : { per_page: 100 },
          signal: ctrl.signal,
        });
        const body = res?.data ?? res;
        const data = Array.isArray(body?.data) ? body.data : [];
        if (alive) setUserOpts(data);
      } catch {}
    })();
    return () => { alive = false; ctrl.abort(); };
  }, [userQ]);

  // eventi (za combobox)
  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await api.get("/api/run-events", {
          params: eventQ ? { q: eventQ, per_page: 100 } : { per_page: 100 },
          signal: ctrl.signal,
        });
        const body = res?.data ?? res;
        const data = Array.isArray(body?.data) ? body.data : [];
        if (alive) setEventOpts(data);
      } catch {}
    })();
    return () => { alive = false; ctrl.abort(); };
  }, [eventQ]);

  async function loadPage() {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/run-stats", {
        params,
        signal: ctrl.signal,
      });
      const body = res?.data ?? res;
      setItems(Array.isArray(body?.data) ? body.data : []);
      setMeta(body?.meta ?? null);
    } catch (e) {
      if (e.name !== "CanceledError" && e.name !== "AbortError") {
        setErr("Ne mogu da učitam run stats.");
      }
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setUserId("");
    setEventId("");
    setUserQ("");
    setEventQ("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString();
  };
  const fmtPace = (sec) => {
    if (!Number.isFinite(sec)) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}/km`;
  };

  // sortiranje klijentski
  const sortedItems = useMemo(() => {
    const arr = [...items];
    const dirMul = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      let A, B;
      switch (sortBy) {
        case "distance_km":
          A = a.distance_km ?? -Infinity;
          B = b.distance_km ?? -Infinity;
          break;
        case "duration_sec":
          A = a.duration_sec ?? -Infinity;
          B = b.duration_sec ?? -Infinity;
          break;
        case "avg_pace_sec":
          A = a.avg_pace_sec ?? Infinity;
          B = b.avg_pace_sec ?? Infinity;
          break;
        case "calories":
          A = a.calories ?? -Infinity;
          B = b.calories ?? -Infinity;
          break;
        case "user":
          A = (a.user?.name ?? `#${a.user_id}`)?.toLowerCase();
          B = (b.user?.name ?? `#${b.user_id}`)?.toLowerCase();
          break;
        case "event":
          A = a.run_event_id ?? 0;
          B = b.run_event_id ?? 0;
          break;
        case "recorded_at":
        default:
          A = a.recorded_at ? Date.parse(a.recorded_at) : 0;
          B = b.recorded_at ? Date.parse(b.recorded_at) : 0;
          break;
      }
      if (A < B) return -1 * dirMul;
      if (A > B) return 1 * dirMul;
      return 0;
    });

    return arr;
  }, [items, sortBy, sortDir]);

  // ---- Export helpers ----
  function csvEscape(val) {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  async function exportCsv() {
    const cols = [
      "id","user_id","user_name","run_event_id","recorded_at",
      "distance_km","duration_sec","avg_pace_sec","avg_pace_str","calories",
    ];

    const p = { ...params, page: 1, per_page: 200 };
    const all = [];
    let current = 1, last = 1;

    setLoading(true);
    setErr("");
    try {
      do {
        p.page = current;
        const res = await api.get("/api/run-stats", { params: p });
        const body = res?.data ?? res;
        const pageItems = Array.isArray(body?.data) ? body.data : [];
        const meta = body?.meta ?? null;

        for (const it of pageItems) {
          all.push({
            id: it.id,
            user_id: it.user_id,
            user_name: it.user?.name ?? "",
            run_event_id: it.run_event_id ?? "",
            recorded_at: it.recorded_at ?? "",
            distance_km: it.distance_km ?? "",
            duration_sec: it.duration_sec ?? "",
            avg_pace_sec: it.avg_pace_sec ?? "",
            avg_pace_str: Number.isFinite(it.avg_pace_sec) ? fmtPace(it.avg_pace_sec) : "",
            calories: it.calories ?? "",
          });
        }

        if (meta) { current = meta.current_page + 1; last = meta.last_page; }
        else { current = 2; last = 1; }
      } while (current <= last);

      const header = cols.join(",");
      const rows = all.map(r =>
        [
          csvEscape(r.id), csvEscape(r.user_id), csvEscape(r.user_name),
          csvEscape(r.run_event_id), csvEscape(r.recorded_at),
          csvEscape(r.distance_km), csvEscape(r.duration_sec),
          csvEscape(r.avg_pace_sec), csvEscape(r.avg_pace_str),
          csvEscape(r.calories),
        ].join(",")
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
      a.href = url;
      a.download = `run_stats_${stamp}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setErr("Export nije uspeo.");
    } finally {
      setLoading(false);
    }
  }

  function SortControl({ value, onChange, dir, setDir }) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <select style={S.input} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="recorded_at">Datum</option>
          <option value="user">Korisnik</option>
          <option value="event">Event</option>
          <option value="distance_km">Distanca</option>
          <option value="duration_sec">Trajanje</option>
          <option value="avg_pace_sec">Pace (sec/km)</option>
          <option value="calories">Kalorije</option>
        </select>
        <button
          type="button"
          className="btn btn--tiny"
          onClick={() => setDir(dir === "asc" ? "desc" : "asc")}
          title="Promeni smer"
          style={S.tinyBtn}
        >
          {dir === "asc" ? <FiChevronUp /> : <FiChevronDown />} {dir.toUpperCase()}
        </button>
      </div>
    );
  }

  return (
    <div className="admin-layout" style={S.page}>
      <AdminSidebar />

      <main className="hp" style={S.main}>
        <div style={S.headRow}>
          <h2 style={S.title}>Run stats (admin)</h2>
          <span style={S.actions}>
            <button className="btn btn--tiny" onClick={loadPage} title="Osveži" style={S.tinyBtn}>
              <FiRefreshCw /> Osveži
            </button>
            <button className="btn btn--tiny" onClick={exportCsv} title="Export CSV" style={S.tinyBtn}>
              <FiDownload /> Export CSV
            </button>
          </span>
        </div>

        {/* Filter bar */}
        <section style={{ ...S.card, marginBottom: 12 }}>
          <div style={S.filtersGrid}>
            {/* USER combobox */}
            <div style={S.field}>
              <label style={S.label}>Korisnik</label>
              <input
                style={{ ...S.input, marginBottom: 6 }}
                placeholder="Pretraži ime/email…"
                value={userQ}
                onChange={(e) => setUserQ(e.target.value)}
              />
              <select
                style={S.input}
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setPage(1); }}
              >
                <option value="">— svi —</option>
                {userOpts.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* EVENT combobox */}
            <div style={S.field}>
              <label style={S.label}>Event</label>
              <input
                style={{ ...S.input, marginBottom: 6 }}
                placeholder="Pretraži lokaciju…"
                value={eventQ}
                onChange={(e) => setEventQ(e.target.value)}
              />
              <select
                style={S.input}
                value={eventId}
                onChange={(e) => { setEventId(e.target.value); setPage(1); }}
              >
                <option value="">— svi —</option>
                {eventOpts.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    #{ev.id} · {ev.location || "n/a"} · {ev.start_time ? new Date(ev.start_time).toLocaleString() : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Datum od</label>
              <input type="date" style={S.input} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Datum do</label>
              <input type="date" style={S.input} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Po strani</label>
              <select style={S.input} value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Sortiraj</label>
              <SortControl value={sortBy} onChange={setSortBy} dir={sortDir} setDir={setSortDir} />
            </div>

            <div style={{ ...S.fieldRow, justifyContent: "flex-start" }}>
              <button className="btn btn--tiny" onClick={() => setPage(1)} style={S.tinyBtn}>
                <FiFilter /> Primeni filtere
              </button>
              <button className="btn btn--tiny" onClick={resetFilters} style={S.tinyBtn}>Reset</button>
            </div>
          </div>
        </section>

        {loading && <div className="note">Učitavanje…</div>}
        {err && <div className="note">{err}</div>}

        {/* Tabela */}
        <div style={S.tableWrap}>
          <table className="re-table" style={S.table}>
            <thead>
              <tr>
                <Th style={S.th}>#</Th>
                <Th style={S.th}>Recorded at</Th>
                <Th style={S.th}>User</Th>
                <Th style={S.th}>Event</Th>
                <Th style={S.th}>Distance (km)</Th>
                <Th style={S.th}>Duration (sec)</Th>
                <Th style={S.th}>Pace (sec/km)</Th>
                <Th style={S.th}>Pace</Th>
                <Th style={S.th}>Calories</Th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <Td colSpan={9} style={{ ...S.td, textAlign: "center", padding: 16, opacity: .8 }}>
                    Nema zapisa.
                  </Td>
                </tr>
              ) : (
                sortedItems.map((r, i) => (
                  <tr key={r.id} style={{ cursor: "default" }}>
                    <Td style={S.td}>{(meta?.from ?? 1) + i}</Td>
                    <Td style={S.td} title={r.recorded_at || ""}>{fmtDateTime(r.recorded_at)}</Td>
                    <Td style={S.td}>{r.user?.name ?? `#${r.user_id}`}</Td>
                    <Td style={S.td}>{r.run_event_id ?? "—"}</Td>
                    <Td style={S.td}>{r.distance_km != null ? Number(r.distance_km).toFixed(2) : "—"}</Td>
                    <Td style={S.td}>{r.duration_sec ?? "—"}</Td>
                    <Td style={S.td}>{r.avg_pace_sec ?? "—"}</Td>
                    <Td style={S.td}>{fmtPace(r.avg_pace_sec)}</Td>
                    <Td style={S.td}>{r.calories ?? "—"}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacija */}
        {meta && meta.last_page > 1 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <button
              className="btn btn--tiny"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1}
              style={S.tinyBtn}
            >
              ← Prethodna
            </button>
            <span style={{ opacity: .8 }}>
              Strana {meta.current_page} / {meta.last_page}
            </span>
            <button
              className="btn btn--tiny"
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page >= meta.last_page}
              style={S.tinyBtn}
            >
              Sledeća →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Th({ children, style }) {
  return <th style={style}>{children}</th>;
}
function Td({ children, style, ...rest }) {
  return <td {...rest} style={style}>{children}</td>;
}
