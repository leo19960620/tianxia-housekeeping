import { useState, useEffect } from 'react';
import { userAPI } from '../../api/user';
import './UserPicker.css';

/**
 * 單選使用者選擇器
 * @param {boolean} visible - 是否顯示 Modal
 * @param {object} selectedUser - 已選擇的使用者
 * @param {Function} onSelect - 選擇使用者時的回調
 * @param {Function} onClose - 關閉 Modal 的回調
 */
function UserPicker({ visible, selectedUser, onSelect, onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible) {
            loadUsers();
        }
    }, [visible]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await userAPI.getAll();
            if (res.success) {
                setUsers(res.data);
            }
        } catch (error) {
            console.error('載入使用者失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (user) => {
        onSelect(user);
        onClose();
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (!visible) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="user-picker-overlay" onClick={handleOverlayClick}>
            <div className="user-picker-container">
                {/* 頭部 */}
                <div className="user-picker-header">
                    <div className="user-picker-header-left">
                        <span style={{ fontSize: '24px' }}>👥</span>
                        <h2 className="user-picker-title">選擇使用者</h2>
                    </div>
                    <button className="user-picker-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* 列表 */}
                <div className="user-picker-list">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>載入中...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="user-picker-empty">
                            <span className="user-picker-empty-icon">👤</span>
                            <p>尚無使用者</p>
                        </div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user.id}
                                className={`user-picker-item ${selectedUser?.id === user.id ? 'selected' : ''
                                    }`}
                                onClick={() => handleSelect(user)}
                            >
                                <div className="user-picker-item-left">
                                    <div className="user-avatar">
                                        {getInitials(user.full_name)}
                                    </div>
                                    <span className="user-name">{user.full_name}</span>
                                </div>
                                {selectedUser?.id === user.id && (
                                    <span className="user-picker-check">✓</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserPicker;
