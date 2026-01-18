-- 為現有的 announcements 資料表加入新欄位
-- 執行此檔案以更新資料庫結構

ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS announcement_type VARCHAR(20) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS announcer VARCHAR(100);

-- 更新現有記錄的 announcement_type 為 'general'
UPDATE announcements 
SET announcement_type = 'general' 
WHERE announcement_type IS NULL;
