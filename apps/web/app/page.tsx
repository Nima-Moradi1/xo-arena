import Link from "next/link";
import { ArrowRight, Gamepad2, LockKeyhole, MonitorSmartphone, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: LockKeyhole,
    title: "Verified auth",
    description: "Email/password signup, verification links, and secure httpOnly session cookies."
  },
  {
    icon: Users,
    title: "Online multiplayer",
    description: "Socket.IO rooms keep both players synchronized in real time."
  },
  {
    icon: MonitorSmartphone,
    title: "Installable PWA",
    description: "Android and iOS friendly manifest, icons, theme metadata, and service worker."
  },
  {
    icon: Sparkles,
    title: "Reusable design system",
    description: "ShadCN-style components powered by one light/dark CSS variable theme."
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            <Gamepad2 className="h-4 w-4" /> Fullstack X-O with MySQL
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Play X-O against the computer or real online players.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            XO Arena is a production-style starter: Next.js latest, Tailwind, shadCN-style UI, TypeScript,
            Express, Socket.IO, Prisma, MySQL, profile photos, history logs, and PWA install support.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/lobby">Go to lobby</Link>
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Live board preview</CardTitle>
            <CardDescription>Responsive, touch-friendly, and theme-aware.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {["X", null, "O", null, "X", null, "O", null, "X"].map((cell, index) => (
                <div key={index} className="flex aspect-square items-center justify-center rounded-2xl border bg-muted text-5xl font-black">
                  {cell}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="h-6 w-6" />
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{feature.description}</CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
