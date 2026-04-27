import express from "express";

import {
  getAdminDashboardStats,
  getComplaintTrends,
  getViolationTrends,
  getAdminActivitySummary
} from "../controllers/adminDashboard.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===========================
   🔐 ADMIN CHECK MIDDLEWARE
=========================== */
const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

/* ===========================
   📊 STATS
=========================== */
router.get("/stats", authenticateUser, isAdmin, getAdminDashboardStats);

/* ===========================
   📈 TRENDS
=========================== */
router.get("/complaint-trends", authenticateUser, isAdmin, getComplaintTrends);
router.get("/violation-trends", authenticateUser, isAdmin, getViolationTrends);

/* ===========================
   🥧 ACTIVITY SUMMARY (PIE)
=========================== */
router.get("/activity-summary", authenticateUser, isAdmin, getAdminActivitySummary);

export default router;