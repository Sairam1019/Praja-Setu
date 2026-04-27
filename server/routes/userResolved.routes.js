import express from "express";
import { getUserResolvedTasks } from "../controllers/userResolved.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* 🔥 DEBUG */
router.use((req, res, next) => {
  console.log("👉 USER RESOLVED ROUTE:", req.method, req.originalUrl);
  next();
});

/* =========================================================
   ROUTES
========================================================= */

// ✅ GET ALL RESOLVED TASKS (PUBLIC FOR USER VIEW)
router.get("/", authenticateUser, getUserResolvedTasks);

export default router;