import api from './axios';

/**
 * 交班事項相關 API
 */
export const handoverItemAPI = {
    getAll: (resolved = undefined) =>
        api.get('/handover-items', { params: { resolved } }),

    create: (data) => api.post('/handover-items', data),

    update: (id, content) => api.put(`/handover-items/${id}`, { content }),

    resolve: (id, resolved = true) =>
        api.put(`/handover-items/${id}/resolve`, { resolved }),

    delete: (id) => api.delete(`/handover-items/${id}`),
};
