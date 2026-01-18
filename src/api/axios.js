import axios from 'axios';
import { API_CONFIG } from '../utils/constants';
import { getAuthToken, clearAuth } from '../utils/storage';

// 通用 Token（適用於不需要登入的場景）
const COMMON_TOKEN = import.meta.env.VITE_COMMON_TOKEN || 'common-access-token-2024';

// 建立 axios 實例
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 請求攔截器 - 自動加入 JWT token
api.interceptors.request.use(
    (config) => {
        // 優先使用 localStorage 中的 token（如果有登入）
        let token = getAuthToken();

        // 如果沒有登入 token，使用通用 token
        if (!token) {
            token = COMMON_TOKEN;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 回應攔截器 - 統一錯誤處理
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API 錯誤:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
        });

        if (error.response) {
            // Token 過期或無效,清除登入狀態
            if (error.response.status === 401 || error.response.status === 403) {
                // 只有在使用登入 token 時才清除（不清除通用 token）
                const storedToken = getAuthToken();
                if (storedToken) {
                    clearAuth();
                }
                // 注意：使用通用 token 時，401 錯誤可能表示後端配置問題
            }
            return Promise.reject(error.response.data);
        }

        return Promise.reject({
            success: false,
            message: '網路錯誤,請檢查連線',
        });
    }
);

export default api;
