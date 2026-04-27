import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { createNotification } from "./notification.controller.js";
import nodemailer from "nodemailer";

/* ==============================
   📧 EMAIL TRANSPORTER
============================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ==============================
   REGISTER
============================== */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR phone=$2",
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users(name,email,password,phone,role,status)
       VALUES($1,$2,$3,$4,'user','active')
       RETURNING id,name,email,phone,role`,
      [name, email, hashedPassword, phone]
    );

    const user = newUser.rows[0];

    /* 🔔 In-app notification */
    await createNotification(
      user.id,
      "Welcome 🎉",
      "Your account has been successfully created."
    );

    /* 📧 Email notification */
    await transporter.sendMail({
      from: `"Praja Setu" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Welcome to Praja Setu 🎉",
      html: `
        <h3>Hello ${user.name},</h3>
        <p>Your account has been successfully created.</p>
        <p>You can now start reporting issues and tracking them.</p>
      `
    });

    res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ==============================
   LOGIN
============================== */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (user.is_blocked) {
      return res.status(403).json({
        message: "🚫 Your account is blocked by admin"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      userId: user.id
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};