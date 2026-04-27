import db from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { io } from "../server.js";
import { sendEmail } from "../utils/email.js";
import OpenAI from "openai";

// Initialize Groq client (OpenAI-compatible)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/* =========================================================
   📋 GET ASSIGNED TASKS
========================================================= */
export const getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter } = req.query;

    const complaints = await db.query(`
      SELECT 
        id, user_id, title, description, image_url,
        category, status, priority, priority_score,
        is_duplicate, is_spam, manual_urgent,
        address, location,
        deadline, completed_at, created_at,
        hotspot_score,
        'complaint' AS type
      FROM complaints
      WHERE assigned_to = $1
    `, [userId]);

    const violations = await db.query(`
      SELECT 
        id, user_id, title, description, image_url,
        category, status, priority, priority_score,
        is_duplicate, is_spam, manual_urgent,
        address, location,
        deadline, completed_at, created_at,
        hotspot_score,
        'violation' AS type
      FROM violations
      WHERE assigned_to = $1
    `, [userId]);

    let tasks = [...complaints.rows, ...violations.rows];

    if (filter === "spam") tasks = tasks.filter(t => t.is_spam);
    else if (filter === "duplicate") tasks = tasks.filter(t => t.is_duplicate);
    else if (filter === "legit") tasks = tasks.filter(t => !t.is_spam && !t.is_duplicate);
    else if (filter === "urgent") tasks = tasks.filter(t => t.manual_urgent);
    else if (filter === "overdue") tasks = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date());

    tasks = tasks.map(t => ({
      ...t,
      isOverdue: t.deadline && new Date(t.deadline) < new Date(),
      isUrgent: t.manual_urgent,
      location: t.location ? { lat: t.location.y, lng: t.location.x } : null
    }));

    tasks.sort((a, b) => {
      if (b.isUrgent !== a.isUrgent) return b.isUrgent - a.isUrgent;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json({ tasks });
  } catch (err) {
    console.error("❌ getAssignedTasks:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   🔍 GET TASK DETAIL (with hasProof)
========================================================= */
export const getTaskDetail = async (req, res) => {
  try {
    const { id, type } = req.params;
    const userId = req.user.id;
    const table = type === "complaint" ? "complaints" : "violations";

    const result = await db.query(`
      SELECT * FROM ${table}
      WHERE id = $1 AND assigned_to = $2
    `, [id, userId]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = result.rows[0];

    const proofCheck = await db.query(
      `SELECT id FROM proof_submissions WHERE task_id = $1 AND task_type = $2`,
      [id, type]
    );
    const hasProof = proofCheck.rows.length > 0;

    const logs = await db.query(`
      SELECT action, message, created_at
      FROM task_logs
      WHERE task_id = $1 AND task_type = $2
      ORDER BY created_at DESC
    `, [id, type]);

    res.json({
      ...task,
      type,
      logs: logs.rows,
      location: task.location ? { lat: task.location.y, lng: task.location.x } : null,
      hasProof
    });
  } catch (err) {
    console.error("❌ getTaskDetail:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   🔄 UPDATE TASK STATUS
========================================================= */
export const updateTaskStatus = async (req, res) => {
  try {
    const { id, type, status } = req.body;
    const deptId = req.user.id;

    if (!["complaint", "violation"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const table = type === "complaint" ? "complaints" : "violations";

    const check = await db.query(
      `SELECT user_id, title FROM ${table} WHERE id = $1 AND assigned_to = $2`,
      [id, deptId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Task not found or not assigned to you" });
    }

    const { user_id, title } = check.rows[0];

    await db.query(
      `UPDATE ${table}
       SET status = $1::text,
           completed_at = CASE WHEN $1::text = 'Resolved' THEN NOW() ELSE completed_at END
       WHERE id = $2 AND assigned_to = $3`,
      [status, id, deptId]
    );

    const message = `Task "${title}" updated to ${status}`;

    await db.query(
      `INSERT INTO task_logs (task_id, task_type, action, message, performed_by)
       VALUES ($1, $2, 'STATUS_UPDATE', $3, $4)
       ON CONFLICT (task_id, task_type, message, performed_by) DO NOTHING`,
      [id, type, message, deptId]
    );

    if (user_id) {
      const userRes = await db.query(`SELECT email FROM users WHERE id=$1`, [user_id]);
      const email = userRes.rows[0]?.email;
      await db.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
        [user_id, "Task Update", message]
      );
      io.to(user_id.toString()).emit("notification", { title: "Task Update", message });
      if (email) await sendEmail(email, "Task Updated", `<p>${message}</p>`);
    }

    const admins = await db.query(`SELECT id, email FROM users WHERE role='admin'`);
    for (const admin of admins.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
        [admin.id, "Department Update", message]
      );
      io.to(admin.id.toString()).emit("notification", { title: "Department Update", message });
      if (admin.email) await sendEmail(admin.email, "Department Task Update", `<p>${message}</p>`);
    }

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("❌ updateTaskStatus:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   ❌ REJECT TASK
========================================================= */
export const rejectTask = async (req, res) => {
  try {
    const { id, type, reason } = req.body;
    const deptId = req.user.id;
    const table = type === "complaint" ? "complaints" : "violations";

    const isSpam = reason === "spam";
    const isDuplicate = reason === "duplicate";

    const result = await db.query(
      `UPDATE ${table}
       SET status = 'Rejected'::text,
           is_spam = $1,
           is_duplicate = $2
       WHERE id = $3 AND assigned_to = $4
       RETURNING user_id, title`,
      [isSpam, isDuplicate, id, deptId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Task not found" });
    }

    const { user_id, title } = result.rows[0];
    const message = `Task "${title}" rejected (${reason})`;

    await db.query(
      `INSERT INTO task_logs (task_id, task_type, action, message, performed_by)
       VALUES ($1, $2, 'REJECTED', $3, $4)
       ON CONFLICT (task_id, task_type, message, performed_by) DO NOTHING`,
      [id, type, message, deptId]
    );

    if (user_id) {
      const userRes = await db.query(`SELECT email FROM users WHERE id=$1`, [user_id]);
      const email = userRes.rows[0]?.email;
      await db.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
        [user_id, "Task Rejected", message]
      );
      io.to(user_id.toString()).emit("notification", { title: "Task Rejected", message });
      if (email) await sendEmail(email, "Task Rejected", `<p>${message}</p>`);
    }

    res.json({ message: "Task rejected" });
  } catch (err) {
    console.error("❌ rejectTask:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   📝 ADD REMARK
========================================================= */
export const addTaskRemark = async (req, res) => {
  try {
    const { id, type, remark } = req.body;
    const userId = req.user.id;

    await db.query(
      `INSERT INTO task_logs (task_id, task_type, action, message, performed_by)
       VALUES ($1, $2, 'REMARK', $3, $4)
       ON CONFLICT (task_id, task_type, message, performed_by) DO NOTHING`,
      [id, type, remark, userId]
    );

    res.json({ message: "Remark added" });
  } catch (err) {
    console.error("❌ addTaskRemark:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   📸 SUBMIT PROOF
========================================================= */
export const submitProof = async (req, res) => {
  try {
    const { taskId, taskType, title, description, latitude, longitude, address } = req.body;
    const deptId = req.user.id;

    if (!taskId || !taskType || !title || !description || !req.file) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!["complaint", "violation"].includes(taskType)) {
      return res.status(400).json({ message: "Invalid task type" });
    }

    const table = taskType === "complaint" ? "complaints" : "violations";

    const taskCheck = await db.query(
      `SELECT user_id, title FROM ${table} WHERE id = $1 AND assigned_to = $2 AND status = 'Resolved'`,
      [taskId, deptId]
    );
    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ message: "Task not found, not assigned to you, or not resolved" });
    }

    const existingProof = await db.query(
      `SELECT id FROM proof_submissions WHERE task_id = $1 AND task_type = $2`,
      [taskId, taskType]
    );
    if (existingProof.rows.length > 0) {
      return res.status(400).json({ message: "Proof already submitted for this task. Only one proof allowed." });
    }

    const { user_id: originalUserId, title: taskTitle } = taskCheck.rows[0];

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const imageUrl = uploadResult.secure_url;

    const proofResult = await db.query(
      `INSERT INTO proof_submissions 
       (task_id, task_type, title, description, image_url, latitude, longitude, address, submitted_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [taskId, taskType, title, description, imageUrl, latitude || null, longitude || null, address || null, deptId]
    );
    const proofId = proofResult.rows[0].id;
    const proofMessage = `Proof submitted for task "${taskTitle}" (ID: ${taskId})`;

    await db.query(
      `INSERT INTO task_logs (task_id, task_type, action, message, performed_by)
       VALUES ($1, $2, 'PROOF_SUBMITTED', $3, $4)
       ON CONFLICT DO NOTHING`,
      [taskId, taskType, proofMessage, deptId]
    );

    if (originalUserId) {
      const userRes = await db.query(`SELECT email FROM users WHERE id = $1`, [originalUserId]);
      const email = userRes.rows[0]?.email;
      await db.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
        [originalUserId, "Proof Submitted", proofMessage]
      );
      io.to(originalUserId.toString()).emit("notification", { title: "Proof Submitted", message: proofMessage });
      if (email) await sendEmail(email, "Proof Submitted for Your Issue", `<p>${proofMessage}</p>`);
    }

    const admins = await db.query(`SELECT id, email FROM users WHERE role = 'admin'`);
    for (const admin of admins.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
        [admin.id, "New Proof Submitted", proofMessage]
      );
      io.to(admin.id.toString()).emit("notification", { title: "New Proof Submitted", message: proofMessage });
      if (admin.email) await sendEmail(admin.email, "Department Task Proof", `<p>${proofMessage}</p>`);
    }

    res.status(201).json({ message: "Proof submitted successfully", proofId, imageUrl });
  } catch (err) {
    console.error("❌ submitProof:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   🤖 ADVANCED AI TASK REVIEW
========================================================= */
/* =========================================================
   🤖 PRO AI TASK REVIEW (SMART + SAFE + SCALABLE)
========================================================= */
export const aiTaskReview = async (req, res) => {
  try {
    const { taskId, type } = req.body;

    if (!taskId || !type) {
      return res.status(400).json({ message: "Task ID and type are required" });
    }
    if (!["complaint", "violation"].includes(type)) {
      return res.status(400).json({ message: "Invalid task type" });
    }

    const table = type === "complaint" ? "complaints" : "violations";

    // =============================================
    // 1. FETCH TASK
    // =============================================
    const result = await db.query(`SELECT * FROM ${table} WHERE id = $1`, [taskId]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = result.rows[0];

    // =============================================
    // 2. BUILD AI INPUT (CLEAN + SAFE)
    // =============================================
    const excludeFields = new Set(["id", "image_data", "video_data", "password_hash"]);

    const taskFields = Object.entries(task)
      .filter(([key, value]) => !excludeFields.has(key) && value != null && value !== "")
      .map(([key, value]) => {
        const safeValue =
          typeof value === "string"
            ? value.replace(/\s+/g, " ").slice(0, 1500)
            : String(value);
        return `${key}: ${safeValue}`;
      })
      .join("\n");

    // =============================================
    // 3. SYSTEM FLAGS (PRE-AI SIGNALS)
    // =============================================
    let flags = [];

    if (task.is_spam) flags.push("SPAM_DB_FLAG");
    if (task.is_duplicate) flags.push("DUPLICATE_DB_FLAG");
    if (!task.image_url && !task.media_url) flags.push("NO_MEDIA");
    if (!task.description || task.description.length < 15) flags.push("WEAK_DESCRIPTION");
    if (task.description && task.description.length > 500) flags.push("VERY_LONG_DESCRIPTION");
    if (task.priority === "HIGH") flags.push("MANUAL_HIGH_PRIORITY");

    const isOld = task.created_at && (Date.now() - new Date(task.created_at)) > 7 * 24 * 3600000;
    if (isOld) flags.push("OLD_TASK");

    // =============================================
    // 4. AI CALL (STRICT + RICH OUTPUT)
    // =============================================
    const ai = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert civic issue analyst. Return STRICT JSON only:

{
  "decision": "APPROVE | REJECT | REVIEW",
  "confidence": 0-100,
  "risk_score": 0-100,
  "urgency_score": 0-100,
  "priority": "LOW | MEDIUM | HIGH",
  "sentiment": "POSITIVE | NEUTRAL | NEGATIVE | URGENT",
  "suggested_department": "Roads | Drainage | Electricity | Garbage | Police | Other",
  "key_concerns": ["..."],
  "recommended_action": "...",
  "flags": ["..."],
  "reason": "...",
  "suggested_tags": ["#tag"],
  "estimated_severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "legal_implication": "NONE | MINOR | MODERATE | SEVERE",
  "community_impact_scale": 0-100
}

Rules:
- Reject if spam/duplicate or nonsense
- Urgency HIGH for safety risks
- Add meaningful tags (not generic)
- Keep JSON valid (no markdown)
- Confidence realistic (not always 100)`
        },
        {
          role: "user",
          content: `Task Data:\n${taskFields}\n\nSystem Flags: ${flags.join(", ") || "None"}`
        }
      ],
      temperature: 0.15,
      max_tokens: 600
    });

    // =============================================
    // 5. SAFE PARSE (CRITICAL)
    // =============================================
    let parsedAI;

    try {
      let content = ai.choices[0].message.content;
      content = content.replace(/```json|```/g, "").trim();
      parsedAI = JSON.parse(content);
    } catch (err) {
      console.error("AI Parse Error:", err);

      parsedAI = {
        decision: "REVIEW",
        confidence: 40,
        risk_score: 50,
        urgency_score: 50,
        priority: "MEDIUM",
        sentiment: "NEUTRAL",
        suggested_department: "Other",
        key_concerns: ["AI_PARSE_ERROR"],
        recommended_action: "Manual review required",
        flags: ["AI_PARSE_ERROR"],
        reason: "AI response parsing failed",
        suggested_tags: [],
        estimated_severity: "MEDIUM",
        legal_implication: "NONE",
        community_impact_scale: 50
      };
    }

    // =============================================
    // 6. POST-AI VALIDATION (PRO LEVEL 🔥)
    // =============================================
    parsedAI.confidence = Math.min(Math.max(parsedAI.confidence || 50, 0), 100);
    parsedAI.risk_score = Math.min(Math.max(parsedAI.risk_score || 50, 0), 100);
    parsedAI.urgency_score = Math.min(Math.max(parsedAI.urgency_score || 50, 0), 100);

    if (!Array.isArray(parsedAI.suggested_tags)) parsedAI.suggested_tags = [];

    // Boost urgency if dangerous keywords exist
    const dangerKeywords = ["pothole", "accident", "fire", "collapse", "live wire"];
    if (dangerKeywords.some(k => (task.description || "").toLowerCase().includes(k))) {
      parsedAI.urgency_score = Math.max(parsedAI.urgency_score, 85);
      parsedAI.priority = "HIGH";
    }

    // =============================================
    // 7. SMART AUTO ACTION (NOT JUST CONFIDENCE)
    // =============================================
    let autoAction = null;

    if (parsedAI.decision === "REJECT" && parsedAI.confidence >= 85) {
      autoAction = "AUTO_REJECT";
    }

    if (
      parsedAI.decision === "APPROVE" &&
      parsedAI.confidence >= 85 &&
      parsedAI.risk_score >= 60 &&
      parsedAI.urgency_score >= 70
    ) {
      autoAction = "AUTO_APPROVE";
    }

    // =============================================
    // 8. RESPONSE
    // =============================================
    res.json({
      task_summary: {
        id: task.id,
        title: task.title,
        category: task.category,
        address: task.address
      },
      ai_analysis: parsedAI,
      system_flags: flags,
      autoAction
    });

  } catch (err) {
    console.error("❌ aiTaskReview error:", err);

    res.status(500).json({
      message: "AI service temporarily unavailable",
      ai_analysis: {
        decision: "REVIEW",
        confidence: 30,
        risk_score: 50,
        urgency_score: 50,
        priority: "MEDIUM",
        sentiment: "NEUTRAL",
        suggested_department: "Other",
        key_concerns: ["SYSTEM_ERROR"],
        recommended_action: "Manual review required",
        flags: ["SYSTEM_ERROR"],
        reason: "AI unavailable",
        suggested_tags: [],
        estimated_severity: "MEDIUM",
        legal_implication: "NONE",
        community_impact_scale: 50
      },
      system_flags: [],
      autoAction: null
    });
  }
};