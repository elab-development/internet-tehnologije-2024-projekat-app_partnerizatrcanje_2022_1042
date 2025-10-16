import axios from "axios";

 
axios.defaults.baseURL = "http://127.0.0.1:8000";
 
axios.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
