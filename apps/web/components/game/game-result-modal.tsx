"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Handshake, Loader2, RotateCcw, Skull, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type GameResult = "win" | "lose" | "draw";

const resultContent = {
  win: {
    title: "You won!",
    message: "Sharp moves. You controlled the board.",
    icon: Trophy,
    panel: "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950",
    iconStyle: "bg-emerald-500 text-white",
    titleStyle: "text-emerald-700 dark:text-emerald-300"
  },
  lose: {
    title: "You lost",
    message: "The opponent found the winning line this time.",
    icon: Skull,
    panel: "border-rose-500/50 bg-rose-50 dark:bg-rose-950",
    iconStyle: "bg-rose-500 text-white",
    titleStyle: "text-rose-700 dark:text-rose-300"
  },
  draw: {
    title: "It's a draw",
    message: "No open lines left. That was evenly matched.",
    icon: Handshake,
    panel: "border-amber-500/50 bg-amber-50 dark:bg-amber-950",
    iconStyle: "bg-amber-500 text-amber-950",
    titleStyle: "text-amber-700 dark:text-amber-300"
  }
} as const;

const confettiColors = ["#22d3ee", "#fb7185", "#fbbf24", "#4ade80", "#a78bfa", "#f97316"];

const confetti = Array.from({ length: 64 }, (_, index) => {
  const wide = index % 3 === 0;
  const round = index % 7 === 0;
  const sway = ((index * 17) % 9) + 3;
  const spin = 540 + (index % 6) * 160;

  return {
    left: (index * 47 + 11) % 100,
    delay: (index % 13) * 0.11,
    duration: 4.8 + (index % 8) * 0.32,
    color: confettiColors[index % confettiColors.length],
    drift: `${((index * 29) % 25) - 12}rem`,
    sway: `${sway}rem`,
    swayStart: `${sway * -0.25}rem`,
    swayBack: `${sway * -0.65}rem`,
    spin: `${spin}deg`,
    spinMid: `${spin * 0.3}deg`,
    spinLate: `${spin * 0.62}deg`,
    width: wide ? "0.9rem" : "0.5rem",
    height: wide ? "0.38rem" : round ? "0.62rem" : "1.05rem",
    radius: round ? "999px" : index % 4 === 0 ? "50% 10%" : "0.15rem"
  };
});

export function GameResultModal({
  open,
  result,
  canReplay,
  replaying,
  onClose,
  onReplay
}: {
  open: boolean;
  result: GameResult;
  canReplay: boolean;
  replaying: boolean;
  onClose: () => void;
  onReplay: () => void;
}) {
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const content = resultContent[result];
  const Icon = content.icon;

  useEffect(() => {
    if (!open) return;
    primaryActionRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation">
      {result === "win" ? (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          {confetti.map((piece, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: `${piece.left}%`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                backgroundColor: piece.color,
                width: piece.width,
                height: piece.height,
                borderRadius: piece.radius,
                "--confetti-drift": piece.drift,
                "--confetti-sway": piece.sway,
                "--confetti-sway-start": piece.swayStart,
                "--confetti-sway-back": piece.swayBack,
                "--confetti-spin": piece.spin,
                "--confetti-spin-mid": piece.spinMid,
                "--confetti-spin-late": piece.spinLate
              } as CSSProperties}
            />
          ))}
        </div>
      ) : null}
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="game-result-title"
        aria-describedby="game-result-description"
        className={`relative z-10 w-full max-w-md rounded-3xl border-2 p-7 text-center shadow-2xl ${content.panel}`}
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-foreground/60 transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10" aria-label="Close result">
          <X className="h-5 w-5" />
        </button>
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${content.iconStyle}`}>
          <Icon className="h-8 w-8" />
        </span>
        <h2 id="game-result-title" className={`mt-5 text-3xl font-black ${content.titleStyle}`}>{content.title}</h2>
        <p id="game-result-description" className="mt-2 text-sm text-foreground/70">{content.message}</p>
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={onClose}>View board</Button>
          {canReplay ? (
            <Button ref={primaryActionRef} onClick={onReplay} disabled={replaying}>
              {replaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Play again
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
