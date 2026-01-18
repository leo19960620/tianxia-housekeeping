import pool from '../database/db.js';

/**
 * 新增房號表和資料的遷移腳本
 * 這個腳本會：
 * 1. 建立 rooms 表（如果不存在）
 * 2. 新增房號資料（如果尚未新增）
 */
async function migrateRooms() {
    try {
        console.log('🔧 開始房號資料遷移...');

        // 建立 rooms 表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id SERIAL PRIMARY KEY,
                floor VARCHAR(10) NOT NULL,
                room_number VARCHAR(20) NOT NULL,
                display_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(floor, room_number)
            );
        `);
        console.log('✅ rooms 表已建立');

        // 建立索引
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
            CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);
        `);
        console.log('✅ 索引已建立');

        // 檢查是否已經有房號資料
        const checkResult = await pool.query('SELECT COUNT(*) FROM rooms');
        const count = parseInt(checkResult.rows[0].count);

        if (count > 0) {
            console.log(`⚠️  資料庫中已有 ${count} 筆房號資料，跳過新增`);
            console.log('💡 如果需要重新載入，請先執行: DELETE FROM rooms;');
        } else {
            // 新增房號資料
            await pool.query(`
                INSERT INTO rooms (floor, room_number, display_order) VALUES
                -- 5F
                ('5F', '501', 1), ('5F', '502', 2), ('5F', '503', 3), ('5F', '505', 4), ('5F', '506', 5),
                ('5F', '507', 6), ('5F', '508', 7), ('5F', '509', 8), ('5F', '510', 9), ('5F', '511', 10),
                ('5F', '512', 11), ('5F', '513', 12), ('5F', '515', 13),
                -- 6F
                ('6F', '601', 1), ('6F', '602', 2), ('6F', '603', 3), ('6F', '605', 4), ('6F', '606', 5),
                ('6F', '607', 6), ('6F', '608', 7), ('6F', '609', 8), ('6F', '610', 9), ('6F', '611', 10),
                ('6F', '612', 11), ('6F', '613', 12), ('6F', '615', 13),
                -- 7F
                ('7F', '701', 1), ('7F', '702', 2), ('7F', '703', 3), ('7F', '705', 4), ('7F', '706', 5),
                ('7F', '707', 6), ('7F', '708', 7), ('7F', '709', 8), ('7F', '710', 9), ('7F', '711', 10),
                ('7F', '712', 11), ('7F', '713', 12), ('7F', '715', 13),
                -- 8F
                ('8F', '801', 1), ('8F', '802', 2), ('8F', '803', 3), ('8F', '805', 4), ('8F', '806', 5),
                ('8F', '807', 6), ('8F', '808', 7),
                -- 9F
                ('9F', '903', 1), ('9F', '905', 2), ('9F', '906', 3), ('9F', '907', 4), ('9F', '908', 5),
                ('9F', '909', 6), ('9F', '910', 7), ('9F', '911', 8), ('9F', '912', 9), ('9F', '913', 10),
                ('9F', '915', 11),
                -- 10F
                ('10F', '1003', 1), ('10F', '1005', 2), ('10F', '1006', 3), ('10F', '1007', 4), ('10F', '1008', 5),
                ('10F', '1009', 6), ('10F', '1010', 7), ('10F', '1011', 8), ('10F', '1012', 9), ('10F', '1013', 10),
                ('10F', '1015', 11),
                -- 11F
                ('11F', '1103', 1), ('11F', '1105', 2), ('11F', '1106', 3), ('11F', '1107', 4), ('11F', '1108', 5),
                ('11F', '1109', 6), ('11F', '1110', 7), ('11F', '1111', 8), ('11F', '1112', 9), ('11F', '1113', 10),
                ('11F', '1115', 11),
                -- 12F
                ('12F', '1203', 1), ('12F', '1205', 2), ('12F', '1206', 3), ('12F', '1207', 4), ('12F', '1208', 5),
                ('12F', '1210', 6), ('12F', '1211', 7), ('12F', '1212', 8), ('12F', '1213', 9), ('12F', '1215', 10)
            `);
            console.log('✅ 房號資料新增完成');
        }

        // 顯示統計
        const statsResult = await pool.query(`
            SELECT floor, COUNT(*) as count
            FROM rooms
            WHERE is_active = TRUE
            GROUP BY floor
            ORDER BY 
                CASE 
                    WHEN floor = 'B1' THEN 0
                    ELSE CAST(REPLACE(floor, 'F', '') AS INTEGER)
                END
        `);

        console.log('\n📊 房號統計：');
        statsResult.rows.forEach(row => {
            console.log(`   ${row.floor}: ${row.count} 間房`);
        });

        const totalResult = await pool.query('SELECT COUNT(*) FROM rooms WHERE is_active = TRUE');
        console.log(`   總計: ${totalResult.rows[0].count} 間房\n`);

        console.log('✅ 房號資料遷移完成!');
        process.exit(0);
    } catch (error) {
        console.error('❌ 房號資料遷移失敗:', error);
        process.exit(1);
    }
}

migrateRooms();
