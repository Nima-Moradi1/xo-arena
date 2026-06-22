import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(24, "Username must be at most 24 characters.")
  .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only.");

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "Nickname must be at least 2 characters.")
  .max(32, "Nickname must be at most 32 characters.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: usernameSchema,
  nickname: nicknameSchema,
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required.")
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email()
});

export const updateProfileSchema = z.object({
  nickname: nicknameSchema
});

export const gameMoveSchema = z.object({
  position: z.number().int().min(0).max(8)
});

export const gameIdSchema = z.object({
  gameId: z.string().min(1)
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
