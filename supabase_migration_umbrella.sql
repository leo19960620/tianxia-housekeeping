-- 遷移腳本：修改雨傘租借資料表結構
-- 請在 Supabase SQL Editor 中執行此腳本

BEGIN;

-- 1. 移除不再使用的 umbrella_number 欄位
ALTER TABLE public.umbrella_rentals 
DROP COLUMN IF EXISTS umbrella_number;

-- 2. 新增 quantity (數量) 欄位，預設為 1
ALTER TABLE public.umbrella_rentals 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

COMMIT;

-- 驗證變更
SELECT * FROM public.umbrella_rentals LIMIT 5;
