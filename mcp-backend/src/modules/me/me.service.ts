import crypto from "node:crypto";                                                                       // קריפטו של Node
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";                            // טיפוסים של Fastify
import { encryptSecret } from "../../utils/secretsCrypto";                                               // הצפנת סודות למסד

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
    await (request as any).jwtVerify();                                                                  // אימות JWT
    return;                                                                                              // יציאה תקינה
  } catch {                                                                                              // אם נכשל
    reply.status(401).send({ ok: false, error: "Unauthorized" });                                        // 401
    return;                                                                                              // סיום
  }                                                                                                      // סוף catch
}                                                                                                        // סוף requireAuth

function getUserFromRequest(request: FastifyRequest): JwtUser | null {                                   // עוזר לקרוא user בבטחה
  const u = (request as any).user as JwtUser | undefined;                                                // שליפה
  if (!u || u.id === undefined || u.id === null) return null;                                            // אין יוזר
  return u;                                                                                              // מחזיר
}                                                                                                        // סוף helper

function normOrNull(v: unknown): string | null {                                                         // מנרמל ערך למחרוזת או null
  const s = (typeof v === "string" ? v : "").trim();                                                     // ניקוי
  return s.length ? s : null;                                                                            // אם ריק מחזיר null
}                                                                                                        // סוף normOrNull

function normalizeWooUrl(input: string | null): string | null {                                          // נרמול URL לחנות
  const v = normOrNull(input);                                                                           // ניקוי
  if (!v) return null;                                                                                   // אין
  if (v.startsWith("http://") || v.startsWith("https://")) return v;                                     // כבר תקין
  return `https://${v}`;                                                                                 // מוסיף https
}                                                                                                        // סוף normalizeWooUrl

const CLIENT_KEY_PEPPER = (process.env.CLIENT_KEY_PEPPER ?? "").trim();                                  // pepper מה env
if (!CLIENT_KEY_PEPPER) {                                                                                // אם חסר
  throw new Error("Missing CLIENT_KEY_PEPPER");                                                          // שגיאה בסטארט
}                                                                                                        // סוף if

function generateClientKeyPlain(): string {                                                              // יצירת client key נוח להעתקה
  return crypto.randomBytes(20).toString("base64url");                                                   // קצר ונוח
}                                                                                                        // סוף generateClientKeyPlain

function hashClientKey(plain: string): string {                                                          // hash דטרמיניסטי לשמירה במסד
  return crypto.createHmac("sha256", CLIENT_KEY_PEPPER).update(plain).digest("hex");                     // HMAC SHA256
}                                                                                                        // סוף hashClientKey

export default async function meRoutes(server: FastifyInstance) {                                        // פלאגין ראוטים

  server.get(                                                                                            // שליפת אינטגרציות
    "/api/me/integrations",                                                                              // נתיב
    { preHandler: requireAuth },                                                                         // אימות JWT
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {                             // handler
      const user = getUserFromRequest(request);                                                          // user
      if (!user) {                                                                                       // אם אין
        reply.status(401).send({ ok: false, error: "Unauthorized" });                                    // 401
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const id = Number(user.id);                                                                        // המרה
      if (!Number.isFinite(id)) {                                                                        // בדיקה
        reply.status(400).send({ ok: false, error: "Bad user id" });                                     // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const res = await server.db.query(                                                                 // שליפה מהמסד
        `SELECT store_name, woo_url, woo_ck, woo_cs, client_key, client_key_hash
         FROM users
         WHERE id = $1`,
        [id]
      );                                                                                                 // סוף query

      if (!res.rowCount) {                                                                               // לא נמצא
        reply.status(404).send({ ok: false, error: "User not found" });                                  // 404
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const row = res.rows[0] as {                                                                       // טיפוס שורה
        store_name: string | null;                                                                       // store_name
        woo_url: string | null;                                                                          // woo_url
        woo_ck: string | null;                                                                           // woo_ck מוצפן או null
        woo_cs: string | null;                                                                           // woo_cs מוצפן או null
        client_key: string | null;                                                                       // legacy בלבד
        client_key_hash: string | null;                                                                  // hash החדש
      };                                                                                                 // סוף טיפוס

      reply.send({                                                                                       // מחזיר לפרונט
        ok: true,                                                                                        // הצלחה
        data: {                                                                                          // נתונים
          store_name: row.store_name ?? "",                                                              // שם חנות
          woo_url: normalizeWooUrl(row.woo_url) ?? "",                                                   // כתובת מנורמלת
          has_woo_ck: !!row.woo_ck,                                                                      // האם CK קיים
          has_woo_cs: !!row.woo_cs,                                                                      // האם CS קיים
          client_key: "",                                                                                // לא מחזירים מפתח גלוי
          has_client_key_hash: !!row.client_key_hash || !!row.client_key,                                // אינדיקציה שיש מפתח
        },                                                                                               // סוף data
      });                                                                                                // סוף send
      return;                                                                                            // סיום
    }                                                                                                    // סוף handler
  );                                                                                                     // סוף route

  server.put<{ Body: UpdateIntegrationsBody }>(                                                          // עדכון אינטגרציות
    "/api/me/integrations",                                                                              // נתיב
    { preHandler: requireAuth },                                                                         // אימות JWT
    async (request, reply): Promise<void> => {                                                           // handler
      const user = getUserFromRequest(request);                                                          // user
      if (!user) {                                                                                       // אין user
        reply.status(401).send({ ok: false, error: "Unauthorized" });                                    // 401
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const id = Number(user.id);                                                                        // המרה
      if (!Number.isFinite(id)) {                                                                        // בדיקה
        reply.status(400).send({ ok: false, error: "Bad user id" });                                     // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const body = request.body ?? {};                                                                   // גוף
      const store_name = normOrNull(body.store_name);                                                    // נרמול
      const woo_url = normalizeWooUrl(body.woo_url ?? null);                                             // נרמול url
      const woo_ck_plain = normOrNull(body.woo_ck);                                                      // ck plain
      const woo_cs_plain = normOrNull(body.woo_cs);                                                      // cs plain

      const hasAnyUpdate = !!(store_name || woo_url || woo_ck_plain || woo_cs_plain);                    // יש מה לעדכן
      if (!hasAnyUpdate) {                                                                               // אם אין כלום
        reply.status(400).send({ ok: false, error: "No fields to update" });                             // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const wantsKeysUpdate = !!(woo_ck_plain || woo_cs_plain);                                          // האם עדכון מפתחות
      if (wantsKeysUpdate && (!woo_ck_plain || !woo_cs_plain)) {                                         // אם אחד חסר
        reply.status(400).send({ ok: false, error: "Provide both woo_ck and woo_cs" });                  // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      if (wantsKeysUpdate && !woo_url) {                                                                 // אם מעדכנים מפתחות בלי URL בגוף
        const cur = await server.db.query(                                                               // שליפת URL קיים
          `SELECT woo_url FROM users WHERE id = $1`,
          [id]
        );                                                                                               // סוף query
        const curUrl = (cur.rows[0]?.woo_url ?? null) as string | null;                                  // url קיים
        if (!curUrl) {                                                                                   // אם אין URL שמור
          reply.status(400).send({ ok: false, error: "Save store URL first" });                          // 400
          return;                                                                                        // סיום
        }                                                                                                // סוף if
      }                                                                                                  // סוף if

      let woo_ck_enc: string | null = null;                                                              // ck מוצפן
      let woo_cs_enc: string | null = null;                                                              // cs מוצפן

      if (woo_ck_plain) woo_ck_enc = encryptSecret(woo_ck_plain);                                        // הצפנת ck
      if (woo_cs_plain) woo_cs_enc = encryptSecret(woo_cs_plain);                                        // הצפנת cs

      const updated = await server.db.query(                                                             // עדכון במסד עם RETURNING
        `UPDATE users
         SET store_name = COALESCE($1, store_name),
             woo_url    = COALESCE($2, woo_url),
             woo_ck     = COALESCE($3, woo_ck),
             woo_cs     = COALESCE($4, woo_cs)
         WHERE id = $5
         RETURNING store_name, woo_url, woo_ck, woo_cs, client_key, client_key_hash`,
        [store_name, woo_url, woo_ck_enc, woo_cs_enc, id]
      );                                                                                                 // סוף query

      const row = updated.rows[0] as any;                                                                // שורה מעודכנת

      reply.send({                                                                                       // מחזיר לפרונט
        ok: true,                                                                                        // OK
        data: {                                                                                          // data עקבי
          store_name: row?.store_name ?? "",                                                             // שם חנות
          woo_url: normalizeWooUrl(row?.woo_url ?? null) ?? "",                                          // כתובת מנורמלת
          has_woo_ck: !!row?.woo_ck,                                                                     // האם CK קיים
          has_woo_cs: !!row?.woo_cs,                                                                     // האם CS קיים
          client_key: "",                                                                                // לא מחזירים מפתח גלוי
          has_client_key_hash: !!row?.client_key_hash || !!row?.client_key,                               // אינדיקציה שיש מפתח
        },                                                                                               // סוף data
      });                                                                                                // סוף send
      return;                                                                                            // סיום
    }                                                                                                    // סוף handler
  );                                                                                                     // סוף route

  server.post<{ Querystring: { regenerate?: string } }>(                                                 // יצירת client key
    "/api/me/client-key",                                                                                // נתיב
    { preHandler: requireAuth },                                                                         // אימות JWT
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {                             // handler
      const user = getUserFromRequest(request);                                                          // user
      if (!user) {                                                                                       // אין user
        reply.status(401).send({ ok: false, error: "Unauthorized" });                                    // 401
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const id = Number(user.id);                                                                        // המרה
      if (!Number.isFinite(id)) {                                                                        // בדיקה
        reply.status(400).send({ ok: false, error: "Bad user id" });                                     // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const wantsRegenerate = String((request as any).query?.regenerate ?? "") === "1";                  // האם ביקש ריגנרציה

      const res = await server.db.query(                                                                 // שליפה מהמסד
        `SELECT woo_url, woo_ck, woo_cs, client_key, client_key_hash
         FROM users
         WHERE id = $1`,
        [id]
      );                                                                                                 // סוף query

      if (!res.rowCount) {                                                                               // לא נמצא
        reply.status(404).send({ ok: false, error: "User not found" });                                  // 404
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      let row = res.rows[0] as {                                                                         // טיפוס שורה
        woo_url: string | null;                                                                          // url
        woo_ck: string | null;                                                                           // ck מוצפן או null
        woo_cs: string | null;                                                                           // cs מוצפן או null
        client_key: string | null;                                                                       // legacy
        client_key_hash: string | null;                                                                  // hash החדש
      };                                                                                                 // סוף טיפוס

      const storeUrl = normalizeWooUrl(row.woo_url) ?? "";                                               // url מנורמל

      if (row.client_key && !row.client_key_hash) {                                                      // אם נשאר legacy ללא hash
        try {                                                                                            // ניסיון
          const migratedHash = hashClientKey(row.client_key);                                            // מחשב hash
          await server.db.query(                                                                         // שומר hash ומנקה legacy
            `UPDATE users
             SET client_key_hash = $1,
                 client_key = NULL
             WHERE id = $2`,
            [migratedHash, id]
          );                                                                                             // סוף query
          row.client_key_hash = migratedHash;                                                            // עדכון בזיכרון
          row.client_key = null;                                                                         // ניקוי בזיכרון
        } catch (e: any) {                                                                               // אם נכשל
          request.log.error(e);                                                                          // לוג
          reply.status(500).send({ ok: false, error: "Server error" });                                  // 500
          return;                                                                                        // סיום
        }                                                                                                // סוף catch
      }                                                                                                  // סוף if

      if (row.client_key_hash && !wantsRegenerate) {                                                     // כבר קיים מפתח ואין ריגנרציה
        reply.send({ ok: true, data: { already_generated: true, store_url: storeUrl } });                // מודיע בלבד
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      const hasAll = !!(row.woo_url && row.woo_ck && row.woo_cs);                                        // חייב להיות שמור במסד
      if (!hasAll) {                                                                                     // אם חסר
        reply.status(400).send({ ok: false, error: "Fill woo_url, woo_ck, woo_cs first" });              // 400
        return;                                                                                          // סיום
      }                                                                                                  // סוף if

      for (let i = 0; i < 5; i++) {                                                                      // ניסיונות ייחודיות
        const plain = generateClientKeyPlain();                                                          // מפתח להעתקה
        const hashed = hashClientKey(plain);                                                             // hash לשמירה

        try {                                                                                            // ניסיון לשמור
          await server.db.query(                                                                         // עדכון hash במסד
            `UPDATE users
             SET client_key_hash = $1,
                 client_key = NULL
             WHERE id = $2`,
            [hashed, id]
          );                                                                                             // סוף query

          reply.send({ ok: true, data: { client_key: plain, store_url: storeUrl } });                    // מחזיר plain פעם אחת
          return;                                                                                        // סיום
        } catch (e: any) {                                                                               // catch
          const code = e?.code ?? "";                                                                    // קוד
          if (code === "23505") continue;                                                                // כפילות unique
          request.log.error(e);                                                                          // לוג
          reply.status(500).send({ ok: false, error: "Server error" });                                  // 500
          return;                                                                                        // סיום
        }                                                                                                // סוף catch
      }                                                                                                  // סוף for

      reply.status(500).send({ ok: false, error: "Failed to generate unique client key" });              // כשל
      return;                                                                                            // סיום
    }                                                                                                    // סוף handler
  );                                                                                                     // סוף route
}                                                                                                        // סוף plugin
