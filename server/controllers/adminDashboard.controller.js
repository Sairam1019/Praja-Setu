import db from "../config/db.js";

/* =========================================================
   📊 ADMIN DASHBOARD STATS (OPTIMIZED)
========================================================= */
export const getAdminDashboardStats = async (req, res) => {
  try {
    const adminId = req.user?.id;

    const { rows } = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role='user' AND is_deleted=false) AS users,
        (SELECT COUNT(*) FROM users WHERE role='department' AND is_deleted=false) AS departments,

        (SELECT COUNT(*) FROM complaints) AS complaints,
        (SELECT COUNT(*) FROM violations) AS violations,

        (SELECT COUNT(*) FROM complaints WHERE LOWER(status) != 'resolved') +
        (SELECT COUNT(*) FROM violations WHERE LOWER(status) != 'resolved') AS pending,

        (SELECT COUNT(*) FROM complaints WHERE LOWER(status)='resolved') +
        (SELECT COUNT(*) FROM violations WHERE LOWER(status)='resolved') AS resolved,

        (SELECT COUNT(*) FROM complaints WHERE assigned_to IS NULL) +
        (SELECT COUNT(*) FROM violations WHERE assigned_to IS NULL) AS unassigned
    `);

    if (adminId) {
      await db.query(`
        INSERT INTO admin_logs (action, message, performed_by)
        VALUES ($1,$2,$3)
      `, ["VIEW_DASHBOARD", "Viewed dashboard", adminId]);
    }

    res.json({
      users: Number(rows[0].users),
      departments: Number(rows[0].departments),
      complaints: Number(rows[0].complaints),
      violations: Number(rows[0].violations),
      pending: Number(rows[0].pending),
      resolved: Number(rows[0].resolved),
      unassigned: Number(rows[0].unassigned)
    });

  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================================
   📈 COMPLAINT TRENDS (SAFE)
========================================================= */
export const getComplaintTrends = async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 7;
    const adminId = req.user?.id;

    const { rows } = await db.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS count
      FROM complaints
      WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [range]);

    if (adminId) {
      await db.query(`
        INSERT INTO admin_logs (action, message, performed_by)
        VALUES ($1,$2,$3)
      `, ["VIEW_COMPLAINT_TRENDS", `Viewed ${range} days`, adminId]);
    }

    res.json(rows);

  } catch (err) {
    console.error("Complaint Trend Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================================
   📈 VIOLATION TRENDS (SAFE)
========================================================= */
export const getViolationTrends = async (req, res) => {
  try {
    const range = parseInt(req.query.range) || 7;
    const adminId = req.user?.id;

    const { rows } = await db.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS count
      FROM violations
      WHERE created_at >= NOW() - ($1 * INTERVAL '1 day')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [range]);

    if (adminId) {
      await db.query(`
        INSERT INTO admin_logs (action, message, performed_by)
        VALUES ($1,$2,$3)
      `, ["VIEW_VIOLATION_TRENDS", `Viewed ${range} days`, adminId]);
    }

    res.json(rows);

  } catch (err) {
    console.error("Violation Trend Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================================
   🥧 ADMIN ACTIVITY SUMMARY (IMPROVED)
========================================================= */
export const getAdminActivitySummary = async (req, res) => {
  try {
    const adminId = req.user?.id;

    const { rows } = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM complaints) AS complaints,
        (SELECT COUNT(*) FROM violations) AS violations,

        (SELECT COUNT(*) FROM complaints WHERE LOWER(status)='resolved') +
        (SELECT COUNT(*) FROM violations WHERE LOWER(status)='resolved') AS resolved,

        (SELECT COUNT(*) FROM complaints WHERE assigned_to IS NOT NULL) +
        (SELECT COUNT(*) FROM violations WHERE assigned_to IS NOT NULL) AS assigned
    `);

    if (adminId) {
      await db.query(`
        INSERT INTO admin_logs (action, message, performed_by)
        VALUES ($1,$2,$3)
      `, ["VIEW_ACTIVITY_SUMMARY", "Viewed activity summary", adminId]);
    }

    res.json([
      { name: "Complaints", value: Number(rows[0].complaints) },
      { name: "Violations", value: Number(rows[0].violations) },
      { name: "Resolved", value: Number(rows[0].resolved) },
      { name: "Assigned", value: Number(rows[0].assigned) }
    ]);

  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};