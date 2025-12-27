import crypto from "crypto";                                                        // קריפטו מובנה של נוד

const ENC_KEY_B64 = (process.env.CRED_ENC_KEY ?? "").trim();                         // מפתח הצפנה מה env
if (!ENC_KEY_B64) throw new Error("Missing CRED_ENC_KEY");                           // אם חסר env זורקים שגיאה

const ENC_KEY = Buffer.from(ENC_KEY_B64, "base64");                                  // ממירים מ base64
if (ENC_KEY.length !== 32) throw new Error("CRED_ENC_KEY must be 32 bytes");         // חייב להיות 32 בתים

const ALG = "aes-256-gcm";                                                           // אלגוריתם הצפנה

export function encryptSecret(plain: string): string {                                // הצפנה למסד
  const iv = crypto.randomBytes(12);                                                  // iv ל gcm
  const cipher = crypto.createCipheriv(ALG, ENC_KEY, iv);                             // יצירת cipher
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);          // הצפנה
  const tag = cipher.getAuthTag();                                                    // תג אימות
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`; // פורמט שמור
}                                                                                    // סוף encryptSecret

export function decryptSecret(stored: string): string {                               // פענוח כשתצטרך להשתמש
  const parts = stored.split(":");                                                    // פיצול
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("Bad secret format");  // בדיקה
  const iv = Buffer.from(parts[1], "base64");                                         // iv
  const tag = Buffer.from(parts[2], "base64");                                        // tag
  const data = Buffer.from(parts[3], "base64");                                       // נתונים
  const decipher = crypto.createDecipheriv(ALG, ENC_KEY, iv);                         // decipher
  decipher.setAuthTag(tag);                                                           // tag
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");   // פענוח
}                                                                                    // סוף decryptSecret
