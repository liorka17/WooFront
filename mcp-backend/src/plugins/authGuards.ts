import { FastifyReply, FastifyRequest } from "fastify";                            // ייבוא טיפוסים של Fastify
                                                                                   

type JwtUser = { id: string | number; email: string; role: string };               // טיפוס משתמש שמגיע מתוך JWT

export async function requireAuth(                                                 // פונקציה שחוסמת ללא התחברות
  request: FastifyRequest,                                                         // הבקשה הנוכחית
  reply: FastifyReply                                                              // התשובה הנוכחית
) {                                                                                // פתיחת פונקציה
  try {                                                                            // ניסיון אימות טוקן
    const anyReq = request as any;                                                  // המרה ל any כדי לגשת ל jwtVerify
    if (typeof anyReq.jwtVerify !== "function") {                                  // אם אין jwtVerify אז JWT לא מותקן נכון
      reply.code(500).send({ ok: false, error: "JWT not configured" });            // מחזיר שגיאה פנימית
      return;                                                                      // יציאה מהפונקציה
    }                                                                              // סוף תנאי
    await anyReq.jwtVerify();                                                      // אימות טוקן והצמדת user ל request
  } catch {                                                                        // אם נכשל
    reply.code(401).send({ ok: false, error: "Unauthorized" });                    // מחזיר 401
  }                                                                                // סוף catch
}                                                                                  // סוף requireAuth

export function requireAdmin(                                                      // פונקציה שחוסמת למי שאינו admin
  request: FastifyRequest,                                                         // הבקשה הנוכחית
  reply: FastifyReply                                                              // התשובה הנוכחית
) {                                                                                // פתיחת פונקציה
  const user = (request as any).user as JwtUser | undefined;                       // שליפת המשתמש מתוך request
  if (!user || user.role !== "admin") {                                            // אם אין משתמש או לא admin
    reply.code(403).send({ ok: false, error: "Admin only" });                      // מחזיר 403
    return;                                                                        // יציאה מהפונקציה
  }                                                                                // סוף תנאי
}                                                                                  // סוף requireAdmin

export function requireSelfOrAdmin(                                                // פונקציה שמאפשרת admin או אותו משתמש
  request: FastifyRequest,                                                         // הבקשה הנוכחית
  reply: FastifyReply                                                              // התשובה הנוכחית
) {                                                                                // פתיחת פונקציה
  const user = (request as any).user as JwtUser | undefined;                       // שליפת המשתמש מתוך request
  const params = (request as any).params as { id?: string };                       // שליפת id מהנתיב
  const requestedId = params?.id;                                                  // שמירת ה id שביקשו
  if (!user) {                                                                     // אם אין משתמש
    reply.code(401).send({ ok: false, error: "Unauthorized" });                    // מחזיר 401
    return;                                                                        // יציאה
  }                                                                                // סוף תנאי
  if (user.role === "admin") return;                                               // אם admin אז מותר
  if (String(user.id) === String(requestedId)) return;                             // אם זה המשתמש עצמו אז מותר
  reply.code(403).send({ ok: false, error: "Forbidden" });                         // אחרת חסימה
}                                                                                  // סוף requireSelfOrAdmin
