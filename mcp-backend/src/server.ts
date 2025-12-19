import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

import dbPlugin from "./plugins/db";
import usersRoutes from "./modules/users/users.routes";
import authRoutes from "./modules/auth/auth.routes";

function getCorsOrigins(): string[] {
  const raw = (process.env.CORS_ORIGINS ?? "http://localhost:4200").trim();
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function buildServer() {
  const server = Fastify({ logger: true });

  const allowedOrigins = getCorsOrigins();

  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });

  await server.register(dbPlugin);

  await server.register(usersRoutes);
  await server.register(authRoutes);

  server.get("/health", async () => {
    return { ok: true };
  });

  return server;
}

async function start() {
  const server = await buildServer();
  const port = Number(process.env.PORT) || 3000;

  try {
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info(`MCP backend running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
