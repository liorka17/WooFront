"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/plugins/db.ts
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const pg_1 = require("pg");
async function connectPool() {
    const pool = new pg_1.Pool({
        host: process.env.PGHOST ?? "localhost",
        port: Number(process.env.PGPORT ?? 5432),
        user: process.env.PGUSER ?? "mcp_user",
        password: process.env.PGPASSWORD ?? "12345",
        database: process.env.PGDATABASE ?? "mcp_DB",
    });
    return pool;
}
const dbPlugin = (0, fastify_plugin_1.default)(async (server) => {
    const pool = await connectPool();
    server.decorate("db", pool);
    server.addHook("onClose", async () => {
        await pool.end();
    });
});
exports.default = dbPlugin;
