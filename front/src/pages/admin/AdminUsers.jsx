 
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api"; 
import "./admin-users.css";

 
import { FiSearch, FiRefreshCw, FiShield, FiUser, FiAlertTriangle } from "react-icons/fi";
import AdminSidebar from "./AdminSidebar";

export default function AdminUsers() {
  const [me, setMe] = useState(null);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const abortRef = useRef(null);

  // ko sam ja (da ne dozvolimo samospuštanje role)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.get("/api/me");
        const u = r?.data?.data ?? r?.data ?? r;
        if (alive) setMe(u || null);
      } catch {
        if (alive) setMe(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  // dohvat korisnika
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/api/users", {
          params: { q: q || undefined, page, per_page: perPage },
          signal: ctrl.signal,
        });
        const body = res?.data ?? res;
        setItems(Array.isArray(body?.data) ? body.data : []);
        setMeta(body?.meta ?? null);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          setErr("Ne mogu da učitam korisnike.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [q, page]);

  const canChangeRole = useMemo(() => me?.role === "admin", [me]);

  function resetAndReload() {
    setQ("");
    setPage(1);
  }

  async function changeRole(user, role) {
    if (!canChangeRole) return;
    if (me && me.id === user.id) {
      alert("Ne možete menjati sopstvenu ulogu.");
      return;
    }
    // optimistički update
    const prev = items;
    setItems((list) => list.map((u) => (u.id === user.id ? { ...u, role } : u)));
    try {
      await api.patch(`/api/users/${user.id}/role`, { role });
    } catch (e) {
      setItems(prev);
      const msg = e?.response?.data?.message || "Promena uloge nije uspela.";
      alert(msg);
    }
  }

  const total = meta?.total ?? items.length;
  const pageFrom = meta?.from ?? (items.length ? (page - 1) * perPage + 1 : 0);
  const pageTo = meta?.to ?? (items.length ? pageFrom + items.length - 1 : 0);

  return (
    <div className="admin-wrap">
      <AdminSidebar />

      <main className="admin-main">
        <div className="admin-main__hdr">
          <h2>Users</h2>
          <div className="admin-main__hdrMeta">
            {me ? (
              <span className="tag">
                <FiShield style={{ verticalAlign: "-2px", marginRight: 4 }} />
                {me.name} ({me.role})
              </span>
            ) : (
              <span className="tag">
                <FiUser style={{ verticalAlign: "-2px", marginRight: 4 }} />
                N/A
              </span>
            )}
            <Link className="btn btn--tiny" to="/admin">← Dashboard</Link>
          </div>
        </div>

        {/* Filter traka */}
        <div className="admin-toolbar">
          <div className="search">
            <FiSearch className="search__icon" />
            <input
              className="search__input"
              placeholder="Pretraga po imenu ili emailu…"
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
            />
          </div>
          <button className="btn btn--tiny" onClick={resetAndReload}>
            <FiRefreshCw style={{ verticalAlign: "-2px", marginRight: 6 }} />
            Reset
          </button>
        </div>

        {loading && <div className="note">Učitavanje…</div>}
        {err && <div className="note">{err}</div>}

        {!loading && !err && (
          <>
            <div className="list-meta">
              Prikaz: <b>{pageFrom}-{pageTo}</b> od <b>{total}</b>
            </div>

            <div className="table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Ime</th>
                    <th>Email</th>
                    <th style={{ width: 160 }}>Uloga</th>
                    <th style={{ width: 120 }}>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="td-center">Nema zapisa.</td>
                    </tr>
                  ) : (
                    items.map((u, i) => (
                      <tr key={u.id}>
                        <td>{(meta?.from ?? 1) + i}</td>
                        <td>{u.name} <span className="muted">#{u.id}</span></td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            className="sel"
                            value={u.role}
                            onChange={(e) => changeRole(u, e.target.value)}
                            disabled={!canChangeRole || (me && me.id === u.id)}
                            title={me && me.id === u.id ? "Ne možete menjati sopstvenu ulogu" : ""}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="td-actions">
                          <Link to={`/mojestatistike?user_id=${u.id}`} className="link">Stat</Link>
                          {/* po želji: dodaj još akcija (lock, reset pass UI, profil) */}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginacija */}
            {meta && meta.last_page > 1 && (
              <div className="pager">
                <button
                  className="btn btn--tiny"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1}
                >
                  ← Prethodna
                </button>
                <span className="muted">
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

            {/* Napomena o sopstvenoj ulozi */}
            <div className="hint">
              <FiAlertTriangle style={{ marginRight: 6 }} />
              Ne možete menjati sopstvenu ulogu (bezbednosno ograničenje).
            </div>
          </>
        )}
      </main>
    </div>
  );
}
