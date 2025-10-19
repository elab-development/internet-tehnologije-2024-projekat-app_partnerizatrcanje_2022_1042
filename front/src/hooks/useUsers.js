 
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

/**
 * Hook za listu korisnika sa pretragom, paginacijom i debounce-om.
 *
 * Primer:
 * const {
 *   items, meta, loading, error,
 *   q, setQ, page, setPage, perPage, setPerPage,
 *   refresh
 * } = useUsers({ perPageDefault: 20 });
 */
export default function useUsers({ perPageDefault = 20, debounceMs = 350 } = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

  // filter/paginacija state
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(perPageDefault);

  // debounce za q
  const [qDebounced, setQDebounced] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), debounceMs);
    return () => clearTimeout(t);
  }, [q, debounceMs]);

  // abort kontrola
  const abortRef = useRef(null);

  const params = useMemo(() => {
    const p = { page, per_page: perPage };
    if (qDebounced.trim()) p.q = qDebounced.trim();
    return p;
  }, [page, perPage, qDebounced]);

  async function fetchUsers(signal) {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/users", { params, signal });
      const body = res?.data ?? res;
      setItems(Array.isArray(body?.data) ? body.data : []);
      setMeta(body?.meta ?? null);
    } catch (e) {
      if (e.name !== "AbortError" && e.name !== "CanceledError") {
        setErr("Ne mogu da učitam korisnike.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    fetchUsers(ctrl.signal);
    return () => ctrl.abort();
  
  }, [params]);  

  return {
   
    items, setItems, meta, loading, error,
  
    q, setQ, page, setPage, perPage, setPerPage,
  
    refresh: () => fetchUsers(),  
  };
}
