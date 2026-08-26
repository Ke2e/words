import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

// dev 热重载时复用全局连接，避免连接泄漏
const globalForDb = globalThis as unknown as { __postgresClient?: ReturnType<typeof postgres> };

const client = globalForDb.__postgresClient ?? postgres(connectionString);
if (process.env.NODE_ENV !== "production") {
  globalForDb.__postgresClient = client;
}

export const db = drizzle(client);

export * from "drizzle-orm";
