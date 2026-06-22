import type { ComputerDifficulty } from "./types";

export type Mark = "X" | "O";
export type BoardCell = Mark | null;
export type Board = readonly BoardCell[];

export const BOARD_SIZE = 9;
export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
] as const;

export function createInitialBoard(): BoardCell[] {
  return Array.from({ length: BOARD_SIZE }, () => null);
}

export function getWinner(board: Board): Mark | null {
  for (const [a, b, c] of WINNING_LINES) {
    const first = board[a];
    if (first && first === board[b] && first === board[c]) {
      return first;
    }
  }
  return null;
}

export function getWinningLine(board: Board): readonly [number, number, number] | null {
  for (const [a, b, c] of WINNING_LINES) {
    const first = board[a];
    if (first && first === board[b] && first === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}

export function isDraw(board: Board): boolean {
  return board.every(Boolean) && !getWinner(board);
}

export function nextMark(mark: Mark): Mark {
  return mark === "X" ? "O" : "X";
}

export function assertValidPosition(position: number): void {
  if (!Number.isInteger(position) || position < 0 || position >= BOARD_SIZE) {
    throw new Error("Position must be an integer between 0 and 8.");
  }
}

export function makeMove(board: Board, position: number, mark: Mark): BoardCell[] {
  assertValidPosition(position);
  if (board[position]) {
    throw new Error("That square is already taken.");
  }
  const nextBoard = [...board];
  nextBoard[position] = mark;
  return nextBoard;
}

function evaluate(board: Board): number {
  const winner = getWinner(board);
  if (winner === "O") return 10;
  if (winner === "X") return -10;
  return 0;
}

function minimax(board: BoardCell[], depth: number, isMaximizing: boolean): number {
  const score = evaluate(board);
  if (score === 10 || score === -10) return score - depth;
  if (isDraw(board)) return 0;

  if (isMaximizing) {
    let best = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < BOARD_SIZE; i += 1) {
      if (!board[i]) {
        board[i] = "O";
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = null;
      }
    }
    return best;
  }

  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < BOARD_SIZE; i += 1) {
    if (!board[i]) {
      board[i] = "X";
      best = Math.min(best, minimax(board, depth + 1, true));
      board[i] = null;
    }
  }
  return best;
}

export function getBestComputerMove(board: Board): number | null {
  if (getWinner(board) || isDraw(board)) return null;

  let bestValue = Number.NEGATIVE_INFINITY;
  let bestMove: number | null = null;
  const mutable = [...board];

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    if (!mutable[i]) {
      mutable[i] = "O";
      const value = minimax(mutable, 0, false);
      mutable[i] = null;
      if (value > bestValue) {
        bestValue = value;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

function getOpenPositions(board: Board): number[] {
  return board.flatMap((cell, index) => (cell ? [] : [index]));
}

function getRandomMove(board: Board): number | null {
  const openPositions = getOpenPositions(board);
  if (openPositions.length === 0) return null;
  return openPositions[Math.floor(Math.random() * openPositions.length)] ?? null;
}

function getImmediateMove(board: Board, mark: Mark): number | null {
  for (const position of getOpenPositions(board)) {
    if (getWinner(makeMove(board, position, mark)) === mark) return position;
  }
  return null;
}

export function getComputerMove(board: Board, difficulty: ComputerDifficulty): number | null {
  if (getWinner(board) || isDraw(board)) return null;

  if (difficulty === "EASY") return getRandomMove(board);

  const winningMove = getImmediateMove(board, "O");
  if (winningMove !== null) return winningMove;

  if (difficulty === "MEDIUM") return getRandomMove(board);

  const blockingMove = getImmediateMove(board, "X");
  if (blockingMove !== null) return blockingMove;

  if (difficulty === "HARD" && Math.random() < 0.35) return getRandomMove(board);
  return getBestComputerMove(board);
}
