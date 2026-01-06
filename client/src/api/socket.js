import { io } from "socket.io-client";
import { getAuth } from "./authStorage";

export function createSocket() {
  const auth = getAuth();

  const socket = io("http://localhost:5000", {
    transports: ["websocket"],
    auth: { token: auth?.token || "" },
  });

  // join admin room
  if (auth?.user?.role === "admin") {
    socket.emit("join", { role: "admin" });
  }

  return socket;
}
