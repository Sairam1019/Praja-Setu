import express from "express";
import {
  getAssignedTasks,
  getTaskDetail,
  updateTaskStatus,
  rejectTask,
  addTaskRemark,
  submitProof,
  aiTaskReview                    // ✅ ADDED
} from "../controllers/departmentTask.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

/* ===========================
   📋 TASKS
=========================== */
router.get("/assigned-tasks", authenticateUser, getAssignedTasks);
router.get("/task/:type/:id", authenticateUser, getTaskDetail);

/* ===========================
   🔄 TASK ACTIONS – all use POST (matching frontend)
=========================== */
router.post("/update-status", authenticateUser, updateTaskStatus);
router.post("/reject-task", authenticateUser, rejectTask);
router.post("/add-remark", authenticateUser, addTaskRemark);

/* ===========================
   📸 SUBMIT PROOF (EVIDENCE FOR RESOLVED TASK)
=========================== */
router.post("/submit-proof", authenticateUser, upload.single("media"), submitProof);

/* ===========================
   🤖 AI TASK REVIEW (ADVANCED ANALYSIS)
=========================== */
router.post("/ai-review", authenticateUser, aiTaskReview);

export default router;