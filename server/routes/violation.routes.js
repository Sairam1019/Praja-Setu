import express from "express";
import {
  createViolation,
  getAllViolations,
  updateViolationStatus,
  deleteViolation,
  enhanceText   // ✅ import the generic text enhancement function
} from "../controllers/violation.controller.js";

import {
  authenticateUser,
  authorizeAdmin
} from "../middleware/auth.middleware.js";

import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// ✅ CREATE (WITH FILE)
router.post(
  "/",
  authenticateUser,
  upload.single("media"),
  createViolation
);

// ✅ ENHANCE TEXT (AI) – for new violations before submission
router.post("/enhance-text", authenticateUser, enhanceText);

// ✅ ADMIN ROUTES
router.get("/", authenticateUser, getAllViolations);
router.put("/:id", authenticateUser, authorizeAdmin, updateViolationStatus);
router.delete("/:id", authenticateUser, authorizeAdmin, deleteViolation);

export default router;