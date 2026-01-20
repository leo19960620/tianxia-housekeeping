import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/bicycle-rentals
 * 查詢租借紀錄（支援 status 過濾）
 */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;

        let sql = `
            SELECT 
                br.*,
                b.bicycle_number
            FROM bicycle_rentals br
            LEFT JOIN bicycles b ON br.bicycle_id = b.id
        `;
        const params = [];

        if (status) {
            sql += ' WHERE br.status = $1';
            params.push(status);
        }

        sql += ' ORDER BY br.rental_start_time DESC';

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('查詢租借紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/bicycle-rentals/active
 * 查詢目前租借中的腳踏車
 */
router.get('/active', async (req, res) => {
    try {
        const sql = `
            SELECT 
                br.*,
                b.bicycle_number
            FROM bicycle_rentals br
            LEFT JOIN bicycles b ON br.bicycle_id = b.id
            WHERE br.status = 'active'
            ORDER BY br.rental_start_time DESC
        `;

        const result = await query(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('查詢目前租借錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/bicycle-rentals
 * 建立租借紀錄
 */
router.post('/', async (req, res) => {
    try {
        const { bicycle_id, room_number, room_status, rented_by, notes } = req.body;

        if (!bicycle_id || !rented_by) {
            return res.status(400).json({
                success: false,
                message: '請提供腳踏車 ID 和經手人'
            });
        }

        // 檢查腳踏車是否可借
        const bicycleCheck = await query(
            'SELECT status FROM bicycles WHERE id = $1',
            [bicycle_id]
        );

        if (bicycleCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此腳踏車'
            });
        }

        if (bicycleCheck.rows[0].status !== 'available') {
            return res.status(400).json({
                success: false,
                message: '此腳踏車目前無法借出'
            });
        }

        // 建立租借紀錄
        const insertSql = `
            INSERT INTO bicycle_rentals 
            (bicycle_id, room_number, room_status, rented_by, notes) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `;
        const result = await query(insertSql, [
            bicycle_id,
            room_number,
            room_status,
            rented_by,
            notes
        ]);

        // 更新腳踏車狀態為已借出
        await query(
            'UPDATE bicycles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['rented', bicycle_id]
        );

        res.status(201).json({
            success: true,
            message: '租借記錄已建立',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('建立租借紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PATCH /api/bicycle-rentals/:id/return
 * 歸還腳踏車
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
            'SELECT bicycle_id, status FROM bicycle_rentals WHERE id = $1',
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

        const bicycleId = rentalCheck.rows[0].bicycle_id;

        // 更新租借紀錄
        const updateSql = `
            UPDATE bicycle_rentals 
            SET status = 'returned', 
                rental_end_time = CURRENT_TIMESTAMP, 
                returned_by = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 
            RETURNING *
        `;
        const result = await query(updateSql, [returned_by, id]);

        // 更新腳踏車狀態為可借
        await query(
            'UPDATE bicycles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['available', bicycleId]
        );

        res.json({
            success: true,
            message: '腳踏車已歸還',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('歸還腳踏車錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
