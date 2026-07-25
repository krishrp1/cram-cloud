import { Router } from 'express';
import { ForumReply, ForumThread, User } from '@prisma/client';
import { prisma } from '../db';
import { tokenRequired } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';
import { notFound, forbidden } from '../lib/httpError';
import { parseId } from '../lib/parseId';

const router = Router();
const MAX_TITLE_LENGTH = 255;
const MAX_CONTENT_LENGTH = 10000;

type ThreadWithCounts = ForumThread & { user: User; _count: { replies: number } };
type ReplyWithUser = ForumReply & { user: User };

function threadToDict(t: ThreadWithCounts) {
  return {
    id: t.id,
    userId: t.userId,
    userName: t.user.email,
    title: t.title,
    content: t.content,
    semester: t.semester,
    createdAt: t.createdAt.toISOString(),
    replyCount: t._count.replies
  };
}

function replyToDict(r: ReplyWithUser) {
  return {
    id: r.id,
    threadId: r.threadId,
    userId: r.userId,
    userName: r.user.email,
    content: r.content,
    createdAt: r.createdAt.toISOString()
  };
}

async function threadOr403(rawThreadId: string, currentUser: User): Promise<ThreadWithCounts> {
  const threadId = parseId(rawThreadId);
  if (threadId === null) throw notFound();
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    include: { user: true, _count: { select: { replies: true } } }
  });
  if (!thread) throw notFound();
  if (currentUser.role !== 'admin' && currentUser.semester !== thread.semester) throw forbidden();
  return thread;
}

router.get(
  '/',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    // Clamp both directions: an unbounded/negative per_page (from a
    // malformed or malicious query param) produces a negative Prisma
    // `skip`, which throws a validation error instead of returning results.
    const perPage = Math.min(Math.max(parseInt(String(req.query.per_page ?? '10'), 10) || 10, 1), 50);
    let requested = req.query.semester as string | undefined;
    if (requested && req.currentUser!.role !== 'admin') {
      requested = undefined;
    }
    const semester = requested || req.currentUser!.semester;

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where: { semester },
        include: { user: true, _count: { select: { replies: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      prisma.forumThread.count({ where: { semester } })
    ]);
    const pages = perPage > 0 ? Math.ceil(total / perPage) : 0;
    return res.status(200).json({
      threads: threads.map(threadToDict),
      total,
      pages,
      currentPage: page
    });
  })
);

router.post(
  '/',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const title = String((req.body && req.body.title) || '').trim();
    const content = String((req.body && req.body.content) || '').trim();
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ error: `Title too long (max ${MAX_TITLE_LENGTH} characters)` });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ error: `Content too long (max ${MAX_CONTENT_LENGTH} characters)` });
    }
    const t = await prisma.forumThread.create({
      data: {
        userId: req.currentUser!.id,
        title,
        content,
        semester: req.currentUser!.semester
      },
      include: { user: true, _count: { select: { replies: true } } }
    });
    return res.status(201).json({ thread: threadToDict(t) });
  })
);

router.get(
  '/:threadId(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const thread = await threadOr403(req.params.threadId, req.currentUser!);
    const replies = await prisma.forumReply.findMany({
      where: { threadId: thread.id },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    });
    return res.status(200).json({ thread: threadToDict(thread), replies: replies.map(replyToDict) });
  })
);

router.delete(
  '/:threadId(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const thread = await threadOr403(req.params.threadId, req.currentUser!);
    if (thread.userId !== req.currentUser!.id && req.currentUser!.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    await prisma.forumThread.delete({ where: { id: thread.id } });
    return res.status(200).json({ message: 'Deleted' });
  })
);

router.post(
  '/:threadId(\\d+)/reply',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const thread = await threadOr403(req.params.threadId, req.currentUser!);
    const content = String((req.body && req.body.content) || '').trim();
    if (!content) return res.status(400).json({ error: 'Content required' });
    if (content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ error: `Content too long (max ${MAX_CONTENT_LENGTH} characters)` });
    }
    const r = await prisma.forumReply.create({
      data: { threadId: thread.id, userId: req.currentUser!.id, content },
      include: { user: true }
    });
    return res.status(201).json({ reply: replyToDict(r) });
  })
);

router.put(
  '/reply/:id(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) throw notFound();
    const existing = await prisma.forumReply.findUnique({ where: { id } });
    if (!existing) throw notFound();
    if (existing.userId !== req.currentUser!.id) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    const content = String((req.body && req.body.content) || '').trim();
    if (!content) return res.status(400).json({ error: 'Content required' });
    if (content.length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ error: `Content too long (max ${MAX_CONTENT_LENGTH} characters)` });
    }
    const r = await prisma.forumReply.update({
      where: { id },
      data: { content },
      include: { user: true }
    });
    return res.status(200).json({ reply: replyToDict(r) });
  })
);

router.delete(
  '/reply/:id(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) throw notFound();
    const existing = await prisma.forumReply.findUnique({ where: { id } });
    if (!existing) throw notFound();
    if (existing.userId !== req.currentUser!.id && req.currentUser!.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    await prisma.forumReply.delete({ where: { id } });
    return res.status(200).json({ message: 'Deleted' });
  })
);

export default router;
