"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch, ApiClientError } from "@/lib/api";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailCard message="Verifying your email..." state="loading" />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function VerifyEmailPageContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Verification token is missing.");
      return;
    }

    apiFetch<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setState("success");
        setMessage(data.message);
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof ApiClientError ? error.message : "Verification failed.");
      });
  }, [token]);

  return <VerifyEmailCard message={message} state={state} />;
}

function VerifyEmailCard({
  message,
  state
}: {
  message: string;
  state: "loading" | "success" | "error";
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>Activate your account before logging in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant={state === "error" ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" disabled={state === "loading"}>
            <Link href="/login">Go to login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
