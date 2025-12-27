import type { Pool, QueryResult } from "pg";
import bcrypt from "bcryptjs";
import type { RegisterBody, UpdateUserBody, UserDto } from "./users.types";
import { encryptSecret } from "../../utils/secretsCrypto";                             // הצפנת סודות
import { generateClientKeyPlain, hashClientKey } from "../../utils/clientKey";         // client key


function mapRowToUserDto(row: any): UserDto {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    storeUrl: row.store_url,
    storeName: row.store_name, 
    plan: row.plan,
    isEmailVerified: row.is_email_verified,
    createdAt: row.created_at,
  };
}

export async function registerUser(
  db: Pool,
  body: RegisterBody
): Promise<UserDto> {
  const email = body.email.toLowerCase().trim();

  const existing: QueryResult = await db.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existing.rowCount && existing.rowCount > 0) {
    throw new Error("USER_EXISTS");
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  const insertResult: QueryResult = await db.query(
    `INSERT INTO users
       (full_name, email, password_hash, role, store_url, store_name, plan)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      body.fullName,
      email,
      passwordHash,
      body.role,
      body.storeUrl,
      body.storeName, 
      body.plan,
    ]
  );

  return mapRowToUserDto(insertResult.rows[0]);
}

export async function getAllUsers(db: Pool): Promise<UserDto[]> {
  const result: QueryResult = await db.query(
    `SELECT * FROM users ORDER BY created_at DESC`
  );
  return result.rows.map(mapRowToUserDto);
}

export async function getUserById(
  db: Pool,
  id: number
): Promise<UserDto | null> {
  const result: QueryResult = await db.query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  if (!result.rowCount) return null;
  return mapRowToUserDto(result.rows[0]);
}

export async function updateUser(
  db: Pool,
  id: number,
  body: UpdateUserBody
): Promise<UserDto | null> {
  const result: QueryResult = await db.query(
    `UPDATE users
       SET
         full_name = $1,
         role = $2,
         store_url = $3,
         store_name = $4,
         plan = $5,
         is_email_verified = $6
     WHERE id = $7
     RETURNING *`,
    [
      body.fullName,
      body.role,
      body.storeUrl,
      body.storeName, // חדש  עדכון שם חנות
      body.plan,
      body.isEmailVerified,
      id,
    ]
  );

  if (!result.rowCount) return null;
  return mapRowToUserDto(result.rows[0]);
}

export async function deleteUserById(
  db: Pool,
  id: number
): Promise<boolean> {
  const result: QueryResult = await db.query(
    `DELETE FROM users WHERE id = $1`,
    [id]
  );
  return !!result.rowCount;
}

export async function updateWooCredentials(                                            // עדכון נתוני Woo
  pool: any,                                                                           // Pool
  userId: string,                                                                      // מזהה
  input: { woo_url: string; woo_ck: string; woo_cs: string; store_name?: string }      // קלט
) {                                                                                    // תחילת פונקציה
  const wooUrl = input.woo_url.trim();                                                 // ניקוי
  const wooCk = input.woo_ck.trim();                                                   // ניקוי
  const wooCs = input.woo_cs.trim();                                                   // ניקוי

  const encCk = encryptSecret(wooCk);                                                   // הצפנת ck
  const encCs = encryptSecret(wooCs);                                                   // הצפנת cs

  const res = await pool.query(                                                         // עדכון מסד
    `UPDATE users
     SET woo_url = $1,
         woo_ck  = $2,
         woo_cs  = $3,
         store_name = COALESCE($4, store_name)
     WHERE id = $5
     RETURNING id, email, role, plan, woo_url, store_name, created_at`,                 // לא מחזירים סודות
    [wooUrl, encCk, encCs, input.store_name ?? null, userId]                            // פרמטרים
  );                                                                                    // סוף query

  return res.rows[0] ?? null;                                                           // תוצאה
}                                                                                        // סוף updateWooCredentials

export async function generateClientKeyForUser(                                          // יצירת client key
  pool: any,                                                                            // Pool
  userId: string                                                                        // מזהה
) {                                                                                      // תחילת פונקציה
  const check = await pool.query(                                                        // בדיקה שיש creds
    `SELECT id, plan, woo_url, woo_ck, woo_cs
     FROM users
     WHERE id = $1`,
    [userId]
  );                                                                                     // סוף query

  if (!check.rowCount) return { ok: false as const, status: 404 as const, error: "User not found" }; // אין משתמש
  const u = check.rows[0];                                                               // user

  if (!u.woo_url || !u.woo_ck || !u.woo_cs) {                                            // חסר שדות
    return { ok: false as const, status: 400 as const, error: "Missing Woo credentials" }; // לא מייצרים
  }                                                                                      // סוף תנאי

  if (String(u.plan).trim() === "starter") {                                             // אם מנוי לא מספיק
    return { ok: false as const, status: 403 as const, error: "Upgrade required" };      // חסום
  }                                                                                      // סוף תנאי

  const plain = generateClientKeyPlain();                                                // מפתח גלוי
  const hashed = hashClientKey(plain);                                                   // hash לשמירה

  await pool.query(                                                                       // שמירת hash
    `UPDATE users
     SET client_key = $1
     WHERE id = $2`,
    [hashed, userId]
  );                                                                                      // סוף query

  return { ok: true as const, status: 200 as const, client_key: plain };                  // מחזיר ללקוח
}                                                                                          // סוף generateClientKeyForUser
