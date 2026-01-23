import { useState, useEffect, useRef } from 'react';
import { handoverItemAPI } from '../api/handoverItem';
import { userAPI } from '../api/user';
import Button from '../components/common/Button';
import Icon from '../components/common/Icon';
import TableSkeleton from '../components/common/TableSkeleton';
import '../styles/ModernTable.css';
import './HandoverItemsPage.css';

function HandoverItemsPage() {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Form states
    const [formContent, setFormContent] = useState('');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // Dropdown states
    const [users, setUsers] = useState([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadItems();
        loadUsers();

        // 點擊外部關閉下拉選單
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        applyFilters();
    }, [items, dateRange, searchQuery]);

    const loadItems = async () => {
        try {
            setLoading(true);
            const res = await handoverItemAPI.getAll();
            if (res.success) {
                setItems(res.data);
            }
        } catch (error) {
            console.error('載入交班事項失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await userAPI.getAll();
            if (res.success) {
                setUsers(res.data);
            }
        } catch (error) {
            console.error('載入使用者失敗:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...items];

        // 日期篩選
        if (dateRange.startDate || dateRange.endDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);
                itemDate.setHours(0, 0, 0, 0);

                if (dateRange.startDate && dateRange.endDate) {
                    const start = new Date(dateRange.startDate);
                    const end = new Date(dateRange.endDate);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    return itemDate >= start && itemDate <= end;
                } else if (dateRange.startDate) {
                    const start = new Date(dateRange.startDate);
                    start.setHours(0, 0, 0, 0);
                    return itemDate >= start;
                } else if (dateRange.endDate) {
                    const end = new Date(dateRange.endDate);
                    end.setHours(23, 59, 59, 999);
                    return itemDate <= end;
                }
                return true;
            });
        }

        // 搜尋篩選
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const content = (item.item_content || item.content || '').toLowerCase();
                // 優先使用 create_by，並向下相容 createby 和 staff_name
                const staff = (item.create_by || item.createby || item.staff_name || '').toLowerCase();
                return content.includes(query) || staff.includes(query);
            });
        }

        setFilteredItems(filtered);
    };

    // 新增功能
    const handleAddClick = () => {
        setFormContent('');
        setSelectedStaff(null);
        setShowAddModal(true);
    };

    const handleCreate = async () => {
        if (!formContent.trim()) {
            alert('請輸入交班內容');
            return;
        }
        if (!selectedStaff) {
            alert('請選擇交班人');
            return;
        }

        try {
            await handoverItemAPI.create({
                content: formContent,
                created_by: selectedStaff.id,      // ID
                create_by: selectedStaff.full_name, // Name (create_by) - 使用者指定
                createby: selectedStaff.full_name  // Name (createby) - 備用
            });
            setShowAddModal(false);
            loadItems();
        } catch (error) {
            alert('新增失敗: ' + (error.message || '未知錯誤'));
        }
    };

    // 編輯功能
    const handleEditClick = (item) => {
        setEditingItem(item);
        setFormContent(item.item_content || item.content);
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!formContent.trim()) {
            alert('請輸入交班內容');
            return;
        }

        try {
            const itemId = editingItem.key_id || editingItem.id;
            await handoverItemAPI.update(itemId, formContent);
            setShowEditModal(false);
            loadItems();
        } catch (error) {
            alert('更新失敗: ' + (error.message || '未知錯誤'));
        }
    };

    // 刪除功能
    const handleDeleteClick = async (item) => {
        if (!window.confirm('確定要刪除此交班事項嗎？')) return;

        try {
            const itemId = item.key_id || item.id;
            await handoverItemAPI.delete(itemId);
            loadItems();
        } catch (error) {
            alert('刪除失敗: ' + (error.message || '未知錯誤'));
        }
    };

    const handleUserSelect = (user) => {
        setSelectedStaff(user);
        setShowUserDropdown(false);
    };

    if (loading) {
        return <TableSkeleton />;
    }

    return (
        <div className="handover-items-page">
            <div className="page-content">
                {/* 篩選欄 */}
                <div className="items-header">
                    <div className="items-search-wrapper">
                        <Icon name="search" size={18} className="items-search-icon" />
                        <input
                            type="text"
                            className="items-search"
                            placeholder="搜尋交班內容..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="items-filters">
                        <Button onClick={handleAddClick}>
                            <Icon name="add" size={18} />
                            新增事項
                        </Button>
                        <input
                            type="date"
                            className="items-filter-select"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                        <input
                            type="date"
                            className="items-filter-select"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
                    </div>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <p>
                            {searchQuery || dateRange.startDate || dateRange.endDate
                                ? '找不到符合條件的交班事項'
                                : '尚無交班事項'}
                        </p>
                    </div>
                ) : (
                    <div className="modern-table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>日期</th>
                                    <th>交班內容</th>
                                    <th>建立人</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => {
                                    // 嘗試透過 created_by (User ID) 匹配使用者名稱
                                    const creatorUser = users.find(u => u.id === item.created_by || u.id === Number(item.created_by));
                                    const creatorName = creatorUser ? creatorUser.full_name : (item.create_by || item.createby || item.staff_name || '-');

                                    return (
                                        <tr key={item.key_id || item.id}>
                                            <td className="item-date-cell">
                                                {item.created_at &&
                                                    new Date(item.created_at).toLocaleDateString('zh-TW')}
                                            </td>
                                            <td className="item-content-cell">
                                                {item.item_content || item.content}
                                            </td>
                                            <td className="item-staff-cell">
                                                {creatorName}
                                            </td>
                                            <td className="item-actions-cell">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleEditClick(item)}
                                                >
                                                    <Icon name="create-outline" size={14} />
                                                    編輯
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeleteClick(item)}
                                                >
                                                    <Icon name="trash-outline" size={14} />
                                                    刪除
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="table-footer">
                            <span className="table-stats">共 {filteredItems.length} 筆紀錄</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 新增 Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>新增交班事項</h2>
                        <div className="form-group">
                            <label>內容</label>
                            <textarea
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                placeholder="請輸入交班事項..."
                                rows={4}
                            />
                        </div>
                        <div className="form-group" ref={dropdownRef}>
                            <label>交班人</label>
                            <div
                                className="picker-trigger"
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                style={{ position: 'relative', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span>{selectedStaff ? selectedStaff.full_name : '選擇交班人'}</span>
                                <Icon name={showUserDropdown ? "chevron-up" : "chevron-down"} size={16} />

                                {/* 下拉選單 - 向上展開 */}
                                {showUserDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: 0,
                                        right: 0,
                                        marginBottom: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
                                        zIndex: 100,
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        border: '1px solid #e0e0e0',
                                        padding: '4px 0',
                                        color: '#333'
                                    }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {users.length > 0 ? (
                                            users.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleUserSelect(user)}
                                                    style={{
                                                        padding: '10px 16px',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedStaff?.id === user.id ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                                        transition: 'background-color 0.2s',
                                                        color: selectedStaff?.id === user.id ? 'var(--color-primary)' : 'var(--color-text)',
                                                        fontWeight: selectedStaff?.id === user.id ? 600 : 400
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedStaff?.id === user.id ? 'rgba(46, 125, 50, 0.12)' : '#f5f5f5'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedStaff?.id === user.id ? 'rgba(46, 125, 50, 0.08)' : 'transparent'}
                                                >
                                                    {user.full_name}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                                                無使用者資料
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setShowAddModal(false)}>取消</button>
                            <button className="primary-btn" onClick={handleCreate}>確認</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 編輯 Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>編輯交班事項</h2>
                        <div className="form-group">
                            <label>內容</label>
                            <textarea
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setShowEditModal(false)}>取消</button>
                            <button className="primary-btn" onClick={handleUpdate}>更新</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HandoverItemsPage;
