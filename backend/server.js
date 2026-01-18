import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import announcementRoutes from './routes/announcements.js';
import handoverRoutes from './routes/handovers.js';
import itemRoutes from './routes/items.js';
import handoverItemRoutes from './routes/handoverItems.js';
import handoverExtensionsRoutes from './routes/handoverExtensions.js';
import userRoutes from './routes/users.js';
import ozoneStatsRoutes from './routes/ozoneStats.js';
import ozoneReservationsRoutes from './routes/ozoneReservations.js';
import roomRoutes from './routes/rooms.js';

dotenv.config();

// 設定時區為台北時間
process.env.TZ = 'Asia/Taipei';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'https://leolnfsystem.dpdns.org', 'https://housekeeping.leolnfsystem.dpdns.org'];

app.use(cors()); // 暫時允許所有來源以解決連線問題
// app.use(cors({
//     origin: function (origin, callback) {
//         // 允許沒有origin的請求 (例如mobile apps或postman)
//         if (!origin) return callback(null, true);

//         if (allowedOrigins.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error('不允許的CORS來源'));
//         }
//     },
//     credentials: true
// }));

// JSON解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '服務中心交接系統 API 運行中',
        timestamp: new Date().toISOString()
    });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/handovers', handoverExtensionsRoutes); // 擴展路由 (新增子項目)
app.use('/api', handoverExtensionsRoutes); // 刪除子項目路由
app.use('/api/items', itemRoutes);
app.use('/api/handover-items', handoverItemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ozone/stats', ozoneStatsRoutes); // 臭氧統計
app.use('/api/ozone/reservations', ozoneReservationsRoutes); // 臭氧預約

// 404處理
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `路由 ${req.method} ${req.path} 不存在`,
        success: false,
    });
});

// 錯誤處理中介層
app.use((err, req, res, next) => {
    console.error('伺服器錯誤:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || '伺服器內部錯誤'
    });
});

// 啟動伺服器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   服務中心交接系統 - API 伺服器        ║
╚═══════════════════════════════════════════╝
  
🚀 伺服器已啟動
📍 http://localhost:${PORT}
📱 Android 模擬器: http://10.0.2.2:${PORT}
🏥 健康檢查: http://localhost:${PORT}/health
🌍 環境: ${process.env.NODE_ENV || 'development'}
⏰ 時間: ${new Date().toLocaleString('zh-TW')}

📚 API 端點:
   POST   /api/auth/login
   POST   /api/auth/register
   GET    /api/announcements
   POST   /api/announcements
   GET    /api/handovers
   POST   /api/handovers
   GET    /api/items
   GET    /api/handover-items
  `);
});

export default app;
