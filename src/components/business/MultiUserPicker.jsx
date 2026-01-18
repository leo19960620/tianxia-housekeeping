import { useState, useEffect } from 'react';
import { userAPI } from '../../api/user';
import './UserPicker.css';
import './MultiUserPicker.css';

/**
 * 多選使用者選擇器
 * @param {boolean} visible - 是否顯示 Modal
 * @param {Array} selectedUsers - 已選擇的使用者 ID 陣列
 * @param {Function} onConfirm - 確認選擇時的回調，參數為選中的使用者陣列
 * @param {Function} onClose - 關閉 Modal 的回調
 */
function MultiUserPicker({ visible, selectedUsers = [], onConfirm, onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tempSelectedIds, setTempSelectedIds] = useState(new Set(selectedUsers));

    useEffect(() => {
        if (visible) {
            loadUsers();
            // 重置臨時選擇為當前已選擇的使用者
            setTempSelectedIds(new Set(selectedUsers));
        }
    }, [visible, selectedUsers]);

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

    const toggleUser = (userId) => {
        setTempSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleConfirm = () => {
        // 根據選中的 ID 找到對應的使用者物件
        const selectedUserObjects = users.filter((user) =>
            tempSelectedIds.has(user.id)
        );
        onConfirm(selectedUserObjects);
        onClose();
    };

    const handleCancel = () => {
        // 取消時恢復原本的選擇
        setTempSelectedIds(new Set(selectedUsers));
        onClose();
    };

    if (!visible) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    return (
        <div className="user-picker-overlay" onClick={handleOverlayClick}>
            <div className="user-picker-container">
                {/* 頭部 */}
                <div className="user-picker-header">
                    <div className="user-picker-header-left">
                        <span style={{ fontSize: '24px' }}>👥</span>
                        <h2 className="user-picker-title">
                            選擇員工{' '}
                            {tempSelectedIds.size > 0 && `(已選 ${tempSelectedIds.size})`}
                        </h2>
                    </div>
                    <button className="user-picker-close" onClick={handleCancel}>
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
                        users.map((user) => {
                            const isSelected = tempSelectedIds.has(user.id);
                            return (
                                <div
                                    key={user.id}
                                    className={`user-picker-item multi-select ${isSelected ? 'selected' : ''
                                        }`}
                                    onClick={() => toggleUser(user.id)}
                                >
                                    <span className="user-name">{user.full_name}</span>
                                    {isSelected && <span className="user-picker-check">✓</span>}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 底部按鈕 */}
                <div className="multi-user-picker-footer">
                    <button className="cancel-btn" onClick={handleCancel}>
                        取消
                    </button>
                    <button className="confirm-btn" onClick={handleConfirm}>
                        確定 {tempSelectedIds.size > 0 && `(${tempSelectedIds.size})`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MultiUserPicker;
