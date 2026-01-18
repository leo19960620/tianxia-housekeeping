import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/handovers/:handoverId/inventory
 * 新增備品紀錄到現有交接
 */
router.post('/:handoverId/inventory', async (req, res) => {
    try {
        const { handoverId } = req.params;
        const { status, category, itemType, roomNumber, quantity } = req.body;

        if (!status || !itemType || !roomNumber) {
            return res.status(400).json({
                success: false,
                message: '請提供完整的備品資訊',
            });
        }

        const result = await query(
            `INSERT INTO inventory_records 
       (handover_id, status, category, item_type, room_number, quantity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [handoverId, status, category, itemType, roomNumber, quantity || 1],
        );

        res.status(201).json({
            success: true,
            message: '備品紀錄新增成功',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('新增備品紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * POST /api/handovers/:handoverId/ozone
 * 新增臭氧紀錄到現有交接（樓層卡片式）
 */
router.post('/:handoverId/ozone', async (req, res) => {
    try {
        const { handoverId } = req.params;
        const { floor, roomNumbers, startTime, durationMinutes, notes } = req.body;

        if (!floor || !roomNumbers || !Array.isArray(roomNumbers) || !startTime) {
            return res.status(400).json({
                success: false,
                message: '請提供完整的臭氧資訊（樓層、房號陣列、開始時間）',
            });
        }

        // 計算結束時間
        const duration = durationMinutes || 30;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60000);

        const result = await query(
            `INSERT INTO ozone_records 
       (handover_id, floor, room_numbers, start_time, duration_minutes, end_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [handoverId, floor, roomNumbers, startTime, duration, end, notes || null],
        );

        res.status(201).json({
            success: true,
            message: '臭氧紀錄新增成功',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('新增臭氧紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: `伺服器錯誤: ${error.message}`,
            error: error.toString()
        });
    }
});

/**
 * POST /api/handovers/:handoverId/items
 * 新增交班事項到現有交接
 */
router.post('/:handoverId/items', async (req, res) => {
    try {
        const { handoverId } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: '請提供交班事項內容',
            });
        }

        const result = await query(
            'INSERT INTO handover_items (handover_id, item_content) VALUES ($1, $2) RETURNING *',
            [handoverId, content],
        );

        res.status(201).json({
            success: true,
            message: '交班事項新增成功',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('新增交班事項錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * DELETE /api/inventory/:id
 * 刪除備品紀錄
 */
router.delete('/inventory/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM inventory_records WHERE key_id = $1 RETURNING *',
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此備品紀錄',
            });
        }

        res.json({
            success: true,
            message: '備品紀錄刪除成功',
        });
    } catch (error) {
        console.error('刪除備品紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * PUT /api/ozone/:id
 * 更新臭氧紀錄
 */
router.put('/ozone/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { floor, roomNumbers, startTime, durationMinutes, notes } = req.body;

        if (!floor || !roomNumbers || !Array.isArray(roomNumbers) || !startTime) {
            return res.status(400).json({
                success: false,
                message: '請提供完整的臭氧資訊',
            });
        }

        // 計算結束時間
        const duration = durationMinutes || 30;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60000);

        const result = await query(
            `UPDATE ozone_records 
       SET floor = $1, room_numbers = $2, start_time = $3, 
           duration_minutes = $4, end_time = $5, notes = $6
       WHERE key_id = $7
       RETURNING *`,
            [floor, roomNumbers, startTime, duration, end, notes || null, id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此臭氧紀錄',
            });
        }

        res.json({
            success: true,
            message: '臭氧紀錄更新成功',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('更新臭氧紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * DELETE /api/ozone/:id
 * 刪除臭氧紀錄
 */
router.delete('/ozone/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM ozone_records WHERE key_id = $1 RETURNING *',
            [id],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此臭氧紀錄',
            });
        }

        res.json({
            success: true,
            message: '臭氧紀錄刪除成功',
        });
    } catch (error) {
        console.error('刪除臭氧紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

export default router;
