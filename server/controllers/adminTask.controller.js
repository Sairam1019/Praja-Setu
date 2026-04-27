import db from "../config/db.js";
import { io } from "../server.js";
import { sendEmail } from "../utils/email.js";

/* =========================================================
   🔁 AUTO ASSIGN HELPER
========================================================= */
const getAvailableUser = async () => {
  const { rows } = await db.query(`
    SELECT 
      u.id,
      u.name,
      u.email,
      COUNT(DISTINCT c.id) + COUNT(DISTINCT v.id) AS assigned_tasks
    FROM users u
    LEFT JOIN complaints c ON u.id = c.assigned_to
    LEFT JOIN violations v ON u.id = v.assigned_to
    WHERE u.role = 'department'
    GROUP BY u.id
    HAVING COUNT(DISTINCT c.id) + COUNT(DISTINCT v.id) < 5
    ORDER BY assigned_tasks ASC
    LIMIT 1
  `);

  return rows[0] || null;
};

/* =========================================================
   📊 GET TASKS
========================================================= */
export const getSmartTasks = async (req, res) => {
  try {
    const complaints = await db.query(`
      SELECT c.*, COUNT(v.id) AS votes, u.name AS assigned_name, 'complaint' AS type
      FROM complaints c
      LEFT JOIN votes v ON c.id = v.complaint_id
      LEFT JOIN users u ON c.assigned_to = u.id
      GROUP BY c.id, u.name
    `);

    const violations = await db.query(`
      SELECT v.*, COUNT(vt.id) AS votes, u.name AS assigned_name, 'violation' AS type
      FROM violations v
      LEFT JOIN votes vt ON v.id = vt.violation_id
      LEFT JOIN users u ON v.assigned_to = u.id
      GROUP BY v.id, u.name
    `);

    const tasks = [...complaints.rows, ...violations.rows].map(t => {
      const votes = Number(t.votes || 0);
      return {
        ...t,
        votes,
        isUrgent: votes >= 5 || t.manual_urgent === true,
        isAssigned: t.assigned_to !== null
      };
    });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
};

/* =========================================================
   📄 TASK DETAIL
========================================================= */
export const getTaskDetail = async (req, res) => {
  try {
    const { id, type } = req.params;
    const table = type === "complaint" ? "complaints" : "violations";

    const result = await db.query(`
      SELECT t.*, COUNT(v.id) AS votes, u.name AS assigned_name
      FROM ${table} t
      LEFT JOIN votes v ON t.id = v.${type}_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id=$1
      GROUP BY t.id, u.name
    `, [id]);

    const task = result.rows[0];
    res.json({
      ...task,
      votes: Number(task.votes || 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
};

/* =========================================================
   📌 ASSIGN TASK (AUTO + LIMIT + EMAIL)
========================================================= */
export const assignTask = async (req, res) => {
  try {
    const { id, type, userId, deadline } = req.body;
    const adminId = req.user.id;

    let user;

    // auto assign if no userId provided
    if (!userId) {
      user = await getAvailableUser();
      if (!user) return res.status(400).json({ message: "No available users" });
    } else {
      // check existing load
      const check = await db.query(`
        SELECT COUNT(*) FROM (
          SELECT id FROM complaints WHERE assigned_to=$1
          UNION ALL
          SELECT id FROM violations WHERE assigned_to=$1
        ) t
      `, [userId]);
      if (Number(check.rows[0].count) >= 5) {
        return res.status(400).json({ message: "Max tasks reached" });
      }
      const resUser = await db.query("SELECT * FROM users WHERE id=$1", [userId]);
      user = resUser.rows[0];
    }

    const uid = user.id;

    // update task
    if (type === "complaint") {
      await db.query(
        "UPDATE complaints SET assigned_to=$1, deadline=$2 WHERE id=$3",
        [uid, deadline || null, id]
      );
    } else {
      await db.query(
        "UPDATE violations SET assigned_to=$1, deadline=$2 WHERE id=$3",
        [uid, deadline || null, id]
      );
    }

    const message = `Task #${id} assigned`;

    // log
    await db.query(`
      INSERT INTO task_logs (task_id, task_type, action, message, performed_by)
      VALUES ($1,$2,'ASSIGNED',$3,$4)
    `, [id, type, message, adminId]);

    // in-app notification
    await db.query(`
      INSERT INTO notifications (user_id, title, message)
      VALUES ($1,$2,$3)
    `, [uid, "New Task", message]);

    // socket
    io.to(uid.toString()).emit("notification", { title: "New Task", message });

    // email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "New Task Assigned",
        html: `<p>Hello ${user.name},</p><p>Task #${id} has been assigned to you.</p>`
      });
    }

    res.json({ message: "Assigned", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
};

/* =========================================================
   🔄 REASSIGN TASK
========================================================= */
export const reassignTask = async (req, res) => {
  try {
    const { id, type, userId } = req.body;

    // check user load
    const check = await db.query(`
      SELECT COUNT(*) FROM (
        SELECT id FROM complaints WHERE assigned_to=$1
        UNION ALL
        SELECT id FROM violations WHERE assigned_to=$1
      ) t
    `, [userId]);

    if (Number(check.rows[0].count) >= 5) {
      return res.status(400).json({ message: "Max tasks reached" });
    }

    if (type === "complaint") {
      await db.query("UPDATE complaints SET assigned_to=$1 WHERE id=$2", [userId, id]);
    } else {
      await db.query("UPDATE violations SET assigned_to=$1 WHERE id=$2", [userId, id]);
    }

    res.json({ message: "Reassigned" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
};

/* =========================================================
   🔥 TOGGLE URGENT
========================================================= */
export const toggleUrgent = async (req, res) => {
  try {
    const { id, type, urgent } = req.body;
    const table = type === "complaint" ? "complaints" : "violations";

    await db.query(`UPDATE ${table} SET manual_urgent=$1 WHERE id=$2`, [urgent, id]);
    res.json({ message: "Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
};

/* =========================================================
   ❌ DELETE TASK
========================================================= */
export const deleteTask = async (req, res) => {
  try {
    const { id, type } = req.params;
    const table = type === "complaint" ? "complaints" : "violations";

    await db.query(`DELETE FROM ${table} WHERE id=$1`, [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
};

/* =========================================================
   👥 USERS LOAD (DEPARTMENT USERS WITH CURRENT TASK COUNT)
========================================================= */
export const getDeptUsersWithLoad = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        u.id, u.name,
        COUNT(DISTINCT c.id) + COUNT(DISTINCT v.id) AS assigned_tasks
      FROM users u
      LEFT JOIN complaints c ON u.id = c.assigned_to
      LEFT JOIN violations v ON u.id = v.assigned_to
      WHERE u.role='department'
      GROUP BY u.id
      ORDER BY assigned_tasks ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
};

/* =========================================================
   📊 TASK TRACKING (TIMELINE)
========================================================= */
export const getTaskTracking = async (req, res) => {
  try {
    const { id, type } = req.params;
    const logs = await db.query(`
      SELECT * FROM task_logs
      WHERE task_id=$1 AND task_type=$2
      ORDER BY created_at ASC
    `, [id, type]);
    res.json({ timeline: logs.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "error" });
  }
};

/* =========================================================
   📧 SEND REMINDER (EMAIL + NOTIFICATION + SOCKET)
========================================================= */
export const sendTaskReminder = async (req, res) => {
  try {
    const { type, id } = req.params;
    const adminId = req.user.id;

    const table = type === "complaint" ? "complaints" : "violations";

    // get task details
    const taskResult = await db.query(
      `SELECT assigned_to, title, user_id FROM ${table} WHERE id = $1`,
      [id]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    const task = taskResult.rows[0];

    if (!task.assigned_to) {
      return res.status(400).json({ message: "Task not assigned to anyone" });
    }

    // get user email & name
    const userResult = await db.query(
      `SELECT email, name FROM users WHERE id = $1`,
      [task.assigned_to]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Assigned user not found" });
    }
    const user = userResult.rows[0];

    // send email
    await sendEmail({
      to: user.email,
      subject: `🔔 Reminder: Task "${task.title}" needs your attention`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Task Reminder</h2>
          <p>Dear ${user.name},</p>
          <p>This is a reminder regarding the task:</p>
          <p><strong>${task.title}</strong></p>
          <p>Please log in and update its status.</p>
          <br/>
          <p>Regards,<br/>Praja Setu Admin</p>
        </div>
      `
    });

    // in-app notification
    await db.query(
      `INSERT INTO notifications (user_id, title, message) 
       VALUES ($1, $2, $3)`,
      [task.assigned_to, "Task Reminder", `Admin sent a reminder for task: ${task.title}`]
    );

    // real‑time socket notification
    io.to(task.assigned_to.toString()).emit("notification", {
      title: "Task Reminder",
      message: `Reminder for task: ${task.title}`
    });

    // admin log
    await db.query(
      `INSERT INTO admin_logs (action, message, performed_by) 
       VALUES ($1, $2, $3)`,
      ["SEND_REMINDER", `Reminder sent for ${type} #${id}`, adminId]
    );

    res.json({ message: "Reminder sent successfully" });
  } catch (err) {
    console.error("❌ sendTaskReminder error:", err);
    res.status(500).json({ message: "Failed to send reminder" });
  }
};