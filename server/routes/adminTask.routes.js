import express from "express";
import {
  getSmartTasks,
  getTaskDetail,
  getDeptUsersWithLoad,
  assignTask,
  deleteTask,
  getTaskTracking,
  reassignTask,
  toggleUrgent,
  sendTaskReminder        // ✅ NEW import
} from "../controllers/adminTask.controller.js";

import {
  authenticateUser,
  authorizeAdmin
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

router.get("/smart-tasks", getSmartTasks);
router.get("/dept-users", getDeptUsersWithLoad);
router.get("/track/:type/:id", getTaskTracking);

router.post("/assign", assignTask);
router.post("/reassign", reassignTask);
router.post("/toggle-urgent", toggleUrgent);
router.post("/reminder/:type/:id", sendTaskReminder);   // ✅ REMINDER ROUTE

router.get("/:type/:id", getTaskDetail);
router.delete("/:type/:id", deleteTask);

export default router;