import api from './axios';

/**
 * 腳踏車管理 API
 */
export const bicycleAPI = {
    getAll: () => api.get('/bicycles'),

    getById: (id) => api.get(`/bicycles/${id}`),

    update: (id, data) => api.patch(`/bicycles/${id}`, data),
};

/**
 * 腳踏車租借 API
 */
export const bicycleRentalAPI = {
    getAll: (params) => api.get('/bicycle-rentals', { params }),

    getActive: () => api.get('/bicycle-rentals/active'),

    create: (data) => api.post('/bicycle-rentals', data),

    update: (id, data) => api.patch(`/bicycle-rentals/${id}`, data),

    return: (id, returnedBy) => api.patch(`/bicycle-rentals/${id}/return`, { returned_by: returnedBy }),
};

/**
 * 腳踏車維護 API
 */
export const bicycleMaintenanceAPI = {
    getAll: (params) => api.get('/bicycle-maintenance', { params }),

    getByBicycleId: (bicycleId) => api.get(`/bicycle-maintenance/bicycle/${bicycleId}`),

    create: (data) => api.post('/bicycle-maintenance', data),
};

/**
 * 雨傘租借 API
 */
export const umbrellaRentalAPI = {
    getAll: (params) => api.get('/umbrella-rentals', { params }),

    getActive: () => api.get('/umbrella-rentals/active'),

    create: (data) => api.post('/umbrella-rentals', data),

    update: (id, data) => api.patch(`/umbrella-rentals/${id}`, data),

    return: (id, returnedBy) => api.patch(`/umbrella-rentals/${id}/return`, { returned_by: returnedBy }),
};
