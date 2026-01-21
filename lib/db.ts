import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Optimized connection pool configuration for serverless and edge environments
const pool = globalForPrisma.pool ?? new Pool({
  connectionString,
  // Maximum number of clients in the pool (optimized for serverless)
  max: process.env.NODE_ENV === "production" ? 10 : 5,
  // Minimum number of clients to keep in the pool
  min: 0,
  // Maximum time (ms) a client can be idle before being closed
  idleTimeoutMillis: 30000,
  // Maximum time (ms) to wait for a connection
  connectionTimeoutMillis: 10000,
  // Allow graceful shutdown
  allowExitOnIdle: true,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Disable connection warnings in production
    errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
  });

// Store in global to prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

// Graceful shutdown handler for production
if (process.env.NODE_ENV === "production") {
  const cleanup = async () => {
    await pool.end();
    await prisma.$disconnect();
  };

  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
}

export default prisma;
