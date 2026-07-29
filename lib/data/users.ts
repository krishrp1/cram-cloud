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

export async function listAllUsers(page: number, perPage: number) {
  const safePage = Math.max(page || 1, 1);
  const safePerPage = Math.min(Math.max(perPage || 20, 1), 100);

  const [users, total] = await Promise.all([
    db.user.findMany({
      orderBy: { id: "asc" },
      skip: (safePage - 1) * safePerPage,
      take: safePerPage,
    }),
    db.user.count(),
  ]);

  return {
    users: users.map(userToDict),
    total,
    pages: Math.ceil(total / safePerPage) || 1,
    currentPage: safePage,
  };
}
