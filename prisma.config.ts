import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js convention is `.env.local`, not `.env` — dotenv's default
// `dotenv/config` import only looks for `.env`, so point it explicitly.
loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Direct (non-pooled) connection — migrations/introspection only, never
  // used at runtime (the app connects via the pooled DATABASE_URL through
  // the PrismaPg adapter in lib/prisma.ts).
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
