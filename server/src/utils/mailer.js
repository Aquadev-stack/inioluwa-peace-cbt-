const nodemailer = require("nodemailer");

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("Missing SMTP env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 true, 587 false
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const transporter = getTransporter();

  // ✅ makes SMTP errors show clearly in server console
  await transporter.verify();

  return transporter.sendMail({ from, to, subject, html });
}

module.exports = { sendMail };
