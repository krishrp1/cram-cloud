import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { Prisma, User } from '@prisma/client';
import { prisma } from '../db';
import { config, SEMESTERS } from '../config';
import { hashPassword, verifyPassword } from '../lib/password';
import { tokenRequired } from '../middleware/auth';
import { asyncHandler } from '../lib/asyncHandler';
import { notFound } from '../lib/httpError';
import { parseId } from '../lib/parseId';

const router = Router();

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD_LENGTH = 8;
// bcrypt only reads the first 72 bytes of its input — anything past that is
// silently ignored, so two different passwords sharing a 72-byte prefix
// would hash identically. Reject before that happens rather than let it
// truncate quietly.
const MAX_PASSWORD_BYTES = 72;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 4.5.3.1.3
// Used to keep login response time constant when the email doesn't exist,
// so the endpoint can't be used to enumerate registered accounts by timing
// the bcrypt compare.
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeOxRp.PkT7wJI4TnP1zlt/dGZmzB1XZm.';

const rateLimitHandler = (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
  res.status(429).json({ error: 'Too many requests, please try again later' });

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

function userToDict(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    semester: user.semester,
    createdAt: user.createdAt.toISOString()
  };
}

router.post(
  '/register',
  registerLimiter,
  asyncHandler(async (req, res) => {
    const data = req.body || {};
    for (const field of ['email', 'password', 'semester']) {
      if (!data[field]) {
        return res.status(400).json({ error: `Missing: ${field}` });
      }
    }

    const email = String(data.email).trim().toLowerCase();
    const password = String(data.password);
    const semester = data.semester;

    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }
    if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
      return res.status(400).json({ error: `Password must be at most ${MAX_PASSWORD_BYTES} bytes` });
    }
    if (!SEMESTERS.includes(semester)) {
      return res.status(400).json({ error: 'Invalid semester' });
    }
    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // role is always 'student' here — admin accounts are provisioned directly
    // in the database, never via the public registration endpoint.
    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(password),
          role: 'student',
          semester
        }
      });
      return res.status(201).json({ message: 'Registered', user: userToDict(user) });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw err;
    }
  })
);

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const data = req.body || {};
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    // Always run the bcrypt compare, even for a nonexistent user, against a
    // fixed dummy hash — otherwise a missing user short-circuits instantly
    // while a wrong password takes ~bcrypt-cost ms, letting an attacker
    // enumerate registered emails purely from response time.
    const passwordOk = await verifyPassword(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { user_id: user.id, exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 },
      config.jwtSecret as string,
      { algorithm: 'HS256' }
    );
    return res.status(200).json({ token, user: userToDict(user) });
  })
);

router.get(
  '/me',
  tokenRequired,
  asyncHandler(async (req, res) => {
    return res.status(200).json({ user: userToDict(req.currentUser!) });
  })
);

router.get(
  '/users',
  tokenRequired,
  asyncHandler(async (req, res) => {
    if (req.currentUser!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    return res.status(200).json({ users: users.map(userToDict) });
  })
);

router.delete(
  '/users/:id(\\d+)',
  tokenRequired,
  asyncHandler(async (req, res) => {
    if (req.currentUser!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    const userId = parseId(req.params.id);
    if (userId === null) throw notFound();
    if (userId === req.currentUser!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    if (!(await prisma.user.findUnique({ where: { id: userId } }))) {
      throw notFound();
    }
    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        return res
          .status(409)
          .json({ error: 'Cannot delete user: they still have notes, comments, or forum posts' });
      }
      throw err;
    }
    return res.status(200).json({ message: 'User deleted' });
  })
);

export default router;
