import { Router } from 'express';
import { Comment, Pdf, User } from '@prisma/client';
import { prisma } from '../db';
import { tokenRequired } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';
import { notFound, forbidden } from '../lib/httpError';
import { parseId } from '../lib/parseId';

const router = Router();
const MAX_COMMENT_LENGTH = 2000;

type CommentWithUser = Comment & { user: User };

function commentToDict(c: CommentWithUser) {
  return {
    id: c.id,
    pdfId: c.pdfId,
    userId: c.userId,
    userName: c.user.email,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null
  };
}

async function pdfOr403(rawPdfId: string, currentUser: User): Promise<Pdf> {
  const pdfId = parseId(rawPdfId);
  if (pdfId === null) throw notFound();
  const pdf = await prisma.pdf.findUnique({ where: { id: pdfId } });
  if (!pdf) throw notFound();
  if (currentUser.role !== 'admin' && currentUser.semester !== pdf.semester) throw forbidden();
  return pdf;
}

router.get(
  '/:pdfId(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const pdf = await pdfOr403(req.params.pdfId, req.currentUser!);
    const comments = await prisma.comment.findMany({
      where: { pdfId: pdf.id },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    });
    return res.status(200).json({ comments: comments.map(commentToDict) });
  })
);

router.post(
  '/:pdfId(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const pdf = await pdfOr403(req.params.pdfId, req.currentUser!);
    const text = String((req.body && req.body.text) || '').trim();
    if (!text) return res.status(400).json({ error: 'Text required' });
    if (text.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Comment too long (max ${MAX_COMMENT_LENGTH} characters)` });
    }
    const c = await prisma.comment.create({
      data: { pdfId: pdf.id, userId: req.currentUser!.id, text },
      include: { user: true }
    });
    return res.status(201).json({ comment: commentToDict(c) });
  })
);

router.put(
  '/:id(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) throw notFound();
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) throw notFound();
    if (existing.userId !== req.currentUser!.id) {
      return res.status(403).json({ error: 'Not your comment' });
    }
    const text = String((req.body && req.body.text) || '').trim();
    if (!text) return res.status(400).json({ error: 'Text required' });
    if (text.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({ error: `Comment too long (max ${MAX_COMMENT_LENGTH} characters)` });
    }
    const c = await prisma.comment.update({
      where: { id },
      data: { text },
      include: { user: true }
    });
    return res.status(200).json({ comment: commentToDict(c) });
  })
);

router.delete(
  '/:id(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) throw notFound();
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) throw notFound();
    if (existing.userId !== req.currentUser!.id && req.currentUser!.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
    await prisma.comment.delete({ where: { id } });
    return res.status(200).json({ message: 'Deleted' });
  })
);

export default router;
