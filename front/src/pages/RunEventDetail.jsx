import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import "./run-event-detail.css";
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
    <main className="hp redetail">
  <Link to="/run-events" className="redetail__back">← Nazad na listu</Link>
  <h2 className="redetail__title">Detalji događaja</h2>

  {loading && <div className="note">Učitavanje...</div>}
  {err && <div className="note">{err}</div>}

  {ev && (
    <section className="redetail__card">
      <div className="redetail__rows">
        <div className="redetail__row">
          <div className="redetail__label">Datum/Vreme:</div>
          <div className="redetail__value">{fmtDate(ev.start_time)}</div>
        </div>

        <div className="redetail__row">
          <div className="redetail__label">Lokacija:</div>
          <div className="redetail__value">{ev.location || "—"}</div>
        </div>

        <div className="redetail__row">
          <div className="redetail__label">Distanca (km):</div>
          <div className="redetail__value">{ev.distance_km ?? "—"}</div>
        </div>

        <div className="redetail__row">
          <div className="redetail__label">Status:</div>
          <div className="redetail__value">
            <span className={`status-badge status--${ev.status || "planned"}`}>
              {ev.status || "planned"}
            </span>
          </div>
        </div>

        <div className="redetail__row">
          <div className="redetail__label">Organizator:</div>
          <div className="redetail__value">{ev.organizer?.name || "—"}</div>
        </div>
      </div>

      <div className="redetail__meta">
        <i>  Učesnici: {ev.participants_count ?? ev.participants?.length ?? 0}</i>
        <i>  Komentari: {ev.comments_count ?? ev.comments?.length ?? 0}</i>
      </div>
    </section>
  )}
</main>

  );
}
