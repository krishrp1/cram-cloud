"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { IDLE_STATE } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm({ justRegistered }: { justRegistered: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, IDLE_STATE);

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="text-3xl">📚</div>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to access your course notes</CardDescription>
      </CardHeader>
      <CardContent>
        {justRegistered && state.status === "idle" && (
          <Alert className="mb-4">
            <AlertDescription>Account created! Sign in to continue.</AlertDescription>
          </Alert>
        )}
        {state.status === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="your@email.com" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
