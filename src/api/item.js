import api from './axios';

/**
 * 備品相關 API
 */
export const itemAPI = {
    getAll: (category) => api.get('/items', { params: { category } }),

    getCategories: () => api.get('/items/categories'),

    create: (data) => api.post('/items', data),

    update: (id, data) => api.put(`/items/${id}`, data),

    delete: (id) => api.delete(`/items/${id}`),

    // 查詢備品歷史紀錄
    getInventoryHistory: (params) => api.get('/items/inventory-records', { params }),
};

