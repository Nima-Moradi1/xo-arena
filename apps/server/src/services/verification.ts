import { prisma } from "@xo/db";
import { env } from "../config/env";
import { createOpaqueToken, hashToken } from "../lib/crypto";
import { sendVerificationEmail } from "../lib/email";

const TOKEN_TTL_HOURS = 24;

export async function issueVerificationEmail(user: { id: string; email: string; nickname: string }) {
  const token = createOpaqueToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)
    }
  });

  const verificationUrl = `${env.APP_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;
  await sendVerificationEmail({ to: user.email, nickname: user.nickname, verificationUrl });
}
