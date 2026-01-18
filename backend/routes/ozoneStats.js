import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/ozone/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * 查詢日期範圍的臭氧統計數據
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: '請提供開始和結束日期',
            });
        }

        // 查詢日期範圍內的臭氧紀錄
        const result = await query(
            `SELECT floor, room_numbers, duration_minutes, start_time
            FROM ozone_records
            WHERE DATE(start_time) >= $1 AND DATE(start_time) <= $2
            ORDER BY floor, start_time`,
            [startDate, endDate]
        );

        // 統計數據
        const floorStats = {};
        let totalRecords = result.rows.length;
        let totalMinutes = 0;
        const roomSet = new Set();

        result.rows.forEach((record) => {
            const floor = record.floor;

            // 初始化樓層統計
            if (!floorStats[floor]) {
                floorStats[floor] = {
                    count: 0,
                    rooms: new Set(),
                };
            }

            // 累計樓層紀錄數
            floorStats[floor].count++;

            // 累計總時長
            totalMinutes += record.duration_minutes || 0;

            // 收集房號
            if (record.room_numbers && Array.isArray(record.room_numbers)) {
                record.room_numbers.forEach(room => {
                    floorStats[floor].rooms.add(room);
                    roomSet.add(room);
                });
            }
        });

        // 轉換 Set 為陣列
        const byFloor = {};
        Object.keys(floorStats).forEach(floor => {
            byFloor[floor] = {
                count: floorStats[floor].count,
                rooms: Array.from(floorStats[floor].rooms),
            };
        });

        res.json({
            success: true,
            data: {
                totalRecords,
                totalRooms: roomSet.size,
                totalMinutes,
                byFloor,
            },
        });
    } catch (error) {
        console.error('查詢臭氧統計錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * GET /api/ozone/stats/daily?date=YYYY-MM-DD
 * 查詢指定日期的臭氧使用紀錄
 */
router.get('/daily', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: '請提供日期參數',
            });
        }

        // 查詢指定日期的臭氧紀錄
        const result = await query(
            `SELECT o.*, h.staff_name, h.shift
            FROM ozone_records o
            LEFT JOIN handovers h ON o.handover_id = h.id
            WHERE DATE(o.start_time) = $1
            ORDER BY o.floor, o.start_time`,
            [date],
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('查詢每日臭氧統計錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * GET /api/ozone/stats/monthly?year=YYYY&month=MM
 * 查詢指定月份的統計數據
 */
router.get('/monthly', authenticateToken, async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: '請提供年份和月份參數',
            });
        }

        // 查詢指定月份的所有臭氧紀錄
        const result = await query(
            `SELECT floor, room_numbers, start_time
            FROM ozone_records
            WHERE EXTRACT(YEAR FROM start_time) = $1
            AND EXTRACT(MONTH FROM start_time) = $2
            ORDER BY floor, start_time`,
            [year, month],
        );

        // 統計每個房間的放置次數
        const roomStats = {};
        const floorStats = {};

        result.rows.forEach((record) => {
            const floor = record.floor;

            // 初始化樓層統計
            if (!floorStats[floor]) {
                floorStats[floor] = {
                    floor: floor,
                    totalCount: 0,
                    rooms: {},
                };
            }

            // 統計每個房間
            record.room_numbers.forEach((room) => {
                // 房間統計
                if (!roomStats[room]) {
                    roomStats[room] = {
                        roomNumber: room,
                        floor: floor,
                        count: 0,
                    };
                }
                roomStats[room].count++;

                // 樓層內房間統計
                if (!floorStats[floor].rooms[room]) {
                    floorStats[floor].rooms[room] = 0;
                }
                floorStats[floor].rooms[room]++;
                floorStats[floor].totalCount++;
            });
        });

        // 轉換為陣列並排序
        const roomStatsArray = Object.values(roomStats).sort((a, b) => {
            if (a.floor !== b.floor) {
                return a.floor.localeCompare(b.floor);
            }
            return a.roomNumber.localeCompare(b.roomNumber);
        });

        const floorStatsArray = Object.values(floorStats)
            .map((floor) => ({
                ...floor,
                rooms: Object.entries(floor.rooms).map(([room, count]) => ({
                    roomNumber: room,
                    count,
                })),
            }))
            .sort((a, b) => a.floor.localeCompare(b.floor));

        res.json({
            success: true,
            data: {
                roomStats: roomStatsArray,
                floorStats: floorStatsArray,
            },
        });
    } catch (error) {
        console.error('查詢每月臭氧統計錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

/**
 * GET /api/ozone/stats/priority?year=YYYY&month=MM
 * 取得優先順序建議（樓層總計最少優先）- 包含所有樓層，即使是0次
 * 統計方式：計算該樓層所有房間被放置的總次數
 */
router.get('/priority', authenticateToken, async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: '請提供年份和月份參數',
            });
        }

        // 定義所有樓層
        const allFloors = ['5F', '6F', '7F', '8F', '9F', '10F', '11F', '12F'];

        // 查詢指定月份的所有臭氧紀錄
        const result = await query(
            `SELECT floor, room_numbers
            FROM ozone_records
            WHERE EXTRACT(YEAR FROM start_time) = $1
            AND EXTRACT(MONTH FROM start_time) = $2`,
            [year, month],
        );

        // 統計每個樓層的房間總次數
        const floorUsageMap = {};

        result.rows.forEach(record => {
            const floor = record.floor;
            // 計算房間數量（每個房號計1次）
            const roomCount = record.room_numbers.length;

            if (!floorUsageMap[floor]) {
                floorUsageMap[floor] = 0;
            }
            floorUsageMap[floor] += roomCount;
        });

        // 為所有樓層建立完整列表（包括0次的）
        const allFloorsWithCount = allFloors.map(floor => ({
            floor,
            usageCount: floorUsageMap[floor] || 0,
        }));

        // 按使用次數排序（少的優先）
        allFloorsWithCount.sort((a, b) => {
            if (a.usageCount !== b.usageCount) {
                return a.usageCount - b.usageCount;
            }
            return a.floor.localeCompare(b.floor);
        });

        // 標記優先順序
        const priorities = allFloorsWithCount.map((item, index) => ({
            floor: item.floor,
            usageCount: item.usageCount,
            priority: index < Math.ceil(allFloorsWithCount.length / 3) ? 'high' :
                index < Math.ceil(allFloorsWithCount.length * 2 / 3) ? 'medium' : 'low',
        }));

        res.json({
            success: true,
            data: priorities,
        });
    } catch (error) {
        console.error('查詢優先順序錯誤:', error);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
        });
    }
});

export default router;
