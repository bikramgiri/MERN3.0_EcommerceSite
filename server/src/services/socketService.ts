import { Server } from "socket.io";

let ioInstance: Server | null = null;
const activeCheckoutSockets = new Set<string>();

export interface ConnectedClientInfo {
  socketId: string;
  userId: string | null;
  role: "admin" | "customer" | "guest" | string;
}

const connectedClients = new Map<string, ConnectedClientInfo>();

export const setIO = (io: Server): void => {
  ioInstance = io;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.io instance has not been initialized yet!");
  }
  return ioInstance;
};

/**
 * Register a newly connected socket with its role and userId
 */
export const registerConnectedSocket = (
  socketId: string,
  userId: string | null,
  role: string = "guest"
): void => {
  connectedClients.set(socketId, { socketId, userId, role });
  emitTrafficUpdate();
};

/**
 * Unregister a disconnected socket
 */
export const unregisterConnectedSocket = (socketId: string): void => {
  connectedClients.delete(socketId);
  activeCheckoutSockets.delete(socketId);
  emitTrafficUpdate();
};

/**
 * Calculate storefront visitor count (customers and guest shoppers, excluding admins)
 */
export const getStorefrontVisitorCount = (): number => {
  let count = 0;
  for (const client of connectedClients.values()) {
    if (client.role !== "admin") {
      count++;
    }
  }
  return count;
};

/**
 * Calculate total active admin sessions
 */
export const getAdminOnlineCount = (): number => {
  let count = 0;
  for (const client of connectedClients.values()) {
    if (client.role === "admin") {
      count++;
    }
  }
  return count;
};

/**
 * Emit an event to all admin sockets that joined "admin-room"
 */
export const emitToAdmin = (event: string, data?: any): void => {
  if (ioInstance) {
    ioInstance.to("admin-room").emit(event, data);
  }
};

/**
 * Broadcast an event to all connected sockets
 */
export const emitToAll = (event: string, data?: any): void => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

/**
 * Track customer entering checkout session
 */
export const addActiveCheckout = (socketId: string): void => {
  activeCheckoutSockets.add(socketId);
  emitTrafficUpdate();
};

/**
 * Track customer leaving checkout session
 */
export const removeActiveCheckout = (socketId: string): void => {
  if (activeCheckoutSockets.has(socketId)) {
    activeCheckoutSockets.delete(socketId);
    emitTrafficUpdate();
  }
};

export const getActiveCheckoutCount = (): number => {
  return activeCheckoutSockets.size;
};

export const getOnlineVisitorCount = (): number => {
  return getStorefrontVisitorCount();
};

/**
 * Broadcast live storefront traffic and checkout counts to admins
 */
export const emitTrafficUpdate = (): void => {
  if (!ioInstance) return;
  const storefrontVisitorsCount = getStorefrontVisitorCount();
  const adminOnlineCount = getAdminOnlineCount();
  const activeCheckoutsCount = activeCheckoutSockets.size;
  const totalConnectedCount = connectedClients.size;

  ioInstance.to("admin-room").emit("admin:traffic-update", {
    storefrontVisitorsCount,
    onlineVisitorsCount: storefrontVisitorsCount, // Now accurately reflects customers & storefront visitors (0 if only admins)
    adminOnlineCount,
    totalConnectedCount,
    activeCheckoutsCount,
    timestamp: new Date().toISOString(),
  });
};
