
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api";
import AdminSidebar from "./AdminSidebar";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiRefreshCw,
  FiFilter,
} from "react-icons/fi";

export default function AdminEvents() {
  // LISTA
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // FILTERI
  const [q, setQ] = useState(""); // lokacija
  const [status, setStatus] = useState(""); // planned | completed | cancelled
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // FORMA (CREATE/EDIT) — MODAL
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [f, setF] = useState({
    start_time: "",
    location: "",
    distance_km: "",
    status: "planned",
    description: "",
    organizer_id: "",
    participants_csv: "",
  });

  const startRef = useRef(null); // autofocus
  const abortRef = useRef(null);

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (q.trim()) p.q = q.trim();
    if (status) p.status = status;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  }, [q, status, dateFrom, dateTo, page, perPage]);

  useEffect(() => {
    loadList();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function loadList() {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/run-events", { params, signal: ctrl.signal });
      const body = res?.data ?? res;
      setItems(Array.isArray(body?.data) ? body.data : []);
      setMeta(body?.meta ?? null);
    } catch (e) {
      if (e.name !== "AbortError" && e.name !== "CanceledError") {
        setErr("Ne mogu da učitam događaje.");
      }
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQ("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const toDatetimeLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const ii = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${ii}`;
  };

  // CREATE
  function openCreate() {
    setEditingId(null);
    setF({
      start_time: "",
      location: "",
      distance_km: "",
      status: "planned",
      description: "",
      organizer_id: "",
      participants_csv: "",
    });
    setFormErr("");
    setFormOpen(true);
  }

  // EDIT
  function openEdit(ev) {
    setEditingId(ev.id);
    setF({
      start_time: toDatetimeLocal(ev.start_time),
      location: ev.location ?? "",
      distance_km: ev.distance_km ?? "",
      status: ev.status ?? "planned",
      description: ev.description ?? "",
      organizer_id: ev.organizer_id ?? "",
      participants_csv: "",
    });
    setFormErr("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setFormErr("");
    setSaving(false);
    setEditingId(null);
  }

  // Modal UX: body scroll lock + Esc zatvaranje + autofocus
  useEffect(() => {
    if (!formOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", onKey);
    setTimeout(() => startRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [formOpen]);

  async function submitForm(e) {
    e?.preventDefault?.();
    setSaving(true);
    setFormErr("");

    try {
      const payload = {
        start_time: f.start_time ? new Date(f.start_time).toISOString() : null,
        location: f.location || null,
        distance_km: f.distance_km !== "" ? Number(f.distance_km) : null,
        status: f.status || "planned",
        description: f.description || null,
      };

      if (String(f.organizer_id).trim()) {
        payload.organizer_id = Number(f.organizer_id);
      }

      const participants = String(f.participants_csv || "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (participants.length > 0) payload.participants = participants;

      if (editingId) {
        await api.put(`/api/run-events/${editingId}`, payload);
      } else {
        await api.post("/api/run-events", payload);
      }

      closeForm();
      await loadList();
    } catch (e) {
      setFormErr("Čuvanje nije uspelo. Proveri polja i permisije.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(ev) {
    const ok = window.confirm(
      `Obrisati događaj #${ev.id}? Ovo će obrisati i komentare, učesnike i vezane statistike.`
    );
    if (!ok) return;

    try {
      await api.delete(`/api/run-events/${ev.id}`);
      setItems((prev) => prev.filter((x) => x.id !== ev.id));
      setMeta((m) => (m ? { ...m, total: Math.max(0, (m.total ?? 0) - 1) } : m));
    } catch {
      alert("Brisanje nije uspelo.");
    }
  }

  return (
    <div style={{ display: "flex" }}>
      <AdminSidebar />

      <main style={{ padding: 24, flex: 1, minWidth: 0 }}>
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Admin · Events</h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn btn--tiny" onClick={loadList}>
              <FiRefreshCw /> Osveži
            </button>
            <button className="btn btn--tiny" onClick={openCreate}>
              <FiPlus /> Novi event
            </button>
          </div>
        </div>

        {/* FILTERI */}
        <section
          style={{
            background: "#121212",
            border: "1px solid #1f1f1f",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(90px, 1fr))",
              gap: 8,
              alignItems: "end",
            }}
          >
            <div style={{ gridColumn: "span 4" }}>
              <label style={lbl}>Pretraga (lokacija)</label>
              <input
                style={inp}
                placeholder="npr. Ada Ciganlija"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={lbl}>Status</label>
              <select style={inp} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">— svi —</option>
                <option value="planned">planned</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={lbl}>Od datuma</label>
              <input type="date" style={inp} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={lbl}>Do datuma</label>
              <input type="date" style={inp} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>

            <div style={{ gridColumn: "span 1" }}>
              <label style={lbl}>Po strani</label>
              <select style={inp} value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                {[10, 12, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: "span 1", display: "flex", gap: 8 }}>
              <button className="btn btn--tiny" onClick={() => setPage(1)}>
                <FiFilter /> Primeni
              </button>
              <button className="btn btn--tiny" onClick={resetFilters}>Reset</button>
            </div>
          </div>
        </section>

        {/* LISTA */}
        {loading && <div className="note">Učitavanje…</div>}
        {err && <div className="note">{err}</div>}

        {!loading && (
          <>
            <div style={{ marginBottom: 12, opacity: 0.9 }}>
              Pronađeno: <strong>{meta?.total ?? items.length}</strong>
              {meta && <> · Strana: <strong>{meta.current_page}</strong> / {meta.last_page}</>}
            </div>

            {/* WRAPPER */}
            <div
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                WebkitOverflowScrolling: "touch",
                background: "#101010",
                border: "1px solid #1f1f1f",
                borderRadius: 12,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset",
                padding: 0,
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 1100,
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  tableLayout: "fixed",
                  fontSize: 14,
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    background: "#141414",
                  }}
                >
                  <tr>
                    <Th style={{ width: 70 }}>#</Th>
                    <Th style={{ width: 180 }}>Datum/Vreme</Th>
                    <Th style={{ width: 240 }}>Lokacija</Th>
                    <Th style={{ width: 130, textAlign: "right" }}>Distanca (km)</Th>
                    <Th style={{ width: 130 }}>Status</Th>
                    <Th style={{ width: 220 }}>Organizator</Th>
                    <Th style={{ width: 120, textAlign: "right" }}>Učesnici</Th>
                    <Th style={{ width: 120, textAlign: "right" }}>Komentari</Th>
                    <Th style={{ width: 220 }}>Akcije</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <Td colSpan={9} style={{ textAlign: "center", padding: 16, opacity: 0.8 }}>
                        Nema zapisa.
                      </Td>
                    </tr>
                  ) : (
                    items.map((e, i) => (
                      <tr key={e.id} style={{ background: i % 2 ? "#0f0f0f" : "transparent" }}>
                        <Td mono>{(meta?.from ?? 1) + i}</Td>
                        <Td>{fmtDate(e.start_time)}</Td>
                        <Td style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.location || "—"}
                        </Td>
                        <Td align="right">{e.distance_km != null ? Number(e.distance_km) : "—"}</Td>
                        <Td>{e.status || "planned"}</Td>
                        <Td style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.organizer?.name || `#${e.organizer_id}`}
                        </Td>
                        <Td align="right">{e.participants_count ?? 0}</Td>
                        <Td align="right">{e.comments_count ?? 0}</Td>
                        <Td style={{ whiteSpace: "nowrap" }}>
                          <button className="btn btn--tiny" onClick={() => openEdit(e)} style={{ marginRight: 8 }}>
                            <FiEdit2 /> Uredi
                          </button>
                          <button
                            className="btn btn--tiny"
                            onClick={() => deleteEvent(e)}
                            style={{ background: "#311", borderColor: "#522", color: "#f8d7da" }}
                          >
                            <FiTrash2 /> Obriši
                          </button>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.last_page > 1 && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
                <button
                  className="btn btn--tiny"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1}
                >
                  ← Prethodna
                </button>
                <span style={{ opacity: 0.8 }}>
                  Strana {meta.current_page} / {meta.last_page}
                </span>
                <button
                  className="btn btn--tiny"
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page >= meta.last_page}
                >
                  Sledeća →
                </button>
              </div>
            )}
          </>
        )}

        {/* MODAL (CREATE/EDIT) */}
        {formOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingId ? `Uredi event #${editingId}` : "Novi event"}
            onMouseDown={(e) => {
              // klik na backdrop zatvara; ali klik unutar modala ne
              if (e.target === e.currentTarget) closeForm();
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
          >
            <div
              style={{
                width: "min(920px, 96vw)",
                maxHeight: "85vh",
                overflow: "auto",
                background: "#111",
                border: "1px solid #1f1f1f",
                borderRadius: 12,
                boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                padding: 16,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>{editingId ? `Uredi event #${editingId}` : "Novi event"}</h3>
                <div style={{ marginLeft: "auto" }}>
                  <button className="btn btn--tiny" onClick={closeForm} title="Zatvori (Esc)">
                    <FiX /> Zatvori
                  </button>
                </div>
              </div>

              {formErr && <div className="note">{formErr}</div>}

              <form onSubmit={submitForm}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12, minmax(70px, 1fr))",
                    gap: 10,
                  }}
                >
                  <div style={{ gridColumn: "span 4" }}>
                    <label style={lbl}>Start time</label>
                    <input
                      ref={startRef}
                      type="datetime-local"
                      style={inp}
                      value={f.start_time}
                      onChange={(e) => setF((s) => ({ ...s, start_time: e.target.value }))}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: "span 4" }}>
                    <label style={lbl}>Lokacija</label>
                    <input
                      style={inp}
                      placeholder="npr. Ada"
                      value={f.location}
                      onChange={(e) => setF((s) => ({ ...s, location: e.target.value }))}
                    />
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={lbl}>Distanca (km)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      style={inp}
                      value={f.distance_km}
                      onChange={(e) => setF((s) => ({ ...s, distance_km: e.target.value }))}
                    />
                  </div>

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={lbl}>Status</label>
                    <select
                      style={inp}
                      value={f.status}
                      onChange={(e) => setF((s) => ({ ...s, status: e.target.value }))}
                    >
                      <option value="planned">planned</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: "span 12" }}>
                    <label style={lbl}>Opis</label>
                    <textarea
                      rows={4}
                      style={{ ...inp, resize: "vertical" }}
                      value={f.description}
                      onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
                    />
                  </div>

                  <div style={{ gridColumn: "span 3" }}>
                    <label style={lbl}>Organizer ID (admin)</label>
                    <input
                      type="number"
                      min="1"
                      style={inp}
                      placeholder="prazno = trenutni"
                      value={f.organizer_id}
                      onChange={(e) => setF((s) => ({ ...s, organizer_id: e.target.value }))}
                    />
                  </div>

                  <div style={{ gridColumn: "span 9" }}>
                    <label style={lbl}>Participants (CSV user_id)</label>
                    <input
                      style={inp}
                      placeholder="npr. 2,8,13"
                      value={f.participants_csv}
                      onChange={(e) => setF((s) => ({ ...s, participants_csv: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                  <button className="btn btn--tiny" type="button" onClick={closeForm}>
                    Otkaži
                  </button>
                  <button className="btn btn--tiny" type="submit" disabled={saving}>
                    <FiSave /> {saving ? "Čuvam…" : "Sačuvaj"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* —————— INLINE STILOVI ZA TABELU —————— */
function Th({ children, style }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "12px 14px",
        borderBottom: "1px solid #212121",
        whiteSpace: "nowrap",
        fontWeight: 600,
        letterSpacing: 0.2,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, mono, align, ...rest }) {
  return (
    <td
      {...rest}
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid #181818",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
        textAlign: align || "left",
      }}
    >
      {children}
    </td>
  );
}

const lbl = { display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 };
const inp = {
  width: "100%",
  background: "#0f0f0f",
  border: "1px solid #262626",
  color: "#eee",
  padding: "8px 10px",
  borderRadius: 8,
  outline: "none",
};
