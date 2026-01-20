# 天下房務管理系統 - 專案資訊

> 本文件記錄專案的重要架構資訊，供 AI 助手快速了解系統配置

## 🏗️ 系統架構

### 資料庫
- **平台**: Supabase (PostgreSQL)
- **位置**: 雲端託管
- **連線**: 
  - Host: `aws-1-ap-northeast-1.pooler.supabase.com`
  - Port: `5432`
  - Database: `postgres`
- **重要**: 所有資料庫操作都在 Supabase，不是本地資料庫

### 後端 API
- **平台**: Render
- **位置**: 雲端部署
- **網址**: `https://tianxia-housekeeping-api.onrender.com`
- **技術**: Node.js + Express
- **重要**: 後端已部署到 Render，不需要在本地運行

### 前端
- **Web**: Cloudflare Pages
  - 網址: `https://tianxia-housekeeping.pages.dev`
  - 技術: Vite + React
- **App**: React Native
  - Android: APK 託管在 Cloudflare Pages
  - iOS: Xcode 直接安裝

## 📋 關鍵注意事項

### ⚠️ 資料庫 Migration
- ❗ Migration 需要在 **Supabase SQL Editor** 中執行
- ❌ 不能使用本地 `psql` 命令
- ✅ 步驟：
  1. 登入 Supabase Dashboard
  2. 進入 SQL Editor
  3. 複製 migration 檔案內容
  4. 執行 SQL

### ⚠️ 後端更新
- ❗ 後端更新需要推送到 **GitHub**
- ✅ Render 會自動偵測並部署
- 步驟：
  ```bash
  git add .
  git commit -m "更新訊息"
  git push origin main
  ```
- 📊 可在 Render Dashboard 查看部署日誌

### ⚠️ 環境變數
- 後端環境變數在 **Render Dashboard** 設定
- 前端環境變數在 `.env.production`

## 🔧 本地開發

### 前端開發
```bash
cd /Users/leo/tianxia-housekeeping
npm run dev
```

### App 開發
```bash
cd /Users/leo/tianxia-housekeeping/TianxiaHousekeeping
npx react-native start
npx react-native run-android  # 或 run-ios
```

### 後端開發
- ❗ 後端在 Render，本地不需要運行
- 如需本地測試，確保連接到 Supabase 資料庫

## 📁 專案結構

```
tianxia-housekeeping/
├── backend/                 # Node.js 後端（部署在 Render）
│   ├── routes/              # API 路由
│   ├── database/            # 資料庫相關
│   │   └── migrations/      # SQL Migration 檔案
│   └── server.js            # 主程式
├── src/                     # Web 前端（Vite + React）
├── TianxiaHousekeeping/     # React Native App
└── public/                  # 靜態檔案（APK 下載）
```

## 🚀 部署流程

### 更新後端
1. 修改程式碼
2. `git push origin main`
3. Render 自動部署
4. 檢查 Render Dashboard 的部署日誌

### 更新 Web
1. 修改程式碼
2. `npm run build`
3. `npx wrangler pages deploy dist --project-name=tianxia-housekeeping`

### 更新 App
1. 修改程式碼
2. 打包 APK
3. 複製到 `public/` 目錄
4. 重新部署 Web

### 更新資料庫
1. 建立 Migration 檔案在 `backend/database/migrations/`
2. 在 Supabase SQL Editor 執行
3. 提交到 Git（保留記錄）

## 📞 重要連結

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Render Dashboard**: https://dashboard.render.com/
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **GitHub Repository**: https://github.com/leo19960620/tianxia-housekeeping

## 💡 快速提示

- 💾 資料庫在雲端（Supabase）
- 🖥️ 後端在雲端（Render）
- 🌐 Web 在雲端（Cloudflare Pages）
- 📱 App 透過 APK 分發

---

最後更新：2026-01-20
