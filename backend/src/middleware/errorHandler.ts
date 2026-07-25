import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError } from '../lib/httpError';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: 'Bad request' });
  }
  if (err && typeof err === 'object' && (err as { type?: string }).type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large' });
  }
  if (err instanceof SyntaxError && (err as { status?: number }).status === 400) {
    return res.status(400).json({ error: 'Bad request' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
