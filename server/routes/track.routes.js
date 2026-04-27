import express from "express";

import {
  getMyComplaints,
  getMyViolations,   // ✅ FIX ADDED
  getTrackingById,
  updateTracking
} from "../controllers/track.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===========================
   📍 USER ROUTES
=========================== */

// Get all complaints of logged-in user
router.get("/my-complaints", authenticateUser, getMyComplaints);

// Get all violations of logged-in user
router.get("/my-violations", authenticateUser, getMyViolations);

// 🔥 IMPORTANT FIX (TYPE REQUIRED)
router.get("/:type/:id", authenticateUser, getTrackingById);


/* ===========================
   📍 DEPARTMENT ROUTE
=========================== */

// Update tracking status
router.patch("/:id", authenticateUser, updateTracking);

export default router;