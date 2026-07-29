import "server-only";
import { db } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

// Fire-and-forget by design: an audit-log write failing must never block
// or fail the admin mutation it's recording — losing one log row is far
// cheaper than an admin action erroring out because logging hiccuped.
export function logAdminAction(admin: User, action: string, targetId: number | null, detail?: string): void {
  db.adminAction
    .create({ data: { adminId: admin.id, adminEmail: admin.email, action, targetId, detail } })
    .catch((err) => console.error("Failed to write admin audit log", action, err));
}
