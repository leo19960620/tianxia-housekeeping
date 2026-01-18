import api from './axios';

/**
 * 認證相關 API
 */
export const authAPI = {
    login: (username, password) => api.post('/auth/login', { username, password }),

    register: (username, password, fullName, role = 'staff') =>
        api.post('/auth/register', { username, password, fullName, role }),
};
