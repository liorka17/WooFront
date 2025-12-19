"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const auth_service_1 = require("./auth.service");
async function authRoutes(server) {
    // POST /api/auth/login
    server.post("/api/auth/login", async (request, reply) => {
        try {
            const result = await (0, auth_service_1.loginUser)(server.db, request.body);
            return reply.status(result.status).send(result);
        }
        catch (err) {
            request.log.error(err);
            return reply.status(500).send({
                ok: false,
                error: "Server error",
            });
        }
    });
    // GET /api/auth/me  – בדיקת טוקן והחזרת המשתמש מה JWT
    server.get("/api/auth/me", async (request, reply) => {
        try {
            const authHeader = request.headers.authorization || "";
            const [, token] = authHeader.split(" ");
            if (!token) {
                return reply.status(401).send({
                    ok: false,
                    error: "Missing or invalid Authorization header",
                });
            }
            const payload = (0, auth_service_1.verifyToken)(token);
            return reply.status(200).send({
                ok: true,
                user: payload,
            });
        }
        catch (err) {
            request.log.error(err);
            return reply.status(401).send({
                ok: false,
                error: "Invalid or expired token",
            });
        }
    });
}
