import type { CookieOptions, Request, Response } from "express";
import { prisma } from "@xo/db";
import type { AuthUser } from "@xo/shared";
import { env, isProduction } from "../config/env";
import { createOpaqueToken, hashToken } from "./crypto";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toAuthUser(user: {
  id: string;
  email: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  createdAt?: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt?.toISOString()
  };
}

export function getCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * MS_PER_DAY
  };
}

export function getSessionTokenFromRequest(req: Request): string | null {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function createSession(res: Response, userId: string) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * MS_PER_DAY);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt
    }
  });

  res.cookie(env.SESSION_COOKIE_NAME, token, getCookieOptions());
}

export async function deleteCurrentSession(req: Request, res: Response) {
  const token = getSessionTokenFromRequest(req);
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: "/" });
}

export async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }

  req.sessionToken = token;
  return toAuthUser(session.user);
}
