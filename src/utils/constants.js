// API 配置
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    TIMEOUT: 10000,
};

// LocalStorage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_INFO: 'user_info',
    SELECTED_USER: 'selected_user',
};

// 樓層配置 (與 Android/iOS App 一致)
export const FLOORS = [
    { id: '5F', label: '5F', rooms: ['501', '502', '503', '505', '506', '507', '508', '509', '510', '511', '512', '513', '515', '520'] },
    { id: '6F', label: '6F', rooms: ['601', '602', '603', '605', '606', '607', '608', '609', '610', '611', '612', '613', '615'] },
    { id: '7F', label: '7F', rooms: ['701', '702', '703', '705', '706', '707', '708', '709', '710', '711', '712', '713', '715'] },
    { id: '8F', label: '8F', rooms: ['801', '802', '803', '805', '806', '807', '808'] },
    { id: '9F', label: '9F', rooms: ['903', '905', '906', '907', '908', '909', '910', '911', '912', '913', '915'] },
    { id: '10F', label: '10F', rooms: ['1003', '1005', '1006', '1007', '1008', '1009', '1010', '1011', '1012', '1013', '1015'] },
    { id: '11F', label: '11F', rooms: ['1103', '1105', '1106', '1107', '1108', '1109', '1110', '1111', '1112', '1113', '1115'] },
    { id: '12F', label: '12F', rooms: ['1203', '1205', '1206', '1207', '1208', '1210', '1211', '1212', '1213', '1215'] },
];

// 備品圖示對照 (使用 Ionicons 名稱，對齊 Native App)
export const ITEM_ICONS = {
    '套組': 'gift-outline',
    '嬰用品': 'happy-outline',
    '家電': 'flash-outline',
    '寢具': 'bed-outline',
    '櫃台': 'storefront-outline',
    '盥洗用品': 'water-outline',
    '清潔用品': 'sparkles-outline',
    '其他': 'cube-outline',
    '預設': 'pricetag-outline',
};

// 班別常數
export const SHIFTS = {
    MORNING: '早班',
    AFTERNOON: '中班',
    EVENING: '晚班',
};

// 班別時間 (與 Android/iOS App 一致)
export const SHIFT_TIMES = {
    [SHIFTS.MORNING]: '08:30-17:00',
    [SHIFTS.AFTERNOON]: '10:30-19:00',
    [SHIFTS.EVENING]: '14:30-23:00',
};

// 備品狀態
export const INVENTORY_STATUS = {
    IN: '收',
    OUT: '放',
};

