import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import {
  registerUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUserById,
} from "./users.service";
import type { RegisterBody, UpdateUserBody } from "./users.types";

const usersRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Register
  server.post<{
    Body: RegisterBody;
  }>("/api/auth/register", async (request, reply) => {
    try {
      const body = request.body;

      if (
        !body.fullName ||
        !body.email ||
        !body.password ||
        !body.role ||
        !body.storeUrl ||
        !body.plan
      ) {
        return reply.status(400).send({
          ok: false,
          error: "Missing required fields",
        });
      }

      const user = await registerUser(server.db, body);

      return reply.status(201).send({
        ok: true,
        user,
      });
    } catch (err: any) {
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
    const users = await getAllUsers(server.db);
    return reply.send({ ok: true, users });
  });

  // GET לפי id
  server.get<{
    Params: { id: string };
  }>("/api/users/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const user = await getUserById(server.db, id);
    if (!user) {
      return reply.status(404).send({ ok: false, error: "User not found" });
    }
    return reply.send({ ok: true, user });
  });

  // PUT עדכון משתמש
  server.put<{
    Params: { id: string };
    Body: UpdateUserBody;
  }>("/api/users/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const updated = await updateUser(server.db, id, request.body);
    if (!updated) {
      return reply.status(404).send({ ok: false, error: "User not found" });
    }
    return reply.send({ ok: true, user: updated });
  });

  // DELETE מחיקה
  server.delete<{
    Params: { id: string };
  }>("/api/users/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const ok = await deleteUserById(server.db, id);
    if (!ok) {
      return reply.status(404).send({ ok: false, error: "User not found" });
    }
    return reply.send({ ok: true });
  });
};

export default usersRoutes;
