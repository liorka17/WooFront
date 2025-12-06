import type { Pool, QueryResult } from "pg";
import bcrypt from "bcryptjs";
import type { RegisterBody, UpdateUserBody, UserDto } from "./users.types";

function mapRowToUserDto(row: any): UserDto {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    storeUrl: row.store_url,
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

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  const insertResult: QueryResult = await db.query(
    `INSERT INTO users
       (full_name, email, password_hash, role, store_url, plan)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [body.fullName, email, passwordHash, body.role, body.storeUrl, body.plan]
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
         plan = $4,
         is_email_verified = $5
     WHERE id = $6
     RETURNING *`,
    [
      body.fullName,
      body.role,
      body.storeUrl,
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
