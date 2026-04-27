import db from "../config/db.js";

/* =========================================================
   📍 GET USER COMPLAINTS (FULL DETAIL)
========================================================= */
export const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { rows } = await db.query(
      `SELECT 
        c.id,
        c.title,
        c.description,
        c.image_url,
        c.category,
        c.status,
        c.priority,
        c.priority_score,
        c.hotspot_score,
        c.address,
        c.created_at,

        COUNT(v.id) AS vote_count,

        ST_X(c.location::geometry) AS lng,
        ST_Y(c.location::geometry) AS lat

      FROM complaints c
      LEFT JOIN votes v ON c.id = v.complaint_id

      WHERE c.user_id = $1

      GROUP BY c.id
      ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (err) {
    console.error("getMyComplaints:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================================================
   📍 GET USER VIOLATIONS (FULL DETAIL)
========================================================= */
export const getMyViolations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { rows } = await db.query(
      `SELECT 
        v.id,
        v.title,
        v.category,
        v.description,
        v.image_url,
        v.status,
        v.priority,
        v.address,
        v.created_at,

        COALESCE(COUNT(vv.id), 0) AS vote_count,

        ST_X(v.location::geometry) AS lng,
        ST_Y(v.location::geometry) AS lat

      FROM violations v
      LEFT JOIN violation_votes vv ON v.id = vv.violation_id

      WHERE v.user_id = $1

      GROUP BY v.id
      ORDER BY v.created_at DESC`,
      [userId]
    );

    const data = rows.map(v => ({
      ...v,
      type: "violation"
    }));

    res.json({
      success: true,
      count: data.length,
      data
    });

  } catch (err) {
    console.error("getMyViolations:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================================================
   📍 GET TRACK DETAIL (COMPLAINT + VIOLATION)
========================================================= */
export const getTrackingById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { type, id } = req.params;

    if (!userId || !id || !type) {
      return res.status(400).json({
        success: false,
        message: "Invalid request"
      });
    }

    let item = null;
    let timeline = [];

    /* ================= COMPLAINT ================= */
    if (type === "complaints") {

      const { rows } = await db.query(
        `SELECT 
          c.*,
          COUNT(v.id) AS vote_count,
          ST_X(c.location::geometry) AS lng,
          ST_Y(c.location::geometry) AS lat
        FROM complaints c
        LEFT JOIN votes v ON c.id = v.complaint_id
        WHERE c.id = $1 AND c.user_id = $2
        GROUP BY c.id`,
        [id, userId]
      );

      if (!rows.length) {
        return res.status(403).json({
          success: false,
          message: "Not allowed"
        });
      }

      item = rows[0];

      const { rows: t } = await db.query(
        `SELECT 
          status,
          message,
          created_at
         FROM complaint_tracking
         WHERE complaint_id = $1
         ORDER BY created_at ASC`,
        [id]
      );

      timeline = t;

      // fallback if empty
      if (!timeline.length) {
        timeline.push({
          status: "Submitted",
          message: "Complaint created",
          created_at: item.created_at
        });
      }
    }

    /* ================= VIOLATION ================= */
    else if (type === "violations") {

      const { rows } = await db.query(
        `SELECT 
          v.*,
          COALESCE(COUNT(vv.id), 0) AS vote_count,
          ST_X(v.location::geometry) AS lng,
          ST_Y(v.location::geometry) AS lat
        FROM violations v
        LEFT JOIN violation_votes vv ON v.id = vv.violation_id
        WHERE v.id = $1 AND v.user_id = $2
        GROUP BY v.id`,
        [id, userId]
      );

      if (!rows.length) {
        return res.status(403).json({
          success: false,
          message: "Not allowed"
        });
      }

      item = rows[0];

      // Simple timeline – you can create a violation_tracking table later
      timeline = [
        {
          status: item.status,
          message: "Violation reported",
          created_at: item.created_at
        }
      ];
    }

    else {
      return res.status(400).json({
        success: false,
        message: "Invalid type"
      });
    }

    res.json({
      success: true,
      item,
      timeline
    });

  } catch (err) {
    console.error("getTrackingById:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================================================
   📍 UPDATE TRACKING (DEPARTMENT) – NOW SUPPORTS BOTH
========================================================= */
export const updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message, type } = req.body; // added `type`

    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const allowedStatus = [
      "Submitted",
      "Pending",
      "Verified",
      "In Progress",
      "Resolved",
      "Rejected"
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    if (role !== "department" && role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only department/admin allowed"
      });
    }

    // Determine table and tracking table based on type
    let tableName;
    let trackingTable;
    let idColumn;

    if (type === "complaints") {
      tableName = "complaints";
      trackingTable = "complaint_tracking";
      idColumn = "complaint_id";
    } else if (type === "violations") {
      tableName = "violations";
      // You can create `violation_tracking` if needed; for now just update status
      // We'll skip timeline insert for violations (optional)
      trackingTable = null;
      idColumn = "id";
    } else {
      return res.status(400).json({
        success: false,
        message: "Type must be 'complaints' or 'violations'"
      });
    }

    // Check if record exists
    const { rows: exists } = await db.query(
      `SELECT id FROM ${tableName} WHERE id = $1`,
      [id]
    );

    if (!exists.length) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`
      });
    }

    // Update status in main table
    await db.query(
      `UPDATE ${tableName} SET status = $1 WHERE id = $2`,
      [status, id]
    );

    // Insert timeline only for complaints (or if you create violation_tracking)
    if (trackingTable) {
      await db.query(
        `INSERT INTO ${trackingTable}
         (${idColumn}, status, message, updated_by)
         VALUES ($1, $2, $3, $4)`,
        [id, status, message || "", userId]
      );
    }

    res.json({
      success: true,
      message: "Tracking updated successfully"
    });

  } catch (err) {
    console.error("updateTracking:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};