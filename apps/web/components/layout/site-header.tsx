"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/75 shadow-sm shadow-primary/5 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Gamepad2 className="h-5 w-5" />
          </span>
          <span>XO Arena</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/lobby">Lobby</Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild aria-label="Profile">
                <Link href="/profile">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Logout" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
