/**
 * 時區處理工具函數
 * 統一處理台北時間（UTC+8）相關的時間轉換
 */

/**
 * 取得當前台北時間
 * @returns {Date} 台北時間的 Date 物件
 */
export const getTaipeiTime = () => {
    const now = new Date();
    // 將 UTC 時間轉換為 UTC+8
    const taipeiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    return taipeiTime;
};

/**
 * 取得當前台北時間的 ISO 字串（用於 datetime-local input）
 * @returns {string} 格式: "2026-01-20T09:30"
 */
export const getTaipeiTimeForInput = () => {
    const taipeiTime = getTaipeiTime();
    return taipeiTime.toISOString().slice(0, 16);
};

/**
 * 將任意 Date 物件轉換為台北時間的 ISO 字串
 * @param {Date} date - 要轉換的 Date 物件
 * @returns {string} 台北時間的 ISO 字串
 */
export const toTaipeiISO = (date = new Date()) => {
    const taipeiTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return taipeiTime.toISOString();
};

/**
 * 格式化台北時間為本地化字串
 * @param {Date|string} dateInput - Date 物件或日期字串
 * @param {object} options - toLocaleString 的選項
 * @returns {string} 格式化後的時間字串
 */
export const formatTaipeiTime = (dateInput, options = {}) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const defaultOptions = {
        timeZone: 'Asia/Taipei',
        ...options,
    };
    return date.toLocaleString('zh-TW', defaultOptions);
};

/**
 * 格式化為台北時間的日期字串
 * @param {Date|string} dateInput - Date 物件或日期字串
 * @returns {string} 格式: "2026/01/20"
 */
export const formatTaipeiDate = (dateInput) => {
    return formatTaipeiTime(dateInput, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

/**
 * 格式化為台北時間的時間字串
 * @param {Date|string} dateInput - Date 物件或日期字串
 * @param {boolean} use24Hour - 是否使用 24 小時制，預設 true
 * @returns {string} 格式: "09:30" 或 "上午9:30"
 */
export const formatTaipeiTimeOnly = (dateInput, use24Hour = true) => {
    return formatTaipeiTime(dateInput, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !use24Hour,
    });
};

/**
 * 取得台北時間的今日日期字串（用於 API 查詢）
 * @returns {string} 格式: "2026-01-20"
 */
export const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * 取得台北時區的今日午夜時間（用於日期比較）
 * @returns {Date} 今日 00:00:00 的 Date 物件
 */
export const getTodayMidnight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};
