 
import { useEffect, useState } from "react";
import api from "../api";

/**
 * Učita trenutno ulogovanog korisnika sa /api/me
 * i vrati { me, loading, error, refresh }.
 */
export default function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

  async function fetchMe(signal) {
    setLoading(true);
    setErr("");
    try {
      const r = await api.get("/api/me", { signal });
      const u = r?.data?.data ?? r?.data ?? r;
      setMe(u || null);
    } catch (e) {
      if (e.name !== "CanceledError" && e.name !== "AbortError") {
        setMe(null);
        setErr("Ne mogu da učitam profil.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMe(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  return {
    me,
    loading,
    error,
    refresh: () => fetchMe(),  
  };
}
