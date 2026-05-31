import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient | null = null;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else if (process.env.DATABASE_URL) {
  try {
    const url = process.env.DATABASE_URL;
    if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
      const { PrismaPg } = require("@prisma/adapter-pg");
      const { Pool } = require("pg");
      const pool = new Pool({ connectionString: url });
      prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    } else if (url.startsWith("file:")) {
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
      prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
    }
    if (prisma && process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma;
    }
  } catch (e) {
    console.warn("Database unavailable:", (e as Error)?.message);
  }
}

export { prisma };
