import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@xo/db";
import { loginSchema, resendVerificationSchema, signupSchema } from "@xo/shared";
import { ApiError, asyncHandler } from "../lib/http";
import { createSession, deleteCurrentSession, getCurrentUser, toAuthUser } from "../lib/auth";
import { hashToken } from "../lib/crypto";
import { issueVerificationEmail } from "../services/verification";

export const authRouter = Router();

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const input = signupSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }]
      }
    });

    if (existing?.email === input.email) {
      throw new ApiError(409, "This email is already registered.", "EMAIL_TAKEN");
    }
    if (existing?.username === input.username) {
      throw new ApiError(409, "This username is already taken.", "USERNAME_TAKEN");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        nickname: input.nickname,
        passwordHash
      }
    });

    await issueVerificationEmail(user);
    res.status(201).json({ message: "Account created. Please verify your email before logging in." });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user) {
      throw new ApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new ApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    if (!user.isEmailVerified) {
      await issueVerificationEmail(user);
      throw new ApiError(403, "Please verify your email first. A new verification link has been sent.", "EMAIL_NOT_VERIFIED");
    }

    await createSession(res, user.id);
    res.json({ user: toAuthUser(user) });
  })
);

authRouter.get(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) throw new ApiError(400, "Verification token is required.", "TOKEN_REQUIRED");

    const tokenHash = hashToken(token);
    const verification = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!verification || verification.usedAt) {
      throw new ApiError(400, "This verification link is invalid or already used.", "INVALID_TOKEN");
    }
    if (verification.expiresAt <= new Date()) {
      throw new ApiError(400, "This verification link has expired. Please request a new one.", "EXPIRED_TOKEN");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { isEmailVerified: true, emailVerifiedAt: new Date() }
      }),
      prisma.emailVerificationToken.update({
        where: { id: verification.id },
        data: { usedAt: new Date() }
      })
    ]);

    res.json({ message: "Email verified. You can now log in." });
  })
);

authRouter.post(
  "/resend-verification",
  asyncHandler(async (req, res) => {
    const input = resendVerificationSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (user && !user.isEmailVerified) {
      await issueVerificationEmail(user);
    }

    res.json({ message: "If this email exists and is unverified, a new verification link was sent." });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    await deleteCurrentSession(req, res);
    res.json({ message: "Logged out." });
  })
);

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req);
    res.json({ user });
  })
);
