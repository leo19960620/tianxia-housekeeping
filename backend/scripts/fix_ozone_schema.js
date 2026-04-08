
import { query } from '../database/db.js';

const fixSchema = async () => {
    console.log('開始修復資料庫 Schema...');

    try {
        // 檢查並新增 floor 欄位
        console.log('正在檢查 floor 欄位...');
        await query(`
      ALTER TABLE ozone_records 
      ADD COLUMN IF NOT EXISTS floor VARCHAR(10);
    `);

        // 檢查並新增 room_numbers 欄位
        console.log('正在檢查 room_numbers 欄位...');
        await query(`
      ALTER TABLE ozone_records 
      ADD COLUMN IF NOT EXISTS room_numbers TEXT[];
    `);

        // 檢查並新增 start_time 欄位
        console.log('正在檢查 start_time 欄位...');
        await query(`
      ALTER TABLE ozone_records 
      ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
    `);

        // 檢查並新增 duration_minutes 欄位
        console.log('正在檢查 duration_minutes 欄位...');
        await query(`
      ALTER TABLE ozone_records 
      ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
    `);

        // 檢查並新增 end_time 欄位
        console.log('正在檢查 end_time 欄位...');
        await query(`
      ALTER TABLE ozone_records 
      ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
    `);

        // 檢查並新增 notes 欄位
        console.log('正在檢查 notes 欄位...');
        await query(`
      ALTER TABLE ozone_records 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

        // 允許無交接之臭氧紀錄（POST /api/ozone/records）
        console.log('正在確保 handover_id 可為 NULL...');
        await query(`
      ALTER TABLE ozone_records 
      ALTER COLUMN handover_id DROP NOT NULL;
    `).catch(() => {
            console.log('（略過）handover_id 可能已為可空');
        });

        console.log('✅ 資料庫 Schema 修復完成！');
        process.exit(0);
    } catch (error) {
        console.error('❌ 修復失敗:', error);
        process.exit(1);
    }
};

fixSchema();
