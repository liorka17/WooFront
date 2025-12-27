import "dotenv/config";                                                            // טעינת משתני סביבה
import Fastify from "fastify";                                                      // יצירת שרת Fastify
import cors from "@fastify/cors";                                                   // CORS
import jwt from "@fastify/jwt";                                                     // JWT
import dbPlugin from "./plugins/db";                                                // DB plugin
import usersRoutes from "./modules/users/users.routes";                             // Users routes
import authRoutes from "./modules/auth/auth.routes";                                // Auth routes

function getCorsOrigins(): string[] {                                               // קריאת Origins מותרים
  const raw = (process.env.CORS_ORIGINS ?? "http://localhost:4200").trim();          // ברירת מחדל ל Angular
  return raw                                                                        // מחזיר מערך
    .split(",")                                                                     // פיצול לפי פסיקים
    .map((s) => s.trim())                                                           // ניקוי רווחים
    .filter((s) => s.length > 0);                                                   // סינון ריקים
}                                                                                   // סוף פונקציה

async function buildServer() {                                                      // בניית שרת
  const server = Fastify({ logger: true, ignoreTrailingSlash: true });              // גם /api/users וגם /api/users/ יעבדו

  const allowedOrigins = getCorsOrigins();                                          // origins מותרים

  await server.register(cors, {                                                     // רישום CORS
    origin: (origin, cb) => {                                                       // בדיקה דינמית
      if (!origin) return cb(null, true);                                           // ללא origin מאושר
      if (allowedOrigins.includes(origin)) return cb(null, true);                   // origin מאושר
      return cb(new Error("Not allowed by CORS"), false);                           // חסימה
    },                                                                              // סוף בדיקת origin
    credentials: true,                                                              // מאפשר credentials
  });                                                                               // סוף CORS

  await server.register(jwt, {                                                      // רישום JWT
    secret: (process.env.JWT_SECRET ?? "dev_secret_change_me").trim(),              // חשוב trim כדי לא לשבור חתימה ואימות
    sign: { expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h").trim() },               // תוקף
  });                                                                               // סוף JWT

  await server.register(dbPlugin);                                                  // DB לפני ראוטים

  await server.register(authRoutes);                                                // auth
  await server.register(usersRoutes);                                               // users

  server.get("/health", async () => ({ ok: true }));                                // health ישן
  server.get("/api/health", async () => ({ ok: true }));                            // health דרך proxy

  return server;                                                                    // החזרת שרת
}                                                                                   // סוף buildServer

async function start() {                                                            // הפעלת שרת
  const server = await buildServer();                                               // בנייה
  const port = Number(process.env.PORT) || 3000;                                    // פורט

  try {                                                                             // ניסיון listen
    await server.listen({ port, host: "0.0.0.0" });                                  // האזנה
    server.log.info(`MCP backend running on port ${port}`);                         // לוג
  } catch (err) {                                                                   // שגיאה
    server.log.error(err);                                                          // לוג שגיאה
    process.exit(1);                                                                // יציאה
  }                                                                                 // סוף try catch
}                                                                                   // סוף start

start();                                                                            // הרצה
