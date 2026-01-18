import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/announcements
 * 取得所有公告
 */
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;

        let sql = `
      SELECT a.*, u.full_name as created_by_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
    `;

        // 如果只要顯示有效公告
        if (active === 'true') {
            sql += ` WHERE CURRENT_DATE BETWEEN a.start_date AND a.end_date`;
        }

        sql += ` ORDER BY a.created_at DESC`;

        const result = await query(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('取得公告錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/announcements/:id
 * 取得單一公告
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT a.*, u.full_name as created_by_name
       FROM announcements a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此公告'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('取得公告錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/announcements
 * 建立新公告 (需登入)
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { content, startDate, endDate, announcementType = 'general', announcer } = req.body;

        if (!content || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: '請提供完整的公告資訊'
            });
        }

        const result = await query(
            `INSERT INTO announcements (content, start_date, end_date, announcement_type, announcer, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [content, startDate, endDate, announcementType, announcer, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: '公告建立成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('建立公告錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PUT /api/announcements/:id
 * 更新公告 (需登入)
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, startDate, endDate, announcementType, announcer } = req.body;

        const result = await query(
            `UPDATE announcements
       SET content = $1, start_date = $2, end_date = $3, announcement_type = $4, announcer = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
            [content, startDate, endDate, announcementType, announcer, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此公告'
            });
        }

        res.json({
            success: true,
            message: '公告更新成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新公告錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * DELETE /api/announcements/:id
 * 刪除公告 (需登入)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM announcements WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此公告'
            });
        }

        res.json({
            success: true,
            message: '公告刪除成功'
        });
    } catch (error) {
        console.error('刪除公告錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
