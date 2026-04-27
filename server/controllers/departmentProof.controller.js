import db from "../config/db.js";

/* =========================================================
   📸 GET ALL PROOFS (ONLY LOGGED-IN DEPARTMENT USER)
========================================================= */
export const getDepartmentProofs = async (req, res) => {
  try {
    const deptId = req.user.id;

    const result = await db.query(
      `SELECT 
        p.id,
        p.task_id,
        p.task_type,
        p.title,
        p.description,
        p.image_url,
        p.address,
        p.created_at,

        -- Task title + category
        COALESCE(c.title, v.title) AS task_title,
        COALESCE(c.category, v.category) AS category

       FROM proof_submissions p

       LEFT JOIN complaints c 
         ON p.task_type = 'complaint' AND p.task_id = c.id

       LEFT JOIN violations v 
         ON p.task_type = 'violation' AND p.task_id = v.id

       WHERE p.submitted_by = $1

       ORDER BY p.created_at DESC`,
      [deptId]
    );

    res.json({ proofs: result.rows });

  } catch (err) {
    console.error("❌ getDepartmentProofs:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================================
   🔍 GET SINGLE PROOF (ONLY HIS OWN PROOF)
========================================================= */
export const getProofDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deptId = req.user.id;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid proof ID" });
    }

    const result = await db.query(`
      SELECT 
        p.id,
        p.task_id,
        p.task_type,
        p.title AS proof_title,
        p.description AS proof_description,
        p.image_url,
        p.latitude,
        p.longitude,
        p.address,
        p.created_at,

        u.name AS submitted_by_name,

        COALESCE(c.title, v.title) AS task_title,
        COALESCE(c.category, v.category) AS category

      FROM proof_submissions p

      LEFT JOIN users u 
        ON p.submitted_by = u.id

      LEFT JOIN complaints c 
        ON p.task_type = 'complaint' AND p.task_id = c.id

      LEFT JOIN violations v 
        ON p.task_type = 'violation' AND p.task_id = v.id

      WHERE p.id = $1 
      AND p.submitted_by = $2   -- 🔥 SECURITY CHECK
    `, [id, deptId]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Proof not found or access denied" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("❌ getProofDetail:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================================================
   ❌ DELETE PROOF (ONLY HIS OWN)
========================================================= */
export const deleteProof = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deptId = req.user.id;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid proof ID" });
    }

    const result = await db.query(
      `DELETE FROM proof_submissions
       WHERE id = $1 AND submitted_by = $2
       RETURNING id`,
      [id, deptId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Proof not found or not yours" });
    }

    res.json({ message: "Proof deleted successfully" });

  } catch (err) {
    console.error("❌ deleteProof:", err);
    res.status(500).json({ message: "Server error" });
  }
};