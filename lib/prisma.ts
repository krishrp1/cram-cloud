import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  // max: 3 — the connection string already points at Supabase's
  // transaction-mode pooler, but capping the adapter's own pool keeps a
  // burst of concurrent serverless invocations from each opening a full
  // connection set against that pooler's own budget.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
