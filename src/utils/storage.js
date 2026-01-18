import { STORAGE_KEYS } from './constants';

/**
 * LocalStorage 管理工具
 */

// 儲存認證 Token
export const setAuthToken = (token) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

// 取得認證 Token
export const getAuthToken = () => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

// 移除認證 Token
export const removeAuthToken = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

// 儲存使用者資訊
export const setUserInfo = (userInfo) => {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
};

// 取得使用者資訊
export const getUserInfo = () => {
    const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
};

// 移除使用者資訊
export const removeUserInfo = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
};

// 儲存選擇的使用者
export const setSelectedUser = (user) => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_USER, JSON.stringify(user));
};

// 取得選擇的使用者
export const getSelectedUser = () => {
    const user = localStorage.getItem(STORAGE_KEYS.SELECTED_USER);
    return user ? JSON.parse(user) : null;
};

// 移除選擇的使用者
export const removeSelectedUser = () => {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_USER);
};

// 清除所有認證相關資料
export const clearAuth = () => {
    removeAuthToken();
    removeUserInfo();
    removeSelectedUser();
};
