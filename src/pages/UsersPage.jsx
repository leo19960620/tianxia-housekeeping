import { useState, useEffect } from 'react';
import { userAPI } from '../api/user';
import Button from '../components/common/Button';
import Icon from '../components/common/Icon';
import '../styles/ModernTable.css';
import Modal from '../components/common/Modal';
import './UsersPage.css';

function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
    });

    useEffect(() => {
        loadUsers();
    }, []);

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

    const handleSubmit = async () => {
        if (!formData.full_name) {
            alert('請輸入姓名');
            return;
        }

        try {
            await userAPI.create({
                fullName: formData.full_name
            });
            alert('使用者已建立');
            setShowModal(false);
            loadUsers();
            setFormData({ full_name: '' });
        } catch (error) {
            alert(error.message || '建立失敗');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('確定要刪除此使用者嗎?')) return;

        try {
            await userAPI.delete(id);
            loadUsers();
        } catch (error) {
            alert(error.message || '刪除失敗');
        }
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>載入中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-content">
                <div className="table-header-row">
                    <h1 className="page-title">使用者管理</h1>
                    <Button onClick={() => setShowModal(true)}>+ 新增使用者</Button>
                </div>

                <div className="modern-table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}></th>
                                <th>姓名</th>
                                <th>ID</th>
                                <th style={{ textAlign: 'right' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                        尚無使用者資料
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-avatar">
                                                {user.full_name.substring(0, 2).toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{user.full_name}</td>
                                        <td>
                                            <span className="user-id-badge">#{user.id}</span>
                                        </td>
                                        <td className="action-cell" style={{ textAlign: 'right' }}>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDelete(user.id)}
                                                style={{ display: 'inline-flex' }}
                                            >
                                                <Icon name="trash" size={14} />
                                                刪除
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className="table-footer">
                        <span className="table-stats">共 {users.length} 筆紀錄</span>
                    </div>
                </div>
            </div>

            {/* 新增使用者 Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="新增使用者"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            姓名 *
                        </label>
                        <input
                            type="text"
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-sm)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-base)',
                            }}
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="請輸入姓名"
                            autoFocus
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                        <Button variant="secondary" fullWidth onClick={() => setShowModal(false)}>
                            取消
                        </Button>
                        <Button fullWidth onClick={handleSubmit}>
                            建立
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default UsersPage;
