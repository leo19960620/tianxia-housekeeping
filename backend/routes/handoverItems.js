import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ... (imports remain same)

/**
 * GET /api/handover-items
 * 取得交班事項列表
 */
router.get('/', async (req, res) => {
    try {
        const { resolved, limit = 100 } = req.query;

        // 修改查詢以包含建立者資訊
        let sql = `
      SELECT hi.*, h.shift, h.staff_name, h.timestamp as handover_timestamp,
             u.full_name as creator_name
      FROM handover_items hi
      LEFT JOIN handovers h ON hi.handover_id = h.id
      LEFT JOIN users u ON hi.created_by = u.id
      WHERE 1=1
    `;

        const params = [];
        let paramIndex = 1;

        if (resolved !== undefined) {
            sql += ` AND hi.is_resolved = $${paramIndex}`;
            params.push(resolved === 'true');
            paramIndex++;
        }

        // 排序：未解決優先，其次按建立時間倒序
        sql += ` ORDER BY hi.is_resolved ASC, hi.created_at DESC`;
        sql += ` LIMIT $${paramIndex}`;
        params.push(limit);

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('取得交班事項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/handover-items
 * 建立獨立交班事項
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id; // 從 token 取得使用者 ID

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '請提供事項內容'
            });
        }

        const result = await query(
            `INSERT INTO handover_items (item_content, created_by) 
             VALUES ($1, $2) 
             RETURNING *`,
            [content, userId]
        );

        res.status(201).json({
            success: true,
            message: '交班事項建立成功',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('建立交班事項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PUT /api/handover-items/:id/resolve
 * 標記交班事項為已解決
 */
// ... (rest of the file remains similar, but need to keep imports and exports)
router.put('/:id/resolve', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { resolved = true } = req.body;

        const result = await query(
            `UPDATE handover_items
       SET is_resolved = $1, updated_at = CURRENT_TIMESTAMP
       WHERE key_id = $2
       RETURNING *`,
            [resolved, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此交班事項'
            });
        }

        res.json({
            success: true,
            message: resolved ? '已標記為已解決' : '已標記為未解決',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新交班事項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PUT /api/handover-items/:id
 * 更新交班事項內容
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '請提供事項內容'
            });
        }

        const result = await query(
            `UPDATE handover_items
       SET item_content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE key_id = $2
       RETURNING *`,
            [content, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此交班事項'
            });
        }

        res.json({
            success: true,
            message: '交班事項更新成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新交班事項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * DELETE /api/handover-items/:id
 * 刪除交班事項
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM handover_items WHERE key_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此交班事項'
            });
        }

        res.json({
            success: true,
            message: '交班事項刪除成功'
        });
    } catch (error) {
        console.error('刪除交班事項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
