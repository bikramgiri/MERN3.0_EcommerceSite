import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_SERVER_URL as string;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  return "http://localhost:4000";
};

/**
 * Initializes and returns the active Socket.IO connection.
 * Sends auth token in handshake so server can authenticate and join admin-room.
 */
export const getSocket = (): Socket => {
  const token = localStorage.getItem("token") || "";

  if (!socket) {
    const SOCKET_URL = getSocketUrl();
    socket = io(SOCKET_URL, {
      auth: { token },
      extraHeaders: {
        token: token,
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to Socket.IO server with ID:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.warn("⚠️ Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected from Socket.IO:", reason);
    });
  } else {
    // Keep auth token updated in case user re-logged in
    socket.auth = { token };
  }

  return socket;
};

/**
 * Explicitly connects the socket if not already connected.
 */
export const connectSocket = (): Socket => {
  const s = getSocket();
  const token = localStorage.getItem("token") || "";
  s.auth = { token };

  if (!s.connected) {
    s.connect();
  }
  return s;
};

/**
 * Disconnects and cleans up socket instance.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
