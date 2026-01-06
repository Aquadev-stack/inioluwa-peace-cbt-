import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const http = axios.create({
  baseURL: `${API}/api`,
  withCredentials: true,
});

export function setAuthToken(token) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}