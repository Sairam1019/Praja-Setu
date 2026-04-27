import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,          // ignore self‑signed cert
    checkServerIdentity: () => undefined // skip hostname verification (optional)
  }
});

pool.query("SELECT 1")
  .then(() => console.log("✅ PostgreSQL Connected"))
  .catch(err => console.error("❌ Database Connection Error:", err.message));

export default pool;