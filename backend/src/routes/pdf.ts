import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import { Pdf, User } from '@prisma/client';
import { prisma } from '../db';
import { config, SEMESTERS } from '../config';
import { tokenRequired, adminRequired } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';
import { notFound, forbidden } from '../lib/httpError';
import { parseId } from '../lib/parseId';
import { uploadPdf, downloadPdf, deletePdf } from '../lib/storage';

const router = Router();
const ALLOWED = new Set(['pdf']);
const PDF_MAGIC = Buffer.from('%PDF-');
const MAX_TITLE_LENGTH = 255;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxContentLength } });

type PdfWithUploader = Pdf & { uploader: User };

function allowed(filename: string) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return false;
  return ALLOWED.has(filename.slice(idx + 1).toLowerCase());
}

function canAccessSemester(currentUser: User, semester: string) {
  return currentUser.role === 'admin' || currentUser.semester === semester;
}

function secureFilename(filename: string) {
  return path.basename(filename).replace(/[^A-Za-z0-9_.-]/g, '_');
}

function pdfToDict(pdf: PdfWithUploader) {
  return {
    id: pdf.id,
    title: pdf.title,
    filename: pdf.filename,
    semester: pdf.semester,
    uploadedBy: pdf.uploader.email,
    fileUrl: pdf.fileUrl,
    uploadDate: pdf.uploadDate.toISOString()
  };
}

async function getPdfOr404(rawId: string): Promise<PdfWithUploader> {
  const id = parseId(rawId);
  if (id === null) throw notFound();
  const pdf = await prisma.pdf.findUnique({ where: { id }, include: { uploader: true } });
  if (!pdf) throw notFound();
  return pdf;
}

router.get(
  '/',
  tokenRequired,
  asyncHandler(async (req, res) => {
    let requested = req.query.semester as string | undefined;
    if (requested && req.currentUser!.role !== 'admin') {
      // non-admins may only ever see their own semester, regardless of query param
      requested = undefined;
    }
    const semester = requested || req.currentUser!.semester;
    const pdfs = await prisma.pdf.findMany({
      where: { semester },
      include: { uploader: true },
      orderBy: { uploadDate: 'desc' }
    });
    return res.status(200).json({ pdfs: pdfs.map(pdfToDict) });
  })
);

router.get(
  '/all',
  tokenRequired,
  adminRequired,
  asyncHandler(async (_req, res) => {
    const pdfs = await prisma.pdf.findMany({ include: { uploader: true }, orderBy: { uploadDate: 'desc' } });
    return res.status(200).json({ pdfs: pdfs.map(pdfToDict) });
  })
);

router.get(
  '/:id(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const pdf = await getPdfOr404(req.params.id);
    if (!canAccessSemester(req.currentUser!, pdf.semester)) throw forbidden();
    return res.status(200).json({ pdf: pdfToDict(pdf) });
  })
);

router.get(
  '/file/:id(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    const pdf = await getPdfOr404(req.params.id);
    if (!canAccessSemester(req.currentUser!, pdf.semester)) throw forbidden();
    const buffer = await downloadPdf(pdf.filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.filename}"`);
    return res.send(buffer);
  })
);

router.post(
  '/',
  tokenRequired,
  adminRequired,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file' });
    }
    const title = String(req.body.title || '').trim();
    const semester = req.body.semester;
    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ error: `Title too long (max ${MAX_TITLE_LENGTH} characters)` });
    }
    if (!SEMESTERS.includes(semester)) {
      return res.status(400).json({ error: 'Invalid semester' });
    }
    if (!file.originalname) {
      return res.status(400).json({ error: 'No file selected' });
    }
    if (!allowed(file.originalname)) {
      return res.status(400).json({ error: 'PDF only' });
    }
    if (!file.buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      return res.status(400).json({ error: 'File is not a valid PDF' });
    }

    const safeName = secureFilename(file.originalname);
    const ext = path.extname(safeName);
    const base = path.basename(safeName, ext);
    const filename = `${base}_${Math.floor(Date.now() / 1000)}${ext}`;
    await uploadPdf(filename, file.buffer);

    const created = await prisma.pdf.create({
      data: { title, filename, semester, uploadedBy: req.currentUser!.id, fileUrl: '' }
    });
    const withUrl = await prisma.pdf.update({
      where: { id: created.id },
      data: { fileUrl: `/api/pdf/file/${created.id}` },
      include: { uploader: true }
    });
    return res.status(201).json({ message: 'Uploaded', pdf: pdfToDict(withUrl) });
  })
);

router.delete(
  '/:id(\\d+)',
  tokenRequired,
  adminRequired,
  asyncHandler(async (req, res) => {
    const pdf = await getPdfOr404(req.params.id);
    try {
      await deletePdf(pdf.filename);
    } catch (err) {
      // Storage object may already be gone; don't let a storage-side hiccup
      // block removing the (bad) DB row.
      console.error('Failed to delete storage object for pdf', pdf.id, err);
    }
    await prisma.pdf.delete({ where: { id: pdf.id } });
    return res.status(200).json({ message: 'Deleted' });
  })
);

export default router;
