import pool from "../config/db.js";
import OpenAI from "openai";

// Initialize Groq client (OpenAI-compatible)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const chatHandler = async (req, res) => {
  try {
    const { userId, message } = req.body;

    // Basic validation
    if (!userId || !message || message.length > 500) {
      return res.status(400).json({ error: "Invalid input" });
    }

    let reply = "";
    let route = null;

    // 1. Try keyword match from bot_responses
    const dbRes = await pool.query(
      "SELECT response, route FROM bot_responses WHERE $1 ILIKE '%' || keyword || '%' LIMIT 1",
      [message]
    );

    if (dbRes.rows.length > 0) {
      reply = dbRes.rows[0].response;
      route = dbRes.rows[0].route;
    } else {
      // 2. Fallback to Groq (free & fast)
      const ai = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant", // fast, free model. Alternative: "llama-3.3-70b-versatile" (higher quality, lower daily limit)
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant for a civic complaint platform called Praja Setu. " +
              "Help users report civic issues, track complaints, understand the platform, and navigate the website. " +
              "Keep responses concise and friendly (max 3 sentences).",
          },
          { role: "user", content: message },
        ],
        max_tokens: 300,
      });
      reply = ai.choices[0].message.content;
    }

    // 3. Save conversation history (use transaction)
    await pool.query("BEGIN");
    await pool.query(
      "INSERT INTO chat_history (user_id, message, is_bot) VALUES ($1, $2, $3)",
      [userId, message, false]
    );
    await pool.query(
      "INSERT INTO chat_history (user_id, message, is_bot) VALUES ($1, $2, $3)",
      [userId, reply, true]
    );
    await pool.query("COMMIT");

    res.json({ reply, route });
  } catch (err) {
    console.error("Chat error:", err);
    // Rollback if transaction was started
    try {
      await pool.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }

    // Provide a friendly fallback message (don't expose internal errors)
    res.status(500).json({
      error: "AI service temporarily unavailable",
      reply: "Sorry, I'm having trouble right now. Please try again later.",
    });
  }
};