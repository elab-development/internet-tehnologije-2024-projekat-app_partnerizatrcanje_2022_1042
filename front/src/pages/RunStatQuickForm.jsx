 
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

/**
 * Brzi unos rezultata trke/treninga.
 * Props:
 * - userId: broj (obavezno ako nema /api/me)
 * - runEventId: broj (opciono, ako se dodaje sa stranice eventa)
 * - defaultRecordedAt: ISO datetime string ili null (npr. event.start_time)
 * - onSaved: (saved) => void   // callback posle uspešnog snimanja
 */
export default function RunStatQuickForm({
  userId: userIdProp,
  runEventId = null,
  defaultRecordedAt = null,
  onSaved,
}) {
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fv, setFv] = useState({}); // 422 field errors

  // inicijalni userId — prioritet /api/me, fallback iz props ili localStorage
  const localUserId = useMemo(() => {
    const raw = localStorage.getItem("user_id");
    return raw ? parseInt(raw, 10) : undefined;
  }, []);

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem("token");
    if (!token) { setMe(null); return; }
    (async () => {
      try {
        const res = await api.get("/api/me");
        const u = res?.data?.data ?? res?.data ?? res;
        if (alive) setMe(u || null);
        if (u?.id) localStorage.setItem("user_id", String(u.id));
      } catch {
        // ako me ne radi, nije smak sveta — koristićemo userIdProp ili localStorage
        setMe(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  const resolvedUserId = me?.id ?? userIdProp ?? localUserId;

  // forma
  const [form, setForm] = useState({
    recorded_at: defaultRecordedAt
      ? defaultRecordedAt.slice(0, 16) // za input[type=datetime-local]
      : new Date().toISOString().slice(0, 16),
    distance_km: "",
    duration_min: "",   // unos kao mm i ss radi lakšeg rada korisnika
    duration_sec: "",
    avg_pace_sec: "",   // računa se automatski ali može i ručno
    calories: "",
    gps_track_json: "", // optional: JSON niz tačaka [ [lat,lng,timestamp], ... ]
  });

  // tempo = duration_sec_total / distance_km
  const computedPace = useMemo(() => {
    const km = Number(form.distance_km);
    const dmin = Number(form.duration_min);
    const dsec = Number(form.duration_sec);
    if (!km || km <= 0 || (!Number.isFinite(dmin) && !Number.isFinite(dsec))) return null;
    const total = (Number.isFinite(dmin) ? dmin : 0) * 60 + (Number.isFinite(dsec) ? dsec : 0);
    if (total <= 0) return null;
    return Math.round(total / km); // sec/km
  }, [form.distance_km, form.duration_min, form.duration_sec]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFv(f => ({ ...f, [name]: undefined }));
    setErr("");
  };

  const fmtPace = (sec) => {
    if (!Number.isFinite(sec)) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}/km`;
    };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setFv({});

    try {
      const duration_sec_total =
        (Number(form.duration_min) || 0) * 60 + (Number(form.duration_sec) || 0);

      // gps_track: pokušaj parse JSON-a ako je korisnik uneo
      let gps_track = null;
      if (form.gps_track_json && form.gps_track_json.trim()) {
        try {
          const parsed = JSON.parse(form.gps_track_json);
          if (Array.isArray(parsed)) gps_track = parsed;
        } catch {
          // ignoriši ako ne valja; backend polje je optional
        }
      }

      const payload = {
        user_id: resolvedUserId,          // obavezno
        run_event_id: runEventId || null, // opcionalno
        recorded_at: form.recorded_at ? new Date(form.recorded_at).toISOString().slice(0,19).replace("T"," ") : new Date().toISOString(),
        distance_km: form.distance_km === "" ? null : Number(form.distance_km),
        duration_sec: duration_sec_total || null,
        // avg_pace_sec možeš proslediti, ali backend ga već računa ako ga ne pošalješ
        avg_pace_sec: (form.avg_pace_sec !== "" && Number(form.avg_pace_sec) >= 0)
          ? Number(form.avg_pace_sec)
          : (computedPace ?? null),
        calories: form.calories === "" ? null : Number(form.calories),
        gps_track: gps_track, // null ili niz (array)
      };

      const res = await api.post("/api/run-stats", payload);
      const saved = res?.data?.data ?? res?.data ?? res;

      // reset forme (po želji)
      setForm(f => ({ ...f, distance_km: "", duration_min: "", duration_sec: "", avg_pace_sec: "", calories: "", gps_track_json: "" }));

      // callback
      onSaved && onSaved(saved);
      alert("Statistika sačuvana.");
    } catch (e2) {
      const data = e2?.response?.data;
      if (e2?.response?.status === 422 && data?.errors) {
        setFv(data.errors);
      } else {
        setErr(data?.message || "Greška pri snimanju statistike.");
      }
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = !!resolvedUserId;

  return (
    <section className="rp-card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Unos rezultata posle trke</h3>
      {!canSubmit && (
        <div className="note" style={{ marginBottom: 12 }}>
          Morate biti ulogovani da biste sačuvali rezultat.
        </div>
      )}
      {err && <div className="note">{err}</div>}

      <form onSubmit={onSubmit} className="rp-form" noValidate>
        <div className="rp-grid">
          <div className="rp-field">
            <label className="rp__lbl">Datum/vreme (zapis)</label>
            <input
              type="datetime-local"
              className={`rp__input ${fv.recorded_at ? "is-invalid" : ""}`}
              name="recorded_at"
              value={form.recorded_at}
              onChange={onChange}
              required
            />
            {fv.recorded_at && <div className="rp__err">{fv.recorded_at[0]}</div>}
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
            <label className="rp__lbl">Trajanje (min)</label>
            <input
              type="number" min="0"
              className={`rp__input ${fv.duration_sec ? "is-invalid" : ""}`}
              name="duration_min"
              value={form.duration_min}
              onChange={onChange}
              placeholder="npr. 52"
            />
          </div>

          <div className="rp-field">
            <label className="rp__lbl">Trajanje (sek)</label>
            <input
              type="number" min="0" max="59"
              className={`rp__input ${fv.duration_sec ? "is-invalid" : ""}`}
              name="duration_sec"
              value={form.duration_sec}
              onChange={onChange}
              placeholder="npr. 30"
            />
            {fv.duration_sec && <div className="rp__err">{fv.duration_sec[0]}</div>}
          </div>

          <div className="rp-field">
            <label className="rp__lbl">Prosečan tempo (sec/km)</label>
            <input
              type="number" min="0"
              className={`rp__input ${fv.avg_pace_sec ? "is-invalid" : ""}`}
              name="avg_pace_sec"
              value={form.avg_pace_sec}
              onChange={onChange}
              placeholder={computedPace != null ? `${computedPace} (${fmtPace(computedPace)})` : "auto izračun"}
            />
            <small style={{ opacity: .8 }}>
              Ako ostaviš prazno, računa se automatski iz distance & trajanja. {computedPace != null && <>Predlog: <b>{fmtPace(computedPace)}</b></>}
            </small>
            {fv.avg_pace_sec && <div className="rp__err">{fv.avg_pace_sec[0]}</div>}
          </div>

          <div className="rp-field">
            <label className="rp__lbl">Kalorije (opciono)</label>
            <input
              type="number" min="0"
              className={`rp__input ${fv.calories ? "is-invalid" : ""}`}
              name="calories"
              value={form.calories}
              onChange={onChange}
              placeholder="npr. 620"
            />
            {fv.calories && <div className="rp__err">{fv.calories[0]}</div>}
          </div>

          <div className="rp-field rp-field--full">
            <label className="rp__lbl">GPS track (JSON array) — opcionalno</label>
            <textarea
              className="rp__input"
              name="gps_track_json"
              value={form.gps_track_json}
              onChange={onChange}
              rows={3}
              placeholder='npr. [[44.81,20.46,"2025-10-19T10:00:00Z"], [44.82,20.47,"2025-10-19T10:01:00Z"]]'
            />
          </div>
        </div>

        <div className="rp__formActions">
          <button className="btn btn--primary" disabled={busy || !canSubmit}>
            {busy ? "Snimam..." : "Sačuvaj rezultat"}
          </button>
        </div>
      </form>
    </section>
  );
}
