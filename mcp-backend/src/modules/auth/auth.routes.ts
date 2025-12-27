import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";       // טיפוסים
import { loginUser, type LoginInput } from "./auth.service";                        // שירות login

export default async function authRoutes(server: FastifyInstance) {                 // פלאגין ראוטים

  server.post(                                                                      // POST login
    "/api/auth/login",                                                              // נתיב
    async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => { // handler
      try {                                                                         // try
        const result = await loginUser(server.db, request.body);                    // אימות מול DB
        if (!result.ok) return reply.status(result.status).send(result);            // אם כשל מחזיר כמו שהוא

        const token = server.jwt.sign(result.payload);                              // חתימה עם fastify jwt בלבד

        return reply.status(200).send({                                             // תשובה
          ok: true,                                                                 // ok
          token,                                                                    // token
          user: result.user,                                                        // user
        });                                                                         // סוף send
      } catch (err) {                                                               // catch
        request.log.error(err);                                                     // לוג
        return reply.status(500).send({ ok: false, error: "Server error" });        // שגיאה
      }                                                                             // סוף catch
    }                                                                               // סוף handler
  );                                                                                // סוף route

  server.get(                                                                       // GET me
    "/api/auth/me",                                                                 // נתיב
    async (request: FastifyRequest, reply: FastifyReply) => {                       // handler
      try {                                                                         // try
        await (request as any).jwtVerify();                                         // אימות עם fastify jwt
        return reply.status(200).send({ ok: true, user: (request as any).user });   // מחזיר את user מה JWT
      } catch (err) {                                                               // catch
        request.log.error(err);                                                     // לוג
        return reply.status(401).send({ ok: false, error: "Unauthorized" });        // 401
      }                                                                             // סוף catch
    }                                                                               // סוף handler
  );                                                                                // סוף route
}                                                                                   // סוף authRoutes
