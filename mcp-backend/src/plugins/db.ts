import fp from "fastify-plugin";                                                    // פלאגין רשמי לעטיפת פלאגינים בפאסטיפיי
import { Pool } from "pg";                                                          // מייבא Pool של Postgres
import type { FastifyInstance } from "fastify";                                     // טיפוס של השרת לצורך טיפוסיות

declare module "fastify" {                                                          // הרחבת הטיפוסים של Fastify
  interface FastifyInstance {                                                       // מוסיף שדה db לשרת
    db: Pool;                                                                       // db יהיה מסוג Pool
  }                                                                                 // סוף הרחבה
}                                                                                   // סוף declare

function mustGet(name: string, fallback?: string): string {                         // פונקציה שמחזירה ערך env חובה
  const v = (process.env[name] ?? fallback)?.toString().trim();                     // קורא env או fallback ומנקה רווחים
  if (!v) throw new Error(`Missing env ${name}`);                                   // אם אין ערך זורק שגיאה ברורה
  return v;                                                                         // מחזיר את הערך התקין
}                                                                                   // סוף פונקציה

function shouldUseSsl(): boolean {                                                  // מחליט אם להפעיל SSL
  const host = (process.env.PGHOST ?? "").toLowerCase();                            // קורא את ה host מה env
  const url = (process.env.DATABASE_URL ?? "").toLowerCase();                       // קורא את DATABASE_URL מה env
  return host.includes("supabase") || url.includes("supabase");                     // אם זה סופאבייס מפעילים SSL
}                                                                                   // סוף פונקציה

async function connectPool(): Promise<Pool> {                                       // פונקציה שמקימה Pool למסד
  const ssl = shouldUseSsl() ? { rejectUnauthorized: false } : undefined;           // SSL לסופאבייס כדי למנוע כשל תעודה

  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();                      // קורא DATABASE_URL אם קיים

  const pool = databaseUrl                                                         // אם יש DATABASE_URL נשתמש בו
    ? new Pool({                                                                    // יוצר Pool לפי connection string
        connectionString: databaseUrl,                                              // מחרוזת חיבור מלאה
        ssl,                                                                        // SSL אם צריך
        max: 10,                                                                    // מקסימום חיבורים
        idleTimeoutMillis: 30_000,                                                  // זמן סגירת חיבור לא פעיל
        connectionTimeoutMillis: 10_000,                                            // זמן המתנה לפתיחת חיבור
      })                                                                            // סוף הגדרה
    : new Pool({                                                                    // אחרת משתמש בפרמטרים הנפרדים
        host: mustGet("PGHOST", "localhost"),                                       // host מה env
        port: Number(mustGet("PGPORT", "5432")),                                    // port מה env
        user: mustGet("PGUSER", "mcp_user"),                                        // user מה env
        password: mustGet("PGPASSWORD", "12345"),                                   // password מה env
        database: mustGet("PGDATABASE", "mcp_DB"),                                  // database מה env
        ssl,                                                                        // SSL אם צריך
        max: 10,                                                                    // מקסימום חיבורים
        idleTimeoutMillis: 30_000,                                                  // זמן סגירת חיבור לא פעיל
        connectionTimeoutMillis: 10_000,                                            // זמן המתנה לפתיחת חיבור
      });                                                                           // סוף הגדרה

  await pool.query("SELECT 1");                                                     // בדיקת חיבור מיידית כדי ליפול מוקדם אם יש בעיה
  return pool;                                                                      // מחזיר את ה pool
}                                                                                   // סוף פונקציה

const dbPlugin = fp(async (server: FastifyInstance) => {                            // יוצר פלאגין פאסטיפיי
  const pool = await connectPool();                                                 // מקים חיבור למסד
  server.decorate("db", pool);                                                      // מוסיף server.db לכל המערכת

  server.addHook("onClose", async () => {                                           // סוגר חיבורים כשהשרת נסגר
    await pool.end();                                                               // מסיים את ה pool בצורה תקינה
  });                                                                               // סוף hook
});                                                                                 // סוף פלאגין

export default dbPlugin;                                                            // מייצא את הפלאגין לשימוש ב server.ts
