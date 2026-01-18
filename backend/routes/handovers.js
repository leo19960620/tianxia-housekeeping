import express from 'express';
import { query, getClient } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/handovers
 * 取得交接紀錄列表
 */
router.get('/', async (req, res) => {
    try {
        const { date, shift, limit = 50 } = req.query;

        // 1. 取得交接主表
        let sql = `
      SELECT h.*, 
             u.full_name as created_by_name,
             (h.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Taipei') as timestamp
      FROM handovers h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE 1=1
    `;

        const params = [];
        let paramIndex = 1;

        if (date) {
            sql += ` AND DATE(h.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Taipei') = $${paramIndex}`;
            params.push(date);
            paramIndex++;
        }

        if (shift) {
            sql += ` AND h.shift = $${paramIndex}`;
            params.push(shift);
            paramIndex++;
        }

        sql += ` ORDER BY h.timestamp DESC`;
        sql += ` LIMIT $${paramIndex}`;
        params.push(limit);

        const handoversResult = await query(sql, params);
        const handovers = handoversResult.rows;

        // 如果沒有資料，直接返回空陣列
        if (handovers.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // 2. 收集所有 ID 以便一次查詢關聯資料
        const handoverIds = handovers.map(h => h.id);

        // 3. 平行查詢所有關聯資料 (Inventory, Ozone, Items)
        // 使用 ANY ($1) 語法來匹配 ID 陣列
        const [inventoryRes, ozoneRes, itemsRes] = await Promise.all([
            query('SELECT * FROM inventory_records WHERE handover_id = ANY($1)', [handoverIds]),
            query('SELECT * FROM ozone_records WHERE handover_id = ANY($1)', [handoverIds]),
            query('SELECT * FROM handover_items WHERE handover_id = ANY($1)', [handoverIds])
        ]);

        const allInventory = inventoryRes.rows;
        const allOzone = ozoneRes.rows;
        const allItems = itemsRes.rows;

        // 4. 將關聯資料組裝回各個 Handover 物件
        const enrichedHandovers = handovers.map(handover => {
            // 篩選屬於此 handover 的資料
            const records = allInventory.filter(r => r.handover_id === handover.id);
            const ozone = allOzone.filter(r => r.handover_id === handover.id);
            const items = allItems.filter(r => r.handover_id === handover.id);

            // 前端需要這些統計欄位 (雖然前端也會算，但後端提供更保險)
            let receiveCount = 0;
            let returnCount = 0;
            records.forEach(inv => {
                if (inv.status === '收') receiveCount += (inv.quantity || 0);
                if (inv.status === '放') returnCount += (inv.quantity || 0);
            });

            return {
                ...handover,
                inventory_records: records,
                ozone_records: ozone,
                handover_items: items,
                // 附加統計數據，與原有 SQL 行為保持部分一致，但現在更精準
                inventory_count: records.length, // 這種計數是 distinct key 數量
                ozone_count: ozone.length,
                item_count: items.length,
                receive_count: receiveCount, // 這是總數量
                return_count: returnCount    // 這是總數量
            };
        });

        res.json({
            success: true,
            data: enrichedHandovers
        });
    } catch (error) {
        console.error('取得交接紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * GET /api/handovers/:id
 * 取得單一交接紀錄的完整資訊
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 取得交接主資料，將 timestamp 轉換為台北時區
        const handoverResult = await query(
            `SELECT h.*, 
                    u.full_name as created_by_name,
                    (h.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Taipei') as timestamp
       FROM handovers h
       LEFT JOIN users u ON h.created_by = u.id
       WHERE h.id = $1`,
            [id]
        );

        if (handoverResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此交接紀錄'
            });
        }

        const handover = handoverResult.rows[0];

        // 取得備品紀錄
        const inventoryResult = await query(
            'SELECT * FROM inventory_records WHERE handover_id = $1 ORDER BY created_at',
            [id]
        );

        // 取得臭氧紀錄
        const ozoneResult = await query(
            'SELECT * FROM ozone_records WHERE handover_id = $1 ORDER BY created_at',
            [id]
        );

        // 取得交班事項
        const itemsResult = await query(
            'SELECT * FROM handover_items WHERE handover_id = $1 ORDER BY created_at',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...handover,
                inventory_records: inventoryResult.rows,
                ozone_records: ozoneResult.rows,
                handover_items: itemsResult.rows
            }
        });
    } catch (error) {
        console.error('取得交接紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * POST /api/handovers
 * 建立新交接紀錄 (包含備品、臭氧、交班事項)
 */
router.post('/', authenticateToken, async (req, res) => {
    const client = await getClient();

    try {
        await client.query('BEGIN');

        const {
            shift,
            staffName,
            handoverNotes,
            inventoryRecords = [],
            ozoneRecords = [],
            handoverItems = [],
            timestamp
        } = req.body;

        if (!shift || !staffName) {
            return res.status(400).json({
                success: false,
                message: '請提供班別和員工姓名'
            });
        }

        // 建立交接主紀錄
        // 如果有提供 timestamp 則使用提供的時間，否則使用資料庫當前時間
        const handoverResult = await client.query(
            `INSERT INTO handovers (shift, staff_name, handover_notes, created_by, timestamp)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [shift, staffName, handoverNotes, req.user.id, timestamp || new Date()]
        );

        const handoverId = handoverResult.rows[0].id;

        // 新增備品紀錄
        for (const record of inventoryRecords) {
            await client.query(
                `INSERT INTO inventory_records 
         (handover_id, status, category, item_type, room_number, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [handoverId, record.status, record.category, record.itemType, record.roomNumber, record.quantity]
            );
        }

        // 新增臭氧紀錄（樓層卡片式）
        for (const record of ozoneRecords) {
            // 計算結束時間
            const duration = record.durationMinutes || 30;
            const start = new Date(record.startTime);
            const end = new Date(start.getTime() + duration * 60000);

            await client.query(
                `INSERT INTO ozone_records 
         (handover_id, floor, room_numbers, start_time, duration_minutes, end_time, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [handoverId, record.floor, record.roomNumbers, record.startTime, duration, end, record.notes || null]
            );
        }

        // 新增交班事項
        for (const item of handoverItems) {
            await client.query(
                'INSERT INTO handover_items (handover_id, item_content) VALUES ($1, $2)',
                [handoverId, item.content]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: '交接紀錄建立成功',
            data: handoverResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('建立交接紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/handovers/:id
 * 更新交接紀錄的基本資訊（班別、員工姓名、備註）
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { shift, staffName, handoverNotes } = req.body;

        // 建構動態更新語句
        const updates = [];
        const params = [];
        let paramIndex = 1;

        if (shift !== undefined) {
            updates.push(`shift = $${paramIndex}`);
            params.push(shift);
            paramIndex++;
        }

        if (staffName !== undefined) {
            updates.push(`staff_name = $${paramIndex}`);
            params.push(staffName);
            paramIndex++;
        }

        if (handoverNotes !== undefined) {
            updates.push(`handover_notes = $${paramIndex}`);
            params.push(handoverNotes);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '沒有提供要更新的欄位'
            });
        }

        // 添加 updated_at 時間戳
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        // 添加 WHERE 條件的 ID
        params.push(id);

        const sql = `
            UPDATE handovers 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await query(sql, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此交接紀錄'
            });
        }

        res.json({
            success: true,
            message: '交接紀錄更新成功',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('更新交接紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

/**
 * DELETE /api/handovers/:id
 * 刪除交接紀錄 (會同時刪除關聯的備品、臭氧、交班紀錄)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM handovers WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '找不到此交接紀錄'
            });
        }

        res.json({
            success: true,
            message: '交接紀錄刪除成功'
        });
    } catch (error) {
        console.error('刪除交接紀錄錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤'
        });
    }
});

export default router;
