import { PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string {
  const mode = process.env.DB_MODE || "local";
  if (mode === "supabase") {
    return process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL!;
  }
  return process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL!;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasourceUrl: getDatabaseUrl(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
