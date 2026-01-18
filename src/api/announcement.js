import api from './axios';

/**
 * 公告相關 API
 */
export const announcementAPI = {
    getAll: (active) => api.get('/announcements', { params: { active } }),

    getById: (id) => api.get(`/announcements/${id}`),

    create: (data) => api.post('/announcements', data),

    update: (id, data) => api.put(`/announcements/${id}`, data),

    delete: (id) => api.delete(`/announcements/${id}`),
};
