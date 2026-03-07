const dotenv = require("dotenv");

dotenv.config();

const { sendEmailOtp } = require("../utils/email");

async function main() {
  const to = String(process.argv[2] || "").trim();
  if (!to) {
    console.error("Usage: node scripts/sendTestEmail.js <to-email>");
    process.exit(1);
  }

  const otp = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  const ttlMinutes = 10;

  await sendEmailOtp({ to, otp, ttlMinutes });
  console.log(`Sent test OTP to ${to}`);
}

main().catch((err) => {
  console.error("Test email failed:", err?.message || err);
  process.exit(1);
});
