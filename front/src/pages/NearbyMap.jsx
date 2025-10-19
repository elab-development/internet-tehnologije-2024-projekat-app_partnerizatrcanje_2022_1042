import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";
import { Link } from "react-router-dom";

// Leaflet ikonice
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon1x from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon1x, shadowUrl: iconShadow });

const POLL_MS = 15000;
const DEFAULT_RADIUS_KM = 5;

// ---- Helpers ----
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const cacheGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj?.exp && Date.now() > obj.exp) { localStorage.removeItem(key); return null; }
    return obj?.val ?? null;
  } catch { return null; }
};
const cacheSet = (key, val, ttlMs = 24 * 60 * 60 * 1000) => {
  try { localStorage.setItem(key, JSON.stringify({ val, exp: Date.now() + ttlMs })); } catch {}
};

// Nominatim geokodiranje (1 req/s throttle u pozivaču)
async function geocodeLocation(q) {
  if (!q) return null;
  const key = "geo:" + q.trim().toLowerCase();
  const cached = cacheGet(key);
  if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) return cached;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error("Geocoding failed");
  const arr = await res.json();
  const first = Array.isArray(arr) && arr[0] ? { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) } : null;
  if (first && Number.isFinite(first.lat) && Number.isFinite(first.lng)) {
    cacheSet(key, first);
  }
  return first;
}

// Haversine u KM
function distKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function NearbyMap() {
  const [center, setCenter] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [err, setErr] = useState("");
  const timerRef = useRef(null);

  const canQuery = useMemo(() => !!center, [center]);

  // 1) Geolokacija iz browsera
  useEffect(() => {
    if (!("geolocation" in navigator)) { setErr("Geolokacija nije dostupna u pregledaču."); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
      },
      (e) => setErr(e.message || "Neuspešno čitanje lokacije."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2) Pošalji moju lokaciju (POST) + probaj da je pročitaš (GET) — ako GET ne postoji, ignorisaće se
  async function syncMyLocation() {
    if (!center) return;
    const accInt = Number.isFinite(accuracy) ? Math.round(Number(accuracy)) : null;
    try {
       await api.post("/api/me/location", { lat: center.lat, lng: center.lng, accuracy_m: accInt });
    } catch { /* ignoriši POST grešku */ }
    try {
      const meRes = await api.get("/api/me/location");
      setMe(meRes.data);
    } catch { /* GET je opcion, ignoriši ako 404 */ }
  }

  // 3) Učitaj korisnike u krugu + evente (evente geokodiramo po location ako nemaju koordinate)
  async function pullNearby() {
    if (!center) return;
    setErr("");
    try {
      const [uRes, eRes] = await Promise.all([
        api.get("/api/nearby-users", { params: { lat: center.lat, lng: center.lng, radius_km: radiusKm } }),
        api.get("/api/run-events",   { params: {
          date_from: new Date(Date.now() - 3600_000).toISOString().slice(0,19).replace("T"," "),
          per_page: 50
        }})
      ]);

      // --- users ---
      setUsers(Array.isArray(uRes?.data?.users) ? uRes.data.users : []);

      // --- events (+geokodiranje ako nemaju coordinate) ---
      const rows = Array.isArray(eRes?.data?.data) ? eRes.data.data : [];
      const needGeo = [];
      const prelim = rows.map(ev => {
        const hasLatLng = Number.isFinite(ev.meet_lat) && Number.isFinite(ev.meet_lng);
        if (!hasLatLng && ev.location) needGeo.push(ev);
        return hasLatLng
          ? { ...ev, _lat: parseFloat(ev.meet_lat), _lng: parseFloat(ev.meet_lng) }
          : { ...ev, _lat: null, _lng: null };
      });

      // Nominatim rate-limit ~1/s
      for (let i = 0; i < needGeo.length; i++) {
        const ev = needGeo[i];
        const coords = await geocodeLocation(ev.location).catch(() => null);
        if (coords) {
          const idx = prelim.findIndex(p => p.id === ev.id);
          if (idx >= 0) { prelim[idx]._lat = coords.lat; prelim[idx]._lng = coords.lng; }
        }
        if (i < needGeo.length - 1) await sleep(1100);
      }

      const filtered = prelim
        .filter(ev => Number.isFinite(ev._lat) && Number.isFinite(ev._lng))
        .filter(ev => distKm(center, { lat: ev._lat, lng: ev._lng }) <= radiusKm);

      setEvents(filtered);
    } catch (e) {
      setErr("Ne mogu da učitam podatke u blizini.");
    }
  }

  // 4) polling
  useEffect(() => {
    if (!canQuery) return;
    syncMyLocation();
    pullNearby();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      syncMyLocation();
      pullNearby();
    }, POLL_MS);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery, radiusKm]);

  const mapCenter = center ?? { lat: 44.8125, lng: 20.4612 }; // BG fallback

  return (
    <main className="hp" style={{ padding: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Trkači u blizini (mapa)</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <label>Radijus (km)</label>
          <select value={radiusKm} onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}>
            {[2, 5, 10, 20].map(km => <option key={km} value={km}>{km}</option>)}
          </select>
          <button className="btn btn--tiny" onClick={() => { syncMyLocation(); pullNearby(); }}>
            Osveži
          </button>
        </div>
      </header>

      {err && <div className="note" style={{ marginBottom: 8 }}>{err}</div>}

      <div style={{ height: "70vh", borderRadius: 12, overflow: "hidden" }}>
        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Moja pozicija */}
          {center && (
            <>
              <Marker position={[center.lat, center.lng]}>
                <Popup><b>Vi ste ovde</b><br/>{me?.name ? me.name : "Prijavljeni korisnik"}</Popup>
              </Marker>
              <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ fillOpacity: 0.05 }} />
            </>
          )}

          {/* Trkači u blizini */}
          {users.map(u => (
            <Marker key={`u-${u.id}`} position={[u.lat, u.lng]}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <b>{u.name}</b><br/>
                  Poslednje viđen: {u.last_seen_at ?? "n/a"}<br/>
                  Udaljenost: {typeof u.distance_km === "number" ? `${u.distance_km} km` : "—"}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Događaji (geokodirani + cache) */}
          {events.map(ev => (
            <Marker key={`e-${ev.id}`} position={[ev._lat, ev._lng]}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <b>{ev.location || "Događaj"}</b><br/>
                  Distanca: {ev.distance_km ?? "—"} km<br/>
                  Status: {ev.status || "planned"}<br/>
                  <Link to={`/run-events/${ev.id}`}>Otvori detalj</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p style={{ opacity: 0.8, marginTop: 8 }}>
        Napomena: adrese događaja se geokodiraju preko OpenStreetMap (Nominatim) i keširaju 24h u pregledaču.
      </p>
    </main>
  );
}
