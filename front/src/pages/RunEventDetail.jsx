import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import "./run-event-detail.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon2x from "leaflet/dist/images/marker-icon-2x.png";
import icon1x from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: icon2x, iconUrl: icon1x, shadowUrl: iconShadow });

export default function RunEventDetail() {
  const { id } = useParams();

  // ------- auth/user -------
  const hasToken = !!localStorage.getItem("token");
  const [me, setMe] = useState(null); // {id, name, role...}

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

  const hasCoords = Number.isFinite(Number(ev?.meet_lat)) && Number.isFinite(Number(ev?.meet_lng));

  // ---- učitaj /api/me ako ima token (da dobijemo me.id / me.role) ----
  useEffect(() => {
    if (!hasToken) { setMe(null); return; }
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/api/me");
        const body = res?.data ?? res;
        const user = body?.data ?? body;
        if (alive) setMe(user || null);
        if (user?.id) localStorage.setItem("user_id", String(user.id)); // opciono osvežavanje
      } catch {
        localStorage.removeItem("token");
        setMe(null);
      }
    })();
    return () => { alive = false; };
  }, [hasToken]);

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

        // Učesnici: koristi iz payload-a ili naknadno dohvati
        if (Array.isArray(event?.participants)) {
          setParticipants(event.participants);
        } else if ((event?.participants_count ?? 0) > 0) {
          const uRes = await api.get(`/api/run-events/${id}/participants`);
          const uBody = uRes?.data ?? uRes;
          setParticipants(Array.isArray(uBody?.data) ? uBody.data : []);
        } else {
          setParticipants([]);
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

  // ---- submit new comment ----
  async function submitComment(e) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setPosting(true);
    try {
      const res = await api.post(`/api/run-events/${id}/comments`, { content: newContent.trim() });
      const created = res?.data?.data ?? res?.data ?? res;
      setComments(prev => [created, ...prev]);       // optimistic
      setNewContent("");
      setEv(prev => prev ? { ...prev, comments_count: (prev.comments_count ?? 0) + 1 } : prev);
    } catch {
      alert("Komentar nije sačuvan.");
    } finally {
      setPosting(false);
    }
  }

  // ---- delete my comment (autor ili admin – backend već proverava) ----
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

            {/* Join/Leave — samo ako je korisnik ulogovan */}
            {me && (
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                {!iAmParticipant ? (
                  <button className="btn btn--primary" onClick={joinEvent}>Pridruži se</button>
                ) : (
                  <button className="btn" onClick={leaveEvent}>Napusti</button>
                )}
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

            {/* Forma za novi komentar */}
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

            {/* Paginacija komentara */}
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
        </>
      )}
    </main>
  );
}
