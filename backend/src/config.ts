import dotenv from 'dotenv';

dotenv.config();

export const SEMESTERS = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
  jwtSecret: process.env.JWT_SECRET,
  maxContentLength: parseInt(process.env.MAX_CONTENT_LENGTH || '52428800', 10),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  port: parseInt(process.env.PORT || '8000', 10),
  supabaseUrl: process.env.SUPABASE_URL,
  // Service role key — bypasses RLS, server-side only, never expose to a client.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'pdfs'
};

export function validateConfig() {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  if (!config.databaseUrl || !config.directUrl) {
    throw new Error('DATABASE_URL / DIRECT_URL environment variables are not set');
  }
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables are not set');
  }
}
