-- 新增腳踏車啟用/停用狀態欄位
-- 此欄位控制腳踏車是否可以被租借
ALTER TABLE bicycles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 更新註解
COMMENT ON COLUMN bicycles.is_active IS '是否啟用: true(ON可租), false(OFF不可租)';

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_bicycles_is_active ON bicycles(is_active);
