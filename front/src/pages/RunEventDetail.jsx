import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function RunEventDetail() {
  const { id } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
     
        const res = await api.get(`/api/run-events/${id}`, { signal: ctrl.signal });
        const body = res?.data ?? res;
        setEv(body?.data ?? body); // Resource ili plain JSON
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr("Ne mogu da učitam događaj.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [id]);

  const fmtDate = (iso) => {
    if (!iso) return "TBA";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <main className="hp" style={{ padding: 24 }}>
      <Link to="/run-events" className="link">← Nazad na listu</Link>
      <h2 style={{ margin: "12px 0 16px" }}>Detalji događaja</h2>

      {loading && <div className="note">Učitavanje...</div>}
      {err && <div className="note">{err}</div>}
      {!loading && !err && !ev && <div className="note">Događaj nije pronađen.</div>}

      {ev && (
        <div className="note" style={{ display: "grid", gap: 8 }}>
          <div><strong>Datum/Vreme:</strong> {fmtDate(ev.start_time)}</div>
          <div><strong>Lokacija:</strong> {ev.location || "—"}</div>
          <div><strong>Distanca (km):</strong> {ev.distance_km ?? "—"}</div>
          <div><strong>Status:</strong> {ev.status || "planned"}</div>
          <div><strong>Organizator:</strong> {ev.organizer?.name || "—"}</div>
          <div style={{ opacity: .8 }}>
             Učesnici: {ev.participants_count ?? ev.participants?.length ?? 0}
            {" • "}
             Komentari: {ev.comments_count ?? ev.comments?.length ?? 0}
          </div>
        </div>
      )}
    </main>
  );
}
