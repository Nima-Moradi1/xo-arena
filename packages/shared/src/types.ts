import type { Board, Mark } from "./game";

export type GameMode = "SINGLE_PLAYER" | "ONLINE";
export type GameStatus = "WAITING" | "IN_PROGRESS" | "X_WON" | "O_WON" | "DRAW" | "ABANDONED";
export type ComputerDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

export type PublicUser = {
  id: string;
  email?: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
  isEmailVerified?: boolean;
  createdAt?: string;
};

export type GameMoveDto = {
  id: string;
  mark: Mark;
  position: number;
  moveNumber: number;
  createdAt: string;
  user: PublicUser | null;
};

export type GameDto = {
  id: string;
  mode: GameMode;
  status: GameStatus;
  difficulty: ComputerDifficulty | null;
  board: Board;
  currentTurn: Mark;
  xPlayer: PublicUser;
  oPlayer: PublicUser | null;
  winner: PublicUser | null;
  moves: GameMoveDto[];
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
};

export type AuthUser = PublicUser & {
  email: string;
  isEmailVerified: boolean;
};

export type ClientToServerEvents = {
  "game:join": (payload: { gameId: string }) => void;
  "game:move": (payload: { gameId: string; position: number }) => void;
};

export type ServerToClientEvents = {
  "game:state": (game: GameDto) => void;
  "game:error": (payload: { message: string }) => void;
  "game:opponent-joined": (game: GameDto) => void;
};
