import { useState, useEffect } from 'react';
import { itemAPI } from '../api/item';
import { useNavigate } from 'react-router-dom';
import '../styles/ModernTable.css';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import TableSkeleton from '../components/common/TableSkeleton';
import { ITEM_ICONS } from '../utils/constants';
import './ItemsPage.css';

function ItemsPage() {
    // ===================
    // State Management
    // ===================
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'history'

    // 備品清單相關
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
    });

    // 歷史紀錄相關
    const [historyRecords, setHistoryRecords] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        itemType: '',
        roomNumber: '',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 50,
    });

    // ===================
    // Effects
    // ===================
    useEffect(() => {
        if (activeTab === 'list') {
            loadData();
        } else {
            loadHistoryRecords();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'history') {
            loadHistoryRecords();
        }
    }, [pagination.currentPage, historyFilters]);

    // ===================
    // 備品清單功能
    // ===================
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

    // ===================
    // 歷史紀錄功能
    // ===================
    const loadHistoryRecords = async (page = pagination.currentPage) => {
        try {
            setHistoryLoading(true);
            const params = {
                ...historyFilters,
                page,
                limit: pagination.limit,
            };

            // 移除空值
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            const res = await itemAPI.getInventoryHistory(params);
            if (res.success) {
                setHistoryRecords(res.data.records);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error('載入歷史紀錄失敗:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setHistoryFilters({ ...historyFilters, [key]: value });
        setPagination({ ...pagination, currentPage: 1 }); // 重置頁碼
    };

    const handleResetFilters = () => {
        setHistoryFilters({
            startDate: '',
            endDate: '',
            status: '',
            itemType: '',
            roomNumber: '',
        });
        setPagination({ ...pagination, currentPage: 1 });
    };

    const handlePageChange = (newPage) => {
        setPagination({ ...pagination, currentPage: newPage });
    };

    const handleViewHandover = (handoverId) => {
        navigate(`/handovers/${handoverId}`);
    };

    // ===================
    // Render Functions
    // ===================
    if (loading && activeTab === 'list') {
        return <TableSkeleton />;
    }

    return (
        <div className="page">
            <div className="page-content">
                <div className="table-header-row">
                    <h1 className="page-title">備品管理</h1>
                    {activeTab === 'list' && (
                        <Button onClick={() => setShowModal(true)}>+ 新增備品</Button>
                    )}
                </div>

                {/* Tab 切換 */}
                <div className="items-tabs">
                    <button
                        className={`items-tab ${activeTab === 'list' ? 'active' : ''}`}
                        onClick={() => setActiveTab('list')}
                    >
                        <Icon name="cube-outline" size={18} />
                        備品清單
                    </button>
                    <button
                        className={`items-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <Icon name="time-outline" size={18} />
                        歷史紀錄
                    </button>
                </div>

                {/* 備品清單 Tab */}
                {activeTab === 'list' && (
                    <div className="modern-table-container">
                        <table className="modern-table">
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
                                            <td>{item.category}</td>
                                            <td className="action-cell" style={{ textAlign: 'right' }}>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="刪除"
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
                            <span className="table-stats">共 {items.length} 筆紀錄</span>
                        </div>
                    </div>
                )}

                {/* 歷史紀錄 Tab */}
                {activeTab === 'history' && (
                    <>
                        {/* 篩選欄 */}
                        <div className="history-filters">
                            <div className="history-filter-row">
                                <div className="history-filter-group">
                                    <label>開始日期</label>
                                    <input
                                        type="date"
                                        className="history-filter-input"
                                        value={historyFilters.startDate}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    />
                                </div>
                                <div className="history-filter-group">
                                    <label>結束日期</label>
                                    <input
                                        type="date"
                                        className="history-filter-input"
                                        value={historyFilters.endDate}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    />
                                </div>
                                <div className="history-filter-group">
                                    <label>狀態</label>
                                    <select
                                        className="history-filter-input"
                                        value={historyFilters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">全部</option>
                                        <option value="收">收</option>
                                        <option value="放">放</option>
                                    </select>
                                </div>
                                <div className="history-filter-group">
                                    <label>備品名稱</label>
                                    <input
                                        type="text"
                                        className="history-filter-input"
                                        placeholder="搜尋備品..."
                                        value={historyFilters.itemType}
                                        onChange={(e) => handleFilterChange('itemType', e.target.value)}
                                    />
                                </div>
                                <div className="history-filter-group">
                                    <label>房號</label>
                                    <input
                                        type="text"
                                        className="history-filter-input"
                                        placeholder="搜尋房號..."
                                        value={historyFilters.roomNumber}
                                        onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                                    />
                                </div>
                                <div className="history-filter-group">
                                    <Button variant="secondary" onClick={handleResetFilters}>
                                        <Icon name="refresh" size={16} />
                                        重置
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 歷史紀錄表格 */}
                        {historyLoading ? (
                            <TableSkeleton />
                        ) : historyRecords.length === 0 ? (
                            <div className="empty-state">
                                <Icon name="file-tray-outline" size={48} />
                                <p>找不到符合條件的備品紀錄</p>
                            </div>
                        ) : (
                            <div className="modern-table-container">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>日期時間</th>
                                            <th>狀態</th>
                                            <th>房號</th>
                                            <th>備品</th>
                                            <th>數量</th>
                                            <th>員工</th>
                                            <th>班別</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyRecords.map((record) => (
                                            <tr key={record.key_id}>
                                                <td>
                                                    {new Date(record.created_at).toLocaleString('zh-TW', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false,
                                                    })}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${record.status === '收' ? 'in' : 'out'}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td>{record.room_number}</td>
                                                <td>{record.item_type}</td>
                                                <td>{record.quantity}</td>
                                                <td>{record.staff_name || '-'}</td>
                                                <td>{record.shift || '-'}</td>
                                                <td>
                                                    <button
                                                        className="action-btn view"
                                                        onClick={() => handleViewHandover(record.handover_id)}
                                                        title="查看交接紀錄"
                                                    >
                                                        <Icon name="eye-outline" size={14} />
                                                        查看
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* 分頁導航 */}
                                <div className="table-footer">
                                    <span className="table-stats">
                                        共 {pagination.totalRecords} 筆紀錄 · 第 {pagination.currentPage} / {pagination.totalPages} 頁
                                    </span>
                                    <div className="pagination">
                                        <button
                                            className="pagination-btn"
                                            disabled={pagination.currentPage === 1}
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        >
                                            <Icon name="chevron-back" size={16} />
                                            上一頁
                                        </button>
                                        <span className="pagination-info">
                                            {pagination.currentPage} / {pagination.totalPages}
                                        </span>
                                        <button
                                            className="pagination-btn"
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        >
                                            下一頁
                                            <Icon name="chevron-forward" size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
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
