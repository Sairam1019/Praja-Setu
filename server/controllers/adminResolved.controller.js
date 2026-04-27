import db from "../config/db.js";

/* =========================================================
   📊 GET ALL RESOLVED TASKS WITH PROOFS (FULL WORKING)
========================================================= */
export const getResolvedWithProofs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        ps.id,
        ps.task_id,
        ps.task_type,
        ps.title AS proof_title,
        ps.description AS proof_description,
        ps.image_url AS proof_image,
        ps.address,
        ps.latitude,
        ps.longitude,
        ps.created_at,

        u.name AS submitted_by_name,

        -- complaint data
        c.title AS complaint_title,
        c.description AS complaint_description,
        c.image_url AS complaint_image,
        c.category AS complaint_category,
        c.status AS complaint_status,

        -- violation data
        v.title AS violation_title,
        v.description AS violation_description,
        v.image_url AS violation_image,
        v.category AS violation_category,
        v.status AS violation_status

      FROM proof_submissions ps

      LEFT JOIN users u 
        ON ps.submitted_by = u.id

      LEFT JOIN complaints c 
        ON ps.task_type = 'complaint' AND ps.task_id = c.id

      LEFT JOIN violations v 
        ON ps.task_type = 'violation' AND ps.task_id = v.id

      WHERE 
        (ps.task_type = 'complaint' AND c.status = 'Resolved')
        OR
        (ps.task_type = 'violation' AND v.status = 'Resolved')

      ORDER BY ps.created_at DESC
    `);

    const tasks = result.rows.map(row => {
      const isComplaint = row.task_type === "complaint";

      return {
        id: row.id,
        task_id: row.task_id,
        task_type: row.task_type,

        // ORIGINAL TASK
        title: isComplaint ? row.complaint_title : row.violation_title,
        description: isComplaint
          ? row.complaint_description
          : row.violation_description,
        category: isComplaint
          ? row.complaint_category
          : row.violation_category,

        image_url: isComplaint
          ? row.complaint_image
          : row.violation_image,

        // PROOF
        proof_title: row.proof_title,
        proof_description: row.proof_description,
        proof_image: row.proof_image,

        // LOCATION
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,

        // META
        submitted_at: row.created_at,
        submitted_by_name: row.submitted_by_name,
      };
    });

    res.json({ tasks });

  } catch (err) {
    console.error("❌ getResolvedWithProofs:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================================
   🔍 GET SINGLE RESOLVED DETAIL (FULL)
========================================================= */
export const getResolvedDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const result = await db.query(`
      SELECT 
        ps.*,

        u.name AS submitted_by_name,

        c.title AS complaint_title,
        c.description AS complaint_description,
        c.image_url AS complaint_image,
        c.category AS complaint_category,

        v.title AS violation_title,
        v.description AS violation_description,
        v.image_url AS violation_image,
        v.category AS violation_category

      FROM proof_submissions ps

      LEFT JOIN users u 
        ON ps.submitted_by = u.id

      LEFT JOIN complaints c 
        ON ps.task_type = 'complaint' AND ps.task_id = c.id

      LEFT JOIN violations v 
        ON ps.task_type = 'violation' AND ps.task_id = v.id

      WHERE ps.id = $1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Not found" });
    }

    const row = result.rows[0];
    const isComplaint = row.task_type === "complaint";

    res.json({
      id: row.id,
      task_id: row.task_id,
      task_type: row.task_type,

      // ORIGINAL TASK
      title: isComplaint ? row.complaint_title : row.violation_title,
      description: isComplaint
        ? row.complaint_description
        : row.violation_description,
      category: isComplaint
        ? row.complaint_category
        : row.violation_category,

      image_url: isComplaint
        ? row.complaint_image
        : row.violation_image,

      // PROOF
      proof_title: row.title,
      proof_description: row.description,
      proof_image: row.image_url,

      // LOCATION
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,

      // META
      submitted_at: row.created_at,
      submitted_by_name: row.submitted_by_name,
    });

  } catch (err) {
    console.error("❌ getResolvedDetail:", err);
    res.status(500).json({ message: "Server error" });
  }
};