import fp from "fastify-plugin";
import { Pool } from "pg";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    db: Pool;
  }
}

function mustGet(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

async function connectPool() {
  const pool = new Pool({
    host: mustGet("PGHOST", "localhost"),
    port: Number(mustGet("PGPORT", "5432")),
    user: mustGet("PGUSER", "mcp_user"),
    password: mustGet("PGPASSWORD", "123"),
    database: mustGet("PGDATABASE", "appdb"),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  await pool.query("SELECT 1");
  return pool;
}

const dbPlugin = fp(async (server: FastifyInstance) => {
  const pool = await connectPool();

  server.decorate("db", pool);

  server.addHook("onClose", async () => {
    await pool.end();
  });
});

export default dbPlugin;
