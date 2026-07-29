"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/prisma";
import { parseId } from "@/lib/parseId";
import { logAdminAction } from "@/lib/audit";
import { Prisma } from "@/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";

export async function deleteUserAction(rawId: string): Promise<ActionState> {
  const admin = await requireAdmin();

  const id = parseId(rawId);
  if (id === null) return { status: "error", message: "Not found" };
  if (id === admin.id) return { status: "error", message: "Cannot delete your own account" };

  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return { status: "error", message: "Not found" };
  }

  try {
    await db.user.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003") {
        return { status: "error", message: "Cannot delete user: they still have notes, comments, or forum posts" };
      }
      if (err.code === "P2025") {
        return { status: "error", message: "Already deleted" };
      }
    }
    throw err;
  }

  logAdminAction(admin, "user.delete", target.id, target.email);
  revalidatePath("/admin");
  return { status: "success" };
}
