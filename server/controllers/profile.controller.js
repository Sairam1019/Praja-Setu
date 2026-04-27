import pool from "../config/db.js";

/* =========================================================
   👤 GET PROFILE DATA (FINAL UPDATED)
========================================================= */
export const getProfileData = async (req, res) => {
  try {
    const userId = req.user.id;

    /* =========================
       USER INFO
    ========================= */
    const userResult = await pool.query(
      `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    /* =========================
       COMPLAINT STATS
    ========================= */
    const complaintStats = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress
      FROM complaints
      WHERE user_id = $1
      `,
      [userId]
    );

    /* =========================
       VIOLATION STATS (FIXED)
    ========================= */
    const violationStats = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'Resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress
      FROM violations
      WHERE user_id = $1
      `,
      [userId]
    );

    /* =========================
       VOTES
    ========================= */
    const votesResult = await pool.query(
      `SELECT COUNT(*) FROM votes WHERE user_id = $1`,
      [userId]
    );

    /* =========================
       RECENT COMPLAINTS
    ========================= */
    const complaintsResult = await pool.query(
      `
      SELECT 
        id,
        title,
        category,
        status,
        image_url,
        created_at
      FROM complaints
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [userId]
    );

    /* =========================
       RECENT VIOLATIONS (FIXED)
    ========================= */
    const violationsResult = await pool.query(
      `
      SELECT 
        id,
        title,
        category,
        status,
        image_url,
        created_at
      FROM violations
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [userId]
    );

    /* =========================
       FORMAT RESPONSE (IMPROVED)
    ========================= */
    const response = {
      success: true,

      user,

      stats: {
        complaints: {
          total: Number(complaintStats.rows[0].total || 0),
          pending: Number(complaintStats.rows[0].pending || 0),
          resolved: Number(complaintStats.rows[0].resolved || 0),
          inProgress: Number(complaintStats.rows[0].in_progress || 0)
        },

        violations: {
          total: Number(violationStats.rows[0].total || 0),
          pending: Number(violationStats.rows[0].pending || 0),
          resolved: Number(violationStats.rows[0].resolved || 0),
          inProgress: Number(violationStats.rows[0].in_progress || 0)
        },

        // 🔥 Combined (NEW – useful for frontend cards)
        overall: {
          total:
            Number(complaintStats.rows[0].total || 0) +
            Number(violationStats.rows[0].total || 0),

          pending:
            Number(complaintStats.rows[0].pending || 0) +
            Number(violationStats.rows[0].pending || 0),

          resolved:
            Number(complaintStats.rows[0].resolved || 0) +
            Number(violationStats.rows[0].resolved || 0),

          inProgress:
            Number(complaintStats.rows[0].in_progress || 0) +
            Number(violationStats.rows[0].in_progress || 0)
        },

        totalVotes: Number(votesResult.rows[0].count || 0)
      },

      complaints: complaintsResult.rows,
      violations: violationsResult.rows
    };

    res.json(response);

  } catch (error) {
    console.error("❌ PROFILE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};