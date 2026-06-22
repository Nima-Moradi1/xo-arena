"use client";

import { useRouter } from "next/navigation";
import { Bot, Loader2, Plus, Swords } from "lucide-react";
import { useState } from "react";
import type { GameDto } from "@xo/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch, ApiClientError } from "@/lib/api";
import { useProtectedRoute } from "@/hooks/use-protected-route";

export default function LobbyPage() {
  const { user, isLoading } = useProtectedRoute();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function createGame(path: string, key: string) {
    setError(null);
    setBusy(key);
    try {
      const data = await apiFetch<{ game: GameDto }>(path, { method: "POST" });
      router.push(`/play/${data.game.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create game.");
    } finally {
      setBusy(null);
    }
  }

  if (isLoading || !user) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading lobby...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Lobby</h1>
        <p className="mt-2 text-muted-foreground">Hi {user.nickname}. Choose a mode and start playing.</p>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Bot className="h-8 w-8" />
            <CardTitle>Single player</CardTitle>
            <CardDescription>Play against a minimax computer opponent. No internet opponent required.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => createGame("/games/single", "single")} disabled={Boolean(busy)}>
              {busy === "single" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Play vs PC
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Swords className="h-8 w-8" />
            <CardTitle>Quick online match</CardTitle>
            <CardDescription>Join the oldest waiting player or create a waiting room automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => createGame("/games/online/quick-match", "quick")} disabled={Boolean(busy)}>
              {busy === "quick" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Quick match
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Plus className="h-8 w-8" />
            <CardTitle>Create room</CardTitle>
            <CardDescription>Create a room and wait. Another logged-in player can join via quick match.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => createGame("/games/online/create", "create")} disabled={Boolean(busy)}>
              {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create online room
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
