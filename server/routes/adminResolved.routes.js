import express from "express";
import {
  getResolvedWithProofs,
  getResolvedDetail
} from "../controllers/adminResolved.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* DEBUG */
router.use((req, res, next) => {
  console.log("👉 ADMIN RESOLVED:", req.method, req.originalUrl);
  next();
});

/* ================= ROUTES ================= */

// GET ALL RESOLVED TASKS
router.get("/", authenticateUser, getResolvedWithProofs);

// GET SINGLE DETAIL
router.get("/:id", authenticateUser, getResolvedDetail);

export default router;