import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

import dbPlugin from "./plugins/db";
import usersRoutes from "./modules/users/users.routes";
import authRoutes from "./modules/auth/auth.routes";

async function buildServer() {
  const server = Fastify({
    logger: true,
  });

  await server.register(cors, {
    origin: ["http://localhost:4200"],
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
