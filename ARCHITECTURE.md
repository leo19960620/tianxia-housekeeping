# 專案架構備註

## 重要資訊

**資料庫**: Supabase (PostgreSQL 雲端)
**後端**: Render (Node.js 雲端部署)

## Migration 執行方式

❗ 因為資料庫在 Supabase，Migration 需要在 Supabase SQL Editor 執行，不能用本地 psql。

步驟：
1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 複製 migration 檔案內容並執行
