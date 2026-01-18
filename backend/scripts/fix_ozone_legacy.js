
import { query } from '../database/db.js';

const fixLegacyColumn = async () => {
    console.log('開始修復資料庫 Schema (Legacy Column)...');

    try {
        // 檢查 room_number 欄位是否存在
        console.log('正在移除 room_number 的 NOT NULL 限制...');

        // 我們使用 ALTER COLUMN ... DROP NOT NULL
        // 如果欄位不存在，這行會拋出錯誤，所以我們包在 try-catch 需要小心
        // 但在 Postgres 中，如果欄位存在，這就是正確語法。
        // 如果是為了安全，可以先檢查欄位是否存在，但我先假設它存在(根據錯誤訊息)

        await query(`
      ALTER TABLE ozone_records 
      ALTER COLUMN room_number DROP NOT NULL;
    `);

        console.log('✅ NOT NULL 限制移除成功！');
        process.exit(0);
    } catch (error) {
        // 錯誤代碼 42703 代表 column 不存在，若是這個錯誤我們可以忽略
        if (error.code === '42703') {
            console.log('⚠️ room_number 欄位不存在，無需修改。');
            process.exit(0);
        }

        console.error('❌ 修復失敗:', error);
        process.exit(1);
    }
};

fixLegacyColumn();
