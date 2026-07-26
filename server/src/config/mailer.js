const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for port 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: to,
    subject: "Your verification code",
    html:
      '<div style="font-family: sans-serif; padding: 20px;">' +
      "<h2>Verify your email</h2>" +
      "<p>Your verification code is:</p>" +
      '<p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">' +
      otp +
      "</p>" +
      '<p style="color: #888;">This code expires in 10 minutes.</p>' +
      "</div>",
  });
}

module.exports = { sendOtpEmail };
