import { initApp } from "./src/app";
import { envConfig } from "./src/config/config";
import adminSeeder from "./src/adminseeder";
import CategoryController from "./src/controllers/admin/category/categoryController";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./src/database/models/userModel";
import Order from "./src/database/models/orderModel";
import { setIO, emitToAdmin, addActiveCheckout, removeActiveCheckout, emitTrafficUpdate, registerConnectedSocket, unregisterConnectedSocket } from "./src/services/socketService";

async function startServer() {
  const app = await initApp(); // waits for connectDB() -> authenticate() -> sync() to fully finish
  const port = envConfig.port;
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`🔴 Port ${port} is already in use by another process. Please close it or kill the process.`);
      process.exit(1);
    } else {
      console.error("🔴 Server error:", err);
    }
  });

  await adminSeeder();
  await CategoryController.seedCategory();

  // *Socket.io server (Method 1)
  //     const io = new Server(server, {
  //       cors: {
  //         origin: [
  //           "http://localhost:5173",
  //           "http://localhost:5174",
  //           "http://localhost:5175",
  //         ],
  //         credentials: true,
  //       },
  //     });
  //     let onlineUsers: { socketId: string; userId: string; role: string }[] = [];
  //     let addToOnlineUsers = (socketId: string, userId: string, role: string) => {
  //       onlineUsers = onlineUsers.filter((user) => user.userId !== userId);
  //       onlineUsers.push({ socketId, userId, role });
  //     };
  //     io.on("connection", (socket) => {
  //       console.log("A user connected");
  //       // socket.on('disconnect', () => {
  //       //       console.log('A user disconnected');
  //       // });

  //       // const { token } = socket.handshake.auth; // client
  //       const token = socket.handshake.headers.token; // postman tesring
  //       if (!token) {
  //         socket.emit("error", "Unauthorized! No token provided");
  //         return;
  //       }

  //       jwt.verify(token as string, envConfig.jwtSecretKey as string, async (err: any, result: any) => {
  //           if (err) {
  //             socket.emit("error", "Unauthorized! Invalid token");
  //           } else {
  //             const userData = await User.findByPk(result.id);
  //             if (!userData) {
  //               socket.emit("error", "Unauthorized! User not found");
  //               return;
  //             }
  //             addToOnlineUsers(socket.id, result.id, userData.role);
  //             console.log("onleineUsers: ", onlineUsers);
  //           }
  //         },
  //       );

  //       // *Update OrderStatus
  //       socket.on("orderStatusUpdated", (data) => {
  //         const { orderId, userId, status } = data;
  //         const findUser = onlineUsers.find((user) => user.userId === userId);
  //         if (!findUser) {
  //           socket.emit("error", "Unauthorized! User not found");
  //           return;
  //         }
  //         io.to(findUser.socketId).emit("orderStatusChanged", { orderId, status });
  //       });
  //     });

  // *Socket.io server (Method 2)
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ],
      credentials: true,
    },
  });

  // Register io instance for controllers and services
  setIO(io);

  let onlineUsers: { socketId: string; userId: string; role: string }[] = [];
  let addToOnlineUsers = (socketId: string, userId: string | null, role: string) => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
    if (userId) {
      onlineUsers = onlineUsers.filter((user) => user.userId !== userId);
    }
    onlineUsers.push({ socketId, userId: userId || "", role });
  };

  // Auth middleware: authenticates users and permits guest storefront visitors
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.headers?.token as string);
    if (!token) {
      (socket as any).userId = null;
      (socket as any).role = "guest";
      return next();
    }
    jwt.verify(
      token,
      envConfig.jwtSecretKey as string,
      async (err: any, result: any) => {
        if (err) {
          (socket as any).userId = null;
          (socket as any).role = "guest";
          return next();
        }
        const userData = await User.findByPk(result.id);
        if (!userData) {
          (socket as any).userId = null;
          (socket as any).role = "guest";
          return next();
        }
        (socket as any).userId = result.id;
        (socket as any).role = userData.role;
        next();
      },
    );
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    const role = (socket as any).role || "guest";
    addToOnlineUsers(socket.id, userId, role);
    registerConnectedSocket(socket.id, userId, role);
    console.log(`Socket connected: ${socket.id} (user: ${userId || "guest"}, role: ${role})`);

    // Join admin socket into admin-room
    if (role === "admin") {
      socket.join("admin-room");
      console.log(`🛡️ Admin joined admin-room: socket ${socket.id} (userId: ${userId})`);
      emitTrafficUpdate();
    }

    // Customer active checkout events
    socket.on("customer:checkout-start", () => {
      addActiveCheckout(socket.id);
    });

    socket.on("customer:checkout-end", () => {
      removeActiveCheckout(socket.id);
    });

    socket.on("disconnect", () => {
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      unregisterConnectedSocket(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });

    // *Update Order status
    socket.on("orderStatusUpdated", async (data) => {
      try {
        console.log("Received orderStatusUpdated:", data); 
        const { orderId, userId, status } = data;
        const findUser = onlineUsers.find((user) => user.userId === userId);
        if (!findUser) {
          console.log("No online user found for userId:", userId);
          socket.emit("appError", "Unauthorized! User not found"); 
          return;
        }
        const [rowsUpdated] = await Order.update(
          { orderStatus: status },
          { where: { id: orderId } },
        );
        console.log("rowsUpdated:", rowsUpdated);
        if (rowsUpdated === 0) {
          socket.emit("appError", "Order not found or not updated");
          return;
        }
        io.to(findUser.socketId).emit(
          "success",
          "Order status updated successfully",
        );

        // Notify admins in admin-room of status change
        emitToAdmin("admin:dashboard-refresh", {
          type: "order-status-updated",
          orderId,
          status,
        });
      } catch (err: any) {
        console.error("orderStatusUpdated error:", err);
        socket.emit("appError", "Something went wrong updating the order");
      }
    });

  });
}

startServer();
