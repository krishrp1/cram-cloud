"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import type { ActionState } from "@/lib/action-state";

const SALT_ROUNDS = 12;
// Fixed dummy hash compared against when a login email doesn't exist, so a
// missing user takes the same ~bcrypt-cost time as a wrong password —
// otherwise the endpoint leaks which emails are registered via response
// timing (a real, previously-found bug in the original implementation).
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeOxRp.PkT7wJI4TnP1zlt/dGZmzB1XZm.";

export async function registerAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getRequestIp();
  if (!(await checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000))) {
    return { status: "error", message: "Too many requests, please try again later" };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    semester: formData.get("semester"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password, semester } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { status: "error", message: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    // role is always 'student' here — admin accounts are provisioned
    // directly in the database, never via public registration.
    await db.user.create({ data: { email, passwordHash, role: "student", semester } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { status: "error", message: "Email already registered" };
    }
    throw err;
  }

  redirect("/login?registered=1");
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await getRequestIp();
  if (!(await checkRateLimit(`login:${ip}`, 10, 60 * 1000))) {
    return { status: "error", message: "Too many requests, please try again later" };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Email and password required" };
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  // Always run the bcrypt compare, even for a nonexistent user, against a
  // fixed dummy hash — see DUMMY_HASH comment above.
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !passwordOk) {
    return { status: "error", message: "Invalid credentials" };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
