import { useState, useEffect } from 'react';
import { itemAPI } from '../api/item';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import { ITEM_ICONS } from '../utils/constants';
import './ItemsPage.css';

function ItemsPage() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [itemsRes, categoriesRes] = await Promise.all([
                itemAPI.getAll(),
                itemAPI.getCategories(),
            ]);

            if (itemsRes.success) {
                setItems(itemsRes.data);
            }
            if (categoriesRes.success) {
                setCategories(categoriesRes.data);
            }
        } catch (error) {
            console.error('載入備品失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.category) {
            alert('請填寫所有欄位');
            return;
        }

        try {
            await itemAPI.create(formData);
            alert('備品已建立');
            setShowModal(false);
            loadData();
            setFormData({ name: '', category: '' });
        } catch (error) {
            alert(error.message || '建立失敗');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('確定要刪除此備品嗎?')) return;

        try {
            await itemAPI.delete(id);
            loadData();
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
                    <h1 className="page-title">備品管理</h1>
                    <Button onClick={() => setShowModal(true)}>+ 新增備品</Button>
                </div>

                <div className="items-page-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>圖示</th>
                                <th>備品名稱</th>
                                <th>分類</th>
                                <th style={{ textAlign: 'right' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                        尚無備品資料
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="item-icon-wrapper">
                                                <Icon
                                                    name={ITEM_ICONS[item.category] || ITEM_ICONS['預設']}
                                                    size={20}
                                                />
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                                        <td>
                                            {item.category}
                                        </td>
                                        <td className="action-cell">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '8px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '50%',
                                                    color: 'var(--color-danger)'
                                                }}
                                                title="刪除"
                                            >
                                                <Icon name="trash-outline" size={20} color="var(--color-danger)" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 新增備品 Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="新增備品"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            備品名稱 *
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-sm)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-base)',
                            }}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="請輸入備品名稱"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            分類 *
                        </label>
                        <select
                            className="form-select"
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-sm)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-base)',
                            }}
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">請選擇分類</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <div style={{ marginTop: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            或輸入新分類(會自動建立)
                        </div>
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

export default ItemsPage;
