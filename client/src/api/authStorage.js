import { setAuthToken } from "./http";

const KEY = "ipc_auth";

export function saveAuth(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  setAuthToken(data?.token || null);
}

export function getAuth() {
  const raw = localStorage.getItem(KEY);
  const parsed = raw ? JSON.parse(raw) : null;

  // CRITICAL: always re-apply token to axios
  setAuthToken(parsed?.token || null);

  return parsed;
}

export function clearAuth() {
  localStorage.removeItem(KEY);
  setAuthToken(null);
}
