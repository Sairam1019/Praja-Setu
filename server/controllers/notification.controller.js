import db from "../config/db.js";
// ❌ SMS import removed
import { sendEmail } from "../utils/email.js";

/* =========================================================
   🔹 CREATE NOTIFICATION (EMAIL + DB only – SMS removed)
========================================================= */
export const createNotification = async (
  userId,
  title,
  message,
  sendEmailFlag = true
) => {
  try {
    // Validate inputs
    if (!userId || !title || !message) {
      console.error("❌ createNotification: missing required fields");
      return;
    }

    // Save to database
    await db.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, $2, $3)`,
      [userId, title, message]
    );

    // Get user contact details
    const { rows } = await db.query(
      "SELECT name, phone, email FROM users WHERE id = $1",
      [userId]
    );

    if (!rows.length) return;

    const { name, email } = rows[0];
    const displayName = name || "User";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Praja Setu - Civic Intelligence System</h2>
        <p>Dear ${displayName},</p>
        <p>${message}</p>
        <br/>
        <p>Regards,<br/>Praja Setu Team</p>
      </div>
    `;

    // Send Email (async, don't block)
    if (sendEmailFlag && email) {
      sendEmail(email, title, emailHtml).catch(err =>
        console.error("❌ Email failed:", err.message)
      );
    }
  } catch (err) {
    console.error("❌ createNotification error:", err.message);
  }
};

/* =========================================================
   🔔 GET MY NOTIFICATIONS
========================================================= */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT id, title, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ getMyNotifications error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

/* =========================================================
   📖 MARK SINGLE AS READ
========================================================= */
export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ markNotificationAsRead error:", err.message);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

/* =========================================================
   📖 MARK ALL AS READ
========================================================= */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ markAllNotificationsAsRead error:", err.message);
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

/* =========================================================
   📖 MARK SELECTED AS READ
========================================================= */
export const markSelectedAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No IDs provided" });
    }

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ANY($1::int[]) AND user_id = $2`,
      [ids, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ markSelectedAsRead error:", err.message);
    res.status(500).json({ success: false, message: "Failed to mark selected as read" });
  }
};

/* =========================================================
   🗑 DELETE SINGLE
========================================================= */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ deleteNotification error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};

/* =========================================================
   🗑 DELETE SELECTED
========================================================= */
export const deleteSelectedNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No IDs provided" });
    }

    await db.query(
      `DELETE FROM notifications
       WHERE id = ANY($1::int[]) AND user_id = $2`,
      [ids, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ deleteSelectedNotifications error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete selected notifications" });
  }
};