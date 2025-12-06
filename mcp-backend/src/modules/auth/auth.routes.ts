import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { loginUser,type LoginInput, verifyToken, type JwtUserPayload,} from "./auth.service";

export default async function authRoutes(server: FastifyInstance) {
  // POST /api/auth/login
  server.post(
    "/api/auth/login",
    async (
      request: FastifyRequest<{ Body: LoginInput }>,
      reply: FastifyReply
    ) => {
      try {
        const result = await loginUser(server.db, request.body);

        return reply.status(result.status).send(result);
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          ok: false,
          error: "Server error",
        });
      }
    }
  );

  // GET /api/auth/me  – בדיקת טוקן והחזרת המשתמש מה JWT
  server.get(
    "/api/auth/me",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization || "";
        const [, token] = authHeader.split(" ");

        if (!token) {
          return reply.status(401).send({
            ok: false,
            error: "Missing or invalid Authorization header",
          });
        }

        const payload = verifyToken(token) as JwtUserPayload;

        return reply.status(200).send({
          ok: true,
          user: payload,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(401).send({
          ok: false,
          error: "Invalid or expired token",
        });
      }
    }
  );
}
