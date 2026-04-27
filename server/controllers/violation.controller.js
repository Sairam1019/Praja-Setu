import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const VALID_STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];

/* =========================
   CREATE VIOLATION 🚨 FINAL (FIXED)
========================= */
export const createViolation = async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, address } = req.body;
    const userId = req.user.id;

    if (!title || !description || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    /* =========================
       1️⃣ UPLOAD MEDIA
    ========================= */
    if (!req.file) {
      return res.status(400).json({ message: "Evidence file required" });
    }

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

    const mediaUrl = uploadResult.secure_url;
    const mediaType = uploadResult.resource_type === "video" ? "video" : "image";

    /* =========================
       2️⃣ FETCH EXISTING HASHES
    ========================= */
    const existing = await pool.query(`
      SELECT media_hash FROM violations
      WHERE media_hash IS NOT NULL
      LIMIT 100
    `);

    const existingHashes = existing.rows
      .map(v => {
        if (!v.media_hash) return null;

        try {
          const parsed = JSON.parse(v.media_hash);

          if (Array.isArray(parsed)) return parsed[0];
          if (typeof parsed === "object") return parsed.hash;

          return parsed;
        } catch {
          return v.media_hash;
        }
      })
      .filter(Boolean);

    /* =========================
       3️⃣ CALL ML SERVICE
    ========================= */
    let mlData = {
      duplicate: false,
      is_spam: false,
      media_hash: null,
      media_match: false,
      text_similarity: 0
    };

    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

try {
  const mlResponse = await fetch(`${ML_SERVICE_URL}/predict-full`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description,
      existing_texts: [],
      existing_hashes: existingHashes,
      uploaded_media_url: mediaUrl,
      media_type: mediaType
    }),
  });

  if (mlResponse.ok) {
    mlData = await mlResponse.json();
  }
} catch (err) {
  console.error("ML ERROR:", err.message);
}

    console.log("🧠 ML RESULT:", mlData);

    /* =========================
       🔥 FINAL DUPLICATE LOGIC
    ========================= */
    let isDuplicate = false;

    // 🚨 RULE 1: EXACT HASH MATCH
    if (mlData.media_hash && existingHashes.includes(mlData.media_hash)) {
      console.log("🔥 EXACT HASH MATCH DETECTED");
      isDuplicate = true;
    }

    // 🚨 RULE 2: ML MEDIA MATCH
    if (mlData.media_match === true) {
      console.log("🔥 ML MEDIA MATCH");
      isDuplicate = true;
    }

    // 🧠 RULE 3: TEXT SIMILARITY (fallback)
    if (mlData.text_similarity > 0.85) {
      console.log("🧠 TEXT DUPLICATE");
      isDuplicate = true;
    }

    /* =========================
       SAVE HASH
    ========================= */
    const finalHash = mlData.media_hash
      ? JSON.stringify(mlData.media_hash)
      : null;

    /* =========================
       4️⃣ INSERT INTO DB
    ========================= */
    const result = await pool.query(
      `
      INSERT INTO violations 
      (
        user_id,
        title,
        category,
        description,
        image_url,
        status,
        priority,
        media_hash,
        is_duplicate,
        is_spam,
        address,
        location
      )
      VALUES ($1,$2,$3,$4,$5,'Pending','Low',$6,$7,$8,$9,
        ST_SetSRID(ST_MakePoint($10,$11),4326)
      )
      RETURNING *
      `,
      [
        userId,
        title,
        category || "manual",
        description,
        mediaUrl,
        finalHash,
        isDuplicate,
        mlData.is_spam || false,
        address || null,
        Number(longitude),
        Number(latitude)
      ]
    );

    res.json({
      message: "Violation reported successfully",
      duplicate: isDuplicate,
      violation: result.rows[0],
      ml: mlData
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET ALL VIOLATIONS
========================= */
export const getAllViolations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.*,
        u.name AS reported_by_name,
        u.email AS reported_by_email,

        COUNT(vt.id) AS vote_count,

        ST_X(v.location::geometry) AS lng,
        ST_Y(v.location::geometry) AS lat

      FROM violations v

      LEFT JOIN users u 
        ON v.user_id = u.id

      LEFT JOIN votes vt 
        ON v.id = vt.violation_id

      GROUP BY v.id, u.name, u.email

      ORDER BY v.created_at DESC
    `);

    res.json(
      result.rows.map((v) => ({
        ...v,
        type: "violation",

        reportedBy: {
          name: v.reported_by_name,
          email: v.reported_by_email
        }
      }))
    );

  } catch (err) {
    console.error("❌ Violation Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE STATUS
========================= */
export const updateViolationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await pool.query(
      `UPDATE violations SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ message: "Violation not found" });
    }

    res.json(updated.rows[0]);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE VIOLATION
========================= */
export const deleteViolation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM violations WHERE id=$1 RETURNING id`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Violation not found" });
    }

    res.json({ message: "Violation deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   🔥 AI ENHANCEMENT (IMPROVED)
========================= */
export const enhanceText = async (req, res) => {
  try {
    const { text, category = "general" } = req.body;

    if (!text || text.length > 2000) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const prompt = `
Rewrite the user's complaint in a clear and slightly descriptive way.

Keep it:
- natural and human-like (not too formal)
- easy to understand
- slightly expanded for clarity
- one short paragraph

Do NOT:
- make it sound like an official report
- use complex or technical words
- change the original meaning

Category: ${category}
User Input: "${text}"
`;
    const ai = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 400
    });

    const enhancedText = ai.choices[0].message.content.trim();

    let severity = "LOW";
    if (enhancedText.toLowerCase().includes("danger") || enhancedText.toLowerCase().includes("hazard")) {
      severity = "HIGH";
    } else if (enhancedText.toLowerCase().includes("risk")) {
      severity = "MEDIUM";
    }

    res.json({ enhancedText, severity });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI enhancement failed" });
  }
};