import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"; // טיפוסים של Fastify
import { getAllUsers, getUserById, updateUser, deleteUserById } from "./users.service";           // פעולות שירות
import type { UpdateUserBody } from "./users.types";                                              // טיפוסים

type JwtUser = { id: string | number; email: string; role: string };                              // טיפוס משתמש מתוך JWT

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {                        // פרה הנדלר שמוודא JWT
  try {                                                                                           // ניסיון אימות
    await (request as any).jwtVerify();                                                           // אימות טוקן דרך הפלאגין
    return;                                                                                       // אם עבר, ממשיכים הלאה
  } catch {                                                                                       // אם אין טוקן או לא תקין
    reply.status(401).send({ ok: false, error: "Unauthorized" });                                 // מחזיר 401
    return reply;                                                                                 // חשוב: עוצר את הפייפליין
  }                                                                                               // סוף catch
}                                                                                                 // סוף requireAuth

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {                       // פרה הנדלר שמוודא admin
  const user = (request as any).user as JwtUser | undefined;                                      // user שנשמר אחרי jwtVerify
  if (!user || user.role !== "admin") {                                                           // אם לא מחובר או לא admin
    reply.status(403).send({ ok: false, error: "Admin only" });                                   // מחזיר 403
    return reply;                                                                                 // חשוב: עוצר את הפייפליין
  }                                                                                               // סוף תנאי
  return;                                                                                         // אם admin, ממשיכים
}                                                                                                 // סוף requireAdmin

async function requireSelfOrAdmin(request: FastifyRequest, reply: FastifyReply) {                 // פרה הנדלר שמאפשר עצמי או admin
  const user = (request as any).user as JwtUser | undefined;                                      // שליפת user
  const idParam = (request as any).params?.id as string | undefined;                              // שליפת id מהנתיב
  if (!user) {                                                                                    // אם אין משתמש
    reply.status(401).send({ ok: false, error: "Unauthorized" });                                 // מחזיר 401
    return reply;                                                                                 // עוצר
  }                                                                                               // סוף תנאי
  if (user.role === "admin") return;                                                              // אם admin מותר
  if (String(user.id) === String(idParam)) return;                                                // אם זה אותו משתמש מותר
  reply.status(403).send({ ok: false, error: "Forbidden" });                                      // אחרת חסום
  return reply;                                                                                   // עוצר
}                                                                                                 // סוף requireSelfOrAdmin

const usersRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {                      // פלאגין ראוטים

  server.get("/api/users", { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => { // כל המשתמשים רק admin
    const users = await getAllUsers(server.db);                                                     // שליפת משתמשים
    return reply.send({ ok: true, users });                                                         // החזרת תוצאה
  });                                                                                                // סוף GET all

  server.get<{ Params: { id: string } }>("/api/users/:id", { preHandler: [requireAuth, requireSelfOrAdmin] }, async (request, reply) => { // לפי id
    const id = Number(request.params.id);                                                            // המרה למספר
    const user = await getUserById(server.db, id);                                                    // שליפה מהמסד
    if (!user) return reply.status(404).send({ ok: false, error: "User not found" });                 // 404 אם לא נמצא
    return reply.send({ ok: true, user });                                                            // מחזיר משתמש
  });                                                                                                // סוף GET by id

  server.put<{ Params: { id: string }; Body: UpdateUserBody }>("/api/users/:id", { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => { // עדכון
    const id = Number(request.params.id);                                                            // המרה למספר
    const updated = await updateUser(server.db, id, request.body);                                   // עדכון במסד
    if (!updated) return reply.status(404).send({ ok: false, error: "User not found" });             // 404 אם לא נמצא
    return reply.send({ ok: true, user: updated });                                                  // מחזיר תוצאה
  });                                                                                                // סוף PUT

  server.delete<{ Params: { id: string } }>("/api/users/:id", { preHandler: [requireAuth, requireAdmin] }, async (request, reply) => { // מחיקה
    const id = Number(request.params.id);                                                            // המרה למספר
    const ok = await deleteUserById(server.db, id);                                                  // מחיקה
    if (!ok) return reply.status(404).send({ ok: false, error: "User not found" });                  // 404 אם לא נמצא
    return reply.send({ ok: true });                                                                 // הצלחה
  });                                                                                                // סוף DELETE
};                                                                                                   // סוף usersRoutes

export default usersRoutes;                                                                           // ייצוא
