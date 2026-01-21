import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/umbrella-rentals
 * 查詢雨傘租借紀錄（支援 status 過濾）
 */
router.get('/', async (req, res) => {
    try {
        const { status, date } = req.query;

        let sql = 'SELECT * FROM umbrella_rentals';
        const params = [];
        const conditions = [];
        let paramCount = 1;

        if (status) {
            conditions.push(`status = $${paramCount++}`);
            params.push(status);
        }

        // 日期篩選（台北時區 UTC+8）
        if (date) {
            // date 格式: YYYY-MM-DD
            conditions.push(`DATE(rental_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Taipei') = $${paramCount++}`);
            params.push(date);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY rental_start_time DESC';

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('查詢雨傘租借紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/umbrella-rentals/active
 * 查詢目前租借中的雨傘
 */
router.get('/active', async (req, res) => {
    try {
        const sql = `
            SELECT * FROM umbrella_rentals 
            WHERE status = 'active' 
            ORDER BY rental_start_time DESC
        `;

        const result = await query(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('查詢目前租借雨傘錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/umbrella-rentals
 * 建立雨傘租借紀錄
 */
router.post('/', async (req, res) => {
    try {
        const { quantity, room_number, room_status, rented_by, notes } = req.body;

        if (!rented_by) {
            return res.status(400).json({
                success: false,
                message: '請提供經手人'
            });
        }

        const insertSql = `
            INSERT INTO umbrella_rentals 
            (quantity, room_number, room_status, rented_by, notes) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `;
        const result = await query(insertSql, [
            quantity || 1, // 預設數量為 1
            room_number,
            room_status,
            rented_by,
            notes
        ]);

        res.status(201).json({
            success: true,
            message: '雨傘租借記錄已建立',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('建立雨傘租借紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PATCH /api/umbrella-rentals/:id
 * 更新租借資訊
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, room_number } = req.body;

        const result = await query(
            `UPDATE umbrella_rentals 
             SET quantity = COALESCE($1, quantity), 
                 room_number = COALESCE($2, room_number),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $3 
             RETURNING *`,
            [quantity, room_number, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此租借紀錄'
            });
        }

        res.json({
            success: true,
            message: '更新成功',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('更新雨傘租借紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PATCH /api/umbrella-rentals/:id/return
 * 歸還雨傘
 */
router.patch('/:id/return', async (req, res) => {
    try {
        const { id } = req.params;
        const { returned_by } = req.body;

        if (!returned_by) {
            return res.status(400).json({
                success: false,
                message: '請提供歸還經手人'
            });
        }

        // 查詢租借紀錄
        const rentalCheck = await query(
            'SELECT status FROM umbrella_rentals WHERE id = $1',
            [id]
        );

        if (rentalCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此租借紀錄'
            });
        }

        if (rentalCheck.rows[0].status === 'returned') {
            return res.status(400).json({
                success: false,
                message: '此租借紀錄已歸還'
            });
        }

        // 更新租借紀錄
        const updateSql = `
            UPDATE umbrella_rentals 
            SET status = 'returned', 
                rental_end_time = CURRENT_TIMESTAMP, 
                returned_by = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 
            RETURNING *
        `;
        const result = await query(updateSql, [returned_by, id]);

        res.json({
            success: true,
            message: '雨傘已歸還',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('歸還雨傘錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
