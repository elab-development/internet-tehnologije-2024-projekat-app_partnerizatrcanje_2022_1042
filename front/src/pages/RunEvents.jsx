import React, { useEffect, useState } from "react";
import api from "../api";
import "./run-events.css";
import { Link } from "react-router-dom";

export default function RunEventsTable() {
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  // učitaj /api/me (ako postoji token)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setMe(null); return; }

    let alive = true;
    (async () => {
      try {
        const res = await api.get("/api/me");
        const user = res?.data?.data ?? res?.data ?? res;
        if (alive) setMe(user || null);
      } catch {
        if (alive) setMe(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  // lista događaja (paginacija)
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
        const body = res?.data ?? res;
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

  const canDelete = (ev) => {
    if (!me) return false;
    return me.role === "admin" || Number(ev.organizer_id) === Number(me.id);
  };

  async function deleteEvent(ev) {
    if (!canDelete(ev)) return;
    const ok = window.confirm(
      `Obrisati događaj #${ev.id}? Ovo će obrisati i komentare, učesnike i statistiku povezanu sa događajem.`
    );
    if (!ok) return;

    try {
      await api.delete(`/api/run-events/${ev.id}`);
      // 1) ukloni iz tabele
      setItems((prev) => prev.filter((x) => x.id !== ev.id));
      // 2) ažuriraj meta.total bez referenci na nepostojeće promenljive
      setMeta((m) =>
        m ? { ...m, total: Math.max(0, (m.total ?? 0) - 1) } : m
      );
    } catch {
      alert("Brisanje nije uspelo.");
    }
  }

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
                      <td style={{ ...td, whiteSpace: "nowrap" }}>
                        <Link className="link" to={`/run-events/${e.id}`} style={{ marginRight: 10 }}>
                          Detalj
                        </Link>
                        {canDelete(e) && (
                          <button
                            className="btn btn--tiny"
                            style={{ background: "#311", borderColor: "#522", color: "#f8d7da" }}
                            onClick={() => deleteEvent(e)}
                            title="Obriši događaj"
                          >
                            Obriši
                          </button>
                        )}
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

// jednostavni inline stilovi
const th = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #2a2a2a" };
const td = { padding: "8px 12px", borderBottom: "1px solid #1b1b1b" };
