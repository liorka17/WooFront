"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const users_service_1 = require("./users.service");
const usersRoutes = async (server) => {
    // Register
    server.post("/api/auth/register", async (request, reply) => {
        try {
            const body = request.body;
            if (!body.fullName ||
                !body.email ||
                !body.password ||
                !body.role ||
                !body.storeUrl ||
                !body.plan) {
                return reply.status(400).send({
                    ok: false,
                    error: "Missing required fields",
                });
            }
            const user = await (0, users_service_1.registerUser)(server.db, body);
            return reply.status(201).send({
                ok: true,
                user,
            });
        }
        catch (err) {
            if (err instanceof Error && err.message === "USER_EXISTS") {
                return reply.status(409).send({
                    ok: false,
                    error: "User with this email already exists",
                });
            }
            request.log.error(err);
            return reply.status(500).send({
                ok: false,
                error: "Server error",
            });
        }
    });
    // GET כל המשתמשים
    server.get("/api/users", async (request, reply) => {
        const users = await (0, users_service_1.getAllUsers)(server.db);
        return reply.send({ ok: true, users });
    });
    // GET לפי id
    server.get("/api/users/:id", async (request, reply) => {
        const id = Number(request.params.id);
        const user = await (0, users_service_1.getUserById)(server.db, id);
        if (!user) {
            return reply.status(404).send({ ok: false, error: "User not found" });
        }
        return reply.send({ ok: true, user });
    });
    // PUT עדכון משתמש
    server.put("/api/users/:id", async (request, reply) => {
        const id = Number(request.params.id);
        const updated = await (0, users_service_1.updateUser)(server.db, id, request.body);
        if (!updated) {
            return reply.status(404).send({ ok: false, error: "User not found" });
        }
        return reply.send({ ok: true, user: updated });
    });
    // DELETE מחיקה
    server.delete("/api/users/:id", async (request, reply) => {
        const id = Number(request.params.id);
        const ok = await (0, users_service_1.deleteUserById)(server.db, id);
        if (!ok) {
            return reply.status(404).send({ ok: false, error: "User not found" });
        }
        return reply.send({ ok: true });
    });
};
exports.default = usersRoutes;
