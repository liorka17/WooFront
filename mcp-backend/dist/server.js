"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const db_1 = __importDefault(require("./plugins/db"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
async function buildServer() {
    const server = (0, fastify_1.default)({
        logger: true,
    });
    await server.register(cors_1.default, {
        origin: ["http://localhost:4200"],
        credentials: true,
    });
    await server.register(db_1.default);
    await server.register(users_routes_1.default);
    await server.register(auth_routes_1.default);
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
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();
