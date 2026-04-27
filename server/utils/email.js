import nodemailer from "nodemailer";

/* =========================================================
   📧 TRANSPORTER
========================================================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================================================
   📧 SEND EMAIL
========================================================= */
export const sendEmail = async (to, subject, html) => {
  try {
    console.log("📧 Sending email to:", to);
    if (!to) return;

    await transporter.sendMail({
      from: `"Praja Setu" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", to);

  } catch (err) {
    console.error("❌ Email Error:", err.message);
  }
};
