const nodemailer = require("nodemailer");

let cachedTransport = null;
let cachedTransportKey = null;
let cachedVerifyPromise = null;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function normalizeSmtpPass(raw) {
  const s = String(raw || "").trim();
  if (!s) return s;
  if (/\s/.test(s)) {
    const compact = s.replace(/\s+/g, "");
    if (compact.length >= 8) return compact;
  }
  return s;
}

function getTransportCacheKey({ host, port, user }) {
  return `${host}:${port}:${user}`;
}

async function verifyTransport(transporter) {
  if (cachedVerifyPromise) return cachedVerifyPromise;
  cachedVerifyPromise = transporter.verify().catch((err) => {
    cachedVerifyPromise = null;
    throw err;
  });
  return cachedVerifyPromise;
}

function getTransport() {
  const host = requireEnv("SMTP_HOST");
  const port = Number(requireEnv("SMTP_PORT"));
  const user = requireEnv("SMTP_USER");
  const pass = normalizeSmtpPass(requireEnv("SMTP_PASS"));

  const cacheKey = getTransportCacheKey({ host, port, user });
  if (cachedTransport && cachedTransportKey === cacheKey)
    return cachedTransport;

  cachedTransportKey = cacheKey;
  cachedVerifyPromise = null;
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return cachedTransport;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function sendBulkEmail({
  subject,
  text,
  html,
  bcc = [],
  chunkSize = 50,
}) {
  const from = requireEnv("SMTP_FROM");
  const transporter = getTransport();
  await verifyTransport(transporter);

  const list = Array.from(
    new Set(
      (Array.isArray(bcc) ? bcc : [])
        .map((e) =>
          String(e || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  );

  if (!list.length) return { sent: 0 };

  const chunks = chunkArray(list, Math.max(1, Number(chunkSize) || 50));
  let sent = 0;

  for (const c of chunks) {
    await transporter.sendMail({
      from,
      to: from,
      bcc: c,
      subject,
      text,
      html,
    });
    sent += c.length;
  }

  return { sent };
}

async function sendEmailOtp({ to, otp, ttlMinutes = 10 }) {
  const from = requireEnv("SMTP_FROM");
  const appName = process.env.APP_NAME || "CampusCore";

  const transporter = getTransport();
  await verifyTransport(transporter);

  const subject = `${appName} verification code`;
  const text = `Your ${appName} verification code is: ${otp}\n\nIt expires in ${ttlMinutes} minutes.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px 0">${appName} verification</h2>
      <p style="margin:0 0 12px 0">Use this code to verify your email address:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">${otp}</div>
      <p style="margin:0;color:#555">This code expires in ${ttlMinutes} minutes.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

async function sendPasswordResetOtp({ to, otp, ttlMinutes = 30 }) {
  const from = requireEnv("SMTP_FROM");
  const appName = process.env.APP_NAME || "CampusCore";

  const transporter = getTransport();
  await verifyTransport(transporter);

  const subject = `${appName} password reset code`;
  const text = `We received a request to reset your ${appName} password.\n\nYour reset code is: ${otp}\n\nIt expires in ${ttlMinutes} minutes. If you didn't request this, you can ignore this email.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px 0">Reset your ${appName} password</h2>
      <p style="margin:0 0 12px 0">Use this code to reset your password:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0">${otp}</div>
      <p style="margin:0;color:#555">This code expires in ${ttlMinutes} minutes.</p>
      <p style="margin:12px 0 0 0;color:#555;font-size:12px">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

function getPrimaryClientOrigin() {
  const raw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  const first = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];

  return String(first || "http://localhost:5173").replace(/\/+$/, "");
}

async function sendPasswordResetEmail({ to, token, ttlMinutes = 30 }) {
  const from = requireEnv("SMTP_FROM");
  const appName = process.env.APP_NAME || "CampusCore";

  const origin = getPrimaryClientOrigin();
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(
    token,
  )}`;

  const transporter = getTransport();
  await verifyTransport(transporter);

  const subject = `${appName} password reset`;
  const text = `We received a request to reset your ${appName} password.\n\nReset link: ${resetUrl}\n\nThis link expires in ${ttlMinutes} minutes. If you didn't request this, you can ignore this email.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 12px 0">Reset your ${appName} password</h2>
      <p style="margin:0 0 12px 0">Click the button below to reset your password. This link expires in ${ttlMinutes} minutes.</p>
      <p style="margin:16px 0">
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700">
          Reset password
        </a>
      </p>
      <p style="margin:0;color:#555;font-size:12px">If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="margin:6px 0 0 0;color:#111;font-size:12px;word-break:break-all">${resetUrl}</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendEmailOtp,
  sendPasswordResetOtp,
  sendPasswordResetEmail,
  sendBulkEmail,
};
