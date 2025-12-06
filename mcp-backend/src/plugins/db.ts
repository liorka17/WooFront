// src/plugins/db.ts
import fp from "fastify-plugin";
import { Pool } from "pg";
import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    db: Pool;
  }
}

async function connectPool() {
  const pool = new Pool({
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? "mcp_user",
    password: process.env.PGPASSWORD ?? "12345",
    database: process.env.PGDATABASE ?? "mcp_DB",
  });

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
