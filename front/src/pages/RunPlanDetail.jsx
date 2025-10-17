import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import "./run-plans.css";

export default function RunPlanDetail() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(`/api/run-plans/${id}`, { signal: ctrl.signal });
        const body = res?.data ?? res;
        setPlan(body?.data ?? body); // Resource ili plain
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr("Ne mogu da učitam plan.");
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
    <main className="hp rp">
      <Link to="/run-plans" className="rp__back">← Nazad na listu</Link>
      <h2 className="rp__title">Detalji plana</h2>

      {loading && <div className="note">Učitavanje...</div>}
      {err && <div className="note">{err}</div>}
      {!loading && !err && !plan && <div className="note">Plan nije pronađen.</div>}

      {plan && (
        <section className="rp-card">
          <div className="rp-rows">
            <div className="rp-row">
              <div className="rp-label">Datum/Vreme:</div>
              <div className="rp-value">{fmtDate(plan.start_time)}</div>
            </div>

            <div className="rp-row">
              <div className="rp-label">Lokacija:</div>
              <div className="rp-value">{plan.location || "—"}</div>
            </div>

            <div className="rp-row">
              <div className="rp-label">Distanca (km):</div>
              <div className="rp-value">{plan.distance_km ?? "—"}</div>
            </div>

            <div className="rp-row">
              <div className="rp-label">Ciljani pace (sec/km):</div>
              <div className="rp-value">{plan.target_pace_sec ?? "—"}</div>
            </div>

            <div className="rp-row">
              <div className="rp-label">Napomena:</div>
              <div className="rp-value">{plan.notes || "—"}</div>
            </div>

            <div className="rp-row">
              <div className="rp-label">Koordinate okupljanja:</div>
              <div className="rp-value">
                {plan.meet_lat != null && plan.meet_lng != null
                  ? `${plan.meet_lat}, ${plan.meet_lng}`
                  : "—"}
              </div>
            </div>

            <div className="rp-row">
              <div className="rp-label">Korisnik:</div>
              <div className="rp-value">{plan.user?.name || `#${plan.user_id}`}</div>
            </div>
          </div>

          <div className="rp-meta">
            <Link to={`/run-plans/${plan.id}/edit`} className="btn">Izmeni</Link>
          </div>
        </section>
      )}
    </main>
  );
}
