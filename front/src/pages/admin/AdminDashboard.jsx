 
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api"; 
import "./admin-dashboard.css";  
import AdminSidebar from "./AdminSidebar";

export default function AdminDashboard() {
  const [me, setMe] = useState(null);
  const [global, setGlobal] = useState(null);
  const [lbKm, setLbKm] = useState([]);
  const [lbPace, setLbPace] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const meRes = await api.get("/api/me");
        const u = meRes?.data?.data ?? meRes?.data ?? meRes;
        if (alive) setMe(u || null);

        const [g, k, p] = await Promise.all([
          api.get("/api/stats/global-averages"),
          api.get("/api/stats/leaderboard/total-distance?limit=5"),
          api.get("/api/stats/leaderboard/avg-pace?limit=5"),
        ]);
        if (!alive) return;
        setGlobal(g.data || null);
        setLbKm(k.data || []);
        setLbPace(p.data || []);
      } catch {
        if (alive) setErr("Ne mogu da učitam admin statistike.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const fmtPace = (sec) => {
    if (!Number.isFinite(sec)) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}/km`;
  };

  return (
    <div className="admin-page">{/* grid: sidebar + content */}
      <AdminSidebar />

      <main className="admin-content hp" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Admin dashboard</h2>
          <span style={{ opacity: .7, fontSize: 14 }}>
            {me ? `Ulogovan kao: ${me.name} (${me.role})` : "—"}
          </span>
          <span style={{ marginLeft: "auto" }}>
            <Link className="btn btn--tiny" to="/">← Nazad</Link>
          </span>
        </div>

        {loading && <div className="note">Učitavanje…</div>}
        {err && <div className="note">{err}</div>}

        {!loading && !err && (
          <>
            {/* KPI kartice */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(190px, 1fr))", gap: 12 }}>
              <div className="redetail__card">
                <div style={{ opacity: .8, fontSize: 14 }}>Ukupno trčanja</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{global?.total_runs ?? "—"}</div>
              </div>
              <div className="redetail__card">
                <div style={{ opacity: .8, fontSize: 14 }}>Ukupno km</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {(global?.total_distance ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="redetail__card">
                <div style={{ opacity: .8, fontSize: 14 }}>Globalni prosek tempa</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {fmtPace(global?.avg_pace_sec)}
                </div>
              </div>
              <div className="redetail__card">
                <div style={{ opacity: .8, fontSize: 14 }}>Prosečna distanca</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {(global?.avg_distance_km ?? 0).toFixed(2)} km
                </div>
              </div>
            </div>

            {/* Rang liste */}
            <div className="redetail__card" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Top 5 — ukupni kilometri</h3>
              {lbKm.length === 0 ? (
                <div className="note">Nema podataka.</div>
              ) : (
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {lbKm.map((r) => (
                    <li key={r.user_id} style={{ margin: "4px 0" }}>
                      {r.name ?? `#${r.user_id}`} — <b>{Number(r.total_km).toFixed(2)} km</b>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="redetail__card" style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Top 5 — najbolji prosečan pace</h3>
              {lbPace.length === 0 ? (
                <div className="note">Nema podataka.</div>
              ) : (
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {lbPace.map((r) => (
                    <li key={r.user_id} style={{ margin: "4px 0" }}>
                      {r.name ?? `#${r.user_id}`} — <b>{fmtPace(r.avg_pace_sec)}</b>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
