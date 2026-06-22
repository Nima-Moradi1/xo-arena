"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { Copy, Loader2, RotateCcw } from "lucide-react";
import type { ClientToServerEvents, GameDto, Mark, ServerToClientEvents } from "@xo/shared";
import { GameBoard } from "@/components/game/game-board";
import { GameResultModal } from "@/components/game/game-result-modal";
import { PlayerCard } from "@/components/game/player-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api";
import { gameStatusLabel } from "@/lib/utils";
import { useProtectedRoute } from "@/hooks/use-protected-route";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export default function PlayPage() {
  const { user, isLoading } = useProtectedRoute();
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const gameId = params.gameId;
  const [game, setGame] = useState<GameDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const socketRef = useRef<GameSocket | null>(null);

  const viewerMark: Mark | null = useMemo(() => {
    if (!game || !user) return null;
    if (game.xPlayer.id === user.id) return "X";
    if (game.oPlayer?.id === user.id) return "O";
    return null;
  }, [game, user]);

  const statusMessage = useMemo(() => {
    if (!game) return "Loading game...";
    if (game.status === "WAITING") return "Waiting for another online player to join.";
    if (game.status === "DRAW") return "The game ended in a draw.";
    if (game.status === "X_WON" || game.status === "O_WON") {
      return game.winner ? `${game.winner.nickname} won this game.` : "The computer won this game.";
    }
    if (viewerMark === game.currentTurn) return "Your turn.";
    return "Opponent's turn.";
  }, [game, viewerMark]);

  async function loadGame() {
    const data = await apiFetch<{ game: GameDto }>(`/games/${gameId}`);
    setGame(data.game);
  }

  useEffect(() => {
    if (!user || !gameId) return;
    loadGame().catch((err) => setError(err instanceof ApiClientError ? err.message : "Could not load game."));
  }, [user, gameId]);

  useEffect(() => {
    if (!user || !game || game.mode !== "ONLINE") return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
    const socket: GameSocket = io(socketUrl, { withCredentials: true, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("game:join", { gameId: game.id }));
    socket.on("game:state", (nextGame) => setGame(nextGame));
    socket.on("game:error", (payload) => setError(payload.message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, game?.id, game?.mode]);

  useEffect(() => {
    if (!game || game.status !== "WAITING") return;
    const interval = window.setInterval(() => {
      loadGame().catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(interval);
  }, [game?.status, gameId]);

  useEffect(() => {
    if (game?.status === "X_WON" || game?.status === "O_WON" || game?.status === "DRAW") {
      setResultOpen(true);
    }
  }, [game?.id, game?.status]);

  async function handleMove(position: number) {
    if (!game || busy || game.status !== "IN_PROGRESS") return;
    setError(null);
    setBusy(true);
    try {
      if (game.mode === "ONLINE") {
        socketRef.current?.emit("game:move", { gameId: game.id, position });
      } else {
        const data = await apiFetch<{ game: GameDto }>(`/games/${game.id}/move`, {
          method: "POST",
          body: JSON.stringify({ position })
        });
        setGame(data.game);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Move failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copyGameId() {
    if (!game) return;
    await navigator.clipboard.writeText(game.id);
  }

  async function replaySinglePlayerGame() {
    if (!game || game.mode !== "SINGLE_PLAYER") return;
    setError(null);
    setReplaying(true);
    try {
      const data = await apiFetch<{ game: GameDto }>("/games/single", {
        method: "POST",
        body: JSON.stringify({ difficulty: game.difficulty ?? "MEDIUM" })
      });
      setResultOpen(false);
      setGame(data.game);
      router.replace(`/play/${data.game.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not start another game.");
    } finally {
      setReplaying(false);
    }
  }

  if (isLoading || !user || !game) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading game...</div>;
  }

  const isPlayersTurn = game.status === "IN_PROGRESS" && viewerMark === game.currentTurn;
  const boardDisabled = busy || !isPlayersTurn;
  const isFinished = game.status === "X_WON" || game.status === "O_WON" || game.status === "DRAW";
  const result = game.status === "DRAW"
    ? "draw"
    : (game.status === "X_WON" && viewerMark === "X") || (game.status === "O_WON" && viewerMark === "O")
      ? "win"
      : "lose";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{game.mode === "SINGLE_PLAYER" ? "Single player" : "Online"}</Badge>
            {game.difficulty ? <Badge variant="outline">{game.difficulty.toLowerCase()}</Badge> : null}
            <Badge variant={game.status === "IN_PROGRESS" ? "default" : "secondary"}>{gameStatusLabel(game.status)}</Badge>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Game room</h1>
          <p
            className={game.status === "WAITING" ? "mt-2 animate-pulse font-semibold text-primary" : "mt-2 text-muted-foreground"}
            aria-live="polite"
          >
            {statusMessage}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isFinished && game.mode === "SINGLE_PLAYER" ? (
            <Button className="w-32" onClick={replaySinglePlayerGame} disabled={replaying}>
              {replaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Play again
            </Button>
          ) : null}
          <Button className="w-32" variant="outline" onClick={copyGameId}><Copy className="h-4 w-4" /> Copy ID</Button>
          <Button className="w-32" variant="outline" onClick={() => router.push("/lobby")}><RotateCcw className="h-4 w-4" /> Lobby</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start justify-center gap-6 lg:grid-cols-[minmax(0,520px)_340px]">
        <Card className="w-full border-primary/20 bg-card/80">
          <CardContent className="p-4 sm:p-6">
            <GameBoard board={game.board} disabled={boardDisabled} onMove={handleMove} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <PlayerCard player={game.xPlayer} mark="X" active={game.currentTurn === "X" && game.status === "IN_PROGRESS"} />
          <PlayerCard
            player={game.oPlayer}
            mark="O"
            active={game.currentTurn === "O" && game.status === "IN_PROGRESS"}
            waiting={game.mode === "ONLINE" && game.status === "WAITING" && !game.oPlayer}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Move log {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </CardTitle>
              <CardDescription>Review each turn from the current match.</CardDescription>
            </CardHeader>
            <CardContent>
              {game.moves.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moves yet.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {game.moves.map((move) => (
                    <li key={move.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                      <span>#{move.moveNumber} {move.user?.nickname ?? "Computer"}</span>
                      <Badge variant="outline">{move.mark} → {move.position + 1}</Badge>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <GameResultModal
        open={resultOpen}
        result={result}
        canReplay={game.mode === "SINGLE_PLAYER"}
        replaying={replaying}
        onClose={() => setResultOpen(false)}
        onReplay={replaySinglePlayerGame}
      />
    </div>
  );
}
