import api from "../lib/axios";

export const registerApi = (data: { email: string; password: string }) =>
  api.post("/auth/register", data);

export const loginApi = (data: { email: string; password: string }) =>
  api.post("/auth/login", data);

export const meApi = () => api.get("/auth/me");
