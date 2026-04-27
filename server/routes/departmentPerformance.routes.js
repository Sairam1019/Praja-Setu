import express from "express";
import { getDepartmentPerformance } from "../controllers/departmentPerformance.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================================================
   🚀 PERFORMANCE ROUTES
========================================================= */
router.get("/performance", authenticateUser, getDepartmentPerformance);

export default router;