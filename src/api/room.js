import api from './axios';

export const roomAPI = {
    /**
     * 取得所有樓層和房號資料
     */
    getAll: () => api.get('/rooms'),

    /**
     * 取得所有樓層列表
     */
    getFloors: () => api.get('/rooms/floors'),

    /**
     * 取得特定樓層的房號列表
     */
    getRoomsByFloor: (floor) => api.get(`/rooms/floor/${floor}`),

    /**
     * 新增房號 (管理員)
     */
    create: (roomData) => api.post('/rooms', roomData),

    /**
     * 刪除房號 (管理員)
     */
    delete: (id) => api.delete(`/rooms/${id}`),
};

