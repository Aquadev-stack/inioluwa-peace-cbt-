import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://inioluwa-peace-cbt.onrender.com";

export const http = axios.create({
  baseURL: API,
  withCredentials: true,
  timeout: 20000,
});

export function setAuthToken(token) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}