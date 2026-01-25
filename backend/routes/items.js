import express from 'express';
import { query } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/items
 * 取得所有備品清單
 */
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;

        let sql = 'SELECT * FROM items';
        const params = [];

        if (category) {
            sql += ' WHERE category = $1';
            params.push(category);
        }

        sql += ' ORDER BY category, name';

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('取得備品清單錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/items/categories
 * 取得所有備品類別
 */
router.get('/categories', async (req, res) => {
    try {
        const result = await query(
            'SELECT DISTINCT category FROM items ORDER BY category'
        );

        res.json({
            success: true,
            data: result.rows.map(row => row.category)
        });
    } catch (error) {
        console.error('取得備品類別錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/items
 * 新增備品項目
 */
router.post('/', async (req, res) => {
    try {
        const { category, name } = req.body;

        if (!category || !name) {
            return res.status(400).json({
                success: false,
                message: '請提供類別和名稱'
            });
        }

        const result = await query(
            'INSERT INTO items (category, name) VALUES ($1, $2) RETURNING *',
            [category, name]
        );

        res.status(201).json({
            success: true,
            message: '備品新增成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('新增備品錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * PUT /api/items/:id
 * 更新備品項目
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category, name } = req.body;

        if (!category || !name) {
            return res.status(400).json({
                success: false,
                message: '請提供類別和名稱'
            });
        }

        const result = await query(
            'UPDATE items SET category = $1, name = $2 WHERE id = $3 RETURNING *',
            [category, name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此備品'
            });
        }

        res.json({
            success: true,
            message: '備品更新成功',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('更新備品錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * DELETE /api/items/:id
 * 刪除備品項目
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM items WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此備品'
            });
        }

        res.json({
            success: true,
            message: '備品刪除成功'
        });
    } catch (error) {
        console.error('刪除備品錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/inventory-records
 * 查詢備品歷史紀錄（支援篩選與分頁）
 */
router.get('/inventory-records', async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            status,
            itemType,
            roomNumber,
            page = 1,
            limit = 50
        } = req.query;

        // 建立 WHERE 條件
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        // 日期範圍篩選
        if (startDate) {
            conditions.push(`ir.created_at >= $${paramIndex}::date`);
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            conditions.push(`ir.created_at < ($${paramIndex}::date + INTERVAL '1 day')`);
            params.push(endDate);
            paramIndex++;
        }

        // 狀態篩選
        if (status) {
            conditions.push(`ir.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        // 備品名稱模糊搜尋
        if (itemType) {
            conditions.push(`ir.item_type ILIKE $${paramIndex}`);
            params.push(`%${itemType}%`);
            paramIndex++;
        }

        // 房號模糊搜尋
        if (roomNumber) {
            conditions.push(`ir.room_number ILIKE $${paramIndex}`);
            params.push(`%${roomNumber}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // 計算總筆數
        const countSql = `
            SELECT COUNT(*) as total
            FROM inventory_records ir
            ${whereClause}
        `;
        const countResult = await query(countSql, params);
        const totalRecords = parseInt(countResult.rows[0].total);

        // 計算分頁
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const totalPages = Math.ceil(totalRecords / limitNum);

        // 查詢資料
        const dataSql = `
            SELECT 
                ir.key_id,
                ir.handover_id,
                ir.status,
                ir.category,
                ir.item_type,
                ir.room_number,
                ir.quantity,
                ir.created_at,
                h.shift,
                h.staff_name
            FROM inventory_records ir
            LEFT JOIN handovers h ON ir.handover_id = h.id
            ${whereClause}
            ORDER BY ir.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await query(dataSql, [...params, limitNum, offset]);

        res.json({
            success: true,
            data: {
                records: dataResult.rows,
                pagination: {
                    currentPage: pageNum,
                    totalPages: totalPages,
                    totalRecords: totalRecords,
                    limit: limitNum
                }
            }
        });
    } catch (error) {
        console.error('查詢備品歷史紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
