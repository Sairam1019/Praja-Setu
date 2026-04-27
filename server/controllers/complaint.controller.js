import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const VALID_STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];

/* =========================================================
   🚀 CREATE COMPLAINT (FINAL ENTERPRISE VERSION)
========================================================= */
export const createComplaint = async (req, res) => {
  try {
    const { title, description, latitude, longitude, address } = req.body;
    const userId = req.user.id;

    if (!description || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let mediaUrl = null;
    let mediaType = null;

    /* =========================
       📤 UPLOAD MEDIA
    ========================= */
    if (req.file) {
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

      mediaUrl = uploadResult.secure_url;
      mediaType =
        uploadResult.resource_type === "video" ? "video" : "image";
    }

    /* =========================
       📍 FETCH NEARBY
    ========================= */
    const nearby = await pool.query(
      `
      SELECT description, media_hash, created_at,
      ST_Distance(location, ST_SetSRID(ST_MakePoint($1,$2),4326)) AS distance
      FROM complaints
      WHERE location IS NOT NULL
      ORDER BY distance ASC
      LIMIT 20
      `,
      [Number(longitude), Number(latitude)]
    );

    const nearbyComplaints = nearby.rows.filter(
      (c) =>
        c.distance < 200 &&
        new Date(c.created_at) < new Date(Date.now() - 3000)
    );

    /* =========================
       🔑 HASH EXTRACTION
    ========================= */
    const existingHashes = nearbyComplaints
      .map((c) => {
        if (!c.media_hash) return null;
        try {
          const parsed = JSON.parse(c.media_hash);
          if (Array.isArray(parsed)) return parsed[0];
          if (typeof parsed === "object") return parsed.hash;
          return parsed;
        } catch {
          return c.media_hash;
        }
      })
      .filter(Boolean);

    const uniqueHashes = [...new Set(existingHashes)];

    /* =========================
       🤖 ML CALL
    ========================= */
    let mlData = {
      category: "general",
      is_spam: false,
      text_similarity: 0,
      media_match: false,
      media_hash: null,
    };

    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:5001";

try {
  const mlResponse = await fetch(
    `${ML_SERVICE_URL}/predict-full`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        existing_texts: nearbyComplaints.map((c) => c.description),
        existing_hashes: uniqueHashes,
        uploaded_media_url: mediaUrl,
        media_type: mediaType,
        distance_ok: nearbyComplaints.length > 0,
      }),
    }
  );

  if (mlResponse.ok) {
    mlData = await mlResponse.json();
  }
} catch (err) {
  console.error("ML ERROR:", err.message);
}
    /* =========================
       🔥 DUPLICATE LOGIC (FINAL)
    ========================= */
    let isDuplicate = false;
    let duplicateReason = null;

    if (mlData.media_hash && uniqueHashes.includes(mlData.media_hash)) {
      isDuplicate = true;
      duplicateReason = "SAME_MEDIA";
    } else if (mlData.media_match) {
      isDuplicate = true;
      duplicateReason = "MEDIA_SIMILARITY";
    } else if (mlData.text_similarity > 0.85) {
      isDuplicate = true;
      duplicateReason = "TEXT_SIMILARITY";
    }

    const confidence = isDuplicate
      ? duplicateReason === "SAME_MEDIA"
        ? 95
        : duplicateReason === "MEDIA_SIMILARITY"
        ? 85
        : 70
      : 10;

    const finalHash = mlData.media_hash
      ? JSON.stringify(mlData.media_hash)
      : null;

    /* =========================
       💾 INSERT
    ========================= */
    const result = await pool.query(
      `
      INSERT INTO complaints 
      (
        user_id, title, description, image_url, category,
        status, priority_score, hotspot_score, priority,
        is_duplicate, is_spam, media_hash, address, location
      )
      VALUES (
        $1,$2,$3,$4,$5,
        'Pending',0,0,'Low',
        $6,$7,$8,$9,
        ST_SetSRID(ST_MakePoint($10,$11),4326)
      )
      RETURNING *
      `,
      [
        userId,
        title || "No title",
        description,
        mediaUrl,
        mlData.category,
        isDuplicate,
        mlData.is_spam,
        finalHash,
        address || null,
        Number(longitude),
        Number(latitude),
      ]
    );

    const complaint = result.rows[0];

    /* =========================
       📦 RESPONSE (FRONTEND READY)
    ========================= */
    res.json({
      success: true,
      message: "Complaint submitted successfully",

      data: {
        id: complaint.id,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        type: "complaint",
        status: complaint.status,
        address: complaint.address,
        created_at: complaint.created_at,
      },

      analysis: {
        isDuplicate,
        duplicateReason,
        confidence,
        isSpam: mlData.is_spam,
      },

      media: {
        url: mediaUrl,
        type: mediaType,
      },
    });
  } catch (err) {
    console.error("❌ CREATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   📋 GET ALL COMPLAINTS
========================================================= */
export const getAllComplaints = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        u.name AS reported_by_name,
        u.email AS reported_by_email,

        COUNT(v.id) AS vote_count,

        ST_X(c.location::geometry) AS lng,
        ST_Y(c.location::geometry) AS lat

      FROM complaints c

      LEFT JOIN users u 
        ON c.user_id = u.id

      LEFT JOIN votes v 
        ON c.id = v.complaint_id

      GROUP BY c.id, u.name, u.email

      ORDER BY c.created_at DESC
    `);

    res.json(
      result.rows.map((c) => ({
        ...c,
        type: "complaint",

        reportedBy: {
          name: c.reported_by_name,
          email: c.reported_by_email
        }
      }))
    );

  } catch (err) {
    console.error("❌ Complaint Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   🔄 UPDATE STATUS
========================================================= */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await pool.query(
      `UPDATE complaints SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );

    if (!updated.rows.length) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
   🤖 ENHANCE DESCRIPTION (SMART + NATURAL VERSION)
========================================================= */
export const enhanceComplaintDescription = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT description FROM complaints WHERE id=$1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const originalText = rows[0].description;

    const ai = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content: `
You are an assistant that improves user-written complaints for a civic platform.

Your goal:
- Rewrite the complaint in a clearer and slightly more descriptive way
- Keep the tone natural and human (like how a person would normally speak)
- Add a bit of context or impact only if it feels natural
- Keep it short and easy to understand
- Return ONLY one paragraph

Important:
- Do NOT make it sound like an official report
- Do NOT use formal or complex words
- Do NOT add greetings or endings
- Do NOT change the original meaning
- Do NOT exaggerate urgency

The output should feel like the same person wrote it, just better.
`
    },
    {
      role: "user",
      content: originalText
    }
  ],
  temperature: 0.6,
  max_tokens: 200
});

    const enhancedText = ai.choices[0].message.content.trim();

    await pool.query(
      `UPDATE complaints SET description=$1 WHERE id=$2`,
      [enhancedText, id]
    );

    res.json({
      success: true,
      enhancedDescription: enhancedText
    });

  } catch (err) {
    console.error("Enhance error:", err);
    res.status(500).json({ error: "AI enhancement failed" });
  }
};



/* =========================================================
   🤖 GENERIC ENHANCE TEXT (FOR NEW INPUT)
========================================================= */
export const enhanceText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.length > 2000) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const ai = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are a civic complaint assistant.

Rewrite the text:
- Make it clear and detailed
- Add context and impact
- Add urgency if needed
- Keep it as ONE paragraph
- DO NOT use letter format
- DO NOT add greetings or endings
- DO NOT use bullet points
- Keep it natural and realistic
`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const enhancedText = ai.choices[0].message.content.trim();

    res.json({
      success: true,
      enhancedText
    });

  } catch (err) {
    console.error("Enhance error:", err);
    res.status(500).json({ error: "AI enhancement failed" });
  }
};