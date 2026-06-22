import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/http";
import { getCurrentUser } from "../lib/auth";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new ApiError(401, "You must be logged in.", "UNAUTHORIZED");
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
