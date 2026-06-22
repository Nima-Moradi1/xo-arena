"use client";

import { getWinningLine, type Board } from "@xo/shared";
import { cn } from "@/lib/utils";

export function GameBoard({ board, disabled, onMove }: { board: Board; disabled?: boolean; onMove: (position: number) => void }) {
  const winningLine = getWinningLine(board);

  return (
    <div className="mx-auto grid w-full max-w-[460px] grid-cols-3 gap-2.5" aria-label="XO board">
      {board.map((cell, index) => {
        const isWinning = winningLine?.includes(index) ?? false;
        return (
          <button
            key={index}
            className={cn(
              "flex aspect-square items-center justify-center rounded-xl border-2 bg-card/85 text-4xl font-black shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-6xl",
              cell === "X" && !isWinning && "text-[hsl(var(--mark-x))]",
              cell === "O" && !isWinning && "text-[hsl(var(--mark-o))]",
              isWinning && "border-transparent bg-[hsl(var(--success))] text-white shadow-lg shadow-emerald-500/20 hover:bg-[hsl(var(--success))]",
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
