import express from "express";
import { getWorkLogs } from "../controllers/departmentWorkLog.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================================================
   📊 WORK LOG ROUTES
========================================================= */
router.get("/work-logs", authenticateUser, getWorkLogs);

export default router;