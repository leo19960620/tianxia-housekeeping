import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// 通用 Token（用於不需要登入的場景）
const COMMON_TOKEN = process.env.COMMON_TOKEN || 'common-access-token-2024';

/**
 * JWT驗證中介層
 * 檢查請求標頭中的JWT token
 * 支援兩種 token：
 * 1. JWT token（登入後取得）
 * 2. 通用 token（固定值，適用於開發環境或不需要登入的場景）
 */
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供驗證token'
        });
    }

    // 檢查是否為通用 token
    if (token === COMMON_TOKEN) {
        // 使用通用 token 時，設定一個預設使用者
        req.user = {
            id: null,  // 使用 null 避免外鍵約束問題
            username: 'common_user',
            role: 'admin' // 給予管理員權限以允許所有操作
        };
        return next();
    }

    // 驗證 JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token無效或已過期'
            });
        }

        req.user = user;
        next();
    });
};

/**
 * 管理員權限驗證中介層
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理員權限'
        });
    }
    next();
};

/**
 * 產生JWT token
 */
export const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};
