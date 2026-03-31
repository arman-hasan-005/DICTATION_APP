/**
 * emailService.js — Nodemailer wrapper for transactional emails
 *
 * Sends:
 *   • OTP verification emails  (sendOtpEmail)
 *   • Password reset emails    (sendPasswordResetEmail)
 *
 * Transport: SMTP (Gmail, Outlook, SendGrid SMTP, Mailgun SMTP)
 * Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
 *
 * For Gmail: enable "App Passwords" (not your regular Gmail password).
 *   https://myaccount.google.com/apppasswords
 *
 * If SMTP is not configured, emails are logged to console in development
 * so the app still works locally without a mail server.
 */

const nodemailer = require('nodemailer');
const { smtpHost, smtpPort, smtpUser, smtpPass, emailFrom, clientUrl, isDev } = require('../config/env');
const logger = require('../config/logger');

// ── Transporter ───────────────────────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!smtpUser || !smtpPass) {
    // No SMTP config — return a fake transport that just logs
    return null;
  }

  transporter = nodemailer.createTransport({
    host:   smtpHost,
    port:   smtpPort,
    secure: smtpPort === 465,   // true for 465, false for 587
    auth:   { user: smtpUser, pass: smtpPass },
  });

  return transporter;
};

// ── Internal send helper ──────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();

  if (!transport) {
    // Dev fallback: print to console instead of sending
    logger.warn('SMTP not configured — email preview in console');
    logger.info(`[EMAIL TO: ${to}]\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, '')}`);
    return;
  }

  await transport.sendMail({ from: `"DictaClass" <${emailFrom}>`, to, subject, html });
  logger.info(`Email sent to ${to}: ${subject}`);
};

// ── Email templates ───────────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8FAFC; margin: 0; padding: 40px 20px; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px 36px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .logo { font-size: 40px; text-align: center; margin-bottom: 8px; }
    .brand { font-size: 22px; font-weight: 700; color: #1E3A5F; text-align: center; margin-bottom: 32px; }
    .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 12px; }
    .body  { font-size: 15px; color: #4B5563; line-height: 1.6; margin-bottom: 24px; }
    .otp-box { background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #1D4ED8; font-family: monospace; }
    .otp-expire { font-size: 13px; color: #6B7280; margin-top: 8px; }
    .btn { display: inline-block; background: #2563EB; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 24px 0; }
    .footer { font-size: 12px; color: #9CA3AF; margin-top: 32px; border-top: 1px solid #F3F4F6; padding-top: 16px; }
    .security-note { background: #FFF7ED; border-left: 3px solid #F59E0B; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400E; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🎙️</div>
    <div class="brand">DictaClass</div>
    ${content}
    <div class="footer">
      This email was sent by DictaClass. If you did not request this, you can safely ignore it.
    </div>
  </div>
</body>
</html>`;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a 6-digit OTP for email verification.
 * @param {string} email  — recipient
 * @param {string} name   — user's display name
 * @param {string} otp    — 6-digit plaintext OTP (not hashed)
 */
const sendOtpEmail = async (email, name, otp) => {
  const html = baseTemplate(`
    <div class="title">Verify your email address</div>
    <div class="body">Hi ${name}, welcome to DictaClass! Use the code below to verify your email address. This code expires in <strong>10 minutes</strong>.</div>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-expire">Expires in 10 minutes</div>
    </div>
    <div class="security-note">
      ⚠️ Never share this code with anyone. DictaClass staff will never ask for it.
    </div>
  `);

  await sendEmail({ to: email, subject: `${otp} is your DictaClass verification code`, html });
};

/**
 * Send a password-reset link containing a secure token.
 * @param {string} email  — recipient
 * @param {string} name   — user's display name
 * @param {string} token  — raw (unhashed) reset token
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  const html = baseTemplate(`
    <div class="title">Reset your password</div>
    <div class="body">Hi ${name}, we received a request to reset your DictaClass password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</div>
    <div style="text-align:center">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="body" style="font-size:13px;color:#6B7280;">
      Or copy this link into your browser:<br>
      <span style="color:#2563EB;word-break:break-all">${resetUrl}</span>
    </div>
    <div class="security-note">
      ⚠️ If you did not request a password reset, your account is safe — just ignore this email.
    </div>
  `);

  await sendEmail({ to: email, subject: 'Reset your DictaClass password', html });
};

module.exports = { sendOtpEmail, sendPasswordResetEmail };
