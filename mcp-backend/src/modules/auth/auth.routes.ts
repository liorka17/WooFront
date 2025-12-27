// src/modules/auth/auth.routes.ts

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";       // טיפוסים של Fastify
import { loginUser, type LoginInput, type JwtUserPayload } from "./auth.service";   // שירות auth: login
import { registerUser } from "../users/users.service";                              // שימוש בפונקציית register מה users
import type { RegisterBody } from "../users/users.types";                           // טיפוס של גוף הרשמה

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {          // Guard שמוודא JWT תקף
  try {                                                                             // ניסיון אימות
    await (request as any).jwtVerify();                                              // אימות טוקן דרך fastify jwt
  } catch {                                                                          // אם אין טוקן או לא תקין
    return reply.status(401).send({ ok: false, error: "Unauthorized" });             // מחזיר 401
  }                                                                                  // סוף catch
}                                                                                    // סוף requireAuth

export default async function authRoutes(server: FastifyInstance) {                  // פלאגין ראוטים של auth

  server.post(                                                                       // ראוט POST להתחברות
    "/api/auth/login",                                                               // הנתיב של login
    async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {  // handler
      try {                                                                          // try
        const result = await loginUser(server.db, request.body);                     // התחברות מול DB
        if (!result.ok) return reply.status(result.status).send(result);             // אם נכשל מחזיר שגיאה כמו שהיא

        const token = (server as any).jwt.sign(result.payload as JwtUserPayload);    // חתימה על JWT דרך fastify jwt

        return reply.status(200).send({                                              // תשובה לפרונט
          ok: true,                                                                  // הצלחה
          token,                                                                    // טוקן
          user: result.user,                                                        // פרטי משתמש
        });                                                                         // סוף send
      } catch (err) {                                                                // catch
        request.log.error(err);                                                      // לוג
        return reply.status(500).send({ ok: false, error: "Server error" });         // שגיאת שרת
      }                                                                              // סוף catch
    }                                                                                // סוף handler
  );                                                                                 // סוף login

  server.post(                                                                       // ראוט POST להרשמה
    "/api/auth/register",                                                            // הנתיב של register
    async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => { // handler
      try {                                                                          // try
        const body = request.body;                                                   // גוף הבקשה

        if (                                                                            // בדיקת שדות חובה
          !body.fullName ||                                                           // שם מלא
          !body.email ||                                                              // אימייל
          !body.password ||                                                           // סיסמה
          !body.role ||                                                               // role
          !body.storeUrl ||                                                           // כתובת חנות
          !body.storeName ||                                                          // שם חנות
          !body.plan                                                                  // plan
        ) {                                                                            // סוף תנאי
          return reply.status(400).send({ ok: false, error: "Missing required fields" }); // 400
        }                                                                              // סוף if

        const user = await registerUser(server.db, body);                             // יצירת משתמש במסד

        const payload: JwtUserPayload = {                                             // payload ל JWT
          id: String((user as any).id),                                                // id
          email: String((user as any).email),                                          // email
          role: String((user as any).role) as JwtUserPayload["role"],                  // role
        };                                                                             // סוף payload

        const token = (server as any).jwt.sign(payload);                               // חתימה על JWT

        return reply.status(201).send({                                                // תשובה לפרונט
          ok: true,                                                                    // הצלחה
          token,                                                                       // טוקן
          user,                                                                        // משתמש שנוצר
        });                                                                            // סוף send
      } catch (err: any) {                                                             // catch
        if (err instanceof Error && err.message === "USER_EXISTS") {                   // אם קיים כבר
          return reply.status(409).send({ ok: false, error: "User with this email already exists" }); // 409
        }                                                                              // סוף if

        request.log.error(err);                                                        // לוג
        return reply.status(500).send({ ok: false, error: "Server error" });           // 500
      }                                                                                // סוף catch
    }                                                                                  // סוף handler
  );                                                                                   // סוף register

  server.get(                                                                          // ראוט GET לבדיקת טוקן
    "/api/auth/me",                                                                    // הנתיב של me
    { preHandler: requireAuth },                                                       // אימות JWT לפני handler
    async (request: FastifyRequest, reply: FastifyReply) => {                          // handler
      return reply.status(200).send({ ok: true, user: (request as any).user });        // מחזיר user מה JWT
    }                                                                                  // סוף handler
  );                                                                                   // סוף me
}                                                                                      // סוף plugin
