import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database/db.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * 使用者登入
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '請提供帳號和密碼'
            });
        }

        // 查詢使用者
        const result = await query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: '帳號或密碼錯誤'
            });
        }

        const user = result.rows[0];

        // 驗證密碼
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '帳號或密碼錯誤'
            });
        }

        // 產生JWT token
        const token = generateToken(user);

        res.json({
            success: true,
            message: '登入成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('登入錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/auth/register
 * 註冊新使用者 (需要管理員權限)
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, role = 'staff' } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: '請提供完整的使用者資訊'
            });
        }

        // 檢查帳號是否已存在
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: '此帳號已被使用'
            });
        }

        // 加密密碼
        const passwordHash = await bcrypt.hash(password, 10);

        // 建立使用者
        const result = await query(
            `INSERT INTO users (username, password_hash, full_name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, full_name, role, created_at`,
            [username, passwordHash, fullName, role]
        );

        res.status(201).json({
            success: true,
            message: '使用者建立成功',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('註冊錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
