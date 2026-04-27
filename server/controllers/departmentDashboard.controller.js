import db from "../config/db.js";

/* =========================================================
   📊 DEPARTMENT DASHBOARD (FINAL PRODUCTION VERSION)
========================================================= */
export const getDepartmentDashboard = async (req, res) => {
  try {
    const deptId = req.user.id;

    /* ===========================
       📊 BASIC COUNTS
    =========================== */
    const [complaints, violations] = await Promise.all([
      db.query("SELECT COUNT(*) FROM complaints WHERE assigned_to=$1", [deptId]),
      db.query("SELECT COUNT(*) FROM violations WHERE assigned_to=$1", [deptId])
    ]);

    /* ===========================
       ✅ RESOLVED
    =========================== */
    const resolved = await db.query(`
      SELECT COUNT(*) FROM (
        SELECT status FROM complaints WHERE assigned_to=$1
        UNION ALL
        SELECT status FROM violations WHERE assigned_to=$1
      ) t
      WHERE LOWER(status)='resolved'
    `, [deptId]);

    /* ===========================
       🔥 URGENT (FIXED LOGIC)
    =========================== */
    const urgent = await db.query(`
      SELECT COUNT(*) FROM (
        SELECT manual_urgent, deadline FROM complaints WHERE assigned_to=$1
        UNION ALL
        SELECT manual_urgent, deadline FROM violations WHERE assigned_to=$1
      ) t
      WHERE manual_urgent = true
      OR (deadline IS NOT NULL AND deadline < NOW())
    `, [deptId]);

    /* ===========================
       ⚠️ OVERDUE (NEW FEATURE)
    =========================== */
    const overdue = await db.query(`
      SELECT COUNT(*) FROM (
        SELECT deadline FROM complaints WHERE assigned_to=$1
        UNION ALL
        SELECT deadline FROM violations WHERE assigned_to=$1
      ) t
      WHERE deadline IS NOT NULL AND deadline < NOW()
    `, [deptId]);

    /* ===========================
       📊 PIE DATA
    =========================== */
    const pieData = [
      { name: "Complaints", value: Number(complaints.rows[0].count) },
      { name: "Violations", value: Number(violations.rows[0].count) },
      { name: "Resolved", value: Number(resolved.rows[0].count) },
      { name: "Urgent", value: Number(urgent.rows[0].count) }
    ];

    /* ===========================
       📈 PERFORMANCE (FIXED)
    =========================== */
    const performance = await db.query(`
      SELECT 
        DATE(created_at) as date,
        TO_CHAR(created_at, 'Dy') as day,
        COUNT(*) as tasks,
        COUNT(*) FILTER (WHERE LOWER(status)='resolved') as resolved
      FROM (
        SELECT created_at, status FROM complaints WHERE assigned_to=$1
        UNION ALL
        SELECT created_at, status FROM violations WHERE assigned_to=$1
      ) t
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at), day
      ORDER BY DATE(created_at)
    `, [deptId]);

    /* ===========================
       📌 TASKS (IMPROVED FOR UI)
    =========================== */
    const tasks = await db.query(`
      SELECT 
        id,
        title,
        status,
        deadline,
        created_at,
        'complaint' AS type,
        manual_urgent
      FROM complaints
      WHERE assigned_to=$1

      UNION ALL

      SELECT 
        id,
        title,
        status,
        deadline,
        created_at,
        'violation' AS type,
        manual_urgent
      FROM violations
      WHERE assigned_to=$1

      ORDER BY created_at DESC
      LIMIT 10
    `, [deptId]);

    /* ===========================
       📜 RECENT ACTIVITY
    =========================== */
    const activity = await db.query(`
      SELECT 
        message,
        action,
        created_at
      FROM task_logs
      WHERE performed_by=$1
      ORDER BY created_at DESC
      LIMIT 10
    `, [deptId]);

    /* ===========================
       👥 TEAM STATUS (FIXED)
    =========================== */
    const team = await db.query(`
      SELECT id, name, is_blocked
      FROM users
      WHERE role='department' AND is_deleted=false
      ORDER BY name ASC
    `);

    /* ===========================
       📊 COMPLETION RATE
    =========================== */
    const totalTasks =
      Number(complaints.rows[0].count) +
      Number(violations.rows[0].count);

    const completedTasks = Number(resolved.rows[0].count);

    const completionRate =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    /* ===========================
       🔥 ENHANCE TASKS (FOR FRONTEND)
    =========================== */
    const enhancedTasks = tasks.rows.map(task => {
      const isOverdue =
        task.deadline && new Date(task.deadline) < new Date();

      return {
        ...task,
        isOverdue,
        isUrgent:
          task.manual_urgent === true ||
          isOverdue ||
          task.status?.toLowerCase() === "pending"
      };
    });

    /* ===========================
       RESPONSE
    =========================== */
    res.json({
      stats: {
        totalComplaints: Number(complaints.rows[0].count),
        totalViolations: Number(violations.rows[0].count),
        totalResolved: completedTasks,
        urgentTasks: Number(urgent.rows[0].count),
        overdueTasks: Number(overdue.rows[0].count), // 🔥 NEW
        completionRate // 🔥 NEW
      },
      pieData,
      performanceData: performance.rows,
      assignTasks: enhancedTasks, // 🔥 UPDATED
      recentActivities: activity.rows,
      departmentUsers: team.rows
    });

  } catch (err) {
    console.error("❌ Department Dashboard Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* =========================================================
   🧹 CLEAR RECENT ACTIVITY (DEPARTMENT)
========================================================= */
export const clearDepartmentActivity = async (req, res) => {
  try {
    const deptId = req.user.id;

    // Delete all task logs performed by this department user
    const result = await db.query(
      "DELETE FROM task_logs WHERE performed_by = $1",
      [deptId]
    );

    res.json({
      success: true,
      message: "Activity cleared successfully",
      deletedCount: result.rowCount
    });
  } catch (err) {
    console.error("❌ Clear activity error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to clear activity logs"
    });
  }
};