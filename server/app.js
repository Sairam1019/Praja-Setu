import express from "express";
import cors from "cors";

import "./config/db.js";

/* ==============================
   🔐 AUTH ROUTES (ALL ROLES)
============================== */
import authRoutes from "./routes/auth.routes.js";

/* ==============================
   👤 USER ROUTES
============================== */
import complaintRoutes from "./routes/complaint.routes.js";
import voteRoutes from "./routes/vote.routes.js";
// ❌ hotspotRoutes removed
import profileRoutes from "./routes/profile.routes.js";
import violationRoutes from "./routes/violation.routes.js";
import trackRoutes from "./routes/track.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import userResolvedRoutes from "./routes/userResolved.routes.js";
import dashboardRoutes from "./routes/userDashboard.routes.js";




/*=================================
        DEPARTMENT ROUTES
=================================*/ 
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
   🔔 NOTIFICATION ROUTES (ALL ROLES)
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
app.use(cors({
  origin: "https://app.netlify.com/projects/sparkly-gingersnap-85805b",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   🚀 API ROUTES
========================================================= */

/* ---------- 🔐 AUTH ---------- */
app.use("/api/auth", authRoutes);

/* ---------- 👤 USER ---------- */
app.use("/api/complaints", complaintRoutes);   // Report + view complaints
app.use("/api/votes", voteRoutes);             // Voting system
// ❌ app.use("/api/hotspots", hotspotRoutes);   // REMOVED
app.use("/api/profile", profileRoutes);        // User profile
app.use("/api/violations", violationRoutes);   // Report violations
app.use("/api/track", trackRoutes);            // Track complaints
// app.use("/api/votes", voteRoutes);          // ❌ DUPLICATE REMOVED
app.use("/api/chat", chatRoutes);   
app.use("/api/user/resolved", userResolvedRoutes);
app.use("/api/dashboard", dashboardRoutes);
           // Chatbot

/*--------------Department --------*/
app.use("/api/department", departmentDashboardRoutes);
app.use("/api/department", departmentTaskRoutes);
app.use("/api/department", departmentWorkLogRoutes);
app.use("/api/department", performanceRoutes);
app.use("/api/department/proofs", departmentProofsRoutes);
/* ---------- 👑 ADMIN ---------- */
app.use("/api/admin/dashboard", adminDashboardRoutes); // Stats + charts
app.use("/api/admin/users", adminUserRoutes);          // Manage users
app.use("/api/admin/tasks", adminTaskRoutes);          // Assign tasks
app.use("/api/admin/departments", adminDepartmentRoutes);
app.use("/api/admin/performance", adminPerformanceRoutes);
app.use("/api/admin/activity", adminActivityRoutes);
app.use("/api/admin/resolved", adminResolvedRoutes);

/* ---------- 🔔 NOTIFICATIONS ---------- */
app.use("/api/notifications", notificationRoutes);     // Real-time + history



/* =========================================================
   🧪 TEST ROUTES
========================================================= */
app.get("/", (req, res) => {
  res.send("🚀 Civic Intelligence API Running");
});

app.get("/test", (req, res) => {
  res.send("✅ Test route working");
});

/* =========================================================
   🔒 PROTECTED TEST
========================================================= */
app.get("/protected", authenticateUser, (req, res) => {
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
    message: "Route not found"
  });
});

/* =========================================================
   🔥 GLOBAL ERROR HANDLER (added)
========================================================= */
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

export default app;