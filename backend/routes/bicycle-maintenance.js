import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/bicycle-maintenance
 * 查詢維護紀錄
 */
router.get('/', async (req, res) => {
    try {
        const { bicycle_id, maintenance_type } = req.query;

        let sql = `
            SELECT 
                bm.*,
                b.bicycle_number
            FROM bicycle_maintenance bm
            LEFT JOIN bicycles b ON bm.bicycle_id = b.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (bicycle_id) {
            sql += ` AND bm.bicycle_id = $${paramCount++}`;
            params.push(bicycle_id);
        }

        if (maintenance_type) {
            sql += ` AND bm.maintenance_type = $${paramCount++}`;
            params.push(maintenance_type);
        }

        sql += ' ORDER BY bm.maintenance_date DESC';

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('查詢維護紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/bicycle-maintenance/bicycle/:bicycleId
 * 查詢特定車輛的維護歷史
 */
router.get('/bicycle/:bicycleId', async (req, res) => {
    try {
        const { bicycleId } = req.params;

        const sql = `
            SELECT * FROM bicycle_maintenance 
            WHERE bicycle_id = $1 
            ORDER BY maintenance_date DESC
        `;

        const result = await query(sql, [bicycleId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('查詢車輛維護歷史錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/bicycle-maintenance
 * 記錄維護
 */
router.post('/', async (req, res) => {
    try {
        const { bicycle_id, maintenance_type, performed_by, notes } = req.body;

        if (!bicycle_id || !maintenance_type) {
            return res.status(400).json({
                success: false,
                message: '請提供腳踏車 ID 和維護類型'
            });
        }

        // 檢查腳踏車是否存在
        const bicycleCheck = await query(
            'SELECT id FROM bicycles WHERE id = $1',
            [bicycle_id]
        );

        if (bicycleCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此腳踏車'
            });
        }

        // 建立維護紀錄
        const insertSql = `
            INSERT INTO bicycle_maintenance 
            (bicycle_id, maintenance_type, performed_by, notes) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const result = await query(insertSql, [
            bicycle_id,
            maintenance_type,
            performed_by,
            notes
        ]);

        // 更新腳踏車的對應維護日期
        const updateField = maintenance_type === 'air_check'
            ? 'last_air_check_date'
            : maintenance_type === 'cleaning'
                ? 'last_cleaning_date'
                : null;

        if (updateField) {
            await query(
                `UPDATE bicycles SET ${updateField} = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [bicycle_id]
            );
        }

        // 如果是外觀檢查，且有備註，更新外觀狀況
        if (maintenance_type === 'appearance_check' && notes) {
            await query(
                'UPDATE bicycles SET appearance_condition = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [notes, bicycle_id]
            );
        }

        res.status(201).json({
            success: true,
            message: '維護紀錄已建立',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('建立維護紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
