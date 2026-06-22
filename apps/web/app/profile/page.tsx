"use client";

import { FormEvent, useEffect, useState } from "react";
import type { AuthUser, GameDto } from "@xo/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch, ApiClientError } from "@/lib/api";
import { assetUrl, gameStatusLabel } from "@/lib/utils";
import { useProtectedRoute } from "@/hooks/use-protected-route";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user, isLoading } = useProtectedRoute();
  const auth = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [games, setGames] = useState<GameDto[]>([]);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    const data = await apiFetch<{ user: AuthUser; games: GameDto[] }>("/profile/me");
    setProfile(data.user);
    setNickname(data.user.nickname);
    setGames(data.games);
  }

  useEffect(() => {
    if (user) loadProfile().catch(() => undefined);
  }, [user]);

  async function saveNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const data = await apiFetch<{ user: AuthUser }>("/profile/me", {
        method: "PATCH",
        body: JSON.stringify({ nickname })
      });
      setProfile(data.user);
      await auth.refresh();
      setMessage("Nickname updated.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not update nickname.");
    }
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("avatar") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("avatar", file);
    setMessage(null);
    setError(null);
    try {
      const data = await apiFetch<{ user: AuthUser }>("/profile/avatar", { method: "POST", body });
      setProfile(data.user);
      await auth.refresh();
      setMessage("Avatar uploaded.");
      form.reset();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not upload avatar.");
    }
  }

  if (isLoading || !user || !profile) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Profile</h1>
          <p className="mt-2 text-muted-foreground">Manage your public identity and review recent games.</p>
        </div>
        <Badge variant="secondary">@{profile.username}</Badge>
      </div>

      {(message || error) && (
        <Alert variant={error ? "destructive" : "default"} className="mb-6">
          <AlertDescription>{error ?? message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Public profile</CardTitle>
              <CardDescription>This is shown to other players.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={assetUrl(profile.avatarUrl) ?? undefined} alt={profile.nickname} />
                  <AvatarFallback>{profile.nickname.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl font-bold">{profile.nickname}</div>
                  <div className="text-sm text-muted-foreground">{profile.email}</div>
                </div>
              </div>
              <form className="space-y-3" onSubmit={saveNickname}>
                <Label htmlFor="nickname">Nickname</Label>
                <Input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} />
                <Button type="submit" className="w-full">Save nickname</Button>
              </form>
              <form className="space-y-3" onSubmit={uploadAvatar}>
                <Label htmlFor="avatar">Profile photo</Label>
                <Input id="avatar" name="avatar" type="file" accept="image/*" />
                <Button type="submit" variant="outline" className="w-full">Upload avatar</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent game log</CardTitle>
            <CardDescription>Last 50 games played from this account.</CardDescription>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <p className="text-sm text-muted-foreground">No games yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 pr-3">Date</th>
                      <th className="py-3 pr-3">Mode</th>
                      <th className="py-3 pr-3">Opponent</th>
                      <th className="py-3 pr-3">Result</th>
                      <th className="py-3 pr-3">Moves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => {
                      const isX = game.xPlayer.id === profile.id;
                      const opponent = isX ? game.oPlayer : game.xPlayer;
                      const mark = isX ? "X" : "O";
                      const won = game.winner?.id === profile.id;
                      const result = game.status === "DRAW" ? "Draw" : game.status === "IN_PROGRESS" || game.status === "WAITING" ? gameStatusLabel(game.status) : won ? "Won" : "Lost";
                      return (
                        <tr key={game.id} className="border-b last:border-0">
                          <td className="py-3 pr-3">{new Date(game.createdAt).toLocaleString()}</td>
                          <td className="py-3 pr-3">{game.mode === "SINGLE_PLAYER" ? "Vs PC" : "Online"}</td>
                          <td className="py-3 pr-3">{opponent?.nickname ?? "Computer"}</td>
                          <td className="py-3 pr-3"><Badge variant={won ? "default" : result === "Lost" ? "destructive" : "secondary"}>{result} as {mark}</Badge></td>
                          <td className="py-3 pr-3">{game.moves.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
