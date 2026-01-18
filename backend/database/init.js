import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 初始化資料庫
 * 讀取schema.sql並執行
 */
async function initDatabase() {
    try {
        console.log('🔧 開始初始化資料庫...');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await pool.query(schema);

        console.log('✅ 資料庫初始化完成!');
        console.log('📊 已建立所有表格和索引');
        console.log('👤 預設管理員帳號: admin / admin123');
        console.log('⚠️  請記得修改預設密碼!');

        process.exit(0);
    } catch (error) {
        console.error('❌ 資料庫初始化失敗:', error);
        process.exit(1);
    }
}

initDatabase();
