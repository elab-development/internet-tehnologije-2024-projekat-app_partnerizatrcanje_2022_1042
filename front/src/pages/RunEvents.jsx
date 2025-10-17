import React, { useEffect, useState } from "react";
import api from "../api";
import "./run-events.css"; // opciono

export default function RunEventsTable() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/api/run-events", {
          params: { page, per_page: perPage },
          signal: ctrl.signal,
        });
        const body = res?.data ?? res; // radi i sa interceptorom i bez
        setItems(Array.isArray(body?.data) ? body.data : []);
        setMeta(body?.meta ?? null);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr("Neuspešno učitavanje događaja.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [page]);

  const fmtDate = (iso) => {
    if (!iso) return "TBA";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="hp" style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Run events</h2>

      {loading && <div className="note">Učitavanje...</div>}
      {err && <div className="note">{err}</div>}

      {!loading && (
        <>
          <div style={{ marginBottom: 12, opacity: 0.9 }}>
            Pronađeno: <strong>{meta?.total ?? items.length}</strong>
            {meta && (
              <> · Strana: <strong>{meta.current_page}</strong> / {meta.last_page}</>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="re-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Datum/Vreme</th>
                  <th style={th}>Lokacija</th>
                  <th style={th}>Distanca (km)</th>
                  <th style={th}>Status</th>
                  <th style={th}>Organizator</th>
                  <th style={th}>Učesnici</th>
                  <th style={th}>Komentari</th>
                  <th style={th}>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 16, textAlign: "center", opacity: 0.8 }}>
                      Nema zapisa.
                    </td>
                  </tr>
                ) : (
                  items.map((e, i) => (
                    <tr key={e.id}>
                      <td style={td}>{(meta?.from ?? 1) + i}</td>
                      <td style={td}>{fmtDate(e.start_time)}</td>
                      <td style={td}>{e.location || "—"}</td>
                      <td style={td}>
                        {e.distance_km != null && e.distance_km !== "" ? Number(e.distance_km) : "—"}
                      </td>
                      <td style={td}>{e.status || "planned"}</td>
                      <td style={td}>{e.organizer?.name || "—"}</td>
                      <td style={td}>{e.participants_count ?? 0}</td>
                      <td style={td}>{e.comments_count ?? 0}</td>
                      <td style={td}>
                        <a className="link" href={`/run-events/${e.id}`}>Detalj</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
            <button
              className="btn btn--tiny"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta || meta.current_page <= 1}
            >
              ← Prethodna
            </button>
            <span style={{ opacity: 0.8 }}>
              Strana {meta?.current_page ?? page} / {meta?.last_page ?? 1}
            </span>
            <button
              className="btn btn--tiny"
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={!meta || meta.current_page >= meta.last_page}
            >
              Sledeća →
            </button>
          </div>
        </>
      )}
    </main>
  );
}

 
