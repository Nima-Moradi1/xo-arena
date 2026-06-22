import { Router } from "express";
import { createSinglePlayerGameSchema, gameMoveSchema } from "@xo/shared";
import { ApiError, asyncHandler } from "../lib/http";
import { requireAuth } from "../middleware/require-auth";
import {
  createOnlineGame,
  createSinglePlayerGame,
  getAccessibleGame,
  playOnlineMove,
  playSinglePlayerMove,
  quickMatch
} from "../services/games";

export const gamesRouter = Router();

gamesRouter.use(requireAuth);

function getGameId(value: string | string[] | undefined) {
  const gameId = Array.isArray(value) ? value[0] : value;
  if (!gameId) throw new ApiError(400, "Game id is required.", "GAME_ID_REQUIRED");
  return gameId;
}

gamesRouter.post(
  "/single",
  asyncHandler(async (req, res) => {
    const input = createSinglePlayerGameSchema.parse(req.body ?? {});
    const game = await createSinglePlayerGame(req.user!.id, input.difficulty);
    res.status(201).json({ game });
  })
);

gamesRouter.post(
  "/online/create",
  asyncHandler(async (req, res) => {
    const game = await createOnlineGame(req.user!.id);
    res.status(201).json({ game });
  })
);

gamesRouter.post(
  "/online/quick-match",
  asyncHandler(async (req, res) => {
    const game = await quickMatch(req.user!.id);
    res.status(game.status === "WAITING" ? 201 : 200).json({ game });
  })
);

gamesRouter.get(
  "/:gameId",
  asyncHandler(async (req, res) => {
    const gameId = getGameId(req.params.gameId);
    const game = await getAccessibleGame(gameId, req.user!.id);
    res.json({ game });
  })
);

gamesRouter.post(
  "/:gameId/move",
  asyncHandler(async (req, res) => {
    const gameId = getGameId(req.params.gameId);
    const input = gameMoveSchema.parse(req.body);
    const current = await getAccessibleGame(gameId, req.user!.id);
    const game =
      current.mode === "SINGLE_PLAYER"
        ? await playSinglePlayerMove(gameId, req.user!.id, input.position)
        : await playOnlineMove(gameId, req.user!.id, input.position);
    res.json({ game });
  })
);
