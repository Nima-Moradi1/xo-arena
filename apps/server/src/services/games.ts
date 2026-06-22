import { prisma, type Prisma } from "@xo/db";
import {
  createInitialBoard,
  getBestComputerMove,
  getWinner,
  isDraw,
  makeMove,
  nextMark,
  type BoardCell,
  type GameDto,
  type GameStatus,
  type Mark,
  type PublicUser
} from "@xo/shared";
import { ApiError } from "../lib/http";

export const gameInclude = {
  xPlayer: true,
  oPlayer: true,
  winner: true,
  moves: {
    include: { user: true },
    orderBy: { moveNumber: "asc" as const }
  }
} satisfies Prisma.GameInclude;

type GameWithRelations = Prisma.GameGetPayload<{ include: typeof gameInclude }>;

type TerminalState = {
  status: GameStatus;
  winnerMark: Mark | null;
  isTerminal: boolean;
};

function publicUser(user: {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt?: Date;
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt?.toISOString()
  };
}

export function boardFromJson(value: Prisma.JsonValue): BoardCell[] {
  if (!Array.isArray(value) || value.length !== 9) return createInitialBoard();
  const normalized = value.map((cell) => (cell === "X" || cell === "O" ? cell : null));
  return normalized as BoardCell[];
}

export function toGameDto(game: GameWithRelations): GameDto {
  return {
    id: game.id,
    mode: game.mode,
    status: game.status,
    board: boardFromJson(game.board),
    currentTurn: game.currentTurn,
    xPlayer: publicUser(game.xPlayer),
    oPlayer: game.oPlayer ? publicUser(game.oPlayer) : null,
    winner: game.winner ? publicUser(game.winner) : null,
    moves: game.moves.map((move) => ({
      id: move.id,
      mark: move.mark,
      position: move.position,
      moveNumber: move.moveNumber,
      createdAt: move.createdAt.toISOString(),
      user: move.user ? publicUser(move.user) : null
    })),
    createdAt: game.createdAt.toISOString(),
    startedAt: game.startedAt?.toISOString() ?? null,
    endedAt: game.endedAt?.toISOString() ?? null
  };
}

function getTerminalState(board: BoardCell[]): TerminalState {
  const winnerMark = getWinner(board);
  if (winnerMark === "X") return { status: "X_WON", winnerMark, isTerminal: true };
  if (winnerMark === "O") return { status: "O_WON", winnerMark, isTerminal: true };
  if (isDraw(board)) return { status: "DRAW", winnerMark: null, isTerminal: true };
  return { status: "IN_PROGRESS", winnerMark: null, isTerminal: false };
}

function assertParticipant(game: GameWithRelations, userId: string) {
  if (game.xPlayerId !== userId && game.oPlayerId !== userId) {
    throw new ApiError(403, "You are not a participant in this game.", "FORBIDDEN");
  }
}

export async function getAccessibleGame(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId }, include: gameInclude });
  if (!game) throw new ApiError(404, "Game not found.", "GAME_NOT_FOUND");
  assertParticipant(game, userId);
  return toGameDto(game);
}

export async function createSinglePlayerGame(userId: string) {
  const game = await prisma.game.create({
    data: {
      mode: "SINGLE_PLAYER",
      status: "IN_PROGRESS",
      board: createInitialBoard(),
      currentTurn: "X",
      xPlayerId: userId,
      startedAt: new Date()
    },
    include: gameInclude
  });

  return toGameDto(game);
}

export async function createOnlineGame(userId: string) {
  const game = await prisma.game.create({
    data: {
      mode: "ONLINE",
      status: "WAITING",
      board: createInitialBoard(),
      currentTurn: "X",
      xPlayerId: userId
    },
    include: gameInclude
  });

  return toGameDto(game);
}

export async function quickMatch(userId: string) {
  const game = await prisma.$transaction(async (tx) => {
    const waiting = await tx.game.findFirst({
      where: {
        mode: "ONLINE",
        status: "WAITING",
        xPlayerId: { not: userId }
      },
      orderBy: { createdAt: "asc" },
      include: gameInclude
    });

    if (!waiting) {
      return tx.game.create({
        data: {
          mode: "ONLINE",
          status: "WAITING",
          board: createInitialBoard(),
          currentTurn: "X",
          xPlayerId: userId
        },
        include: gameInclude
      });
    }

    return tx.game.update({
      where: { id: waiting.id },
      data: {
        oPlayerId: userId,
        status: "IN_PROGRESS",
        startedAt: new Date()
      },
      include: gameInclude
    });
  });

  return toGameDto(game);
}

export async function playSinglePlayerMove(gameId: string, userId: string, position: number) {
  const game = await prisma.$transaction(async (tx) => {
    const existing = await tx.game.findUnique({ where: { id: gameId }, include: gameInclude });
    if (!existing) throw new ApiError(404, "Game not found.", "GAME_NOT_FOUND");
    if (existing.mode !== "SINGLE_PLAYER") {
      throw new ApiError(400, "This endpoint is only for single-player games.", "INVALID_GAME_MODE");
    }
    if (existing.xPlayerId !== userId) {
      throw new ApiError(403, "You are not a participant in this game.", "FORBIDDEN");
    }
    if (existing.status !== "IN_PROGRESS") {
      throw new ApiError(409, "This game is already finished.", "GAME_FINISHED");
    }
    if (existing.currentTurn !== "X") {
      throw new ApiError(409, "It is not your turn.", "NOT_YOUR_TURN");
    }

    let board = makeMove(boardFromJson(existing.board), position, "X");
    let moveNumber = existing.moves.length + 1;
    await tx.gameMove.create({
      data: {
        gameId,
        userId,
        mark: "X",
        position,
        moveNumber
      }
    });

    let terminal = getTerminalState(board);
    let winnerId: string | null = terminal.winnerMark === "X" ? userId : null;
    let currentTurn: Mark = "O";

    if (!terminal.isTerminal) {
      const aiPosition = getBestComputerMove(board);
      if (aiPosition !== null) {
        board = makeMove(board, aiPosition, "O");
        moveNumber += 1;
        await tx.gameMove.create({
          data: {
            gameId,
            userId: null,
            mark: "O",
            position: aiPosition,
            moveNumber
          }
        });
      }
      terminal = getTerminalState(board);
      winnerId = terminal.winnerMark === "X" ? userId : null;
      currentTurn = terminal.isTerminal ? "X" : "X";
    }

    await tx.game.update({
      where: { id: gameId },
      data: {
        board,
        currentTurn,
        status: terminal.status,
        winnerId,
        endedAt: terminal.isTerminal ? new Date() : null
      }
    });

    const updated = await tx.game.findUniqueOrThrow({ where: { id: gameId }, include: gameInclude });
    return updated;
  });

  return toGameDto(game);
}

export async function playOnlineMove(gameId: string, userId: string, position: number) {
  const game = await prisma.$transaction(async (tx) => {
    const existing = await tx.game.findUnique({ where: { id: gameId }, include: gameInclude });
    if (!existing) throw new ApiError(404, "Game not found.", "GAME_NOT_FOUND");
    if (existing.mode !== "ONLINE") {
      throw new ApiError(400, "This endpoint is only for online games.", "INVALID_GAME_MODE");
    }
    if (existing.status === "WAITING") {
      throw new ApiError(409, "Waiting for an opponent to join.", "WAITING_FOR_OPPONENT");
    }
    if (existing.status !== "IN_PROGRESS") {
      throw new ApiError(409, "This game is already finished.", "GAME_FINISHED");
    }
    assertParticipant(existing, userId);

    const mark: Mark = existing.xPlayerId === userId ? "X" : "O";
    if (existing.currentTurn !== mark) {
      throw new ApiError(409, "It is not your turn.", "NOT_YOUR_TURN");
    }

    const board = makeMove(boardFromJson(existing.board), position, mark);
    const moveNumber = existing.moves.length + 1;
    await tx.gameMove.create({ data: { gameId, userId, mark, position, moveNumber } });

    const terminal = getTerminalState(board);
    const winnerId = terminal.winnerMark === "X" ? existing.xPlayerId : terminal.winnerMark === "O" ? existing.oPlayerId : null;

    await tx.game.update({
      where: { id: gameId },
      data: {
        board,
        currentTurn: terminal.isTerminal ? existing.currentTurn : nextMark(mark),
        status: terminal.status,
        winnerId,
        endedAt: terminal.isTerminal ? new Date() : null
      }
    });

    return tx.game.findUniqueOrThrow({ where: { id: gameId }, include: gameInclude });
  });

  return toGameDto(game);
}
