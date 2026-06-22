"use client";

import { useRouter } from "next/navigation";
import { Bot, Brain, Loader2, Plus, Sparkles, Swords, Target, Zap } from "lucide-react";
import { useState } from "react";
import type { ComputerDifficulty, GameDto } from "@xo/shared";
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
  const [difficulty, setDifficulty] = useState<ComputerDifficulty>("MEDIUM");

  async function createGame(path: string, key: string, body?: object) {
    setError(null);
    setBusy(key);
    try {
      const data = await apiFetch<{ game: GameDto }>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined
      });
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden border-primary/30 md:col-span-2">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-primary p-2 text-primary-foreground"><Bot className="h-6 w-6" /></span>
              <div>
                <CardTitle>Play against the computer</CardTitle>
                <CardDescription className="mt-1">Choose how challenging your opponent should be.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Computer difficulty">
              {difficultyOptions.map((option) => {
                const Icon = option.icon;
                const selected = difficulty === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setDifficulty(option.value)}
                    className={`rounded-xl border p-4 text-left transition ${selected ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-background/70 hover:border-primary/50 hover:bg-accent"}`}
                  >
                    <Icon className="mb-3 h-5 w-5" />
                    <span className="block font-bold">{option.label}</span>
                    <span className={`mt-1 block text-xs ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{option.description}</span>
                  </button>
                );
              })}
            </div>
            <Button className="mt-5 w-full sm:w-auto" size="lg" onClick={() => createGame("/games/single", "single", { difficulty })} disabled={Boolean(busy)}>
              {busy === "single" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />} Play {difficulty.toLowerCase()}
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

const difficultyOptions: Array<{
  value: ComputerDifficulty;
  label: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  { value: "EASY", label: "Easy", description: "Relaxed and unpredictable", icon: Sparkles },
  { value: "MEDIUM", label: "Medium", description: "Spots winning chances", icon: Target },
  { value: "HARD", label: "Hard", description: "Defends and fights back", icon: Zap },
  { value: "EXPERT", label: "Expert", description: "Perfect strategic play", icon: Brain }
];
