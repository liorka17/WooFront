// src/modules/auth/auth.service.ts

import type { Pool } from "pg";                                                     // Pool של Postgres
import bcrypt from "bcryptjs";                                                      // bcrypt

export interface LoginInput {                                                       // טיפוס בקשת התחברות
  email: string;                                                                    // אימייל
  password: string;                                                                 // סיסמה
}                                                                                   // סוף טיפוס

export interface JwtUserPayload {                                                   // payload שנכניס ל JWT
  id: string;                                                                       // מזהה כ string כדי להתאים למה שיש אצלך
  email: string;                                                                    // אימייל
  role: "owner" | "agency" | "developer" | "admin";                                 // תפקידים
}                                                                                   // סוף טיפוס

export async function loginUser(pool: Pool, body: LoginInput) {                     // פונקציה שמוודאת משתמש וסיסמה
  const email = body.email.toLowerCase().trim();                                    // נרמול אימייל

  const res = await pool.query(                                                     // שאילתא למסד
    "SELECT id, email, password_hash, role FROM users WHERE email = $1",            // שליפה
    [email]                                                                         // פרמטר
  );                                                                                // סוף query

  if (!res.rowCount) {                                                              // אם לא נמצא
    return { ok: false as const, status: 401 as const, error: "Invalid email or password" }; // שגיאה
  }                                                                                 // סוף תנאי

  const user = res.rows[0];                                                         // המשתמש שנמצא

  const isValid = await bcrypt.compare(body.password, user.password_hash);          // בדיקת סיסמה
  if (!isValid) {                                                                   // אם לא תקין
    return { ok: false as const, status: 401 as const, error: "Invalid email or password" }; // שגיאה
  }                                                                                 // סוף תנאי

  const payload: JwtUserPayload = {                                                 // יצירת payload ל JWT
    id: String(user.id),                                                            // מזהה
    email: String(user.email),                                                      // אימייל
    role: user.role as JwtUserPayload["role"],                                      // תפקיד
  };                                                                                // סוף payload

  return {                                                                          // מחזיר נתונים ל route כדי שיחתום עם server.jwt.sign
    ok: true as const,                                                              // הצלחה
    status: 200 as const,                                                           // סטטוס
    payload,                                                                        // payload לחתימה
    user: { id: String(user.id), email: String(user.email), role: String(user.role) }, // user לתצוגה
  };                                                                                // סוף return
}                                                                                   // סוף loginUser
