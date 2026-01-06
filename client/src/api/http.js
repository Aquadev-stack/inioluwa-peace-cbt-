// client/src/api/http.js
import axios from "axios";

export const http = axios.create({
  baseURL: "",          // ✅ proxy mode (like before)
  withCredentials: false,
});

export function setAuthToken(token) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}
