 
// vuče trkače u blizini i (po potrebi) geokodira adrese događaja preko Nominatim-a.
// Različitim bojama pinova razlikujemo: mene (zelena), druge (plava), događaje (narandžasta).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";
import { Link } from "react-router-dom";

// Leaflet-ov "fix" za default PNG ikone (bez ovoga default markeri se nekad ne vide u bundlerima)
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon1x from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon1x, shadowUrl: iconShadow });

// Na koliko često osvežavamo ko je u blizini
const POLL_MS = 15000;
const DEFAULT_RADIUS_KM = 5;

/* ------------------ Helper funkcije ------------------ */

// najjednostavniji sleep (čekanje) – koristimo da poštujemo Nominatim rate limit ~1req/s
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// jednostavan localStorage keš sa TTL (ovde čuvamo rezultate geokodiranja)
const cacheGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj?.exp && Date.now() > obj.exp) { // isteklo => obriši i vrati null
      localStorage.removeItem(key);
      return null;
    }
    return obj?.val ?? null;
  } catch {
    return null;
  }
};
const cacheSet = (key, val, ttlMs = 24 * 60 * 60 * 1000) => {
  try {
    localStorage.setItem(key, JSON.stringify({ val, exp: Date.now() + ttlMs }));
  } catch {}
};

 
 
/* ------------------ Custom Leaflet ikone (DivIcon + CSS) ------------------ */
// Umesto PNG-ova, crtamo pin preko CSS-a i samo menjamo boju.
// (iconAnchor/popupAnchor podešavaju poravnanje prema vrhu pina).
const meIcon = L.divIcon({
  className: "pin pin--me",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -34],
});
const userIcon = L.divIcon({
  className: "pin pin--user",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -34],
}); 

export default function NearbyMap() {
  // center/accuracy držimo iz browser geolokacije
  const [center, setCenter] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  // UI state
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

  // podaci za mapu
  const [me, setMe] = useState(null);      // odgovor sa /api/me/location (opciono)
  const [users, setUsers] = useState([]);  // trkači iz /api/nearby-users 

  const [err, setErr] = useState("");      // poruka korisniku (ako nešto krene po zlu)
  const timerRef = useRef(null);

  const canQuery = useMemo(() => !!center, [center]);
  const hasToken = !!localStorage.getItem("token"); // koristimo da ne lupamo /nearby bez auth-a

  /* ------------------ 1) Uzmi geolokaciju iz browsera ------------------ */
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setErr("Geolokacija nije dostupna u pregledaču.");
      return;
    }
    // watchPosition = prati promene lokacije (bolje za mapu nego getCurrentPosition)
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy); // preciznost u metrima – nekad decimalna
      },
      (e) => setErr(e.message || "Neuspešno čitanje lokacije."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ------------------ 2) Pošalji moju lokaciju na backend (+ učitaj je nazad) ------------------ */
  // Zašto? Da backend zna gde sam i da me drugi vide (naravno, samo ulogovani).
  async function syncMyLocation() {
    if (!center || !hasToken) return;
    const accInt = Number.isFinite(accuracy) ? Math.round(Number(accuracy)) : null; // backend traži integer
    try {
      await api.post("/api/me/location", { lat: center.lat, lng: center.lng, accuracy_m: accInt });
    } catch {/* tihi fail – ne rušimo UI */}
    try {
      const meRes = await api.get("/api/me/location");
      setMe(meRes.data);
    } catch {/* GET je opcion – ako 404/403, samo ignorišemo */}
  }

  /* ------------------ 3) Učitaj ko je blizu   ------------------ */
  async function pullNearby() {
    if (!center) return;
    setErr("");
    try {
      // Ako nema tokena, /nearby-users preskačemo (vrati prazno) – mapa i dalje radi
      const [uRes, eRes] = await Promise.all([
        hasToken
          ? api.get("/api/nearby-users", { params: { lat: center.lat, lng: center.lng, radius_km: radiusKm } })
          : Promise.resolve({ data: { users: [] } }),
         
      ]);

      // 3a) trkači
      setUsers(Array.isArray(uRes?.data?.users) ? uRes.data.users : []);

       
     
    } catch (e) {
      setErr("Ne mogu da učitam podatke u blizini.");
    }
  }

  /* ------------------ 4) Polling (periodično osvežavanje) ------------------ */
  useEffect(() => {
    if (!canQuery) return;
    // prvi "udar"
    syncMyLocation();
    pullNearby();
    // pa posle na svakih POLL_MS
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      syncMyLocation();
      pullNearby();
    }, POLL_MS);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery, radiusKm, hasToken]);

  // fallback centar na Beograd dok ne dobijemo lokaciju iz browsera
  const mapCenter = center ?? { lat: 44.8125, lng: 20.4612 };

  return (
    <main className="hp" style={{ padding: 16 }}>
      
      <style>{`
        .pin { position: relative; width:28px; height:36px; }
        .pin::before{
          content:"";
          position:absolute; left:50%; top:6px;
          width:24px; height:24px; margin-left:-12px;
          border-radius:50% 50% 50% 0; transform: rotate(-45deg);
          box-shadow: 0 0 0 2px #fff inset, 0 2px 8px rgba(0,0,0,.35);
        }
        .pin--me::before    { background:#22c55e; }  /* zelena = ja */
        .pin--user::before  { background:#3b82f6; }  /* plava  = ostali trkači */
        .pin--event::before { background:#f59e0b; }  /* narandžasta = događaji */
      `}</style>

      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Trkači u blizini (mapa)</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <label>Radijus (km)</label>
          {/* jednostavan filter radijusa – na promenu, odmah okida novi polling ciklus */}
          <select value={radiusKm} onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}>
            {[2, 5, 10, 20].map((km) => (
              <option key={km} value={km}>{km}</option>
            ))}
          </select>
          <button className="btn btn--tiny" onClick={() => { syncMyLocation(); pullNearby(); }}>
            Osveži
          </button>
        </div>
      </header>

      {err && <div className="note" style={{ marginBottom: 8 }}>{err}</div>}

      <div style={{ height: "70vh", borderRadius: 12, overflow: "hidden" }}>
        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Moja pozicija: zeleni pin + krug radijusa (Circle je u metrima) */}
          {center && (
            <>
              <Marker position={[center.lat, center.lng]} icon={meIcon}>
                <Popup>
                  <b>Vi ste ovde</b><br />
                  {me?.name ? me.name : "Prijavljeni korisnik"}
                </Popup>
              </Marker>
              <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ fillOpacity: 0.05 }} />
            </>
          )}

          {/* Drugi trkači (stiglo sa /nearby-users) */}
          {users.map((u) => (
            <Marker key={`u-${u.id}`} position={[u.lat, u.lng]} icon={userIcon}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <b>{u.name}</b><br />
                  Poslednje viđen: {u.last_seen_at ?? "n/a"}<br />
                  Udaljenost: {typeof u.distance_km === "number" ? `${u.distance_km} km` : "—"}
                </div>
              </Popup>
            </Marker>
          ))}

         
        </MapContainer>
      </div>

      {/* Ako nisi ulogovan, objasni zašto nema trkača (ali događaji i dalje rade) */}
      {!hasToken && (
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          Ulogujte se da vidite ostale trkače u blizini.
        </p>
      )}
      <p style={{ opacity: 0.8, marginTop: 4 }}>
        Napomena: adrese događaja se geokodiraju preko OpenStreetMap (Nominatim) i keširaju 24h u pregledaču.
      </p>
    </main>
  );
}
