import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/ozone/records
 * 建立臭氧紀錄（無需交接／班別；handover_id 為 NULL）
 */
router.post('/records', authenticateToken, async (req, res) => {
    try {
        const { floor, roomNumbers, startTime, durationMinutes, notes } = req.body;

        if (!floor || !roomNumbers || !Array.isArray(roomNumbers) || roomNumbers.length === 0 || !startTime) {
            return res.status(400).json({
                success: false,
                message: '請提供樓層、至少一間房號與開始時間',
            });
        }

        const duration = durationMinutes || 30;
        const start = new Date(startTime);
        if (Number.isNaN(start.getTime())) {
            return res.status(400).json({
                success: false,
                message: '開始時間格式不正確',
            });
        }
        const end = new Date(start.getTime() + duration * 60000);

        const result = await query(
            `INSERT INTO ozone_records 
       (handover_id, floor, room_numbers, start_time, duration_minutes, end_time, notes)
       VALUES (NULL, $1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [floor, roomNumbers, startTime, duration, end, notes || null],
        );

        res.status(201).json({
            success: true,
            message: '臭氧紀錄已建立',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('建立獨立臭氧紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: error.message,
        });
    }
});

export default router;
