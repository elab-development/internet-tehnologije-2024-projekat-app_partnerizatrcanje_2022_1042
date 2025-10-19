 
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import "./run-plans.css";
 
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon1x from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon1x, shadowUrl: iconShadow });

function getUserId() {
  const raw = localStorage.getItem("user_id");
  return raw ? parseInt(raw, 10) : undefined;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}
function fmtPace(sec) {
  if (!Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

export default function MyStats() {
  const userId = getUserId();
  const [me, setMe] = useState(null);

  // summary i po mesecima
  const [summary, setSummary] = useState(null);
  const [byMonth, setByMonth] = useState([]);

  // list (moji zapisi)
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // selektovani zapis -> mapa
  const [sel, setSel] = useState(null);
  const mapRef = useRef(null);

  // poređenje
  const [globalAvg, setGlobalAvg] = useState(null);
  const [leaderKm, setLeaderKm] = useState([]);     // top po km
  const [leaderPace, setLeaderPace] = useState([]); // top po prosečnom pace-u (najmanji)

  // učitaj /api/me (nije striktno, ali korisno za ime)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/me");
        const user = res?.data?.data ?? res?.data ?? res;
        setMe(user || null);
        if (user?.id) localStorage.setItem("user_id", String(user.id));
      } catch {
        setMe(null);
      }
    })();
  }, []);

  // summary + by-month (zahtevaju userId)
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      try {
        const sRes = await api.get(`/api/stats/user/${userId}/summary`);
        const bRes = await api.get(`/api/stats/user/${userId}/by-month`);
        const sBody = sRes?.data ?? {};
        const bBody = bRes?.data ?? [];
        if (!alive) return;
        setSummary(sBody);
        setByMonth(Array.isArray(bBody) ? bBody : []);
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, [userId]);

  // moji zapisi (paginirano)
  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/api/run-stats", {
          params: { user_id: userId, page, per_page: perPage },
          signal: ctrl.signal,
        });
        const body = res?.data ?? res;
        setItems(Array.isArray(body?.data) ? body.data : []);
        setMeta(body?.meta ?? null);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr("Ne mogu da učitam tvoje statistike.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [userId, page]);

  // globalna poređenja (2 dodatne bek rute ispod)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const g = await api.get("/api/stats/global-averages");
        const kmTop = await api.get("/api/stats/leaderboard/total-distance?limit=5");
        const paceTop = await api.get("/api/stats/leaderboard/avg-pace?limit=5");
        if (!alive) return;
        setGlobalAvg(g?.data ?? null);
        setLeaderKm(Array.isArray(kmTop?.data) ? kmTop.data : []);
        setLeaderPace(Array.isArray(paceTop?.data) ? paceTop.data : []);
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, []);

  // centriraj mapu na track selektovanog zapisa
  useEffect(() => {
    if (!sel?.gps_track || !Array.isArray(sel.gps_track) || sel.gps_track.length === 0) return;
    try {
      const pts = sel.gps_track.map(p => [p[0], p[1]]);
      if (mapRef.current && pts.length > 0) {
        const bounds = L.latLngBounds(pts);
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch {/* ignore */}
  }, [sel]);

  const myAvgPace = summary?.avg_pace_sec ?? null;
  const myAvgDist = useMemo(() => {
    // prosečna distanca po zapisu iz moje stranice (ili iz summary: total_distance/total_runs)
    if (summary?.total_runs > 0 && Number.isFinite(summary?.total_distance)) {
      return summary.total_distance / summary.total_runs;
    }
    return null;
  }, [summary]);

  const vsGlobalPace = useMemo(() => {
    if (!Number.isFinite(myAvgPace) || !Number.isFinite(globalAvg?.avg_pace_sec)) return null;
    // manji je bolji, prikaži % razliku
    return Math.round(((globalAvg.avg_pace_sec - myAvgPace) / globalAvg.avg_pace_sec) * 100);
  }, [myAvgPace, globalAvg]);

  const vsGlobalDist = useMemo(() => {
    if (!Number.isFinite(myAvgDist) || !Number.isFinite(globalAvg?.avg_distance_km)) return null;
    return Math.round(((myAvgDist - globalAvg.avg_distance_km) / globalAvg.avg_distance_km) * 100);
  }, [myAvgDist, globalAvg]);

  return (
    <main className="hp rp" style={{ padding: 24 }}>
      <h2 className="rp__title">Moja statistika {me?.name ? `— ${me.name}` : ""}</h2>

      {!userId && (
        <div className="note">Niste ulogovani.</div>
      )}

      {/* SUMARY */}
      {userId && (
        <section className="rp-card" style={{ marginBottom: 16 }}>
          <div className="rp-rows" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div className="rp-row">
              <div className="rp-label">Ukupno trčanja</div>
              <div className="rp-value"><b>{summary?.total_runs ?? 0}</b></div>
            </div>
            <div className="rp-row">
              <div className="rp-label">Ukupno km</div>
              <div className="rp-value"><b>{(summary?.total_distance ?? 0).toFixed(2)}</b></div>
            </div>
            <div className="rp-row">
              <div className="rp-label">Prosečan pace</div>
              <div className="rp-value"><b>{fmtPace(summary?.avg_pace_sec)}</b></div>
            </div>
            <div className="rp-row">
              <div className="rp-label">Poslednje trčanje</div>
              <div className="rp-value">{summary?.last_run_at ? fmtDate(summary.last_run_at) : "—"}</div>
            </div>
          </div>
        </section>
      )}

      {/* POREĐENJE */}
      {userId && (
        <section className="rp-card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Poređenje sa ostalima</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div className="rp-row">
              <div className="rp-label">Moj prosečan pace</div>
              <div className="rp-value">{fmtPace(myAvgPace)}</div>
              <small style={{ opacity: .8 }}>Globalni prosek: {fmtPace(globalAvg?.avg_pace_sec)}</small>
              {vsGlobalPace != null && (
                <div style={{ opacity: .9, marginTop: 4 }}>
                  {vsGlobalPace >= 0 ? "Bolji" : "Sporiji"} od proseka za <b>{Math.abs(vsGlobalPace)}%</b>
                </div>
              )}
            </div>
            <div className="rp-row">
              <div className="rp-label">Moja prosečna distanca</div>
              <div className="rp-value">{Number.isFinite(myAvgDist) ? myAvgDist.toFixed(2) + " km" : "—"}</div>
              <small style={{ opacity: .8 }}>Globalni prosek: {Number.isFinite(globalAvg?.avg_distance_km) ? globalAvg.avg_distance_km.toFixed(2) + " km" : "—"}</small>
              {vsGlobalDist != null && (
                <div style={{ opacity: .9, marginTop: 4 }}>
                  {vsGlobalDist >= 0 ? "Veća" : "Manja"} od proseka za <b>{Math.abs(vsGlobalDist)}%</b>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <h4 style={{ margin: "4px 0" }}>Top 5 — ukupni kilometri</h4>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {leaderKm.map((u) => (
                  <li key={u.user_id} style={{ marginBottom: 4 }}>
                    {u.name ?? `#${u.user_id}`} — <b>{Number(u.total_km).toFixed(2)} km</b>
                  </li>
                ))}
                {leaderKm.length === 0 && <div style={{ opacity: .7 }}>Nema podataka.</div>}
              </ol>
            </div>
            <div>
              <h4 style={{ margin: "4px 0" }}>Top 5 — najbolji avg pace</h4>
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {leaderPace.map((u) => (
                  <li key={u.user_id} style={{ marginBottom: 4 }}>
                    {u.name ?? `#${u.user_id}`} — <b>{fmtPace(u.avg_pace_sec)}</b>
                  </li>
                ))}
                {leaderPace.length === 0 && <div style={{ opacity: .7 }}>Nema podataka.</div>}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* LISTA + MAPA */}
      <section className="rp-card">
        <h3 style={{ marginTop: 0 }}>Moji zapisi</h3>

        {loading && <div className="note">Učitavanje...</div>}
        {err && <div className="note">{err}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(300px, 1fr)", gap: 16 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="re-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Vreme</th>
                  <th style={th}>Dist (km)</th>
                  <th style={th}>Trajanje (s)</th>
                  <th style={th}>Pace</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, textAlign: "center", opacity: .8 }}>Nema zapisa.</td>
                  </tr>
                ) : items.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => setSel(r)}
                    style={{ cursor: "pointer", background: sel?.id === r.id ? "#1a1a1a" : undefined }}
                  >
                    <td style={td}>{(meta?.from ?? 1) + i}</td>
                    <td style={td}>{fmtDate(r.recorded_at)}</td>
                    <td style={td}>{Number(r.distance_km ?? 0).toFixed(2)}</td>
                    <td style={td}>{r.duration_sec ?? "—"}</td>
                    <td style={td}>{fmtPace(r.avg_pace_sec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* paginacija */}
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
          </div>

          {/* MAPA prikaza selektovanog zapisa */}
          <div style={{ minHeight: 320, borderRadius: 12, overflow: "hidden" }}>
            <MapContainer
              center={{ lat: 44.8125, lng: 20.4612 }}
              zoom={12}
              style={{ height: 360, width: "100%" }}
              whenCreated={(map) => (mapRef.current = map)}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {sel?.gps_track && Array.isArray(sel.gps_track) && sel.gps_track.length > 0 && (
                <>
                  <Polyline positions={sel.gps_track.map(p => [p[0], p[1]])} />
                  <Marker position={[sel.gps_track[0][0], sel.gps_track[0][1]]}><Popup>Start</Popup></Marker>
                  <Marker position={[sel.gps_track[sel.gps_track.length - 1][0], sel.gps_track[sel.gps_track.length - 1][1]]}><Popup>Kraj</Popup></Marker>
                </>
              )}
            </MapContainer>

            <div style={{ marginTop: 8, opacity: .85 }}>
              {sel ? (
                <>
                  <b>Izabrano:</b> {fmtDate(sel.recorded_at)} · {Number(sel.distance_km ?? 0).toFixed(2)} km · {fmtPace(sel.avg_pace_sec)}
                </>
              ) : (
                <>Klikni zapis u tabeli za prikaz rute.</>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const th = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #2a2a2a", position: "sticky", top: 0, background: "#111" };
const td = { padding: "8px 12px", borderBottom: "1px solid #1b1b1b" };
