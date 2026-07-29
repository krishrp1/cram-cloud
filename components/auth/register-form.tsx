"use client";

import { useActionState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { registerAction } from "@/lib/actions/auth";
import { IDLE_STATE } from "@/lib/action-state";
import { SEMESTERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, IDLE_STATE);

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="bg-accent mx-auto mb-1 flex size-12 items-center justify-center rounded-full">
          <GraduationCap className="text-accent-foreground size-6" aria-hidden />
        </div>
        <CardTitle className="font-heading text-2xl">Create your account</CardTitle>
        <CardDescription>Join your semester&apos;s notes &amp; discussions</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">College Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name.sm24@bmsce.ac.in"
              pattern="[A-Za-z]+(\.[A-Za-z]+)*\.[A-Za-z]{2}[0-9]{2}@bmsce\.ac\.in"
              title="Format: name.XX##@bmsce.ac.in (e.g. john.sm24@bmsce.ac.in)"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="semester">Semester</Label>
            <Select name="semester" required>
              <SelectTrigger id="semester" className="w-full">
                <SelectValue placeholder="Select your semester" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="bg-cta text-cta-foreground hover:bg-cta/90 w-full"
          >
            {pending ? "Creating account…" : "Create Account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
