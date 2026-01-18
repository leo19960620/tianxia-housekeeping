import api from './axios';

/**
 * 使用者相關 API
 */
export const userAPI = {
    getAll: () => api.get('/users'),

    getById: (id) => api.get(`/users/${id}`),

    create: (data) => api.post('/users', data),

    update: (id, data) => api.put(`/users/${id}`, data),

    delete: (id) => api.delete(`/users/${id}`),
};
