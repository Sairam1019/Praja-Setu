import express from "express";
import {
  getAdminActivity,
  blockUser,
  unblockUser,
  deleteUser,
  clearLogs
} from "../controllers/adminActivity.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateUser, getAdminActivity);

router.post("/block", authenticateUser, blockUser);
router.post("/unblock", authenticateUser, unblockUser);
router.post("/delete-user", authenticateUser, deleteUser);
router.post("/clear-logs", authenticateUser, clearLogs);

export default router;