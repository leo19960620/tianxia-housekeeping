import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// 建立PostgreSQL連線池
const pool = new Pool({
  user: process.env.DB_USER || 'root',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'housekeeping',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
  // 設定時區為台北時間
  options: '-c timezone=Asia/Taipei',
  max: 20, // 最大連線數
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 測試資料庫連線
pool.on('connect', () => {
  console.log('✅ 資料庫連線成功');
});

pool.on('error', (err) => {
  console.error('❌ 資料庫連線錯誤:', err);
  process.exit(-1);
});

// 查詢輔助函式
export const query = async (text, params) => {
  const start = Date.now();
  try {
    // 在每次查詢前設定 session 時區為台北
    await pool.query("SET timezone = 'Asia/Taipei'");
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('資料庫查詢錯誤:', error);
    throw error;
  }
};

// 取得連線(用於交易)
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // 設定timeout
  const timeout = setTimeout(() => {
    console.error('客戶端連線已超過5秒!');
  }, 5000);

  // 覆寫release方法以清除timeout
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
};

export default pool;
