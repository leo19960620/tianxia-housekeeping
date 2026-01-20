# 專案配置資訊

## 部署架構

本專案使用 **雲端部署架構**，不使用本地開發環境：

### 後端
- **平台**: Render
- **URL**: https://tianxia-housekeeping-api.onrender.com
- **部署方式**: Git 自動部署
- **環境變數**: 在 Render Dashboard 設定

### 資料庫
- **平台**: Supabase (PostgreSQL)
- **連線方式**: 透過 Render 環境變數連接
- **Migration 執行**: 需在 Supabase Dashboard 的 SQL Editor 手動執行

### 前端
- **Web**: Cloudflare Pages
- **App**: React Native (本地開發 + APK 發佈)

## 開發流程

### 當有資料庫變更時：
1. 建立 migration 檔案（在 `backend/database/migrations/` 目錄）
2. 在 **Supabase Dashboard** → **SQL Editor** 執行 migration
3. 提交程式碼到 Git
4. Render 會自動重新部署後端

### 當有後端程式碼變更時：
1. 修改程式碼
2. 提交到 Git
3. Render 自動部署

### 當有前端變更時：
- **Web**: 提交到 Git，Cloudflare Pages 自動部署
- **App**: 本地測試後，需要重新 build APK（如果要發佈）

## 重要提醒

⚠️ **資料庫 Migration 必須手動執行**
- 本專案使用 Supabase，不能直接用 psql 連線
- 所有 migration 都需要在 Supabase Dashboard 的 SQL Editor 手動執行
- Migration 檔案路徑：`backend/database/migrations/`

⚠️ **後端環境變數**
- 資料庫連線資訊存在 Render 的環境變數中
- 不要在本地 `.env` 檔案中設定線上資料庫連線

⚠️ **Web 測試**
- Web 前端連接雲端 API
- 本地開發時使用 `npm run dev`，會連接線上後端

⚠️ **App 測試**
- App 也連接雲端 API (Render)
- API_CONFIG 設定在 `TianxiaHousekeeping/src/config/constants.js`
