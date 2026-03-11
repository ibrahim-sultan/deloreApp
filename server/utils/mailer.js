const postmark = require('postmark');

// Simple Postmark mailer wrapper
// Env vars used:
// - POSTMARK_SERVER_TOKEN (required)
// - MAIL_FROM or EMAIL_FROM (sender address)
//
// Usage: await sendMail({ to, subject, html, text, from })

let client = null;
const token = process.env.POSTMARK_SERVER_TOKEN || process.env.POSTMARK_TOKEN;
if (token) {
  try {
    client = new postmark.ServerClient(token);
  } catch (e) {
    console.warn('Failed to initialize Postmark client:', e.message);
  }
} else {
  console.warn('POSTMARK_SERVER_TOKEN not set. Emails will be skipped.');
}

async function sendMail({ to, subject, html, text, from }) {
  if (!client) {
    console.warn('Postmark client not available. Skipping email to:', to);
    return;
  }
  const fromAddr = from || process.env.MAIL_FROM || process.env.EMAIL_FROM;
  if (!fromAddr) {
    console.warn('No MAIL_FROM/EMAIL_FROM configured. Skipping email to:', to);
    return;
  }
  await client.sendEmail({
    From: fromAddr,
    To: to,
    Subject: subject,
    HtmlBody: html || undefined,
    TextBody: text || undefined,
    MessageStream: process.env.POSTMARK_STREAM || 'outbound'
  });
}

module.exports = { sendMail };
