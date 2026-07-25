import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import type { User } from "@/generated/prisma/client";

// Memoized per request — several Server Components on the same page can
// each call getCurrentUser() without triggering duplicate DB round-trips.
//
// Deliberately re-reads the user row from the DB on every request rather
// than trusting the JWT payload's claims (mirrors the original Express
// tokenRequired middleware) — a role change or account deletion takes
// effect immediately instead of waiting for the session to expire.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const payload = await getSessionPayload();
  if (!payload) return null;
  return db.user.findUnique({ where: { id: payload.userId } });
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export function canAccessSemester(user: User, semester: string): boolean {
  return user.role === "admin" || user.semester === semester;
}
