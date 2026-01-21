-- 遷移腳本：將交班事項獨立出來
-- 請在 Supabase SQL Editor 中執行此腳本

BEGIN;

-- 1. 讓 handover_id 可以為 NULL (允許獨立建立事項)
ALTER TABLE public.handover_items 
ALTER COLUMN handover_id DROP NOT NULL;

-- 2. 新增 created_by 欄位紀錄建立者 ID (關聯 users 表)
-- 假設 users.id 是 INTEGER，如果是 UUID 請改為 UUID
ALTER TABLE public.handover_items 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES public.users(id);

COMMIT;

-- 驗證變更
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'handover_items';
