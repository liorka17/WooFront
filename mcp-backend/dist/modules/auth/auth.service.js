"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.loginUser = loginUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = (process.env.JWT_SECRET ?? "dev-secret").trim();
// חשוב: expiresIn מקבל טיפוס מיוחד, לא string כללי
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
async function loginUser(pool, body) {
    const email = body.email.toLowerCase().trim();
    const res = await pool.query("SELECT id, email, password_hash, role FROM users WHERE email = $1", [email]);
    if (res.rowCount === 0) {
        return {
            ok: false,
            status: 401,
            error: "Invalid email or password",
        };
    }
    const user = res.rows[0];
    const isValid = await bcryptjs_1.default.compare(body.password, user.password_hash);
    if (!isValid) {
        return {
            ok: false,
            status: 401,
            error: "Invalid email or password",
        };
    }
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    const token = signToken(payload);
    return {
        ok: true,
        status: 200,
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    };
}
