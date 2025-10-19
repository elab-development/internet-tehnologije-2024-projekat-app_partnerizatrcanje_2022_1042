// src/pages/MyStats.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./my-stats.css";

import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon1x from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon1x, shadowUrl: iconShadow });

function useMe() {
  const [me, setMe] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    let alive = true;
    if (!token) { setMe(null); return; }
    (async () => {
      try {
        const res = await api.get("/api/me");
        const u = res?.data?.data ?? res?.data ?? res;
        if (alive) setMe(u || null);
        if (u?.id) localStorage.setItem("user_id", String(u.id));
      } catch {
        setMe(null);
      }
    })();
    return () => { alive = false; };
  }, []);
  return me;
}

const fmtPace = (sec) => {
  if (!Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}/km`;
};

export default function MyStats() {
  const me = useMe();
  const resolvedUserId = me?.id ?? (localStorage.getItem("user_id") ? parseInt(localStorage.getItem("user_id"),10) : undefined);

  // hero summary
  const [sum, setSum] = useState(null);
  const [sumErr, setSumErr] = useState("");

  // global averages for comparison
  const [glob, setGlob] = useState(null);
  const [globErr, setGlobErr] = useState("");

  // list (pagination)
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [listErr, setListErr] = useState("");

  // selected stat to draw route
  const [sel, setSel] = useState(null);

  // load summary + global
  useEffect(() => {
    if (!resolvedUserId) return;
    let alive = true;

    (async () => {
      try {
        setSumErr("");
        const r1 = await api.get(`/api/stats/user/${resolvedUserId}/summary`);
        if (alive) setSum(r1?.data ?? r1);
      } catch (e) {
        if (alive) setSumErr("Ne mogu da učitam tvoje statistike.");
      }

      try {
        setGlobErr("");
        // globalni prosek i rang liste — ako nemaš poseban endpoint, izvuci iz /api/run-stats (prvih 50) i izračunaj
        const gRes = await api.get("/api/run-stats", { params: { per_page: 50 } });
        const list = gRes?.data?.data ?? [];
        const avgPace = list.length ? Math.round(list.filter(x => Number.isFinite(x.avg_pace_sec)).reduce((a,b)=>a+b.avg_pace_sec,0)/list.length) : null;
        const avgDist = list.length ? (list.filter(x=>Number.isFinite(x.distance_km)).reduce((a,b)=>a+b.distance_km,0)/list.length) : null;

        // top 5 ukupni km po korisniku (grub prikaz iz lokalnih 50 redova)
        const byUser = {};
        list.forEach(x => {
          const key = x.user?.id || x.user_id;
          if (!key) return;
          byUser[key] = byUser[key] || { name: x.user?.name || `#${key}`, km: 0 };
          byUser[key].km += Number(x.distance_km) || 0;
        });
        const topKm = Object.values(byUser).sort((a,b)=>b.km - a.km).slice(0,5);

        // top 5 najbolji pace (manji je bolji)
        const byUserP = {};
        list.forEach(x => {
          const key = x.user?.id || x.user_id;
          if (!key || !Number.isFinite(x.avg_pace_sec) || x.avg_pace_sec<=0) return;
          byUserP[key] = byUserP[key] || { name: x.user?.name || `#${key}`, sec: x.avg_pace_sec, n: 0 };
          byUserP[key].sec = Math.min(byUserP[key].sec, x.avg_pace_sec);
        });
        const topPace = Object.values(byUserP).sort((a,b)=>a.sec - b.sec).slice(0,5);

        setGlob({
          avgPaceSec: avgPace,
          avgDistKm: avgDist,
          topKm,
          topPace,
        });
      } catch {
        setGlobErr("Ne mogu da učitam globalne podatke.");
      }
    })();

    return () => { alive = false; };
  }, [resolvedUserId]);

  // load my list (paginated)
  useEffect(() => {
    if (!resolvedUserId) return;
    let alive = true;
    (async () => {
      try {
        setListErr("");
        const res = await api.get("/api/run-stats", { params: { user_id: resolvedUserId, page, per_page: 10 }});
        const body = res?.data ?? res;
        if (!alive) return;
        setRows(Array.isArray(body?.data) ? body.data : []);
        setMeta(body?.meta ?? null);
      } catch {
        if (alive) setListErr("Ne mogu da učitam tvoje statistike.");
      }
    })();
    return () => { alive = false; };
  }, [resolvedUserId, page]);

  const myAvgPace = useMemo(() => sum?.avg_pace_sec ?? null, [sum]);
  const myAvgDist = useMemo(() => {
    if (!sum?.total_runs || !sum?.total_distance) return null;
    return sum.total_runs > 0 ? (sum.total_distance / sum.total_runs) : null;
  }, [sum]);

  const betterThan = useMemo(() => {
    if (!myAvgPace || !glob?.avgPaceSec) return null;
    // manji sec/km je bolji
    const delta = glob.avgPaceSec - myAvgPace;
    return Math.round((Math.max(0, delta) / glob.avgPaceSec) * 100);
  }, [myAvgPace, glob]);

  const worseDist = useMemo(() => {
    if (!myAvgDist || !glob?.avgDistKm) return null;
    const delta = myAvgDist - glob.avgDistKm;
    return Math.round((Math.max(0, -delta) / glob.avgDistKm) * 100);
  }, [myAvgDist, glob]);

  const mapRoute = useMemo(() => {
    if (!sel?.gps_track) return null;
    // očekuje se niz [lat,lng,timestamp?]
    const pts = sel.gps_track
      .map(p => Array.isArray(p) && p.length >= 2 ? [Number(p[0]), Number(p[1])] : null)
      .filter(Boolean);
    return pts.length ? pts : null;
  }, [sel]);

  const mapCenter = mapRoute?.[0] ?? [44.8125, 20.4612]; // BG fallback

  return (
    <main className="hp ms">
      {/* HERO */}
      <div className="ms__hero">
        <div className="ms__card">
          <div style={{ opacity:.8 }}>Ukupno trčanja</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{sum?.total_runs ?? "—"}</div>
        </div>
        <div className="ms__card">
          <div style={{ opacity:.8 }}>Ukupno km</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{Number(sum?.total_distance||0).toFixed(2)}</div>
        </div>
        <div className="ms__card">
          <div style={{ opacity:.8 }}>Prosečan pace</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{fmtPace(myAvgPace)}</div>
        </div>
        <div className="ms__card">
          <div style={{ opacity:.8 }}>Poslednje trčanje</div>
          <div style={{ fontSize:16 }}>{sum?.last_run_at || "—"}</div>
        </div>
      </div>

      {/* POREĐENJE */}
      <section className="ms__compare">
        <h3 style={{ marginTop: 0 }}>Poređenje sa ostalima</h3>
        {globErr && <div className="note">{globErr}</div>}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div className="ms__card">
            <div style={{ fontWeight:600, marginBottom:6 }}>Moj prosečan pace</div>
            <div style={{ fontSize:22, fontWeight:700 }}>{fmtPace(myAvgPace)}</div>
            <div style={{ opacity:.8, marginTop:4 }}>Globalni prosek: {fmtPace(glob?.avgPaceSec)}</div>
            {betterThan!=null && <div style={{ marginTop:8, fontWeight:700 }}>Bolji od proseka za {betterThan}%</div>}

            <div style={{ marginTop:16, fontWeight:600 }}>Top 5 — ukupni kilometri</div>
            <ol style={{ marginTop:8 }}>
              {glob?.topKm?.map((u,i)=>(
                <li key={i}>
                  {u.name} — <b>{u.km.toFixed(2)} km</b>
                </li>
              )) ?? <div style={{ opacity:.7 }}>Nema podataka.</div>}
            </ol>
          </div>

          <div className="ms__card">
            <div style={{ fontWeight:600, marginBottom:6 }}>Moja prosečna distanca</div>
            <div style={{ fontSize:22, fontWeight:700 }}>{myAvgDist ? `${myAvgDist.toFixed(2)} km` : "—"}</div>
            <div style={{ opacity:.8, marginTop:4 }}>
              Globalni prosek: {glob?.avgDistKm ? `${glob.avgDistKm.toFixed(2)} km` : "—"}
            </div>
            {worseDist!=null && <div style={{ marginTop:8, fontWeight:700 }}>Manja od proseka za {worseDist}%</div>}

            <div style={{ marginTop:16, fontWeight:600 }}>Top 5 — najbolji avg pace</div>
            <ol style={{ marginTop:8 }}>
              {glob?.topPace?.map((u,i)=>(
                <li key={i}>
                  {u.name} — <b>{fmtPace(u.sec)}</b>
                </li>
              )) ?? <div style={{ opacity:.7 }}>Nema podataka.</div>}
            </ol>
          </div>
        </div>
      </section>

      {/* LISTA + MAPA */}
      <section className="ms__bottom">
        <div className="ms__table">
          <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ margin:0 }}>Moji zapisi</h3>
            {listErr && <div className="note" style={{ marginTop:8 }}>{listErr}</div>}
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
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
                {rows.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding:16, textAlign:"center", opacity:.8 }}>Nema zapisa.</td></tr>
                ) : rows.map((r,i)=>(
                  <tr key={r.id} className="rowHover" onClick={()=>setSel(r)} style={{ cursor:"pointer" }}>
                    <td style={td}>{(meta?.from ?? 1)+i}</td>
                    <td style={td}>{new Date(r.recorded_at).toLocaleString()}</td>
                    <td style={td}>{Number(r.distance_km||0).toFixed(2)}</td>
                    <td style={td}>{r.duration_sec ?? "—"}</td>
                    <td style={td}>{fmtPace(r.avg_pace_sec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <div style={{ display:"flex", gap:8, alignItems:"center", padding:12 }}>
              <button className="btn btn--tiny" disabled={meta.current_page<=1}
                onClick={()=>setPage(p=>Math.max(1,p-1))}>← Prethodna</button>
              <span style={{ opacity:.8 }}>Strana {meta.current_page} / {meta.last_page}</span>
              <button className="btn btn--tiny" disabled={meta.current_page>=meta.last_page}
                onClick={()=>setPage(p=>Math.min(meta.last_page,p+1))}>Sledeća →</button>
            </div>
          )}
        </div>

        <div className="ms__mapCard">
          <div style={{ height: 420 }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height:"100%", width:"100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapRoute ? (
                <>
                  <Polyline positions={mapRoute} />
                  <Marker position={mapRoute[0]}><Popup>Start</Popup></Marker>
                  <Marker position={mapRoute[mapRoute.length-1]}><Popup>Kraj</Popup></Marker>
                </>
              ) : (
                <Marker position={mapCenter}><Popup>Beograd</Popup></Marker>
              )}
            </MapContainer>
          </div>
          <div style={{ padding:8, textAlign:"center", opacity:.85 }}>
            {sel ? "Prikazana je ruta iz izabranog zapisa." : "Klikni zapis u tabeli za prikaz rute."}
          </div>
        </div>
      </section>
    </main>
  );
}

const th = { textAlign:"left", padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)" };
const td = { padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)" };
