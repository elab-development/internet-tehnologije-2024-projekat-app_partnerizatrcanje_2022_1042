 
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 15000,
});

// Request interceptor — UBACI TOKEN
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Response interceptor — ako token nije validan, izbaci korisnika
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      // možeš i programatski da preusmeriš na /login
      // window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
