import express from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markSelectedAsRead,
  deleteNotification,
  deleteSelectedNotifications
} from "../controllers/notification.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===========================
   GET ALL NOTIFICATIONS
=========================== */
router.get("/", authenticateUser, getMyNotifications);

/* ===========================
   MARK ONE AS READ
=========================== */
router.put("/:id/read", authenticateUser, markNotificationAsRead);

/* ===========================
   MARK ALL AS READ
=========================== */
router.put("/read-all", authenticateUser, markAllNotificationsAsRead);

/* ===========================
   MARK SELECTED AS READ
=========================== */
router.post("/read-selected", authenticateUser, markSelectedAsRead);

/* ===========================
   DELETE ONE
=========================== */
router.delete("/:id", authenticateUser, deleteNotification);

/* ===========================
   DELETE SELECTED
=========================== */
router.post("/delete-selected", authenticateUser, deleteSelectedNotifications);



export default router;