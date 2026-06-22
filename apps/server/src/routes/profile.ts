import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { prisma } from "@xo/db";
import { updateProfileSchema } from "@xo/shared";
import { uploadsPath } from "../config/env";
import { toAuthUser } from "../lib/auth";
import { ApiError, asyncHandler } from "../lib/http";
import { requireAuth } from "../middleware/require-auth";
import { gameInclude, toGameDto } from "../services/games";

export const profileRouter = Router();

const avatarsDir = path.join(uploadsPath, "avatars");
fs.mkdirSync(avatarsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarsDir),
    filename: (req, file, cb) => {
      const userId = req.user?.id ?? "anonymous";
      const safeExt = path.extname(file.originalname).toLowerCase() || ".png";
      cb(null, `${userId}-${Date.now()}${safeExt}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new ApiError(400, "Please upload an image file.", "INVALID_FILE_TYPE"));
      return;
    }
    cb(null, true);
  }
});

profileRouter.use(requireAuth);

profileRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const [user, games] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.game.findMany({
        where: {
          OR: [{ xPlayerId: userId }, { oPlayerId: userId }]
        },
        orderBy: { createdAt: "desc" },
        include: gameInclude,
        take: 50
      })
    ]);

    res.json({ user: toAuthUser(user), games: games.map(toGameDto) });
  })
);

profileRouter.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const input = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { nickname: input.nickname }
    });
    res.json({ user: toAuthUser(user) });
  })
);

profileRouter.post(
  "/avatar",
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "Avatar image is required.", "FILE_REQUIRED");
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { avatarUrl } });
    res.json({ user: toAuthUser(user) });
  })
);
