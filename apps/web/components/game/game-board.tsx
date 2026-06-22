"use client";

import { getWinningLine, type Board } from "@xo/shared";
import { cn } from "@/lib/utils";

export function GameBoard({ board, disabled, onMove }: { board: Board; disabled?: boolean; onMove: (position: number) => void }) {
  const winningLine = getWinningLine(board);

  return (
    <div className="grid grid-cols-3 gap-3" aria-label="XO board">
      {board.map((cell, index) => {
        const isWinning = winningLine?.includes(index) ?? false;
        return (
          <button
            key={index}
            className={cn(
              "flex aspect-square min-h-24 items-center justify-center rounded-2xl border bg-card text-5xl font-black shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-32 sm:text-7xl",
              isWinning && "bg-primary text-primary-foreground hover:bg-primary",
              disabled && "cursor-not-allowed opacity-80"
            )}
            disabled={disabled || Boolean(cell)}
            onClick={() => onMove(index)}
            aria-label={`Square ${index + 1}${cell ? ` filled by ${cell}` : " empty"}`}
          >
            {cell}
          </button>
        );
      })}
    </div>
  );
}
