import db from "../config/db.js";

/* =========================================================
   📊 GET WORK LOGS (DEPARTMENT USER)
========================================================= */
export const getWorkLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter, search } = req.query;

    let query = `
      SELECT 
        tl.id,
        tl.task_id,
        tl.task_type,
        tl.action,
        tl.message,
        tl.created_at
      FROM task_logs tl
      WHERE tl.performed_by = $1
    `;

    const values = [userId];
    let index = 2;

    /* ===========================
       🔍 FILTER BY ACTION
    =========================== */
    if (filter && filter !== "all") {
      query += ` AND tl.action = $${index}`;
      values.push(filter);
      index++;
    }

    /* ===========================
       🔎 SEARCH (message)
    =========================== */
    if (search) {
      query += ` AND LOWER(tl.message) LIKE $${index}`;
      values.push(`%${search.toLowerCase()}%`);
      index++;
    }

    /* ===========================
       📅 ORDER
    =========================== */
    query += ` ORDER BY tl.created_at DESC LIMIT 200`;

    const { rows } = await db.query(query, values);

    /* ===========================
       📊 STATS (FAST CALCULATION)
    =========================== */
    const stats = {
      total: rows.length,
      resolved: rows.filter(r => r.action === "STATUS_UPDATE").length,
      rejected: rows.filter(r => r.action === "REJECTED").length,
      remarks: rows.filter(r => r.action === "REMARK").length
    };

    /* ===========================
       🧠 SUMMARY
    =========================== */
    const summary = `You performed ${stats.total} actions. 
Resolved: ${stats.resolved}, Rejected: ${stats.rejected}, Remarks: ${stats.remarks}.`;

    res.json({
      logs: rows,
      stats,
      summary
    });

  } catch (err) {
    console.error("❌ getWorkLogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};