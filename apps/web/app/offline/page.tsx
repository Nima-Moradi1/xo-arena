import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>You are offline</CardTitle>
          <CardDescription>XO Arena is installed, but online games and login need a network connection.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Reconnect to keep playing and sync your profile/game history.</CardContent>
        <CardFooter>
          <Button asChild className="w-full"><Link href="/">Back home</Link></Button>
        </CardFooter>
      </Card>
    </div>
  );
}
