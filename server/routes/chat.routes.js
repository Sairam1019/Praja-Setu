import express from "express";
import { chatHandler } from "../controllers/chatController.js";
import pool from "../config/db.js";

const router = express.Router();

// POST /api/chat – handled by controller
router.post("/chat", chatHandler);

// GET /api/chat/:userId – get conversation history
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await pool.query(
      "SELECT * FROM chat_history WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );
    res.json(data.rows);
  } catch (err) {
    console.error("GET history error:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// DELETE /api/chat/:userId – clear conversation history
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "DELETE FROM chat_history WHERE user_id = $1",
      [userId]
    );
    res.json({ 
      message: "Chat history deleted",
      deletedCount: result.rowCount 
    });
  } catch (err) {
    console.error("DELETE history error:", err);
    res.status(500).json({ error: "Failed to delete chat history" });
  }
});

export default router;  // ✅ ES module default export