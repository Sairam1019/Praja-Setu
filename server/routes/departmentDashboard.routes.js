import express from "express";
import { getDepartmentDashboard, clearDepartmentActivity } from "../controllers/departmentDashboard.controller.js";
import { authenticateUser, authorizeDepartment } from "../middleware/auth.middleware.js"; // ✅ import both

const router = express.Router();

// ✅ exactly matches frontend URLs
router.get("/dashboard", authenticateUser, getDepartmentDashboard);
router.delete("/dashboard/clear-activity", authenticateUser, authorizeDepartment, clearDepartmentActivity);

export default router;