import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/bicycle-rentals
 * 查詢租借紀錄（支援 status 過濾）
 */
router.get('/', async (req, res) => {
    try {
        const { status, date } = req.query;

        let sql = `
            SELECT 
                br.*,
                b.bicycle_number
            FROM bicycle_rentals br
            LEFT JOIN bicycles b ON br.bicycle_id = b.id
        `;
        const params = [];
        const conditions = [];
        let paramCount = 1;

        if (status) {
            conditions.push(`br.status = $${paramCount++}`);
            params.push(status);
        }

        // 日期篩選（台北時區 UTC+8）
        if (date) {
            // date 格式: YYYY-MM-DD
            conditions.push(`DATE(br.rental_start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Taipei') = $${paramCount++}`);
            params.push(date);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
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
 * 建立租借紀錄（支援批次借出）
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

        // 支援批次借出：將 bicycle_id 轉為陣列
        const bicycleIds = Array.isArray(bicycle_id) ? bicycle_id : [bicycle_id];

        if (bicycleIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請至少選擇一輛腳踏車'
            });
        }

        // 開始 transaction
        await query('BEGIN');

        try {
            const createdRentals = [];

            for (const id of bicycleIds) {
                // 檢查腳踏車是否可借
                const bicycleCheck = await query(
                    'SELECT status, is_active FROM bicycles WHERE id = $1',
                    [id]
                );

                if (bicycleCheck.rows.length === 0) {
                    throw new Error(`找不到腳踏車 ID: ${id}`);
                }

                if (bicycleCheck.rows[0].status !== 'available') {
                    throw new Error(`腳踏車 ID ${id} 目前無法借出（狀態：${bicycleCheck.rows[0].status}）`);
                }

                // 檢查是否啟用
                if (bicycleCheck.rows[0].is_active === false) {
                    throw new Error(`腳踏車 ID ${id} 目前已關閉，無法借出`);
                }

                // 建立租借紀錄
                const insertSql = `
                    INSERT INTO bicycle_rentals 
                    (bicycle_id, room_number, room_status, rented_by, notes) 
                    VALUES ($1, $2, $3, $4, $5) 
                    RETURNING *
                `;
                const result = await query(insertSql, [
                    id,
                    room_number,
                    room_status,
                    rented_by,
                    notes
                ]);

                // 更新腳踏車狀態為已借出
                await query(
                    'UPDATE bicycles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['rented', id]
                );

                createdRentals.push(result.rows[0]);
            }

            // 提交 transaction
            await query('COMMIT');

            res.status(201).json({
                success: true,
                message: `成功借出 ${bicycleIds.length} 輛腳踏車`,
                data: createdRentals
            });
        } catch (error) {
            // 回滾 transaction
            await query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('建立租借紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: error.message || '伺服器錯誤'
        });
    }
});

/**
 * PATCH /api/bicycle-rentals/:id
 * 更新租借資訊
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { bicycle_number, room_number } = req.body;

        // 1. 取得目前的租借紀錄
        const rentalCheck = await query(
            'SELECT * FROM bicycle_rentals WHERE id = $1',
            [id]
        );

        if (rentalCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此租借紀錄'
            });
        }

        const currentRental = rentalCheck.rows[0];
        let newBicycleId = currentRental.bicycle_id;

        // 開始 Transaction
        await query('BEGIN');

        try {
            // 2. 如果有更改腳踏車編號
            if (bicycle_number) {
                // 找出對應的 bicycle_id
                const bikeResult = await query(
                    'SELECT id, status FROM bicycles WHERE bicycle_number = $1',
                    [bicycle_number]
                );

                if (bikeResult.rows.length === 0) {
                    throw new Error(`找不到編號為 ${bicycle_number} 的腳踏車`);
                }

                const newBike = bikeResult.rows[0];

                // 如果換了車
                if (newBike.id !== currentRental.bicycle_id) {
                    // 檢查新車是否可借
                    if (newBike.status !== 'available') {
                        throw new Error(`腳踏車 ${bicycle_number} 目前無法租借`);
                    }

                    // 1. 將舊車設為 available
                    await query(
                        "UPDATE bicycles SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
                        [currentRental.bicycle_id]
                    );

                    // 2. 將新車設為 rented
                    await query(
                        "UPDATE bicycles SET status = 'rented', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
                        [newBike.id]
                    );

                    newBicycleId = newBike.id;
                }
            }

            // 3. 更新租借紀錄
            const updateResult = await query(
                `UPDATE bicycle_rentals 
                 SET bicycle_id = $1, 
                     room_number = COALESCE($2, room_number),
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $3 
                 RETURNING *`,
                [newBicycleId, room_number, id]
            );

            await query('COMMIT');

            res.json({
                success: true,
                message: '更新成功',
                data: updateResult.rows[0]
            });

        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('更新租借紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: error.message || '伺服器錯誤'
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
