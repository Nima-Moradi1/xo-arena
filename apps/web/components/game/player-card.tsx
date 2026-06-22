import type { PublicUser } from "@xo/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { assetUrl, cn } from "@/lib/utils";

export function PlayerCard({
  player,
  mark,
  active,
  waiting = false
}: {
  player: PublicUser | null;
  mark: "X" | "O";
  active?: boolean;
  waiting?: boolean;
}) {
  const initials = waiting ? "?" : player?.nickname?.slice(0, 2).toUpperCase() ?? "PC";
  const displayName = waiting ? "Waiting for player" : player?.nickname ?? "Computer";
  const subtitle = waiting ? "Searching for an online opponent" : player?.username ? `@${player.username}` : "Computer opponent";

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-card p-3", active && "ring-2 ring-ring")}>
      <Avatar>
        <AvatarImage src={assetUrl(player?.avatarUrl) ?? undefined} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate font-semibold", waiting && "animate-pulse text-primary")}>{displayName}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <Badge variant={active ? "default" : "secondary"}>{mark}</Badge>
    </div>
  );
}
