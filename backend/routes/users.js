import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/users
 * 取得所有使用者列表
 */
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, username, full_name, role, created_at, updated_at 
             FROM users 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('取得使用者列表錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/users/:id
 * 取得單一使用者資訊
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT id, username, full_name, role, created_at, updated_at 
             FROM users 
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此使用者'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('取得使用者錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/users
 * 建立新使用者
 */
router.post('/', async (req, res) => {
    try {
        const { username, password, fullName, role = 'staff' } = req.body;

        if (!fullName) {
            return res.status(400).json({
                success: false,
                message: '請提供使用者姓名'
            });
        }

        // 簡化模式：如果沒提供 username，自動使用 uuid 或隨機字串
        const finalUsername = username || `user_${Date.now()}`;
        // 簡化模式：如果沒提供 password，使用預設密碼 '123456'
        const finalPassword = password || '123456';

        // 檢查帳號是否已存在
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1',
            [finalUsername]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: '此帳號已被使用'
            });
        }

        // 加密密碼
        const passwordHash = await bcrypt.hash(finalPassword, 10);

        // 建立使用者
        const result = await query(
            `INSERT INTO users (username, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, full_name, role, created_at`,
            [finalUsername, passwordHash, fullName, role]
        );

        res.status(201).json({
            success: true,
            message: '使用者建立成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('建立使用者錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PUT /api/users/:id
 * 更新使用者資訊
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, password } = req.body;

        if (!fullName) {
            return res.status(400).json({
                success: false,
                message: '請提供姓名'
            });
        }

        let updateQuery;
        let params;

        if (password) {
            // 如果提供密碼，則更新密碼
            const passwordHash = await bcrypt.hash(password, 10);
            updateQuery = `UPDATE users 
                          SET full_name = $1, role = $2, password_hash = $3, updated_at = CURRENT_TIMESTAMP 
                          WHERE id = $4 
                          RETURNING id, username, full_name, role, updated_at`;
            params = [fullName, role, passwordHash, id];
        } else {
            // 不更新密碼
            updateQuery = `UPDATE users 
                          SET full_name = $1, role = $2, updated_at = CURRENT_TIMESTAMP 
                          WHERE id = $3 
                          RETURNING id, username, full_name, role, updated_at`;
            params = [fullName, role, id];
        }

        const result = await query(updateQuery, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此使用者'
            });
        }

        res.json({
            success: true,
            message: '使用者更新成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新使用者錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * DELETE /api/users/:id
 * 刪除使用者
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此使用者'
            });
        }

        res.json({
            success: true,
            message: '使用者刪除成功'
        });
    } catch (error) {
        console.error('刪除使用者錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
