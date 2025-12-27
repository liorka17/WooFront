import type { Pool } from "pg";                                                     // טיפוס Pool למסד Postgres
import crypto from "crypto";                                                        // ספריית קריפטו מובנית של Node

type IntegrationRow = {                                                             // טיפוס שורה מהטבלה לצרכי אינטגרציה
  store_name: string | null;                                                        // שם חנות
  woo_url: string | null;                                                           // כתובת חנות ווקומרס
  woo_ck: string | null;                                                            // מפתח צרכן מוצפן
  woo_cs: string | null;                                                            // סוד צרכן מוצפן
  client_key: string | null;                                                        // מפתח לקוח
};                                                                                  // סוף טיפוס

function mustGetEncKey(): Buffer {                                                  // פונקציה שמביאה מפתח הצפנה מהסביבה
  const raw = (process.env.ENCRYPTION_KEY ?? "").trim();                             // קורא ENCRYPTION_KEY מה ENV
  if (!raw) throw new Error("Missing ENCRYPTION_KEY");                              // אם אין מפתח מציף שגיאה ברורה
  const buf = Buffer.from(raw, "base64");                                           // ממיר מ base64 ל Buffer
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes base64"); // דורש 32 בייט ל AES 256
  return buf;                                                                       // מחזיר מפתח תקין
}                                                                                   // סוף פונקציה

function encryptText(plain: string): string {                                       // מצפין טקסט בצורה מאובטחת
  const key = mustGetEncKey();                                                      // מביא מפתח הצפנה
  const iv = crypto.randomBytes(12);                                                // יוצר IV באורך 12 ל GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);                     // יוצר צופן AES 256 GCM
  const enc1 = cipher.update(plain, "utf8");                                        // מצפין חלק ראשון
  const enc2 = cipher.final();                                                      // מצפין חלק אחרון
  const tag = cipher.getAuthTag();                                                  // מביא תג אימות
  const packed = Buffer.concat([iv, tag, enc1, enc2]).toString("base64");           // אורז הכל למחרוזת base64
  return packed;                                                                    // מחזיר מחרוזת מוצפנת
}                                                                                   // סוף encryptText

function hasKeys(row: IntegrationRow): boolean {                                    // בודק האם קיימים מפתחות שמורים
  return Boolean(row.woo_url && row.woo_ck && row.woo_cs);                          // מחזיר אמת אם שלושתם קיימים
}                                                                                   // סוף hasKeys

export async function getMeIntegrations(pool: Pool, userId: string) {               // מביא נתוני אינטגרציה לפי המשתמש המחובר
  const res = await pool.query<IntegrationRow>(                                     // מריץ שאילתא למסד
    "SELECT store_name, woo_url, woo_ck, woo_cs, client_key FROM users WHERE id = $1", // שליפה
    [userId]                                                                        // פרמטר id
  );                                                                                // סוף query

  if (!res.rowCount) {                                                              // אם המשתמש לא נמצא
    return {                                                                        // מחזיר מבנה ריק
      store_name: null,                                                             // שם חנות ריק
      woo_url: null,                                                                // כתובת ריקה
      has_woo_keys: false,                                                          // אין מפתחות
      client_key: null,                                                             // אין client key
    };                                                                              // סוף מבנה
  }                                                                                 // סוף if

  const row = res.rows[0];                                                          // שורה ראשונה
  return {                                                                          // מחזיר רק דברים שמותר לפרונט לראות
    store_name: row.store_name,                                                     // שם חנות
    woo_url: row.woo_url,                                                           // כתובת חנות
    has_woo_keys: hasKeys(row),                                                     // האם יש מפתחות שמורים
    client_key: row.client_key,                                                     // client key אם קיים
  };                                                                                // סוף return
}                                                                                   // סוף getMeIntegrations

export type UpdateIntegrationsBody = {                                              // טיפוס גוף עדכון אינטגרציה מהפרונט
  store_name?: string | null;                                                       // שם חנות אופציונלי
  woo_url?: string | null;                                                          // כתובת חנות אופציונלית
  woo_ck?: string | null;                                                           // consumer key אופציונלי
  woo_cs?: string | null;                                                           // consumer secret אופציונלי
};                                                                                  // סוף טיפוס

export async function updateMeIntegrations(pool: Pool, userId: string, body: UpdateIntegrationsBody) { // מעדכן אינטגרציה למשתמש
  const storeName = (body.store_name ?? null)?.toString().trim() || null;           // מנרמל שם חנות
  const wooUrl = (body.woo_url ?? null)?.toString().trim() || null;                // מנרמל כתובת
  const wooCkPlain = (body.woo_ck ?? null)?.toString().trim() || null;             // מנרמל CK
  const wooCsPlain = (body.woo_cs ?? null)?.toString().trim() || null;             // מנרמל CS

  const wooCkEnc = wooCkPlain ? encryptText(wooCkPlain) : null;                    // מצפין CK אם קיים
  const wooCsEnc = wooCsPlain ? encryptText(wooCsPlain) : null;                    // מצפין CS אם קיים

  const res = await pool.query<IntegrationRow>(                                     // מעדכן במסד ומחזיר נתונים
    `UPDATE users                                                                   
     SET store_name = $2, woo_url = $3, woo_ck = $4, woo_cs = $5
     WHERE id = $1
     RETURNING store_name, woo_url, woo_ck, woo_cs, client_key`,                    // מחזיר ערכים לאחר עדכון
    [userId, storeName, wooUrl, wooCkEnc, wooCsEnc]                                // פרמטרים
  );                                                                                // סוף query

  if (!res.rowCount) throw new Error("USER_NOT_FOUND");                             // אם אין משתמש מציף שגיאה

  const row = res.rows[0];                                                          // שורה אחרי עדכון
  return {                                                                          // מחזיר לפרונט נתונים מותרים
    store_name: row.store_name,                                                     // שם חנות
    woo_url: row.woo_url,                                                          // כתובת חנות
    has_woo_keys: hasKeys(row),                                                     // האם יש מפתחות שמורים
    client_key: row.client_key,                                                     // client key אם קיים
  };                                                                                // סוף return
}                                                                                   // סוף updateMeIntegrations

function randomClientKey(): string {                                                // מייצר client key אקראי
  return crypto.randomBytes(32).toString("base64url");                              // יוצר מפתח ידידותי להדבקה
}                                                                                   // סוף randomClientKey

export async function generateClientKey(pool: Pool, userId: string) {               // מייצר client key למשתמש אם יש לו מפתחות
  const res = await pool.query<IntegrationRow>(                                     // מביא מצב נוכחי
    "SELECT store_name, woo_url, woo_ck, woo_cs, client_key FROM users WHERE id = $1", // שליפה
    [userId]                                                                        // פרמטר id
  );                                                                                // סוף query

  if (!res.rowCount) throw new Error("USER_NOT_FOUND");                             // אם אין משתמש
  const row = res.rows[0];                                                          // שורה
  if (!hasKeys(row)) throw new Error("MISSING_WOO_KEYS");                            // אם אין שלושת שדות חובה

  if (row.client_key) {                                                             // אם כבר יש key
    return {                                                                        // מחזיר אותו בלי ליצור חדש
      store_name: row.store_name,                                                   // שם חנות
      woo_url: row.woo_url,                                                         // כתובת
      has_woo_keys: true,                                                           // יש מפתחות
      client_key: row.client_key,                                                   // המפתח הקיים
    };                                                                              // סוף return
  }                                                                                 // סוף if

  for (let i = 0; i < 5; i++) {                                                     // מנסה כמה פעמים למניעת התנגשות נדירה
    const key = randomClientKey();                                                  // יוצר מפתח
    try {                                                                           // מנסה לעדכן
      const up = await pool.query<IntegrationRow>(                                  // מעדכן ומחזיר נתונים
        `UPDATE users SET client_key = $2 
         WHERE id = $1
         RETURNING store_name, woo_url, woo_ck, woo_cs, client_key`,                // מחזיר ערכים
        [userId, key]                                                               // פרמטרים
      );                                                                            // סוף query

      const out = up.rows[0];                                                       // שורה אחרי עדכון
      return {                                                                      // מחזיר לפרונט
        store_name: out.store_name,                                                 // שם חנות
        woo_url: out.woo_url,                                                       // כתובת
        has_woo_keys: true,                                                         // יש מפתחות
        client_key: out.client_key,                                                 // מפתח חדש
      };                                                                            // סוף return
    } catch (e: any) {                                                              // אם נפל
      const msg = String(e?.message ?? "");                                         // הודעת שגיאה כמחרוזת
      if (msg.toLowerCase().includes("client_key") && msg.toLowerCase().includes("unique")) { // אם ייחודיות
        continue;                                                                   // מנסה שוב עם מפתח חדש
      }                                                                             // סוף if
      throw e;                                                                      // אחרת זורק את השגיאה
    }                                                                               // סוף catch
  }                                                                                 // סוף לולאה

  throw new Error("FAILED_TO_GENERATE_KEY");                                        // אם לא הצליח אחרי ניסיונות
}                                                                                   // סוף generateClientKey
