import db from "../config/db.js";
import { io } from "../server.js";
import { sendEmail } from "../utils/email.js";

/* =========================================================
   📊 GET ADMIN ACTIVITY (PAGINATED)
========================================================= */
export const getAdminActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const blockedUsers = await db.query(`
      SELECT id, name, email, role
      FROM users
      WHERE is_blocked = true AND is_deleted = false
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const logs = await db.query(`
      SELECT 
        a.id,
        a.action,
        a.message,
        a.created_at,
        COALESCE(u.name, 'System') AS admin_name
      FROM admin_logs a
      LEFT JOIN users u ON a.performed_by = u.id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      page: Number(page),
      limit: Number(limit),
      blockedUsers: blockedUsers.rows,
      logs: logs.rows
    });

  } catch (err) {
    console.error("❌ getAdminActivity:", err);
    res.status(500).json({ message: "error" });
  }
};


/* =========================================================
   🚫 BLOCK USER (FULL SYSTEM)
========================================================= */
export const blockUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  if (userId === adminId) {
    return res.status(400).json({ message: "You cannot block yourself" });
  }

  try {
    await db.query("BEGIN");

    const user = await db.query(
      "SELECT id, name, email FROM users WHERE id=$1 AND is_deleted=false",
      [userId]
    );

    if (user.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const userData = user.rows[0];

    await db.query(
      "UPDATE users SET is_blocked = true WHERE id = $1",
      [userId]
    );

    const message = `🚫 Your account has been blocked by admin`;

    /* 🔥 LOG */
    await db.query(`
      INSERT INTO admin_logs (action, message, performed_by)
      VALUES ($1,$2,$3)
    `, ["BLOCK_USER", `Blocked user ${userId}`, adminId]);

    /* 🔔 IN-APP */
    await db.query(`
      INSERT INTO notifications (user_id, title, message)
      VALUES ($1,$2,$3)
    `, [userId, "Account Blocked", message]);

    await db.query("COMMIT");

    /* ⚡ REALTIME */
    io.to(userId.toString()).emit("notification", {
      title: "Account Blocked",
      message
    });

    /* 📧 EMAIL */
    await sendEmail(
      userData.email,
      "Account Blocked",
      `Hello ${userData.name},

Your account has been blocked by admin.

If you think this is a mistake, contact support.

- Civic System`
    );

    res.json({ message: "User blocked successfully" });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ blockUser:", err);
    res.status(500).json({ message: "error" });
  }
};


/* =========================================================
   🔓 UNBLOCK USER (FULL SYSTEM)
========================================================= */
export const unblockUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id;

  try {
    await db.query("BEGIN");

    const user = await db.query(
      "SELECT id, name, email FROM users WHERE id=$1 AND is_deleted=false",
      [userId]
    );

    if (user.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const userData = user.rows[0];

    await db.query(
      "UPDATE users SET is_blocked = false WHERE id = $1",
      [userId]
    );

    const message = `✅ Your account has been unblocked`;

    await db.query(`
      INSERT INTO admin_logs (action, message, performed_by)
      VALUES ($1,$2,$3)
    `, ["UNBLOCK_USER", `Unblocked user ${userId}`, adminId]);

    await db.query(`
      INSERT INTO notifications (user_id, title, message)
      VALUES ($1,$2,$3)
    `, [userId, "Account Unblocked", message]);

    await db.query("COMMIT");

    io.to(userId.toString()).emit("notification", {
      title: "Account Unblocked",
      message
    });

    await sendEmail(
      userData.email,
      "Account Unblocked",
      `Hello ${userData.name},

Your account is now active again. You can login.

- Civic System`
    );

    res.json({ message: "User unblocked successfully" });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ unblockUser:", err);
    res.status(500).json({ message: "error" });
  }
};


/* =========================================================
   ❌ DELETE USER (SOFT DELETE + FULL SYSTEM)
========================================================= */
export const deleteUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id;

  try {
    await db.query("BEGIN");

    const user = await db.query(
      "SELECT id, name, email FROM users WHERE id=$1 AND is_deleted=false",
      [userId]
    );

    if (user.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const userData = user.rows[0];

    await db.query(
      "UPDATE users SET is_deleted = true WHERE id = $1",
      [userId]
    );

    const message = `❌ Your account has been deleted`;

    await db.query(`
      INSERT INTO admin_logs (action, message, performed_by)
      VALUES ($1,$2,$3)
    `, ["DELETE_USER", `Deleted user ${userId}`, adminId]);

    await db.query(`
      INSERT INTO notifications (user_id, title, message)
      VALUES ($1,$2,$3)
    `, [userId, "Account Deleted", message]);

    await db.query("COMMIT");

    io.to(userId.toString()).emit("notification", {
      title: "Account Deleted",
      message
    });

    await sendEmail(
      userData.email,
      "Account Deleted",
      `Hello ${userData.name},

Your account has been removed by admin.

Contact support if needed.

- Civic System`
    );

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ deleteUser:", err);
    res.status(500).json({ message: "error" });
  }
};


/* =========================================================
   🧹 CLEAR LOGS
========================================================= */
export const clearLogs = async (req, res) => {
  try {
    await db.query("BEGIN");

    await db.query("DELETE FROM admin_logs");

    await db.query("COMMIT");

    res.json({ message: "Logs cleared" });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ clearLogs:", err);
    res.status(500).json({ message: "error" });
  }
};