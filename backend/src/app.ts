import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config';
import authRouter from './routes/auth';
import pdfRouter from './routes/pdf';
import commentsRouter from './routes/comments';
import forumRouter from './routes/forum';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  validateConfig();

  const app = express();

  app.use(cors({ origin: config.corsOrigins, credentials: false }));
  app.use(express.json({ limit: config.maxContentLength }));

  app.use(
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => res.status(429).json({ error: 'Too many requests, please try again later' })
    })
  );

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  app.use('/api/auth', authRouter);
  app.use('/api/pdf', pdfRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/forum', forumRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
