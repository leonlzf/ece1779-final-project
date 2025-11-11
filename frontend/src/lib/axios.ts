import axios from "axios";

const api = axios.create({ baseURL: "/api" });

const t = localStorage.getItem("token");
if (t) api.defaults.headers.Authorization = `Bearer ${t}`;

api.interceptors.request.use(cfg => {
  const tok = localStorage.getItem("token");
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
  return cfg;
});

export default api;
