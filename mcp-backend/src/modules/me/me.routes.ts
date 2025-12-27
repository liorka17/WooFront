import crypto from "node:crypto";                                                                       // קריפטו של Node ליצירת מפתח רנדומלי
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";                            // טיפוסים של Fastify

type JwtUser = {                                                                                         // טיפוס יוזר מתוך JWT
  id: string | number;                                                                                   // מזהה
  email: string;                                                                                         // אימייל
  role: string;                                                                                          // תפקיד
};                                                                                                       // סוף טיפוס

type UpdateIntegrationsBody = {                                                                          // טיפוס גוף לעדכון אינטגרציות
  store_name?: string;                                                                                   // שם חנות
  woo_url?: string;                                                                                      // כתובת חנות
  woo_ck?: string;                                                                                       // consumer key
  woo_cs?: string;                                                                                       // consumer secret
};                                                                                                       // סוף טיפוס

async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {                // preHandler לאימות JWT
  try {                                                                                                  // ניסיון
    await (request as any).jwtVerify();                                                                  // אימות JWT מתוך Authorization
    return;                                                                                              // יציאה תקינה
  } catch {                                                                                              // אם נכשל
    reply.status(401).send({ ok: false, error: "Unauthorized" });                                        // שולח 401
    return;                                                                                              // סיום
  }                                                                                                      // סוף catch
}                                                                                                        // סוף requireAuth

function getUserFromRequest(request: FastifyRequest): JwtUser | null {                                   // עוזר לקרוא user בבטחה
  const u = (request as any).user as JwtUser | undefined;                                                // קריאה מתוך request.user
  if (!u || u.id === undefined || u.id === null) return null;                                            // אם אין id אין יוזר
  return u;                                                                                              // מחזיר יוזר תקין
}                                                                                                        // סוף helper

function normOrNull(v: unknown): string | null {                                                         // מנרמל ערך למחרוזת או null
  const s = (typeof v === "string" ? v : "").trim();                                                     // מחרוזת וניקוי רווחים
  return s.length ? s : null;                                                                            // אם ריק מחזיר null
}                                                                                                        // סוף normOrNull

function generateClientKeyPlain(): string {                                                              // יצירת client key להעתקה
  return crypto.randomBytes(32).toString("hex");                                                         // 64 תווים hex
}                                                                                                        // סוף generateClientKeyPlain

function hashClientKey(plain: string): string {                                                          // hash דטרמיניסטי לשמירה במסד
  const pepper = (process.env.CLIENT_KEY_PEPPER ?? "").trim();                                           // pepper מה env
  if (!pepper) throw new Error("Missing CLIENT_KEY_PEPPER");                                             // אם חסר env לא מאפשר גנרוט
  return crypto.createHmac("sha256", pepper).update(plain).digest("hex");                                 // HMAC SHA256
}                                                                                                        // סוף hashClientKey

export default async function meRoutes(server: FastifyInstance) {                                         // פלאגין ראוטים

  server.get(                                                                                            // שליפת אינטגרציות של המשתמש המחובר
    "/api/me/integrations",                                                                              // נתיב
    { preHandler: requireAuth },                                                                         // אימות JWT
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {                             // handler
      const user = getUserFromRequest(request);                                                          // שליפת user
      if (!user) {                                                                                       // אם אין user
        reply.status(401).send({ ok: false, error: "Unauthorized" });                                    // 401
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const id = Number(user.id);                                                                        // המרה למספר
      if (!Number.isFinite(id)) {                                                                        // בדיקת id
        reply.status(400).send({ ok: false, error: "Bad user id" });                                     // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const res = await server.db.query(                                                                 // שליפה מהמסד
        `SELECT store_name, woo_url, woo_ck, woo_cs, client_key, client_key_hash
         FROM users
         WHERE id = $1`,
        [id]
      );                                                                                                 // סוף query

      if (!res.rowCount) {                                                                               // אם לא נמצא
        reply.status(404).send({ ok: false, error: "User not found" });                                  // 404
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const row = res.rows[0] as {                                                                       // טיפוס שורה
        store_name: string | null;                                                                       // store_name
        woo_url: string | null;                                                                          // woo_url
        woo_ck: string | null;                                                                           // woo_ck
        woo_cs: string | null;                                                                           // woo_cs
        client_key: string | null;                                                                       // client_key ישן אם קיים
        client_key_hash: string | null;                                                                  // client_key_hash החדש
      };                                                                                                 // סוף טיפוס

      reply.send({                                                                                       // מחזיר לפרונט
        ok: true,                                                                                        // הצלחה
        data: {                                                                                          // נתונים
          store_name: row.store_name ?? "",                                                              // שם חנות
          woo_url: row.woo_url ?? "",                                                                    // כתובת
          has_woo_ck: !!row.woo_ck,                                                                      // האם קיים
          has_woo_cs: !!row.woo_cs,                                                                      // האם קיים
          client_key: row.client_key ?? "",                                                              // מצב מעבר כדי לא לשבור פרונט
          has_client_key_hash: !!row.client_key_hash,                                                    // אינדיקציה שיש hash במסד
        },                                                                                               // סוף data
      });                                                                                                // סוף send
      return;                                                                                            // סיום
    }                                                                                                    // סוף handler
  );                                                                                                     // סוף route

  server.put<{ Body: UpdateIntegrationsBody }>(                                                          // חשוב לתת גנרי פה כדי ש request.body לא יהיה unknown
    "/api/me/integrations",                                                                              // נתיב
    { preHandler: requireAuth },                                                                         // אימות JWT
    async (request, reply): Promise<void> => {                                                           // handler
      const user = getUserFromRequest(request);                                                          // שליפת user
      if (!user) {                                                                                       // אם אין user
        reply.status(401).send({ ok: false, error: "Unauthorized" });                                    // 401
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const id = Number(user.id);                                                                        // המרה למספר
      if (!Number.isFinite(id)) {                                                                        // בדיקת id
        reply.status(400).send({ ok: false, error: "Bad user id" });                                     // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const body = request.body ?? {};                                                                   // גוף הבקשה עכשיו טיפוסי
      const store_name = normOrNull(body.store_name);                                                    // נרמול store_name
      const woo_url = normOrNull(body.woo_url);                                                          // נרמול woo_url
      const woo_ck = normOrNull(body.woo_ck);                                                            // נרמול woo_ck
      const woo_cs = normOrNull(body.woo_cs);                                                            // נרמול woo_cs

      await server.db.query(                                                                             // עדכון במסד
        `UPDATE users
         SET store_name = COALESCE($1, store_name),
             woo_url    = COALESCE($2, woo_url),
             woo_ck     = COALESCE($3, woo_ck),
             woo_cs     = COALESCE($4, woo_cs)
         WHERE id = $5`,
        [store_name, woo_url, woo_ck, woo_cs, id]
      );                                                                                                 // סוף query

      reply.send({ ok: true });                                                                          // OK
      return;                                                                                            // סיום
    }                                                                                                    // סוף handler
  );                                                                                                     // סוף route

  server.post(                                                                                           // יצירת client key
    "/api/me/client-key",                                                                                // נתיב
    { preHandler: requireAuth },                                                                         // אימות JWT
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {                             // handler
      const user = getUserFromRequest(request);                                                          // שליפת user
      if (!user) {                                                                                       // אם אין user
        reply.status(401).send({ ok: false, error: "Unauthorized" });                                    // 401
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const id = Number(user.id);                                                                        // המרה למספר
      if (!Number.isFinite(id)) {                                                                        // בדיקת id
        reply.status(400).send({ ok: false, error: "Bad user id" });                                     // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const res = await server.db.query(                                                                 // שליפה מהמסד
        `SELECT woo_url, woo_ck, woo_cs, client_key, client_key_hash
         FROM users
         WHERE id = $1`,
        [id]
      );                                                                                                 // סוף query

      if (!res.rowCount) {                                                                               // אם לא נמצא
        reply.status(404).send({ ok: false, error: "User not found" });                                  // 404
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const row = res.rows[0] as {                                                                       // טיפוס שורה
        woo_url: string | null;                                                                          // woo_url
        woo_ck: string | null;                                                                           // woo_ck
        woo_cs: string | null;                                                                           // woo_cs
        client_key: string | null;                                                                       // client_key ישן אם קיים
        client_key_hash: string | null;                                                                  // client_key_hash החדש אם קיים
      };                                                                                                 // סוף טיפוס

      if (row.client_key) {                                                                              // מצב מעבר אם כבר יש מפתח ישן
        reply.send({ ok: true, client_key: row.client_key });                                            // מחזיר אותו ולא מייצר חדש
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const hasAll = !!(row.woo_url && row.woo_ck && row.woo_cs);                                        // בדיקה שיש 3 שדות
      if (!hasAll) {                                                                                     // אם חסר
        reply.status(400).send({ ok: false, error: "Fill woo_url, woo_ck, woo_cs first" });              // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      for (let i = 0; i < 5; i++) {                                                                      // ניסיונות למניעת התנגשויות ייחודיות
        let plain = "";                                                                                  // מפתח להעתקה
        let hashed = "";                                                                                 // hash לשמירה במסד

        try {                                                                                            // ניסיון לייצר מפתח ולחשב hash
          plain = generateClientKeyPlain();                                                              // מפתח שנשלח לפרונט
          hashed = hashClientKey(plain);                                                                 // hash קבוע לזיהוי בבוט
        } catch (e: any) {                                                                               // אם חסר pepper או בעיית קריפטו
          request.log.error(e);                                                                          // לוג
          reply.status(500).send({ ok: false, error: "Server config error" });                           // 500
          return;                                                                                        // סיום
        }                                                                                                // סוף catch

        try {                                                                                            // ניסיון לשמור במסד
          await server.db.query(                                                                         // עדכון במסד
            `UPDATE users
             SET client_key_hash = $1
             WHERE id = $2`,
            [hashed, id]
          );                                                                                             // סוף query

          reply.send({ ok: true, client_key: plain });                                                   // מחזיר לפרונט את ה plain בלבד
          return;                                                                                        // סיום
        } catch (e: any) {                                                                               // catch
          const code = e?.code ?? "";                                                                    // קוד PG
          if (code === "23505") continue;                                                                // כפילות unique על hash
          request.log.error(e);                                                                          // לוג
          reply.status(500).send({ ok: false, error: "Server error" });                                  // 500
          return;                                                                                        // סיום
        }                                                                                                // סוף catch
      }                                                                                                  // סוף for

      reply.status(500).send({ ok: false, error: "Failed to generate unique client key" });              // לא הצליח אחרי ניסיונות
      return;                                                                                            // סיום
    }                                                                                                    // סוף handler
  );                                                                                                     // סוף route
}                                                                                                        // סוף plugin
