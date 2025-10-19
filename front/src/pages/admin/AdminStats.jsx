 
import React, { useEffect, useMemo, useState } from "react";
import api from "../../api"; 
import { Link } from "react-router-dom";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// Ikonice (opciono, ali zgodno za KPI)
import { FaRunning, FaRoad, FaTachometerAlt, FaRuler } from "react-icons/fa";
import AdminSidebar from "./AdminSidebar";

export default function AdminStats() {
  const [global, setGlobal] = useState(null);
  const [lbKm, setLbKm] = useState([]);     // leaderboard po total km
  const [lbPace, setLbPace] = useState([]); // leaderboard po avg pace (manje je bolje)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [g, k, p] = await Promise.all([
          api.get("/api/stats/global-averages"),
          api.get("/api/stats/leaderboard/total-distance?limit=10"),
          api.get("/api/stats/leaderboard/avg-pace?limit=10"),
        ]);
        if (!alive) return;
        setGlobal(g.data || null);
        setLbKm(Array.isArray(k.data) ? k.data : []);
        setLbPace(Array.isArray(p.data) ? p.data : []);
      } catch {
        if (alive) setErr("Ne mogu da učitam statistike.");
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

  // podaci za grafikone
  const chartKm = useMemo(() => {
    // Sortiraj silazno da grafikon bude uredan (ako backend već jeste, super)
    const arr = [...lbKm].sort((a, b) => Number(b.total_km) - Number(a.total_km));
    return arr.map((r, i) => ({
      rank: i + 1,
      name: r.name ?? `#${r.user_id}`,
      total_km: Number(r.total_km || 0),
    }));
  }, [lbKm]);

  const chartPace = useMemo(() => {
    // Pošto je manji pace bolji, sortiramo rastuće
    const arr = [...lbPace].sort((a, b) => Number(a.avg_pace_sec) - Number(b.avg_pace_sec));
    return arr.map((r, i) => ({
      rank: i + 1,
      name: r.name ?? `#${r.user_id}`,
      avg_pace_sec: Number(r.avg_pace_sec || 0),
      // Korisno za tooltip
      pace_fmt: fmtPace(Number(r.avg_pace_sec || 0)),
    }));
  }, [lbPace]);

  // CSV export helper
  const exportCsv = (rows, headers, filename) => {
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      if (s.includes(",") || s.includes("\n") || s.includes("\"")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const csv =
      headers.map((h) => h.label).join(",") + "\n" +
      rows.map((row) => headers.map((h) => esc(row[h.key])).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportKmCsv = () => {
    exportCsv(
      chartKm,
      [
        { key: "rank", label: "Rank" },
        { key: "name", label: "Name" },
        { key: "total_km", label: "Total_km" },
      ],
      "leaderboard_total_km.csv"
    );
  };

  const exportPaceCsv = () => {
    exportCsv(
      chartPace,
      [
        { key: "rank", label: "Rank" },
        { key: "name", label: "Name" },
        { key: "avg_pace_sec", label: "AvgPaceSec" },
        { key: "pace_fmt", label: "AvgPaceFmt" },
      ],
      "leaderboard_avg_pace.csv"
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar />

      <main className="hp" style={{ flex: 1, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Admin · Stats</h2>
          <span style={{ marginLeft: "auto" }}>
            <Link className="btn btn--tiny" to="/">← Nazad</Link>
          </span>
        </div>

        {loading && <div className="note">Učitavanje…</div>}
        {err && <div className="note">{err}</div>}

        {!loading && !err && (
          <>
            {/* KPI kartice */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(190px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div className="redetail__card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <FaRunning size={22} style={{ opacity: 0.8 }} />
                <div>
                  <div style={{ opacity: 0.8, fontSize: 14 }}>Ukupno trčanja</div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>
                    {global?.total_runs ?? "—"}
                  </div>
                </div>
              </div>

              <div className="redetail__card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <FaRoad size={22} style={{ opacity: 0.8 }} />
                <div>
                  <div style={{ opacity: 0.8, fontSize: 14 }}>Ukupno km</div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>
                    {(global?.total_distance ?? 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="redetail__card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <FaTachometerAlt size={22} style={{ opacity: 0.8 }} />
                <div>
                  <div style={{ opacity: 0.8, fontSize: 14 }}>Globalni prosek tempa</div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>
                    {fmtPace(global?.avg_pace_sec)}
                  </div>
                </div>
              </div>

              <div className="redetail__card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <FaRuler size={22} style={{ opacity: 0.8 }} />
                <div>
                  <div style={{ opacity: 0.8, fontSize: 14 }}>Prosečna distanca</div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>
                    {(global?.avg_distance_km ?? 0).toFixed(2)} km
                  </div>
                </div>
              </div>
            </div>

            {/* Grafikon: Top 10 ukupni kilometri */}
            <section className="redetail__card" style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0 }}>Top 10 — ukupni kilometri</h3>
                <span style={{ marginLeft: "auto" }}>
                  <button className="btn btn--tiny" onClick={exportKmCsv}>Export CSV</button>
                </span>
              </div>

              {chartKm.length === 0 ? (
                <div className="note" style={{ marginTop: 8 }}>Nema podataka.</div>
              ) : (
                <div style={{ width: "100%", height: 340, marginTop: 10 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartKm} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                      <YAxis />
                      <Tooltip formatter={(val) => [`${Number(val).toFixed(2)} km`, "Ukupno km"]} />
                      <Legend />
                      <Bar dataKey="total_km" name="Ukupno km" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Grafikon: Top 10 najbolji pace (manje je bolje) */}
            <section className="redetail__card" style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0 }}>Top 10 — najbolji prosečan pace</h3>
                <span style={{ marginLeft: "auto" }}>
                  <button className="btn btn--tiny" onClick={exportPaceCsv}>Export CSV</button>
                </span>
              </div>

              {chartPace.length === 0 ? (
                <div className="note" style={{ marginTop: 8 }}>Nema podataka.</div>
              ) : (
                <div style={{ width: "100%", height: 340, marginTop: 10 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={chartPace}
                      margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} interval={0} />
                      <YAxis
                        label={{ value: "sec/km (manje=bolje)", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        formatter={(val, name, props) => [
                          `${fmtPace(val)} (${val} sec/km)`,
                          "Avg pace",
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="avg_pace_sec" name="Avg pace (sec/km)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
