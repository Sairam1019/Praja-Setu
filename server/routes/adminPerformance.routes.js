import express from "express";
import { getPerformanceDashboard } from "../controllers/adminPerformance.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===========================
   📊 PERFORMANCE
=========================== */

// ✅ Global
router.get("/", authenticateUser, getPerformanceDashboard);

// ✅ Department specific
router.get("/:id", authenticateUser, getPerformanceDashboard);

export default router;