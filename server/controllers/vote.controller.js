import pool from "../config/db.js";

/* =========================
   VOTE FOR COMPLAINT
========================= */
export const voteComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const complaintId = req.params.id;

    // check already voted
    const existing = await pool.query(
      "SELECT * FROM votes WHERE user_id=$1 AND complaint_id=$2",
      [userId, complaintId]
    );

    if (existing.rows.length > 0) {
      // remove vote (toggle)
      await pool.query(
        "DELETE FROM votes WHERE user_id=$1 AND complaint_id=$2",
        [userId, complaintId]
      );

      return res.json({ message: "Vote removed" });
    }

    await pool.query(
      "INSERT INTO votes (user_id, complaint_id) VALUES ($1,$2)",
      [userId, complaintId]
    );

    res.json({ message: "Voted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   VOTE FOR VIOLATION
========================= */
export const voteViolation = async (req, res) => {
  try {
    const userId = req.user.id;
    const violationId = req.params.id;

    const existing = await pool.query(
      "SELECT * FROM votes WHERE user_id=$1 AND violation_id=$2",
      [userId, violationId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "DELETE FROM votes WHERE user_id=$1 AND violation_id=$2",
        [userId, violationId]
      );

      return res.json({ message: "Vote removed" });
    }

    await pool.query(
      "INSERT INTO votes (user_id, violation_id) VALUES ($1,$2)",
      [userId, violationId]
    );

    res.json({ message: "Voted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};