import api from './axios';

/**
 * 臭氧統計相關 API
 */
export const ozoneAPI = {
    // 統計查詢（支援日查詢、月統計、優先順序）
    getStats: (params) => {
        // 根據參數決定使用哪個端點
        if (params.date) {
            // 日查詢
            return api.get('/ozone/stats/daily', { params });
        } else if (params.type === 'priority') {
            // 優先順序
            return api.get('/ozone/stats/priority', { params });
        } else if (params.year && params.month) {
            // 月統計
            return api.get('/ozone/stats/monthly', { params });
        }
        // 日期範圍查詢（原有功能）
        return api.get('/ozone/stats', { params });
    },

    // 預約管理
    getReservations: (params) => api.get('/ozone/reservations', { params }),

    createReservation: (data) => api.post('/ozone/reservations', data),

    updateReservation: (id, data) => api.put(`/ozone/reservations/${id}`, data),

    deleteReservation: (id) => api.delete(`/ozone/reservations/${id}`),
};
