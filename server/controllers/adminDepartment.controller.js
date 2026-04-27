import db from "../config/db.js";

/* =========================================================
   🏢 GET ALL DEPARTMENTS (SORTED BY PERFORMANCE)
========================================================= */
export const getDepartments = async (req, res) => {
  try {
    const adminId = req.user?.id;

    const { rows } = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,

        COALESCE(c.total, 0) + COALESCE(v.total, 0) AS total_tasks,
        COALESCE(c.completed, 0) + COALESCE(v.completed, 0) AS completed_tasks,
        COALESCE(c.pending, 0) + COALESCE(v.pending, 0) AS pending_tasks

      FROM users u

      LEFT JOIN (
        SELECT 
          assigned_to,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') AS completed,
          COUNT(*) FILTER (WHERE LOWER(status) != 'resolved') AS pending
        FROM complaints
        GROUP BY assigned_to
      ) c ON u.id = c.assigned_to

      LEFT JOIN (
        SELECT 
          assigned_to,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') AS completed,
          COUNT(*) FILTER (WHERE LOWER(status) != 'resolved') AS pending
        FROM violations
        GROUP BY assigned_to
      ) v ON u.id = v.assigned_to

      WHERE u.role = 'department'
    `);

    // Calculate performance and prepare formatted list
    const formatted = rows.map(dep => {
      const total = Number(dep.total_tasks || 0);
      const completed = Number(dep.completed_tasks || 0);
      return {
        ...dep,
        total_tasks: total,
        completed_tasks: completed,
        pending_tasks: Number(dep.pending_tasks || 0),
        performance: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    // ✅ Sort by performance (highest first)
    formatted.sort((a, b) => b.performance - a.performance);

    if (adminId) {
      await db.query(`
        INSERT INTO admin_logs (action, message, performed_by)
        VALUES ($1,$2,$3)
      `, ["VIEW_DEPARTMENTS", "Viewed departments", adminId]);
    }

    res.json(formatted);

  } catch (err) {
    console.error("❌ getDepartments:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================================
   📋 GET DEPARTMENT DETAILS (FINAL FIXED)
========================================================= */
export const getDepartmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    /* ===========================
       🔹 COMPLAINTS
    =========================== */
    const complaints = await db.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.status,
        c.deadline,
        c.created_at,
        c.manual_urgent,
        c.assigned_to,

        u.name AS assigned_name,

        COUNT(v.id)::int AS votes,
        'complaint' AS type

      FROM complaints c
      LEFT JOIN votes v ON v.complaint_id = c.id
      LEFT JOIN users u ON u.id = c.assigned_to

      WHERE c.assigned_to = $1

      GROUP BY c.id, u.name
    `, [id]);


    /* ===========================
       🔹 VIOLATIONS
    =========================== */
    const violations = await db.query(`
      SELECT 
        v.id,
        v.title,
        v.description,
        v.status,
        v.deadline,
        v.created_at,
        v.manual_urgent,
        v.assigned_to,

        u.name AS assigned_name,

        COUNT(vt.id)::int AS votes,
        'violation' AS type

      FROM violations v
      LEFT JOIN votes vt ON vt.violation_id = v.id
      LEFT JOIN users u ON u.id = v.assigned_to

      WHERE v.assigned_to = $1

      GROUP BY v.id, u.name
    `, [id]);


    /* ===========================
       🔹 MERGE + FIXED LOGIC
    =========================== */
    const allTasks = [...complaints.rows, ...violations.rows].map(task => {
      const votes = Number(task.votes || 0);

      const isUrgent =
        votes >= 5 ||
        task.manual_urgent === true;

      const isOverdue =
        task.deadline &&
        new Date(task.deadline) < new Date() &&
        task.status?.toLowerCase() !== "resolved";

      return {
        ...task,
        votes,
        isUrgent,
        isOverdue,
        isAssigned: true
      };
    });


    /* ===========================
       🔹 SORT (URGENT + LATEST FIRST)
    =========================== */
    allTasks.sort((a, b) => {
      if (b.isUrgent !== a.isUrgent) {
        return b.isUrgent - a.isUrgent;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });


    /* ===========================
       🔹 SUMMARY (FOR DASHBOARD)
    =========================== */
    const summary = {
      total: allTasks.length,
      urgent: allTasks.filter(t => t.isUrgent).length,
      resolved: allTasks.filter(t => t.status?.toLowerCase() === "resolved").length,
      pending: allTasks.filter(t => t.status?.toLowerCase() !== "resolved").length,
      overdue: allTasks.filter(t => t.isOverdue).length
    };


    if (adminId) {
      await db.query(`
        INSERT INTO admin_logs (action, message, performed_by)
        VALUES ($1,$2,$3)
      `, [
        "VIEW_DEPARTMENT_DETAIL",
        `Viewed department ${id}`,
        adminId
      ]);
    }

    res.json({
      summary,
      tasks: allTasks
    });

  } catch (err) {
    console.error("❌ getDepartmentDetails:", err);
    res.status(500).json({ message: "Server error" });
  }
};