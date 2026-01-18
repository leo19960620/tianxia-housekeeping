import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'tianxia_housekeeping',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function resetAdminPassword() {
    try {
        console.log('🔄 正在重置admin密碼...');

        const password = 'admin123';
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
            [passwordHash, 'admin']
        );

        if (result.rows.length > 0) {
            console.log('✅ admin密碼已重置!');
            console.log('   帳號: admin');
            console.log('   密碼: admin123');
        } else {
            console.log('❌ 找不到admin用戶');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ 錯誤:', error);
        process.exit(1);
    }
}

resetAdminPassword();
