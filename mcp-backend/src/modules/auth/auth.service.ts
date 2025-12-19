import type { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? "dev-secret").trim();

// חשוב: expiresIn מקבל טיפוס מיוחד, לא string כללי
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) ?? "1h";

export interface LoginInput {
  email: string;
  password: string;
}

export interface JwtUserPayload {
  id: number;
  email: string;
  role: "owner" | "agency" | "developer" | "admin";
}

export function signToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtUserPayload {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
}

export async function loginUser(pool: Pool, body: LoginInput) {
  const email = body.email.toLowerCase().trim();

  const res = await pool.query(
    "SELECT id, email, password_hash, role FROM users WHERE email = $1",
    [email]
  );

  if (res.rowCount === 0) {
    return {
      ok: false as const,
      status: 401 as const,
      error: "Invalid email or password",
    };
  }

  const user = res.rows[0];

  const isValid = await bcrypt.compare(body.password, user.password_hash);
  if (!isValid) {
    return {
      ok: false as const,
      status: 401 as const,
      error: "Invalid email or password",
    };
  }

  const payload: JwtUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = signToken(payload);

  return {
    ok: true as const,
    status: 200 as const,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}
