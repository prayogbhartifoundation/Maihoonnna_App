require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL Connection (Supabase — main database)
// ─────────────────────────────────────────────────────────────────────────────

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // required for Supabase / hosted PG
});

// Test DB connection on startup
pgPool.connect()
  .then(client => {
    console.log("✅ PostgreSQL Connected");
    client.release();
  })
  .catch(err => console.error("❌ PostgreSQL Connection Error:", err));

// ─────────────────────────────────────────────────────────────────────────────
// Email Transporter (Gmail)
// ─────────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /submit-form  — Save lead + send email
// ─────────────────────────────────────────────────────────────────────────────

app.post("/submit-form", async (req, res) => {

  console.log("📩 Lead received:", req.body);

  try {

    const { name, phone, address } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and address are required"
      });
    }

    // 1. Save lead to marketing_leads table (PostgreSQL / Supabase)
    await pgPool.query(
      `INSERT INTO marketing_leads
         (id, name, phone, city, source, status, "createdAt", "updatedAt")
       VALUES
         (gen_random_uuid(), $1, $2, $3, 'website', 'new', NOW(), NOW())`,
      [name, phone, address]
    );

    console.log(`✅ Lead saved to marketing_leads: ${name}`);

    // 2. Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `New MaiHoonNa Lead - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F97316; border-bottom: 3px solid #F97316; padding-bottom: 10px;">
            New Lead Received
          </h2>

          <div style="background-color: #FFF1E6; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">Lead Details</h3>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; font-weight: bold; width: 120px;">Name:</td>
                <td style="padding: 10px 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">Phone:</td>
                <td style="padding: 10px 0;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Address:</td>
                <td style="padding: 10px 0;">${address}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            Submitted on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>

          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">

          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            MaiHoonNa - Always Present | © 2026 All rights reserved
          </p>
        </div>
      `,
      text: `
New MaiHoonNa Lead

Name:    ${name}
Phone:   ${phone}
Address: ${address}

Submitted on: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
      `
    };

    await transporter.sendMail(mailOptions);

    console.log("📧 Email sent successfully");

    res.status(200).json({
      success: true,
      message: "Lead submitted successfully"
    });

  } catch (error) {

    console.error("❌ Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error. Please try again."
    });

  }

});

// ─────────────────────────────────────────────────────────────────────────────
// GET /health  — Health check
// ─────────────────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "Server running",
    time: new Date()
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📬 Ready to receive leads`);
});