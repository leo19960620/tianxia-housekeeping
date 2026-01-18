- 服務中心交接系統 - 資料庫結構定義
-- PostgreSQL

-- 刪除現有表格 (如果存在)
DROP TABLE IF EXISTS inventory_records CASCADE;
DROP TABLE IF EXISTS ozone_records CASCADE;
DROP TABLE IF EXISTS handover_items CASCADE;
DROP TABLE IF EXISTS handovers CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- 建立使用者表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立房號表
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    floor VARCHAR(10) NOT NULL,              -- 樓層 (例如: 5F, 6F, 7F)
    room_number VARCHAR(20) NOT NULL,        -- 房號 (例如: 501, 502)
    display_order INTEGER DEFAULT 0,         -- 顯示順序
    is_active BOOLEAN DEFAULT TRUE,          -- 是否啟用
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(floor, room_number)               -- 樓層+房號唯一
);


-- 建立公告表
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    announcement_type VARCHAR(20) DEFAULT 'general',
    announcer VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立交接紀錄表
CREATE TABLE handovers (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shift VARCHAR(10) CHECK (shift IN ('早班', '中班', '晚班')),
    staff_name VARCHAR(100) NOT NULL,
    handover_notes TEXT,
    notified_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立備品表
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立收放備品紀錄表
CREATE TABLE inventory_records (
    key_id SERIAL PRIMARY KEY,
    handover_id INTEGER REFERENCES handovers(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('收', '放')),
    category VARCHAR(50),
    item_type VARCHAR(100),
    room_number VARCHAR(20),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立臭氧紀錄表（樓層卡片式管理）
CREATE TABLE ozone_records (
    key_id SERIAL PRIMARY KEY,
    handover_id INTEGER REFERENCES handovers(id) ON DELETE CASCADE,
    floor VARCHAR(10) NOT NULL,              -- 樓層 (例如: 2F, 3F)
    room_numbers TEXT[] NOT NULL,            -- 房號陣列 (例如: {201, 202, 203})
    start_time TIMESTAMP NOT NULL,           -- 開始時間
    duration_minutes INTEGER DEFAULT 30,     -- 持續時間（分鐘）
    end_time TIMESTAMP,                      -- 結束時間（自動計算或手動調整）
    notes TEXT,                              -- 備註
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立臭氧預約表
CREATE TABLE ozone_reservations (
    id SERIAL PRIMARY KEY,
    floor VARCHAR(10) NOT NULL,              -- 樓層
    room_numbers TEXT[] NOT NULL,            -- 房號陣列
    requested_date DATE NOT NULL,            -- 預約日期
    notes TEXT,                              -- 備註/需求說明
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_by VARCHAR(100),                 -- 建立者
    completed_by VARCHAR(100),               -- 完成者
    completed_at TIMESTAMP,                  -- 完成時間
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立交班事項表
CREATE TABLE handover_items (
    key_id SERIAL PRIMARY KEY,
    handover_id INTEGER REFERENCES handovers(id) ON DELETE CASCADE,
    item_content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX idx_handovers_timestamp ON handovers(timestamp);
CREATE INDEX idx_handovers_shift ON handovers(shift);
CREATE INDEX idx_inventory_handover ON inventory_records(handover_id);
CREATE INDEX idx_ozone_handover ON ozone_records(handover_id);
CREATE INDEX idx_ozone_floor ON ozone_records(floor);
CREATE INDEX idx_ozone_start_time ON ozone_records(start_time);
CREATE INDEX idx_ozone_reservations_date ON ozone_reservations(requested_date);
CREATE INDEX idx_ozone_reservations_status ON ozone_reservations(status);
CREATE INDEX idx_handover_items_handover ON handover_items(handover_id);
CREATE INDEX idx_handover_items_resolved ON handover_items(is_resolved);
CREATE INDEX idx_rooms_floor ON rooms(floor);
CREATE INDEX idx_rooms_active ON rooms(is_active);

-- 插入備品資料
INSERT INTO items (name, category) VALUES
('波型枕', '寢具'),
('床墊', '寢具'),
('硬枕', '寢具'),
('軟枕', '寢具'),
('乳膠枕', '寢具'),
('羽毛枕', '寢具'),
('棉被', '寢具'),
('嬰兒床', '嬰用品'),
('嬰兒盆', '嬰用品'),
('嬰兒椅', '嬰用品'),
('消毒鍋', '嬰用品'),
('床圍', '嬰用品'),
('電風扇', '家電'),
('除濕機', '家電'),
('熨斗', '家電'),
('黑膠機', '家電'),
('冰桶', 'B1'),
('員餐椅', 'B1'),
('套組Ａ雙', '套組'),
('套組Ａ單', '套組'),
('生日組', '套組'),
('化妝鏡', '櫃台'),
('吹風機', '櫃台'),
('記憶枕', '寢具'),
('開瓶器', '櫃台'),
('電視遙控器', '櫃台'),
('暖氣機', '家電'),
('白衣架', 'B1'),
('支撐型對枕', '寢具');

-- 插入預設管理員帳號 (密碼: admin123 的bcrypt hash)
-- 注意: 實際部署時請透過API建立並使用強密碼
INSERT INTO users (username, password_hash, full_name, role) VALUES
('admin', '$2a$10$XQmYGKvGYLvBPl9xZ0hs8.xp3.oN2K8gM9p.BcMy/aD5PqCw0.qPW', '系統管理員', 'admin');

-- 插入房號資料 (與前端 constants.js 一致)
INSERT INTO rooms (floor, room_number, display_order) VALUES
-- B1 (無房號)
-- 5F
('5F', '501', 1), ('5F', '502', 2), ('5F', '503', 3), ('5F', '505', 4), ('5F', '506', 5),
('5F', '507', 6), ('5F', '508', 7), ('5F', '509', 8), ('5F', '510', 9), ('5F', '511', 10),
('5F', '512', 11), ('5F', '513', 12), ('5F', '515', 13),
-- 6F
('6F', '601', 1), ('6F', '602', 2), ('6F', '603', 3), ('6F', '605', 4), ('6F', '606', 5),
('6F', '607', 6), ('6F', '608', 7), ('6F', '609', 8), ('6F', '610', 9), ('6F', '611', 10),
('6F', '612', 11), ('6F', '613', 12), ('6F', '615', 13),
-- 7F
('7F', '701', 1), ('7F', '702', 2), ('7F', '703', 3), ('7F', '705', 4), ('7F', '706', 5),
('7F', '707', 6), ('7F', '708', 7), ('7F', '709', 8), ('7F', '710', 9), ('7F', '711', 10),
('7F', '712', 11), ('7F', '713', 12), ('7F', '715', 13),
-- 8F
('8F', '801', 1), ('8F', '802', 2), ('8F', '803', 3), ('8F', '805', 4), ('8F', '806', 5),
('8F', '807', 6), ('8F', '808', 7),
-- 9F
('9F', '903', 1), ('9F', '905', 2), ('9F', '906', 3), ('9F', '907', 4), ('9F', '908', 5),
('9F', '909', 6), ('9F', '910', 7), ('9F', '911', 8), ('9F', '912', 9), ('9F', '913', 10),
('9F', '915', 11),
-- 10F
('10F', '1003', 1), ('10F', '1005', 2), ('10F', '1006', 3), ('10F', '1007', 4), ('10F', '1008', 5),
('10F', '1009', 6), ('10F', '1010', 7), ('10F', '1011', 8), ('10F', '1012', 9), ('10F', '1013', 10),
('10F', '1015', 11),
-- 11F
('11F', '1103', 1), ('11F', '1105', 2), ('11F', '1106', 3), ('11F', '1107', 4), ('11F', '1108', 5),
('11F', '1109', 6), ('11F', '1110', 7), ('11F', '1111', 8), ('11F', '1112', 9), ('11F', '1113', 10),
('11F', '1115', 11),
-- 12F
('12F', '1203', 1), ('12F', '1205', 2), ('12F', '1206', 3), ('12F', '1207', 4), ('12F', '1208', 5),
('12F', '1210', 6), ('12F', '1211', 7), ('12F', '1212', 8), ('12F', '1213', 9), ('12F', '1215', 10);


COMMENT ON TABLE users IS '使用者帳號表';
COMMENT ON TABLE rooms IS '房號資料表';
COMMENT ON TABLE announcements IS '公告資料表';
COMMENT ON TABLE handovers IS '交接紀錄主表';
COMMENT ON TABLE items IS '備品清單表';
COMMENT ON TABLE inventory_records IS '收放備品紀錄表';
COMMENT ON TABLE ozone_records IS '臭氧使用紀錄表（樓層卡片式管理）';
COMMENT ON TABLE ozone_reservations IS '臭氧預約表';
COMMENT ON TABLE handover_items IS '交班事項表';

