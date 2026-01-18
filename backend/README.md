# 天下房務管理系統 - 後端API

Node.js/Express API伺服器,使用PostgreSQL資料庫。

## 安裝步驟

### 1. 安裝依賴
```bash
cd backend
npm install
```

### 2. 安裝PostgreSQL
在Mac mini上安裝PostgreSQL:
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 3. 建立資料庫
```bash
# 登入PostgreSQL
psql postgres

# 建立資料庫
CREATE DATABASE tianxia_housekeeping;

# 建立使用者(可選)
CREATE USER tianxia_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tianxia_housekeeping TO tianxia_admin;

# 退出
\q
```

### 4. 設定環境變數
```bash
cp .env.example .env
# 編輯.env檔案,填入資料庫連線資訊
```

### 5. 初始化資料庫
```bash
npm run init-db
```

### 6. 啟動伺服器
```bash
# 開發模式(自動重啟)
npm run dev

# 正式模式
npm start
```

## API文件

### 認證相關
- `POST /api/auth/login` - 使用者登入
- `POST /api/auth/register` - 註冊新使用者

### 公告管理
- `GET /api/announcements` - 取得所有公告
- `GET /api/announcements?active=true` - 取得有效公告
- `POST /api/announcements` - 建立公告 (需登入)
- `PUT /api/announcements/:id` - 更新公告 (需登入)
- `DELETE /api/announcements/:id` - 刪除公告 (需登入)

### 交接紀錄
- `GET /api/handovers` - 取得交接紀錄列表
- `GET /api/handovers/:id` - 取得單一交接紀錄完整資訊
- `POST /api/handovers` - 建立交接紀錄 (需登入)
- `DELETE /api/handovers/:id` - 刪除交接紀錄 (需登入)

### 備品管理
- `GET /api/items` - 取得所有備品
- `GET /api/items/categories` - 取得備品類別

### 交班事項
- `GET /api/handover-items` - 取得交班事項
- `PUT /api/handover-items/:id` - 更新交班事項 (需登入)
- `PUT /api/handover-items/:id/resolve` - 標記為已解決 (需登入)
- `DELETE /api/handover-items/:id` - 刪除交班事項 (需登入)

## 預設帳號

- **帳號**: admin
- **密碼**: admin123
- **⚠️ 請登入後立即修改密碼!**

## Cloudflare Tunnel 設定

### 1. 安裝cloudflared
```bash
brew install cloudflare/cloudflare/cloudflared
```

### 2. 登入Cloudflare
```bash
cloudflared tunnel login
```

### 3. 建立Tunnel
```bash
cloudflared tunnel create tianxia-housekeeping
```

### 4. 設定路由
編輯 `~/.cloudflared/config.yml`:
```yaml
tunnel: <tunnel-id>
credentials-file: /Users/leo/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: leolnfsystem.dpdns.org
    service: http://localhost:3000
  - service: http_status:404
```

### 5. 設定DNS
```bash
cloudflared tunnel route dns tianxia-housekeeping leolnfsystem.dpdns.org
```

### 6. 執行Tunnel
```bash
cloudflared tunnel run tianxia-housekeeping
```

## 部署建議

- 使用`pm2`讓伺服器在背景持續運行
- 設定PostgreSQL自動備份
- 啟用HTTPS(透過Cloudflare Tunnel自動提供)
