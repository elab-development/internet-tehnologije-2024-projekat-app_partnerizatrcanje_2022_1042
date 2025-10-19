import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api";
import "./run-plans.css";

// Leaflet mapa
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon1x from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon1x, shadowUrl: iconShadow });

function getCurrentUserId() {
  const raw = localStorage.getItem("user_id");
  return raw ? parseInt(raw, 10) : undefined;
}

/* ----------------- komponenta za hvatanje klika na mapi ----------------- */
function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

export default function RunPlanUpsert() {
  const { id } = useParams(); // ako ima id -> edit mode
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    start_time: "",
    location: "",
    distance_km: "",
    target_pace_sec: "",
    notes: "",
    meet_lat: "",
    meet_lng: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [fv, setFv] = useState({}); // field errors (422)

  const mapRef = useRef(null); // da možemo da centriramo mapu

  // Inicijalni centar mape: Beograd ili postojeće koordinate (edit)
  const initialCenter = useMemo(() => {
    if (form.meet_lat && form.meet_lng) {
      const lat = Number(form.meet_lat), lng = Number(form.meet_lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return { lat: 44.8125, lng: 20.4612 }; // BG
  }, [form.meet_lat, form.meet_lng]);

  useEffect(() => {
    if (!isEdit) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(`/api/run-plans/${id}`, { signal: ctrl.signal });
        const body = res?.data ?? res;
        const p = body?.data ?? body;
        setForm({
          start_time: p.start_time ? p.start_time.slice(0, 16) : "", // za datetime-local
          location: p.location ?? "",
          distance_km: p.distance_km ?? "",
          target_pace_sec: p.target_pace_sec ?? "",
          notes: p.notes ?? "",
          meet_lat: p.meet_lat ?? "",
          meet_lng: p.meet_lng ?? "",
        });
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr("Ne mogu da učitam plan.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [isEdit, id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setFv((fv) => ({ ...fv, [name]: undefined }));
  };

  // klik na mapu -> upiši koordinate u formu
  const pickOnMap = ({ lat, lng }) => {
    setForm(f => ({ ...f, meet_lat: lat.toFixed(6), meet_lng: lng.toFixed(6) }));
  };

  // "Moja lokacija" – koristi browser geolocation
  const useMyLocation = async () => {
    if (!("geolocation" in navigator)) {
      alert("Geolokacija nije dostupna u pregledaču.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setForm(f => ({ ...f, meet_lat: lat.toFixed(6), meet_lng: lng.toFixed(6) }));
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
        }
      },
      () => alert("Neuspešno čitanje lokacije."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");
    setFv({});

    // pripremi payload (koordinate kao brojke ako postoje)
    const payload = {
      ...form,
      meet_lat: form.meet_lat === "" ? null : Number(form.meet_lat),
      meet_lng: form.meet_lng === "" ? null : Number(form.meet_lng),
    };

    try {
      if (isEdit) {
        const res = await api.put(`/api/run-plans/${id}`, payload);
        const body = res?.data ?? res;
        const saved = body?.data ?? body;
        setMsg("Plan je izmenjen.");
        navigate(`/run-plans/${saved.id}`, { replace: true });
      } else {
        payload.user_id = getCurrentUserId(); // backend traži user_id
        const res = await api.post("/api/run-plans", payload);
        const body = res?.data ?? res;
        const created = body?.data ?? body;
        setMsg("Plan je kreiran.");
        navigate(`/run-plans/${created.id}`, { replace: true });
      }
    } catch (e) {
      const data = e?.response?.data;
      if (e?.response?.status === 422 && data?.errors) {
        setFv(data.errors);
      } else {
        setErr(data?.message || "Greška pri snimanju plana.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hp rp">
      <Link to="/run-plans" className="rp__back">← Nazad na listu</Link>
      <h2 className="rp__title">{isEdit ? "Izmena plana" : "Novi plan"}</h2>

      {err && <div className="note">{err}</div>}
      {msg && <div className="note">{msg}</div>}

      <form className="rp-form" onSubmit={onSubmit} noValidate>
        <div className="rp-grid">
          <div className="rp-field">
            <label className="rp__lbl">Datum/Vreme</label>
            <input
              type="datetime-local"
              className={`rp__input ${fv.start_time ? "is-invalid" : ""}`}
              name="start_time"
              value={form.start_time}
              onChange={onChange}
              required
            />
            {fv.start_time && <div className="rp__err">{fv.start_time[0]}</div>}
          </div>

          <div className="rp-field">
            <label className="rp__lbl">Lokacija (opis/tekst)</label>
            <input
              className={`rp__input ${fv.location ? "is-invalid" : ""}`}
              name="location"
              value={form.location}
              onChange={onChange}
              placeholder="npr. Ada Ciganlija"
            />
            {fv.location && <div className="rp__err">{fv.location[0]}</div>}
          </div>

          <div className="rp-field">
            <label className="rp__lbl">Distanca (km)</label>
            <input
              type="number" step="0.01" min="0"
              className={`rp__input ${fv.distance_km ? "is-invalid" : ""}`}
              name="distance_km"
              value={form.distance_km}
              onChange={onChange}
              placeholder="npr. 10"
            />
            {fv.distance_km && <div className="rp__err">{fv.distance_km[0]}</div>}
          </div>

          <div className="rp-field">
            <label className="rp__lbl">Ciljani pace (sec/km)</label>
            <input
              type="number" min="0"
              className={`rp__input ${fv.target_pace_sec ? "is-invalid" : ""}`}
              name="target_pace_sec"
              value={form.target_pace_sec}
              onChange={onChange}
              placeholder="npr. 330 (5:30/km)"
            />
            {fv.target_pace_sec && <div className="rp__err">{fv.target_pace_sec[0]}</div>}
          </div>

          {/* --- Koordinate --- */}
          <div className="rp-field">
            <label className="rp__lbl">Meet lat</label>
            <input
              type="number" step="0.000001"
              className={`rp__input ${fv.meet_lat ? "is-invalid" : ""}`}
              name="meet_lat"
              value={form.meet_lat}
              onChange={onChange}
              placeholder="44.806…"
            />
            {fv.meet_lat && <div className="rp__err">{fv.meet_lat[0]}</div>}
          </div>

          <div className="rp-field">
            <label className="rp__lbl">Meet lng</label>
            <input
              type="number" step="0.000001"
              className={`rp__input ${fv.meet_lng ? "is-invalid" : ""}`}
              name="meet_lng"
              value={form.meet_lng}
              onChange={onChange}
              placeholder="20.412…"
            />
            {fv.meet_lng && <div className="rp__err">{fv.meet_lng[0]}</div>}
          </div>

          {/* --- Mini mapa za izbor klikom + dugme Moja lokacija --- */}
          <div className="rp-field rp-field--full">
            <label className="rp__lbl">Izaberi tačku na mapi (klikom)</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button type="button" className="btn" onClick={useMyLocation}>
                Moja lokacija
              </button>
            </div>
            <div style={{ height: 320, borderRadius: 12, overflow: "hidden" }}>
              <MapContainer
                center={initialCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                whenCreated={(map) => (mapRef.current = map)}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickPicker onPick={pickOnMap} />
                {Number.isFinite(Number(form.meet_lat)) && Number.isFinite(Number(form.meet_lng)) && (
                  <Marker position={[Number(form.meet_lat), Number(form.meet_lng)]}>
                    <Popup>Mesto okupljanja</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
            <small style={{ opacity: 0.75 }}>
              Savet: klikni na mapu da postaviš marker i popuniš koordinate.
            </small>
          </div>
        </div>

        <div className="rp__formActions">
          <button className="btn" type="button" onClick={() => navigate(-1)}>Otkaži</button>
          <button className="btn btn--primary" disabled={loading}>
            {loading ? "Snimam..." : isEdit ? "Sačuvaj izmene" : "Kreiraj plan"}
          </button>
        </div>
      </form>
    </main>
  );
}
