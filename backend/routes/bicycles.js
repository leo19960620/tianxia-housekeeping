import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/bicycles
 * 查詢所有腳踏車（含最新維護紀錄）
 */
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                b.*,
                (SELECT COUNT(*) FROM bicycle_rentals WHERE bicycle_id = b.id AND status = 'active') as is_currently_rented,
                (SELECT json_build_object(
                    'last_air_check', MAX(CASE WHEN maintenance_type = 'air_check' THEN maintenance_date END),
                    'last_cleaning', MAX(CASE WHEN maintenance_type = 'cleaning' THEN maintenance_date END),
                    'last_appearance_check', MAX(CASE WHEN maintenance_type = 'appearance_check' THEN maintenance_date END)
                ) FROM bicycle_maintenance WHERE bicycle_id = b.id) as maintenance_info
            FROM bicycles b
            ORDER BY CAST(b.bicycle_number AS INTEGER)
        `;

        const result = await query(sql);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('查詢腳踏車資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/bicycles/:id
 * 查詢單一腳踏車詳細資料
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const bicycleSql = 'SELECT * FROM bicycles WHERE id = $1';
        const bicycleResult = await query(bicycleSql, [id]);

        if (bicycleResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此腳踏車'
            });
        }

        // 查詢維護紀錄
        const maintenanceSql = `
            SELECT * FROM bicycle_maintenance 
            WHERE bicycle_id = $1 
            ORDER BY maintenance_date DESC 
            LIMIT 10
        `;
        const maintenanceResult = await query(maintenanceSql, [id]);

        res.json({
            success: true,
            data: {
                ...bicycleResult.rows[0],
                maintenance_history: maintenanceResult.rows
            }
        });
    } catch (error) {
        console.error('查詢腳踏車詳細資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PATCH /api/bicycles/:id
 * 更新腳踏車資料
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, appearance_condition, notes, is_active } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (appearance_condition !== undefined) {
            updates.push(`appearance_condition = $${paramCount++}`);
            values.push(appearance_condition);
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramCount++}`);
            values.push(notes);
        }
        if (typeof is_active === 'boolean') {
            updates.push(`is_active = $${paramCount++}`);
            values.push(is_active);
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const sql = `
            UPDATE bicycles 
            SET ${updates.join(', ')} 
            WHERE id = $${paramCount} 
            RETURNING *
        `;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此腳踏車'
            });
        }

        res.json({
            success: true,
            message: '腳踏車資料已更新',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新腳踏車資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
