import db from "../config/db.js";
import bcrypt from "bcrypt";
import { io } from "../server.js";
import { sendEmail } from "../utils/email.js";

/* =========================================================
   👥 GET USERS (ALL ACTIVE USERS)
========================================================= */
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const adminId = req.user?.id;

    let query = `
      SELECT id, name, email, phone, role, is_blocked, created_at
      FROM users
      WHERE 1=1
    `;

    const values = [];

    if (role) {
      query += " AND role = $1";
      values.push(role);
    }

    query += " ORDER BY created_at DESC";

    const { rows } = await db.query(query, values);

    if (adminId) {
      await db.query(
        `INSERT INTO admin_logs (action, message, performed_by)
         VALUES ($1,$2,$3)`,
        [
          "VIEW_USERS",
          role ? `Viewed ${role}` : "Viewed all users",
          adminId,
        ]
      );
    }

    res.json(rows);

  } catch (err) {
    console.error("❌ GET USERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   ➕ CREATE USER
========================================================= */
export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const adminId = req.user?.id;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!["admin", "department"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone" });
    }

    const existing = await db.query(
      "SELECT id FROM users WHERE email=$1 OR phone=$2",
      [email, phone]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email or phone already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, phone, role`,
      [name, email, phone, hashed, role]
    );

    const user = rows[0];

    // 🔔 Notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1,$2,$3)`,
      [user.id, "Account Created", "Your account has been created"]
    );

    io.to(user.id.toString()).emit("notification", {
      title: "Account Created",
      message: "Your account has been created",
    });

    sendEmail(
      user.email,
      "Account Created",
      `Hello ${user.name}, your account has been created.`
    ).catch(console.error);

    if (adminId) {
      await db.query(
        `INSERT INTO admin_logs (action, message, performed_by)
         VALUES ($1,$2,$3)`,
        ["CREATE_USER", `Created ${role} ${user.name}`, adminId]
      );
    }

    res.json({ message: "User created", user });

  } catch (err) {
    console.error("❌ CREATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   🚫 BLOCK / UNBLOCK USER
========================================================= */
export const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (id == adminId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const check = await db.query("SELECT * FROM users WHERE id=$1", [id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { rows } = await db.query(
      `UPDATE users
       SET is_blocked = NOT is_blocked
       WHERE id=$1
       RETURNING id, name, email, is_blocked`,
      [id]
    );

    const user = rows[0];

    const message = user.is_blocked
      ? "Your account has been blocked"
      : "Your account has been unblocked";

    // 🔔 Notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1,$2,$3)`,
      [id, "Account Update", message]
    );

    io.to(id.toString()).emit("notification", {
      title: "Account Update",
      message,
    });

    sendEmail(user.email, "Account Update", message).catch(console.error);

    if (adminId) {
      await db.query(
        `INSERT INTO admin_logs (action, message, performed_by)
         VALUES ($1,$2,$3)`,
        [
          user.is_blocked ? "BLOCK_USER" : "UNBLOCK_USER",
          `${user.name} updated`,
          adminId,
        ]
      );
    }

    res.json({ message: "User updated", user });

  } catch (err) {
    console.error("❌ BLOCK ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   ❌ HARD DELETE USER (FINAL)
========================================================= */
export const deleteUser = async (req, res) => {
  const client = await db.connect();

  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (id == adminId) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    await client.query("BEGIN");

    const userCheck = await client.query(
      "SELECT * FROM users WHERE id=$1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const user = userCheck.rows[0];

    // ⚠️ OPTIONAL: clean dependencies (recommended)
    await client.query("DELETE FROM notifications WHERE user_id=$1", [id]);
    await client.query("DELETE FROM task_logs WHERE performed_by=$1", [id]);

    // 🔥 HARD DELETE
    await client.query("DELETE FROM users WHERE id=$1", [id]);

    await client.query("COMMIT");

    // 📡 Socket
    io.to(id.toString()).emit("notification", {
      title: "Account Deleted",
      message: "Your account has been deleted",
    });

    // 📧 Email
    sendEmail(
      user.email,
      "Account Deleted",
      "Your account has been permanently deleted"
    ).catch(console.error);

    if (adminId) {
      await db.query(
        `INSERT INTO admin_logs (action, message, performed_by)
         VALUES ($1,$2,$3)`,
        ["DELETE_USER", `Deleted ${user.name}`, adminId]
      );
    }

    console.log("🔥 HARD DELETE SUCCESS:", id);

    res.json({ message: "User permanently deleted" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};