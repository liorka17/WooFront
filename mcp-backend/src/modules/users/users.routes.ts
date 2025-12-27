import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"; // טיפוסים
import { getAllUsers, getUserById, updateUser, deleteUserById } from "./users.service";           // שירות
import type { UpdateUserBody } from "./users.types";                                              // טיפוס

type JwtUser = { id: string; email: string; role: string };                                      // user מתוך jwt

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {                        // אימות JWT
  try {                                                                                           // try
    await (request as any).jwtVerify();                                                           // אימות עם fastify jwt
  } catch {                                                                                       // catch
    return reply.status(401).send({ ok: false, error: "Unauthorized" });                          // 401
  }                                                                                               // סוף catch
}                                                                                                 // סוף requireAuth

function requireAdmin(request: FastifyRequest, reply: FastifyReply) {                             // בדיקת admin
  const user = (request as any).user as JwtUser | undefined;                                      // user מה jwtVerify
  if (!user || user.role !== "admin") {                                                           // אם לא admin
    return reply.status(403).send({ ok: false, error: "Admin only" });                            // 403
  }                                                                                               // סוף תנאי
}                                                                                                 // סוף requireAdmin

function requireSelfOrAdmin(request: FastifyRequest, reply: FastifyReply) {                       // עצמי או admin
  const user = (request as any).user as JwtUser | undefined;                                      // user
  const idParam = String((request as any).params?.id ?? "");                                      // id מהנתיב
  if (!user) return reply.status(401).send({ ok: false, error: "Unauthorized" });                 // אם אין user
  if (user.role === "admin") return;                                                              // admin מותר
  if (String(user.id) === idParam) return;                                                        // עצמי מותר
  return reply.status(403).send({ ok: false, error: "Forbidden" });                               // אחרת חסום
}                                                                                                 // סוף requireSelfOrAdmin

const usersRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {                      // פלאגין

  server.get(                                                                                      // GET all users
    "/api/users",                                                                                  // נתיב
    { preHandler: [requireAuth, requireAdmin] },                                                   // חייב admin
    async (request, reply) => {                                                                    // handler
      const users = await getAllUsers(server.db);                                                  // שליפה
      return reply.send({ ok: true, users });                                                      // החזרה
    }                                                                                              // סוף handler
  );                                                                                               // סוף route

  server.get<{ Params: { id: string } }>(                                                          // GET user by id
    "/api/users/:id",                                                                              // נתיב
    { preHandler: [requireAuth, requireSelfOrAdmin] },                                             // עצמי או admin
    async (request, reply) => {                                                                    // handler
      const id = Number(request.params.id);                                                        // id
      const user = await getUserById(server.db, id);                                               // שליפה
      if (!user) return reply.status(404).send({ ok: false, error: "User not found" });            // 404
      return reply.send({ ok: true, user });                                                       // החזרה
    }                                                                                              // סוף handler
  );                                                                                               // סוף route

  server.put<{ Params: { id: string }; Body: UpdateUserBody }>(                                    // PUT update
    "/api/users/:id",                                                                              // נתיב
    { preHandler: [requireAuth, requireAdmin] },                                                   // רק admin
    async (request, reply) => {                                                                    // handler
      const id = Number(request.params.id);                                                        // id
      const updated = await updateUser(server.db, id, request.body);                               // עדכון
      if (!updated) return reply.status(404).send({ ok: false, error: "User not found" });         // 404
      return reply.send({ ok: true, user: updated });                                              // החזרה
    }                                                                                              // סוף handler
  );                                                                                               // סוף route

  server.delete<{ Params: { id: string } }>(                                                       // DELETE
    "/api/users/:id",                                                                              // נתיב
    { preHandler: [requireAuth, requireAdmin] },                                                   // רק admin
    async (request, reply) => {                                                                    // handler
      const id = Number(request.params.id);                                                        // id
      const ok = await deleteUserById(server.db, id);                                              // מחיקה
      if (!ok) return reply.status(404).send({ ok: false, error: "User not found" });              // 404
      return reply.send({ ok: true });                                                             // הצלחה
    }                                                                                              // סוף handler
  );                                                                                               // סוף route
};                                                                                                 // סוף plugin

export default usersRoutes;                                                                         // ייצוא
