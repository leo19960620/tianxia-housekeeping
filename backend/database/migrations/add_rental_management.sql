-- 租借管理系統 - 資料庫結構定義
-- 新增腳踏車與雨傘租借管理功能
-- PostgreSQL

-- ============================================
-- 1. 腳踏車基本資料表
-- ============================================
CREATE TABLE bicycles (
    id SERIAL PRIMARY KEY,
    bicycle_number VARCHAR(10) UNIQUE NOT NULL,  -- 車號 (1-10)
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
    appearance_condition TEXT,                    -- 外觀狀況描述
    last_air_check_date DATE,                     -- 上次打氣日期
    last_cleaning_date DATE,                      -- 上次擦拭日期
    notes TEXT,                                   -- 備註
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 腳踏車租借紀錄表
-- ============================================
CREATE TABLE bicycle_rentals (
    id SERIAL PRIMARY KEY,
    bicycle_id INTEGER REFERENCES bicycles(id) ON DELETE CASCADE,
    room_number VARCHAR(20),                      -- 房號
    room_status VARCHAR(20) CHECK (room_status IN ('checked_in', 'checked_out', 'not_yet')),
    rental_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rental_end_time TIMESTAMP,
    rented_by VARCHAR(100) NOT NULL,              -- 借出經手人
    returned_by VARCHAR(100),                     -- 歸還經手人
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 腳踏車維護紀錄表
-- ============================================
CREATE TABLE bicycle_maintenance (
    id SERIAL PRIMARY KEY,
    bicycle_id INTEGER REFERENCES bicycles(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) CHECK (maintenance_type IN ('air_check', 'cleaning', 'appearance_check')),
    maintenance_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performed_by VARCHAR(100),                    -- 執行人員
    notes TEXT,                                   -- 備註（如外觀狀況描述）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. 雨傘租借紀錄表
-- ============================================
CREATE TABLE umbrella_rentals (
    id SERIAL PRIMARY KEY,
    umbrella_number VARCHAR(20) NOT NULL,         -- 雨傘編號
    room_number VARCHAR(20),                      -- 房號
    room_status VARCHAR(20) CHECK (room_status IN ('checked_in', 'checked_out', 'not_yet')),
    rental_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rental_end_time TIMESTAMP,
    rented_by VARCHAR(100) NOT NULL,              -- 借出經手人
    returned_by VARCHAR(100),                     -- 歸還經手人
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 建立索引以提升查詢效能
-- ============================================
CREATE INDEX idx_bicycles_status ON bicycles(status);
CREATE INDEX idx_bicycle_rentals_status ON bicycle_rentals(status);
CREATE INDEX idx_bicycle_rentals_bicycle_id ON bicycle_rentals(bicycle_id);
CREATE INDEX idx_bicycle_rentals_start_time ON bicycle_rentals(rental_start_time);
CREATE INDEX idx_bicycle_maintenance_bicycle_id ON bicycle_maintenance(bicycle_id);
CREATE INDEX idx_bicycle_maintenance_type ON bicycle_maintenance(maintenance_type);
CREATE INDEX idx_bicycle_maintenance_date ON bicycle_maintenance(maintenance_date);
CREATE INDEX idx_umbrella_rentals_status ON umbrella_rentals(status);
CREATE INDEX idx_umbrella_rentals_start_time ON umbrella_rentals(rental_start_time);

-- ============================================
-- 初始化 10 輛腳踏車資料
-- ============================================
INSERT INTO bicycles (bicycle_number, status, appearance_condition) VALUES
('1', 'available', '良好'),
('2', 'available', '良好'),
('3', 'available', '良好'),
('4', 'available', '良好'),
('5', 'available', '良好'),
('6', 'available', '良好'),
('7', 'available', '良好'),
('8', 'available', '良好'),
('9', 'available', '良好'),
('10', 'available', '良好');

-- ============================================
-- 資料表註解
-- ============================================
COMMENT ON TABLE bicycles IS '腳踏車基本資料表';
COMMENT ON TABLE bicycle_rentals IS '腳踏車租借紀錄表';
COMMENT ON TABLE bicycle_maintenance IS '腳踏車維護紀錄表';
COMMENT ON TABLE umbrella_rentals IS '雨傘租借紀錄表';

COMMENT ON COLUMN bicycles.status IS '狀態: available(可借), rented(已借出), maintenance(維護中)';
COMMENT ON COLUMN bicycle_rentals.room_status IS '房間狀態: checked_in(已入住), checked_out(已退房), not_yet(尚未入住)';
COMMENT ON COLUMN bicycle_rentals.status IS '租借狀態: active(租借中), returned(已歸還)';
COMMENT ON COLUMN bicycle_maintenance.maintenance_type IS '維護類型: air_check(打氣), cleaning(擦拭), appearance_check(外觀檢查)';
COMMENT ON COLUMN umbrella_rentals.room_status IS '房間狀態: checked_in(已入住), checked_out(已退房), not_yet(尚未入住)';
COMMENT ON COLUMN umbrella_rentals.status IS '租借狀態: active(租借中), returned(已歸還)';
