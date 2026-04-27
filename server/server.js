import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";

/* ================= CREATE SERVER ================= */
const server = http.createServer(app);

/* ================= SOCKET SETUP ================= */
export const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

/* ================= SOCKET CONNECTION ================= */
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // 🔥 Join user-specific room
  socket.on("join", (userId) => {
    socket.join(userId.toString());
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});