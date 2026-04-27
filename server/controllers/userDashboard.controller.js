import db from "../config/db.js";

/* =========================================================
   📊 GLOBAL COMPLAINT STATS (ALL USERS)
========================================================= */
export const getComplaintStats = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE LOWER(status) = 'pending') AS pending,
        COUNT(*) FILTER (WHERE LOWER(status) = 'in progress') AS "inProgress"
      FROM complaints
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Complaint stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   📊 GLOBAL VIOLATION STATS (ALL USERS)
========================================================= */
export const getViolationStats = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE LOWER(status) = 'pending') AS pending,
        COUNT(*) FILTER (WHERE LOWER(status) = 'in progress') AS "inProgress"
      FROM violations
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Violation stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   📈 GLOBAL WEEKLY TREND (ALL DATA)
========================================================= */
export const getWeeklyTrend = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        TO_CHAR(date, 'Dy') AS day,
        SUM(complaints) AS complaints,
        SUM(violations) AS violations
      FROM (
        SELECT 
          DATE(created_at) AS date,
          COUNT(*) AS complaints,
          0 AS violations
        FROM complaints
        GROUP BY DATE(created_at)

        UNION ALL

        SELECT 
          DATE(created_at) AS date,
          0 AS complaints,
          COUNT(*) AS violations
        FROM violations
        GROUP BY DATE(created_at)
      ) t
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `);

    res.json({ data: result.rows.reverse() });
  } catch (err) {
    console.error("Trend error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   🧩 GLOBAL STATUS DISTRIBUTION
========================================================= */
export const getStatusDistribution = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT status, COUNT(*) AS value
      FROM (
        SELECT status FROM complaints
        UNION ALL
        SELECT status FROM violations
      ) t
      GROUP BY status
    `);

    const formatted = result.rows.map(r => ({
      name: r.status,
      value: Number(r.value)
    }));

    res.json({ data: formatted });
  } catch (err) {
    console.error("Status distribution error:", err);
    res.status(500).json({ message: "Server error" });
  }
};