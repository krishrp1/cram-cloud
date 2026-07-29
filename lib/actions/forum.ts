"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, canAccessSemester } from "@/lib/auth/dal";
import { db } from "@/lib/prisma";
import { parseId } from "@/lib/parseId";
import { checkRateLimit } from "@/lib/rate-limit";
import { createThreadSchema, replyContentSchema } from "@/lib/validations/forum";
import { Prisma, type User } from "@/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";

async function getAuthorizedThread(rawId: string, user: User) {
  const id = parseId(rawId);
  if (id === null) return null;
  const thread = await db.forumThread.findUnique({ where: { id } });
  if (!thread) return null;
  if (!canAccessSemester(user, thread.semester)) return null;
  return thread;
}

export async function createThreadAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  if (!(await checkRateLimit(`thread:${user.id}`, 10, 60 * 60 * 1000))) {
    return { status: "error", message: "Too many requests, please try again later" };
  }

  const parsed = createThreadSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const thread = await db.forumThread.create({
    data: { userId: user.id, title: parsed.data.title, content: parsed.data.content, semester: user.semester },
  });

  revalidatePath("/forum");
  redirect(`/forum/${thread.id}`);
}

export async function deleteThreadAction(rawId: string): Promise<ActionState> {
  const user = await requireUser();

  const thread = await getAuthorizedThread(rawId, user);
  if (!thread) return { status: "error", message: "Not found" };
  if (thread.userId !== user.id && user.role !== "admin") {
    return { status: "error", message: "Not allowed" };
  }

  try {
    await db.forumThread.delete({ where: { id: thread.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { status: "error", message: "Already deleted" };
    }
    throw err;
  }
  revalidatePath("/forum");
  redirect("/forum");
}

export async function postReplyAction(rawThreadId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  if (!(await checkRateLimit(`reply:${user.id}`, 30, 60 * 1000))) {
    return { status: "error", message: "Too many requests, please slow down" };
  }

  const thread = await getAuthorizedThread(rawThreadId, user);
  if (!thread) return { status: "error", message: "Not found" };

  const parsed = replyContentSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.forumReply.create({
    data: { threadId: thread.id, userId: user.id, content: parsed.data.content },
  });

  revalidatePath(`/forum/${thread.id}`);
  return { status: "success" };
}

export async function editReplyAction(rawId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const id = parseId(rawId);
  if (id === null) return { status: "error", message: "Not found" };
  const existing = await db.forumReply.findUnique({ where: { id } });
  if (!existing) return { status: "error", message: "Not found" };
  if (existing.userId !== user.id) return { status: "error", message: "Not allowed" };

  const parsed = replyContentSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.forumReply.update({ where: { id }, data: { content: parsed.data.content } });
  revalidatePath(`/forum/${existing.threadId}`);
  return { status: "success" };
}

export async function deleteReplyAction(rawId: string): Promise<ActionState> {
  const user = await requireUser();

  const id = parseId(rawId);
  if (id === null) return { status: "error", message: "Not found" };
  const existing = await db.forumReply.findUnique({ where: { id } });
  if (!existing) return { status: "error", message: "Not found" };
  if (existing.userId !== user.id && user.role !== "admin") {
    return { status: "error", message: "Not allowed" };
  }

  try {
    await db.forumReply.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { status: "error", message: "Already deleted" };
    }
    throw err;
  }
  revalidatePath(`/forum/${existing.threadId}`);
  return { status: "success" };
}
