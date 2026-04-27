import db from "../config/db.js";

/* =========================================================
   👤 USER – GET ALL RESOLVED TASKS WITH PROOF
   (BEFORE vs AFTER + Department + My Highlight)
========================================================= */
export const getUserResolvedTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT 
        ps.id AS proof_id,
        ps.task_id,
        ps.task_type,

        -- 🟢 PROOF (AFTER)
        ps.title AS proof_title,
        ps.description AS proof_description,
        ps.image_url AS proof_image,
        ps.created_at AS proof_time,
        ps.address AS proof_address,
        ps.latitude,
        ps.longitude,

        -- 👨‍🔧 DEPARTMENT USER
        u.name AS department_name,
        u.email AS department_email,

        -- 🔴 COMPLAINT (BEFORE)
        c.id AS complaint_id,
        c.title AS complaint_title,
        c.description AS complaint_description,
        c.image_url AS complaint_image,
        c.category AS complaint_category,
        c.address AS complaint_address,
        c.created_at AS complaint_created,
        c.user_id AS complaint_user_id,

        -- 🔴 VIOLATION (BEFORE)
        v.id AS violation_id,
        v.title AS violation_title,
        v.description AS violation_description,
        v.image_url AS violation_image,
        v.category AS violation_category,
        v.address AS violation_address,
        v.created_at AS violation_created,
        v.user_id AS violation_user_id

      FROM proof_submissions ps

      LEFT JOIN users u 
        ON ps.submitted_by = u.id

      LEFT JOIN complaints c 
        ON ps.task_type = 'complaint' AND ps.task_id = c.id

      LEFT JOIN violations v 
        ON ps.task_type = 'violation' AND ps.task_id = v.id

      WHERE 
        (ps.task_type = 'complaint' AND LOWER(c.status) = 'resolved')
        OR
        (ps.task_type = 'violation' AND LOWER(v.status) = 'resolved')

      ORDER BY ps.created_at DESC
    `);

    const data = result.rows.map(row => {
      const isComplaint = row.task_type === "complaint";

      // ⭐ Check if this is user's own complaint
      const isMine =
        (isComplaint && row.complaint_user_id === userId) ||
        (!isComplaint && row.violation_user_id === userId);

      return {
        id: row.proof_id,
        task_id: row.task_id,
        task_type: row.task_type,

        /* ================= BEFORE (ORIGINAL TASK) ================= */
        original: {
          title: isComplaint ? row.complaint_title : row.violation_title,
          description: isComplaint ? row.complaint_description : row.violation_description,
          category: isComplaint ? row.complaint_category : row.violation_category,
          image: isComplaint ? row.complaint_image : row.violation_image,
          address: isComplaint ? row.complaint_address : row.violation_address,
          created_at: isComplaint ? row.complaint_created : row.violation_created,
        },

        /* ================= AFTER (PROOF) ================= */
        proof: {
          title: row.proof_title,
          description: row.proof_description,
          image: row.proof_image,
          address: row.proof_address,
          latitude: row.latitude,
          longitude: row.longitude,
          submitted_at: row.proof_time,
        },

        /* ================= DEPARTMENT ================= */
        department: {
          name: row.department_name,
          email: row.department_email,
        },

        /* ================= META ================= */
        isMine
      };
    });

    res.json({
      success: true,
      total: data.length,
      data
    });

  } catch (err) {
    console.error("❌ getUserResolvedTasks:", err);
    res.status(500).json({ message: "Server error" });
  }
};