import "server-only";
import { db } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

function userToDict(u: User) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    semester: u.semester,
    createdAt: u.createdAt.toISOString(),
  };
}

export type UserListItem = ReturnType<typeof userToDict>;

export async function listAllUsers(): Promise<UserListItem[]> {
  const users = await db.user.findMany({ orderBy: { id: "asc" } });
  return users.map(userToDict);
}
