import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api";
import "./run-plans.css";

function getCurrentUserId() {
  const raw = localStorage.getItem("user_id");
  return raw ? parseInt(raw, 10) : undefined;
}

export default function RunPlanUpsert() {
  const { id } = useParams(); // ako ima id -> edit mode
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const userId = getCurrentUserId();

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

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");
    setFv({});

    try {
      if (isEdit) {
        const res = await api.put(`/api/run-plans/${id}`, form);
        const body = res?.data ?? res;
        const saved = body?.data ?? body;
        setMsg("Plan je izmenjen.");
        navigate(`/run-plans/${saved.id}`, { replace: true });
      } else {
        // **user scope**: moraš poslati user_id
        const payload = { ...form, user_id: userId };
        const res = await api.post("/api/run-plans", payload);
        const body = res?.data ?? res;
        const created = body?.data ?? body;
        setMsg("Plan je kreiran.");
        navigate(`/run-plans/${created.id}`, { replace: true });
      }
    } catch (e) {
      // 422 validacija
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
            <label className="rp__lbl">Lokacija</label>
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

          <div className="rp-field rp-field--full">
            <label className="rp__lbl">Napomena</label>
            <textarea
              className={`rp__input ${fv.notes ? "is-invalid" : ""}`}
              name="notes"
              value={form.notes}
              onChange={onChange}
              rows={4}
              placeholder="Detalji treninga, dogovor sa ekipom…"
            />
            {fv.notes && <div className="rp__err">{fv.notes[0]}</div>}
          </div>

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
