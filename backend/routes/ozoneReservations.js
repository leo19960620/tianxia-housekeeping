import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/ozone/reservations
 * 取得所有預約（可篩選 status, date）
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, date } = req.query;

        let queryText = 'SELECT * FROM ozone_reservations WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            queryText += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (date) {
            queryText += ` AND requested_date = $${paramIndex}`;
            params.push(date);
            paramIndex++;
        }

        queryText += ' ORDER BY requested_date DESC, created_at DESC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('查詢臭氧預約錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * POST /api/ozone/reservations
 * 建立新預約
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { floor, roomNumbers, requestedDate, notes, createdBy } = req.body;

        if (!floor || !roomNumbers || !Array.isArray(roomNumbers) || roomNumbers.length === 0 || !requestedDate) {
            return res.status(400).json({
                success: false,
                message: '請提供完整的預約資訊（樓層、房號陣列、預約日期）',
            });
        }

        const result = await query(
            `INSERT INTO ozone_reservations 
       (floor, room_numbers, requested_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [floor, roomNumbers, requestedDate, notes || null, createdBy || null],
        );

        res.status(201).json({
            success: true,
            message: '預約建立成功',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('建立臭氧預約錯誤:', error);
        console.error('錯誤詳細資訊:', error.message);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message,
        });
    }
});

/**
 * PUT /api/ozone/reservations/:id
 * 更新預約（完成、編輯）
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { floor, roomNumbers, requestedDate, notes, status, completedBy } = req.body;

        // 如果是標記完成
        if (status === 'completed') {
            const result = await query(
                `UPDATE ozone_reservations 
         SET status = 'completed', 
             completed_by = $1, 
             completed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
                [completedBy || null, id],
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '找不到此預約',
                });
            }

            return res.json({
                success: true,
                message: '預約已完成',
                data: result.rows[0],
            });
        }

        // 一般編輯預約
        if (!floor || !roomNumbers || !Array.isArray(roomNumbers) || roomNumbers.length === 0 || !requestedDate) {
            return res.status(400).json({
                success: false,
                message: '請提供完整的預約資訊',
            });
        }

        const result = await query(
            `UPDATE ozone_reservations 
       SET floor = $1, room_numbers = $2, requested_date = $3, 
           notes = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
            [floor, roomNumbers, requestedDate, notes || null, id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此預約',
            });
        }

        res.json({
            success: true,
            message: '預約更新成功',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('更新臭氧預約錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * DELETE /api/ozone/reservations/:id
 * 刪除預約
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM ozone_reservations WHERE id = $1 RETURNING *',
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此預約',
            });
        }

        res.json({
            success: true,
            message: '預約刪除成功',
        });
    } catch (error) {
        console.error('刪除臭氧預約錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

export default router;
