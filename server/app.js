import express from "express";
import cors from "cors";

import "./config/db.js";

/* ==============================
   🔐 AUTH ROUTES
============================== */
import authRoutes from "./routes/auth.routes.js";

/* ==============================
   👤 USER ROUTES
============================== */
import complaintRoutes from "./routes/complaint.routes.js";
import voteRoutes from "./routes/vote.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import violationRoutes from "./routes/violation.routes.js";
import trackRoutes from "./routes/track.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import userResolvedRoutes from "./routes/userResolved.routes.js";
import dashboardRoutes from "./routes/userDashboard.routes.js";

/* ==============================
   🏢 DEPARTMENT ROUTES
============================== */
import departmentDashboardRoutes from "./routes/departmentDashboard.routes.js";
import departmentTaskRoutes from "./routes/departmentTask.routes.js";
import departmentWorkLogRoutes from "./routes/departmentWorkLog.routes.js";
import performanceRoutes from "./routes/departmentPerformance.routes.js";
import departmentProofsRoutes from "./routes/depatmentProof.routes.js";

/* ==============================
   👑 ADMIN ROUTES
============================== */
import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
import adminTaskRoutes from "./routes/adminTask.routes.js";
import adminDepartmentRoutes from "./routes/adminDepartment.routes.js";
import adminPerformanceRoutes from "./routes/adminPerformance.routes.js";
import adminActivityRoutes from "./routes/adminActivity.routes.js";
import adminResolvedRoutes from "./routes/adminResolved.routes.js";

/* ==============================
   🔔 NOTIFICATIONS
============================== */
import notificationRoutes from "./routes/notification.routes.js";

/* ==============================
   🔐 MIDDLEWARE
============================== */
import { authenticateUser } from "./middleware/auth.middleware.js";

const app = express();

/* ==============================
   ⚙️ GLOBAL MIDDLEWARE
============================== */

// ✅ BEST CORS (works for Netlify + preview URLs)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   🚀 API ROUTES
========================================================= */

// 🔐 AUTH
app.use("/api/auth", authRoutes);

// 👤 USER
app.use("/api/complaints", complaintRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/violations", violationRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user/resolved", userResolvedRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 🏢 DEPARTMENT
app.use("/api/department", departmentDashboardRoutes);
app.use("/api/department", departmentTaskRoutes);
app.use("/api/department", departmentWorkLogRoutes);
app.use("/api/department", performanceRoutes);
app.use("/api/department/proofs", departmentProofsRoutes);

// 👑 ADMIN
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/tasks", adminTaskRoutes);
app.use("/api/admin/departments", adminDepartmentRoutes);
app.use("/api/admin/performance", adminPerformanceRoutes);
app.use("/api/admin/activity", adminActivityRoutes);
app.use("/api/admin/resolved", adminResolvedRoutes);

// 🔔 NOTIFICATIONS
app.use("/api/notifications", notificationRoutes);

/* =========================================================
   🧪 TEST ROUTES
========================================================= */

// Root check
app.get("/", (req, res) => {
  res.send("🚀 Civic Intelligence API Running");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// Protected test
app.get("/api/protected", authenticateUser, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

/* =========================================================
   ❌ 404 HANDLER
========================================================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

/* =========================================================
   🔥 GLOBAL ERROR HANDLER
========================================================= */
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);

  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

export default app;