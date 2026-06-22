import nodemailer from "nodemailer";
import { env } from "../config/env";

type SendVerificationEmailInput = {
  to: string;
  nickname: string;
  verificationUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST);
}

export async function sendVerificationEmail(input: SendVerificationEmailInput) {
  if (!hasSmtpConfig()) {
    console.log("\nEmail verification SMTP is not configured.");
    console.log(`Verification link for ${input.to}: ${input.verificationUrl}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
  });

  const safeNickname = escapeHtml(input.nickname);
  const safeVerificationUrl = escapeHtml(input.verificationUrl);

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: "Verify your XO Arena email",
    text: `Hi ${input.nickname},\n\nVerify your email to activate your XO Arena account:\n${input.verificationUrl}\n\nThis link expires in 24 hours.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Verify your XO Arena email</h2>
        <p>Hi ${safeNickname},</p>
        <p>Click the button below to activate your account. This link expires in 24 hours.</p>
        <p><a href="${safeVerificationUrl}" style="display:inline-block;background:#111827;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Verify email</a></p>
        <p>Or copy this link:</p>
        <p>${safeVerificationUrl}</p>
      </div>
    `
  });
}
