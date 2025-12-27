import crypto from "crypto";                                                         // קריפטו מובנה

const PEPPER = (process.env.CLIENT_KEY_PEPPER ?? "").trim();                          // pepper לגיבוב
if (!PEPPER) throw new Error("Missing CLIENT_KEY_PEPPER");                            // אם חסר env זורקים

export function generateClientKeyPlain(): string {                                    // יצירת client key למשתמש
  return crypto.randomBytes(32).toString("base64url");                                // מפתח נוח להעתקה
}                                                                                    // סוף generate

export function hashClientKey(plain: string): string {                                // hash לשמירה במסד
  return crypto.createHmac("sha256", PEPPER).update(plain).digest("hex");             // HMAC SHA256
}                                                                                    // סוף hash
