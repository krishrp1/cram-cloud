import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '../db';
import { config } from '../config';

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export async function tokenRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader) {
    token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
  }
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret as string) as { user_id: number };
    const currentUser = await prisma.user.findUnique({ where: { id: payload.user_id } });
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.currentUser = currentUser;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminRequired(req: Request, res: Response, next: NextFunction) {
  if (req.currentUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
