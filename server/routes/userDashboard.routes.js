import express from "express";
import {
  getComplaintStats,
  getViolationStats,
  getWeeklyTrend,
  getStatusDistribution
} from "../controllers/userDashboard.controller.js";

const router = express.Router();

/* 🔥 DEBUG */
router.use((req, res, next) => {
  console.log("👉 GLOBAL DASHBOARD:", req.method, req.originalUrl);
  next();
});

/* ================= ROUTES ================= */

// 🌍 GLOBAL DATA (no auth needed OR keep auth if admin only)
router.get("/complaint-stats", getComplaintStats);
router.get("/violation-stats", getViolationStats);
router.get("/weekly-trend", getWeeklyTrend);
router.get("/status-distribution", getStatusDistribution);

export default router;