// Vercel Node.js runtime entrypoint. `server.ts` (app.listen) is for local
// dev / non-serverless hosts only — Vercel calls this handler directly per
// request, it never listens on a port itself. vercel.json rewrites every
// path to this function, so req.url still carries the original path
// (e.g. /api/auth/login) for Express's own router to match on.
import { createApp } from '../src/app';

export default createApp();
