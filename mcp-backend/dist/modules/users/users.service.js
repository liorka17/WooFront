"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.deleteUserById = deleteUserById;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function mapRowToUserDto(row) {
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
async function registerUser(db, body) {
    const email = body.email.toLowerCase().trim();
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount && existing.rowCount > 0) {
        throw new Error("USER_EXISTS");
    }
    const saltRounds = 10;
    const passwordHash = await bcryptjs_1.default.hash(body.password, saltRounds);
    const insertResult = await db.query(`INSERT INTO users
       (full_name, email, password_hash, role, store_url, plan)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`, [body.fullName, email, passwordHash, body.role, body.storeUrl, body.plan]);
    return mapRowToUserDto(insertResult.rows[0]);
}
async function getAllUsers(db) {
    const result = await db.query(`SELECT * FROM users ORDER BY created_at DESC`);
    return result.rows.map(mapRowToUserDto);
}
async function getUserById(db, id) {
    const result = await db.query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (!result.rowCount)
        return null;
    return mapRowToUserDto(result.rows[0]);
}
async function updateUser(db, id, body) {
    const result = await db.query(`UPDATE users
       SET
         full_name = $1,
         role = $2,
         store_url = $3,
         plan = $4,
         is_email_verified = $5
     WHERE id = $6
     RETURNING *`, [
        body.fullName,
        body.role,
        body.storeUrl,
        body.plan,
        body.isEmailVerified,
        id,
    ]);
    if (!result.rowCount)
        return null;
    return mapRowToUserDto(result.rows[0]);
}
async function deleteUserById(db, id) {
    const result = await db.query(`DELETE FROM users WHERE id = $1`, [id]);
    return !!result.rowCount;
}
