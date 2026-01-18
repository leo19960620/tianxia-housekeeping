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

export default router;
