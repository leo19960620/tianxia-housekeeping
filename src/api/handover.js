import api from './axios';

/**
 * 交接紀錄相關 API
 */
export const handoverAPI = {
    getAll: (params = {}) => api.get('/handovers', { params }),

    getById: (id) => api.get(`/handovers/${id}`),

    create: (data) => api.post('/handovers', data),

    update: (id, data) => api.put(`/handovers/${id}`, data),

    delete: (id) => api.delete(`/handovers/${id}`),

    // 新增子項目
    addInventory: (handoverId, data) =>
        api.post(`/handovers/${handoverId}/inventory`, data),

    addOzone: (handoverId, data) =>
        api.post(`/handovers/${handoverId}/ozone`, data),

    addHandoverItem: (handoverId, data) =>
        api.post(`/handovers/${handoverId}/items`, data),

    // 更新子項目
    updateOzone: (id, data) => api.put(`/ozone/${id}`, data),

    // 刪除子項目
    deleteInventory: (id) => api.delete(`/inventory/${id}`),

    deleteOzone: (id) => api.delete(`/ozone/${id}`),
};
