import express from "express";
import {
  createComplaint,
  getAllComplaints,
  updateComplaintStatus,
  enhanceComplaintDescription,
  enhanceText   // ✅ make sure this is imported
} from "../controllers/complaint.controller.js";

import {
  authenticateUser,
  authorizeAdmin
} from "../middleware/auth.middleware.js";

import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post("/", authenticateUser, upload.single("media"), createComplaint);
router.get("/", authenticateUser, getAllComplaints);
router.put("/:id/status", authenticateUser, authorizeAdmin, updateComplaintStatus);
router.post("/:id/enhance", authenticateUser, enhanceComplaintDescription);

// ✅ NEW: enhance generic text (no ID required)
router.post("/enhance-text", authenticateUser, enhanceText);

export default router;