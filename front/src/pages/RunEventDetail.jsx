// src/pages/RunEventDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import "./run-event-detail.css";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon1x from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon1x, shadowUrl: iconShadow });

/* ------------------ Mini helperi ------------------ */
function fmtPace(sec) {
  if (!Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

function useMe() {
  const hasToken = !!localStorage.getItem("token");
  const [me, setMe] = useState(null);
  useEffect(() => {
    if (!hasToken) { setMe(null); return; }
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/api/me");
        const user = res?.data?.data ?? res?.data ?? res;
        if (alive) setMe(user || null);
        if (user?.id) localStorage.setItem("user_id", String(user.id));
      } catch {
        localStorage.removeItem("token");
        setMe(null);
      }
    })();
    return () => { alive = false; };
  }, [hasToken]);
  return me;
}

/* ------------------ Mapa koja dodaje tačke klikom ------------------ */
function ClickToAdd({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

/* ------------------ Modal (bez dodatnih biblioteka) ------------------ */
function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn btn--tiny" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginTop: 8 }}>{children}</div>
      </div>
    </div>
  );
}

/* ------------------ Glavna stranica ------------------ */
export default function RunEventDetail() {
  const { id } = useParams();
  const me = useMe();

  // ------- event -------
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ------- participants -------
  const [participants, setParticipants] = useState([]);
  const participantsCount = useMemo(
    () => ev?.participants_count ?? participants.length ?? 0,
    [ev, participants]
  );

  // ------- comments -------
  const [comments, setComments] = useState([]);
  const [cMeta, setCMeta] = useState(null);
  const [cPage, setCPage] = useState(1);
  const [cLoading, setCLoading] = useState(false);
  const [cErr, setCErr] = useState("");
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);

  // ------- modal za rezultat -------
  const [statOpen, setStatOpen] = useState(false);
  const [statBusy, setStatBusy] = useState(false);
  const [statErr, setStatErr] = useState("");
  const [statFv, setStatFv] = useState({});
  const [statMsg, setStatMsg] = useState("");

  // forma u modalu
  const [statForm, setStatForm] = useState({
    recorded_at: new Date().toISOString().slice(0, 16),
    distance_km: "",
    duration_min: "",
    duration_sec: "",
    avg_pace_sec: "",
    calories: "",
  });

  // crtanje rute
  const [trackPts, setTrackPts] = useState([]); // [{lat,lng}, ...]
  const trackMapRef = useRef(null);

  const hasCoords = Number.isFinite(Number(ev?.meet_lat)) && Number.isFinite(Number(ev?.meet_lng));

  // ---- load event ----
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(`/api/run-events/${id}`, { signal: ctrl.signal });
        const body = res?.data ?? res;
        const event = body?.data ?? body;
        setEv(event);

        // Učesnici
        if (Array.isArray(event?.participants)) {
          setParticipants(event.participants);
        } else if ((event?.participants_count ?? 0) > 0) {
          const uRes = await api.get(`/api/run-events/${id}/participants`);
          const uBody = uRes?.data ?? uRes;
          setParticipants(Array.isArray(uBody?.data) ? uBody.data : []);
        } else {
          setParticipants([]);
        }

        // predloži recorded_at iz eventa
        if (event?.start_time) {
          setStatForm(s => ({ ...s, recorded_at: event.start_time.slice(0, 16) }));
        }
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr("Ne mogu da učitam događaj.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [id]);

  // ---- load comments (paginirano) ----
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setCLoading(true);
      setCErr("");
      try {
        const res = await api.get(`/api/run-events/${id}/comments`, {
          params: { page: cPage, per_page: 10 },
          signal: ctrl.signal,
        });
        const body = res?.data ?? res;
        setComments(Array.isArray(body?.data) ? body.data : []);
        setCMeta(body?.meta ?? null);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setCErr("Ne mogu da učitam komentare.");
        }
      } finally {
        setCLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [id, cPage]);

  // ---- comment submit/delete ----
  async function submitComment(e) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setPosting(true);
    try {
      const res = await api.post(`/api/run-events/${id}/comments`, { content: newContent.trim() });
      const created = res?.data?.data ?? res?.data ?? res;
      setComments(prev => [created, ...prev]);
      setNewContent("");
      setEv(prev => prev ? { ...prev, comments_count: (prev.comments_count ?? 0) + 1 } : prev);
    } catch {
      alert("Komentar nije sačuvan.");
    } finally {
      setPosting(false);
    }
  }
  async function deleteComment(commentId) {
    if (!window.confirm("Obrisati komentar?")) return;
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setEv(prev => prev ? { ...prev, comments_count: Math.max(0, (prev.comments_count ?? 1) - 1) } : prev);
    } catch {
      alert("Brisanje nije uspelo.");
    }
  }

  // ---- join/leave ----
  async function joinEvent() {
    try {
      await api.post(`/api/run-events/${id}/join`);
      const uRes = await api.get(`/api/run-events/${id}/participants`);
      const uBody = uRes?.data ?? uRes;
      setParticipants(Array.isArray(uBody?.data) ? uBody.data : []);
      setEv(prev => prev ? { ...prev, participants_count: (prev.participants_count ?? 0) + 1 } : prev);
    } catch {
      alert("Nije moguće pridružiti se.");
    }
  }
  async function leaveEvent() {
    try {
      await api.delete(`/api/run-events/${id}/leave`);
      const uRes = await api.get(`/api/run-events/${id}/participants`);
      const uBody = uRes?.data ?? uRes;
      setParticipants(Array.isArray(uBody?.data) ? uBody.data : []);
      setEv(prev => prev ? { ...prev, participants_count: Math.max(0, (prev.participants_count ?? 1) - 1) } : prev);
    } catch {
      alert("Nije moguće napustiti događaj.");
    }
  }

  const iAmParticipant = useMemo(
    () => !!me && participants.some(p => p.id === me.id),
    [participants, me]
  );

  const fmtDate = (iso) => {
    if (!iso) return "TBA";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // ------- stat form helpers -------
  const computedPace = useMemo(() => {
    const km = Number(statForm.distance_km);
    const dmin = Number(statForm.duration_min);
    const dsec = Number(statForm.duration_sec);
    if (!km || km <= 0) return null;
    const total = (Number.isFinite(dmin) ? dmin : 0) * 60 + (Number.isFinite(dsec) ? dsec : 0);
    if (total <= 0) return null;
    return Math.round(total / km);
  }, [statForm.distance_km, statForm.duration_min, statForm.duration_sec]);

  const onStatChange = (e) => {
    const { name, value } = e.target;
    setStatForm(s => ({ ...s, [name]: value }));
    setStatFv(f => ({ ...f, [name]: undefined }));
    setStatErr("");
    setStatMsg("");
  };

  // mapa (modal) – početni centar
  const modalMapCenter = useMemo(() => {
    if (hasCoords) return { lat: Number(ev.meet_lat), lng: Number(ev.meet_lng) };
    return { lat: 44.8125, lng: 20.4612 }; // Beograd
  }, [hasCoords, ev?.meet_lat, ev?.meet_lng]);

  // dodavanje tačke kliktanjem
  const addPoint = (pt) => setTrackPts((prev) => [...prev, pt]);
  const undoPoint = () => setTrackPts((prev) => prev.slice(0, -1));
  const clearTrack = () => setTrackPts([]);

  // moja lokacija (kao brza prva tačka ili centriranje)
  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return alert("Geolokacija nije dostupna.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        // dodaj kao tačku i centriraj
        setTrackPts(prev => [...prev, { lat, lng }]);
        if (trackMapRef.current) trackMapRef.current.setView([lat, lng], 15);
      },
      () => alert("Neuspešno čitanje lokacije."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  };

  const submitStat = async (e) => {
    e.preventDefault();
    if (!me?.id) { setStatErr("Morate biti ulogovani."); return; }
    setStatBusy(true);
    setStatErr("");
    setStatFv({});
    setStatMsg("");

    try {
      const duration_sec_total =
        (Number(statForm.duration_min) || 0) * 60 + (Number(statForm.duration_sec) || 0);

      // gps_track kao niz [lat, lng]; (ako želiš i ts -> [lat,lng,ts])
      const gps_track = trackPts.length
        ? trackPts.map(p => [Number(p.lat), Number(p.lng)])
        : null;

      const payload = {
        user_id: me.id,
        run_event_id: Number(id),
        recorded_at: statForm.recorded_at
          ? new Date(statForm.recorded_at).toISOString().slice(0,19).replace("T"," ")
          : new Date().toISOString(),
        distance_km: statForm.distance_km === "" ? null : Number(statForm.distance_km),
        duration_sec: duration_sec_total || null,
        avg_pace_sec: (statForm.avg_pace_sec !== "" && Number(statForm.avg_pace_sec) >= 0)
          ? Number(statForm.avg_pace_sec)
          : (computedPace ?? null),
        calories: statForm.calories === "" ? null : Number(statForm.calories),
        gps_track, // ← sada dolazi iz mape
      };

      const res = await api.post("/api/run-stats", payload);
      const saved = res?.data?.data ?? res?.data ?? res;

      setStatMsg("Rezultat je sačuvan. 🎉");
      // reset polja (ostavi recorded_at)
      setStatForm(s => ({
        ...s,
        distance_km: "",
        duration_min: "",
        duration_sec: "",
        avg_pace_sec: "",
        calories: "",
      }));
      setTrackPts([]);
    } catch (e2) {
      const data = e2?.response?.data;
      if (e2?.response?.status === 422 && data?.errors) {
        setStatFv(data.errors);
      } else {
        setStatErr(data?.message || "Greška pri snimanju rezultata.");
      }
    } finally {
      setStatBusy(false);
    }
  };

  return (
    <main className="hp redetail">
      <Link to="/run-events" className="redetail__back">← Nazad na listu</Link>
      <h2 className="redetail__title">Detalji događaja</h2>

      {loading && <div className="note">Učitavanje...</div>}
      {err && <div className="note">{err}</div>}

      {ev && (
        <>
          <section className="redetail__card">
            <div className="redetail__rows">
              <div className="redetail__row">
                <div className="redetail__label">Datum/Vreme:</div>
                <div className="redetail__value">{fmtDate(ev.start_time)}</div>
              </div>

              <div className="redetail__row">
                <div className="redetail__label">Lokacija:</div>
                <div className="redetail__value">{ev.location || "—"}</div>
              </div>

              <div className="redetail__row">
                <div className="redetail__label">Distanca (km):</div>
                <div className="redetail__value">{ev.distance_km ?? "—"}</div>
              </div>

              <div className="redetail__row">
                <div className="redetail__label">Status:</div>
                <div className="redetail__value">
                  <span className={`status-badge status--${ev.status || "planned"}`}>
                    {ev.status || "planned"}
                  </span>
                </div>
              </div>

              <div className="redetail__row">
                <div className="redetail__label">Organizator:</div>
                <div className="redetail__value">{ev.organizer?.name || "—"}</div>
              </div>
            </div>

            <div className="redetail__meta">
              <i>Učesnici: {participantsCount}</i>
              <i>Komentari: {ev.comments_count ?? cMeta?.total ?? comments.length}</i>
            </div>

            {/* Akcije */}
            {me && (
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!iAmParticipant ? (
                  <button className="btn btn--primary" onClick={joinEvent}>Pridruži se</button>
                ) : (
                  <button className="btn" onClick={leaveEvent}>Napusti</button>
                )}
                <button className="btn" onClick={() => setStatOpen(true)}>
                  Unesi rezultat
                </button>
               
              </div>
            )}
          </section>

          {/* Mini mapa (ako postoje koordinate) */}
          {hasCoords && (
            <section className="redetail__card" style={{ overflow: "hidden" }}>
              <h3 style={{ margin: "0 0 8px" }}>Mesto okupljanja</h3>
              <div style={{ height: 260, borderRadius: 12, overflow: "hidden" }}>
                <MapContainer
                  center={{ lat: Number(ev.meet_lat), lng: Number(ev.meet_lng) }}
                  zoom={14}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[Number(ev.meet_lat), Number(ev.meet_lng)]}>
                    <Popup>{ev.location || "Lokacija okupljanja"}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </section>
          )}

          {/* Učesnici */}
          {participants.length > 0 && (
            <section className="redetail__card">
              <h3 style={{ marginTop: 0 }}>Učesnici</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {participants.map(u => (
                  <li key={u.id}>{u.name} <span style={{ opacity: .7 }}>#{u.id}</span></li>
                ))}
              </ul>
            </section>
          )}

          {/* Komentari */}
          <section className="redetail__card">
            <h3 style={{ marginTop: 0 }}>Komentari</h3>

            {me ? (
              <form onSubmit={submitComment} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  className="rp__input"
                  placeholder="Napiši komentar…"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn--primary" disabled={posting || !newContent.trim()}>
                  {posting ? "Slanje…" : "Objavi"}
                </button>
              </form>
            ) : (
              <div className="note" style={{ marginBottom: 12 }}>Uloguj se da dodaš komentar.</div>
            )}

            {cLoading && <div className="note">Učitavanje komentara…</div>}
            {cErr && <div className="note">{cErr}</div>}

            {comments.length === 0 && !cLoading ? (
              <div className="note">Još uvek nema komentara.</div>
            ) : (
              <ul className="comments">
                {comments.map(c => (
                  <li key={c.id} className="comment">
                    <div className="comment__hdr">
                      <b>{c.user?.name || `#${c.user_id}`}</b>
                      <span className="comment__time">
                        {c.posted_at ? new Date(c.posted_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <div className="comment__body">{c.content}</div>
                    {me && (me.id === c.user_id || me.role === "admin") && (
                      <button className="link" onClick={() => deleteComment(c.id)}>Obriši</button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {cMeta && cMeta.last_page > 1 && (
              <div className="rp__pag" style={{ marginTop: 12 }}>
                <button
                  className="btn btn--tiny"
                  onClick={() => setCPage(p => Math.max(1, p - 1))}
                  disabled={cMeta.current_page <= 1}
                >
                  ← Prethodna
                </button>
                <span>Strana {cMeta.current_page} / {cMeta.last_page}</span>
                <button
                  className="btn btn--tiny"
                  onClick={() => setCPage(p => Math.min(cMeta.last_page, p + 1))}
                  disabled={cMeta.current_page >= cMeta.last_page}
                >
                  Sledeća →
                </button>
              </div>
            )}
          </section>

          {/* -------------- MODAL: unos rezultata + crtanje rute -------------- */}
          <Modal open={statOpen} onClose={() => setStatOpen(false)} title="Unos rezultata posle trke">
            {statErr && <div className="note">{statErr}</div>}
            {statMsg && <div className="note">{statMsg} <Link to="/my-stats">Pogledaj „Moja statistika“ →</Link></div>}

            <form onSubmit={submitStat} className="rp-form" noValidate>
              <div className="rp-grid">
                <div className="rp-field">
                  <label className="rp__lbl">Datum/vreme zapisa</label>
                  <input
                    type="datetime-local"
                    className={`rp__input ${statFv.recorded_at ? "is-invalid" : ""}`}
                    name="recorded_at"
                    value={statForm.recorded_at}
                    onChange={onStatChange}
                    required
                  />
                  {statFv.recorded_at && <div className="rp__err">{statFv.recorded_at[0]}</div>}
                </div>

                <div className="rp-field">
                  <label className="rp__lbl">Distanca (km)</label>
                  <input
                    type="number" step="0.01" min="0"
                    className={`rp__input ${statFv.distance_km ? "is-invalid" : ""}`}
                    name="distance_km"
                    value={statForm.distance_km}
                    onChange={onStatChange}
                    placeholder="npr. 10"
                  />
                  {statFv.distance_km && <div className="rp__err">{statFv.distance_km[0]}</div>}
                </div>

                <div className="rp-field">
                  <label className="rp__lbl">Trajanje (min)</label>
                  <input
                    type="number" min="0"
                    className={`rp__input ${statFv.duration_sec ? "is-invalid" : ""}`}
                    name="duration_min"
                    value={statForm.duration_min}
                    onChange={onStatChange}
                    placeholder="npr. 52"
                  />
                </div>

                <div className="rp-field">
                  <label className="rp__lbl">Trajanje (sek)</label>
                  <input
                    type="number" min="0" max="59"
                    className={`rp__input ${statFv.duration_sec ? "is-invalid" : ""}`}
                    name="duration_sec"
                    value={statForm.duration_sec}
                    onChange={onStatChange}
                    placeholder="npr. 30"
                  />
                  {statFv.duration_sec && <div className="rp__err">{statFv.duration_sec[0]}</div>}
                </div>

                <div className="rp-field">
                  <label className="rp__lbl">Pace (sec/km)</label>
                  <input
                    type="number" min="0"
                    className={`rp__input ${statFv.avg_pace_sec ? "is-invalid" : ""}`}
                    name="avg_pace_sec"
                    value={statForm.avg_pace_sec}
                    onChange={onStatChange}
                    placeholder={computedPace != null ? `${computedPace} (${fmtPace(computedPace)})` : "auto izračun"}
                  />
                  {statFv.avg_pace_sec && <div className="rp__err">{statFv.avg_pace_sec[0]}</div>}
                </div>

                <div className="rp-field">
                  <label className="rp__lbl">Kalorije (opciono)</label>
                  <input
                    type="number" min="0"
                    className={`rp__input ${statFv.calories ? "is-invalid" : ""}`}
                    name="calories"
                    value={statForm.calories}
                    onChange={onStatChange}
                    placeholder="npr. 620"
                  />
                  {statFv.calories && <div className="rp__err">{statFv.calories[0]}</div>}
                </div>

                {/* Mapa za crtanje rute */}
                <div className="rp-field rp-field--full">
                  <label className="rp__lbl">GPS ruta (klikni na mapu da dodaješ tačke)</label>
                  <div style={{ height: 320, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
                    <MapContainer
                      center={modalMapCenter}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                      whenCreated={(map) => (trackMapRef.current = map)}
                    >
                      <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <ClickToAdd onAdd={addPoint} />
                      {trackPts.length > 0 && (
                        <>
                          <Polyline positions={trackPts.map(p => [p.lat, p.lng])} />
                          {/* start marker */}
                          <Marker position={[trackPts[0].lat, trackPts[0].lng]}>
                            <Popup>Start</Popup>
                          </Marker>
                          {/* end marker */}
                          <Marker position={[trackPts[trackPts.length - 1].lat, trackPts[trackPts.length - 1].lng]}>
                            <Popup>Kraj</Popup>
                          </Marker>
                        </>
                      )}
                    </MapContainer>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" className="btn btn--tiny" onClick={useMyLocation}>Moja lokacija</button>
                    <button type="button" className="btn btn--tiny" onClick={undoPoint} disabled={trackPts.length === 0}>Korak nazad</button>
                    <button type="button" className="btn btn--tiny" onClick={clearTrack} disabled={trackPts.length === 0}>Očisti rutu</button>
                    <span style={{ opacity: .8 }}>
                      Tačaka: <b>{trackPts.length}</b>
                    </span>
                  </div>
                  <small style={{ opacity: .75 }}>
                    Savet: klikom na mapu dodaješ tačke redom. „Korak nazad“ briše poslednju tačku.
                  </small>
                </div>
              </div>

              <div className="rp__formActions" style={{ justifyContent: "space-between" }}>
                <button type="button" className="btn" onClick={() => setStatOpen(false)}>Otkaži</button>
                <button className="btn btn--primary" disabled={statBusy}>
                  {statBusy ? "Snimam..." : "Sačuvaj rezultat"}
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </main>
  );
}

/* ------------------ inline stilovi modala ------------------ */
const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modalStyle = {
  width: "min(920px, 94vw)",
  maxHeight: "90vh",
  overflow: "auto",
  background: "#111",
  color: "#fff",
  borderRadius: 12,
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  padding: 16,
  border: "1px solid #2a2a2a",
};
const modalHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};
