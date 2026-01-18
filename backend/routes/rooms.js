import express from 'express';
import pool from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * 取得所有樓層列表
 * GET /api/rooms/floors
 */
router.get('/floors', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT floor
            FROM rooms
            WHERE is_active = TRUE
            ORDER BY 
                CASE 
                    WHEN floor = 'B1' THEN 0
                    ELSE CAST(REPLACE(floor, 'F', '') AS INTEGER)
                END
        `);

        const floors = result.rows.map(row => row.floor);
        res.json({ success: true, data: floors });
    } catch (error) {
        console.error('取得樓層列表錯誤:', error);
        res.status(500).json({ success: false, message: '取得樓層列表失敗' });
    }
});

/**
 * 取得所有房號資料 (依樓層分組)
 * GET /api/rooms
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT floor, room_number
            FROM rooms
            WHERE is_active = TRUE
            ORDER BY 
                CASE 
                    WHEN floor = 'B1' THEN 0
                    ELSE CAST(REPLACE(floor, 'F', '') AS INTEGER)
                END,
                display_order
        `);

        // 依樓層分組
        const roomsByFloor = {};
        result.rows.forEach(row => {
            if (!roomsByFloor[row.floor]) {
                roomsByFloor[row.floor] = [];
            }
            roomsByFloor[row.floor].push(row.room_number);
        });

        // 轉換為陣列格式 (與前端 constants.js 格式一致)
        const floors = Object.keys(roomsByFloor).map(floor => ({
            id: floor,
            label: floor,
            rooms: roomsByFloor[floor]
        }));

        res.json({ success: true, data: floors });
    } catch (error) {
        console.error('取得房號資料錯誤:', error);
        res.status(500).json({ success: false, message: '取得房號資料失敗' });
    }
});

/**
 * 取得特定樓層的房號列表
 * GET /api/rooms/floor/:floor
 */
router.get('/floor/:floor', authenticateToken, async (req, res) => {
    try {
        const { floor } = req.params;

        const result = await pool.query(`
            SELECT room_number
            FROM rooms
            WHERE floor = $1 AND is_active = TRUE
            ORDER BY display_order
        `, [floor]);

        const rooms = result.rows.map(row => row.room_number);
        res.json({ success: true, data: rooms });
    } catch (error) {
        console.error('取得房號列表錯誤:', error);
        res.status(500).json({ success: false, message: '取得房號列表失敗' });
    }
});

/**
 * 新增房號
 * POST /api/rooms
 * 僅限管理員
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { floor, room_number, display_order } = req.body;

        if (!floor || !room_number) {
            return res.status(400).json({
                success: false,
                message: '樓層和房號為必填欄位'
            });
        }

        const result = await pool.query(`
            INSERT INTO rooms (floor, room_number, display_order)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [floor, room_number, display_order || 0]);

        res.status(201).json({
            success: true,
            message: '房號新增成功',
            data: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') { // 唯一性約束違反
            return res.status(400).json({
                success: false,
                message: '此樓層的房號已存在'
            });
        }
        console.error('新增房號錯誤:', error);
        res.status(500).json({ success: false, message: '新增房號失敗' });
    }
});

/**
 * 刪除房號
 * DELETE /api/rooms/:id
 * 僅限管理員
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            DELETE FROM rooms
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此房號'
            });
        }

        res.json({
            success: true,
            message: '房號刪除成功'
        });
    } catch (error) {
        console.error('刪除房號錯誤:', error);
        res.status(500).json({ success: false, message: '刪除房號失敗' });
    }
});

export default router;
