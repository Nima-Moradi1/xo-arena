import type { PublicUser } from "@xo/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { assetUrl, cn } from "@/lib/utils";

export function PlayerCard({ player, mark, active }: { player: PublicUser | null; mark: "X" | "O"; active?: boolean }) {
  const initials = player?.nickname?.slice(0, 2).toUpperCase() ?? "PC";

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-card p-3", active && "ring-2 ring-ring")}>
      <Avatar>
        <AvatarImage src={assetUrl(player?.avatarUrl) ?? undefined} alt={player?.nickname ?? "Computer"} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{player?.nickname ?? "Computer"}</div>
        <div className="truncate text-xs text-muted-foreground">{player?.username ? `@${player.username}` : "Unbeatable AI"}</div>
      </div>
      <Badge variant={active ? "default" : "secondary"}>{mark}</Badge>
    </div>
  );
}
