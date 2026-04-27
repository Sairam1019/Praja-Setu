import db from "../config/db.js";

/* =========================================================
   📊 FULL PERFORMANCE DASHBOARD (GLOBAL + DEPARTMENT)
========================================================= */
export const getPerformanceDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    const isDept = !!id;

    /* ===========================
       🏢 DEPARTMENT PERFORMANCE
       (lead_name omitted because no lead_id column exists)
    =========================== */
    const { rows } = await db.query(`
      SELECT 
        u.id,
        u.name,
        NULL AS lead_name,   -- placeholder; no lead association exists

        (
          SELECT COUNT(*) FROM complaints WHERE assigned_to = u.id
        ) +
        (
          SELECT COUNT(*) FROM violations WHERE assigned_to = u.id
        ) AS total_tasks,

        (
          SELECT COUNT(*) FROM complaints 
          WHERE assigned_to = u.id AND status = 'Resolved'
        ) +
        (
          SELECT COUNT(*) FROM violations 
          WHERE assigned_to = u.id AND status = 'Resolved'
        ) AS completed_tasks,

        (
          SELECT COUNT(*) FROM complaints 
          WHERE assigned_to = u.id AND status != 'Resolved'
        ) +
        (
          SELECT COUNT(*) FROM violations 
          WHERE assigned_to = u.id AND status != 'Resolved'
        ) AS pending_tasks

      FROM users u
      WHERE u.role = 'department'
    `);

    let departments = rows.map(dep => {
      const total = parseInt(dep.total_tasks);
      const completed = parseInt(dep.completed_tasks);

      return {
        ...dep,
        total_tasks: total,
        completed_tasks: completed,
        pending_tasks: parseInt(dep.pending_tasks),
        performance: total > 0 ? Math.round((completed / total) * 100) : 0,
        lead_name: null   // explicitly null
      };
    });

    if (isDept) {
      departments = departments.filter(d => d.id == id);
    }

    /* ===========================
       🔥 RANKING
    =========================== */
    departments.sort((a, b) => b.performance - a.performance);

    const rankedDepartments = departments.map((d, i) => ({
      ...d,
      rank: i + 1
    }));

    /* ===========================
       📊 SUMMARY
    =========================== */
    const summary = await db.query(`
      SELECT 
        COUNT(*) AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved_tasks,
        COUNT(*) FILTER (WHERE status != 'Resolved') AS pending_tasks
      FROM (
        SELECT status FROM complaints ${isDept ? "WHERE assigned_to = $1" : ""}
        UNION ALL
        SELECT status FROM violations ${isDept ? "WHERE assigned_to = $1" : ""}
      ) t
    `, isDept ? [id] : []);

    const overdue = await db.query(`
      SELECT COUNT(*) FROM (
        SELECT deadline, status FROM complaints ${isDept ? "WHERE assigned_to = $1" : ""}
        UNION ALL
        SELECT deadline, status FROM violations ${isDept ? "WHERE assigned_to = $1" : ""}
      ) t
      WHERE deadline < NOW() AND status != 'Resolved'
    `, isDept ? [id] : []);

    const summaryCards = {
      total_tasks: parseInt(summary.rows[0].total_tasks || 0),
      resolved_tasks: parseInt(summary.rows[0].resolved_tasks || 0),
      pending_tasks: parseInt(summary.rows[0].pending_tasks || 0),
      overdue_tasks: parseInt(overdue.rows[0].count || 0)
    };

    /* ===========================
       🥧 PIE CHART
    =========================== */
    const pieChart = [
      { name: "Resolved", value: summaryCards.resolved_tasks },
      { name: "Pending", value: summaryCards.pending_tasks }
    ];

    /* ===========================
       📈 TREND
    =========================== */
    const trend = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE status = 'Resolved') as resolved,
        COUNT(*) FILTER (WHERE status != 'Resolved') as pending
      FROM (
        SELECT created_at, status FROM complaints ${isDept ? "WHERE assigned_to = $1" : ""}
        UNION ALL
        SELECT created_at, status FROM violations ${isDept ? "WHERE assigned_to = $1" : ""}
      ) t
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, isDept ? [id] : []);

    /* ===========================
       🔥 INSIGHTS
    =========================== */
    const topPerformer = rankedDepartments[0] || null;
    const worstPerformer = rankedDepartments[rankedDepartments.length - 1] || null;
    const mostLoaded = [...departments]
      .sort((a, b) => b.total_tasks - a.total_tasks)[0] || null;

    /* ===========================
       🔥 LOGGING
    =========================== */
    if (adminId) {
      const message = isDept
        ? `Admin viewed performance dashboard of department ID ${id}`
        : "Admin viewed global performance dashboard";

      await db.query(`
        INSERT INTO admin_logs (action, message, performed_by)
        VALUES ($1,$2,$3)
      `, [
        isDept ? "VIEW_DEPT_PERFORMANCE" : "VIEW_GLOBAL_PERFORMANCE",
        message,
        adminId
      ]);
    }

    /* ===========================
       📤 RESPONSE
    =========================== */
    res.json({
      summaryCards,
      departments: rankedDepartments,
      pieChart,
      trend: trend.rows,
      insights: {
        topPerformer,
        worstPerformer,
        mostLoaded
      }
    });

  } catch (err) {
    console.error("❌ Performance Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};