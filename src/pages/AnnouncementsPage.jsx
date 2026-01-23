import { useState, useEffect, useRef } from 'react';
import { announcementAPI } from '../api/announcement';
import { userAPI } from '../api/user';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import TableSkeleton from '../components/common/TableSkeleton';
import { getTodayMidnight } from '../utils/timezone';
import '../styles/ModernTable.css';
import './AnnouncementsPage.css';

function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'expired', or 'recurring'
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        start_date: '',
        end_date: '',
        created_by: '', // Changed from announcer
        announcement_type: 'normal',
    });

    // 下拉選單相關
    const [users, setUsers] = useState([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadAnnouncements();
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

    const loadAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await announcementAPI.getAll();
            if (res.success) {
                setAnnouncements(res.data);
            }
        } catch (error) {
            console.error('載入公告失敗:', error);
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

    // 從 content 提取標題（取前 50 字元或第一行）
    const extractTitle = (content) => {
        if (!content) return '未命名公告';
        const firstLine = content.split('\n')[0];
        return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    };

    // 判斷公告狀態
    const getAnnouncementStatus = (announcement) => {
        if (announcement.announcement_type === 'routine') return 'routine';

        const today = getTodayMidnight(); // 使用時區工具
        const start = new Date(announcement.start_date);
        const end = new Date(announcement.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (today < start) return 'pending';      // 未開始
        if (start <= today && today <= end) return 'active';  // 進行中  
        return 'inactive';  // 已到期
    };

    // 過濾公告
    const getFilteredAnnouncements = () => {
        let filtered = announcements;

        // 根據頁籤過濾
        if (activeTab === 'active') {
            // 進行中：一般公告且在有效期內
            filtered = filtered.filter(ann => {
                const type = ann.announcement_type || 'normal';
                const isNormalType = (type === 'normal' || type === 'general');
                if (!isNormalType) return false;
                return getAnnouncementStatus(ann) === 'active';
            });
        } else if (activeTab === 'pending') {
            // 未開始：一般公告且開始日期在未來
            filtered = filtered.filter(ann => {
                const type = ann.announcement_type || 'normal';
                const isNormalType = (type === 'normal' || type === 'general');
                if (!isNormalType) return false;
                return getAnnouncementStatus(ann) === 'pending';
            });
        } else if (activeTab === 'expired') {
            // 已到期：一般公告且已過期
            filtered = filtered.filter(ann => {
                const type = ann.announcement_type || 'normal';
                const isNormalType = (type === 'normal' || type === 'general');
                if (!isNormalType) return false;
                return getAnnouncementStatus(ann) === 'inactive';
            });
        } else {
            // 例行公告
            filtered = filtered.filter(ann => ann.announcement_type === 'routine');
        }

        // 搜尋關鍵字
        if (searchKeyword) {
            filtered = filtered.filter(ann =>
                ann.content?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                (ann.createby || ann.created_by || ann.announcer || '').toLowerCase().includes(searchKeyword.toLowerCase())
            );
        }

        // 排序邏輯 - 所有公告都按開始日期降序（最新在上）
        filtered.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date) : new Date(0);
            const dateB = b.start_date ? new Date(b.start_date) : new Date(0);
            return dateB - dateA;
        });

        return filtered;
    };

    const handleOpenModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({
            title: '',
            content: '',
            start_date: '',
            end_date: '',
            created_by: '',
            announcement_type: activeTab === 'recurring' ? 'routine' : 'normal',
        });
        setShowModal(true);
    };

    // 格式化日期為 YYYY-MM-DD
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleEdit = (announcement) => {
        setIsEditing(true);
        setEditingId(announcement.id);
        // 優先讀取 createby，兼容 created_by 和 announcer
        const creator = announcement.createby || announcement.created_by || announcement.announcer || '';

        setFormData({
            title: extractTitle(announcement.content),
            content: announcement.content,
            start_date: formatDateForInput(announcement.start_date),
            end_date: formatDateForInput(announcement.end_date),
            created_by: creator,
            announcement_type: announcement.announcement_type,
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.content) {
            alert('請填寫公告內容');
            return;
        }

        if (formData.announcement_type !== 'routine') {
            if (!formData.start_date || !formData.end_date) {
                alert('請填寫開始日期和結束日期');
                return;
            }
        }

        try {
            const submitData = {
                content: formData.content,
                startDate: formData.start_date,
                endDate: formData.end_date,
                createby: formData.created_by, // Send as createby
                announcementType: formData.announcement_type,
            };

            if (isEditing) {
                await announcementAPI.update(editingId, submitData);
                alert('公告已更新');
            } else {
                await announcementAPI.create(submitData);
                alert('公告已建立');
            }

            setShowModal(false);
            loadAnnouncements();
        } catch (error) {
            alert(error.message || (isEditing ? '更新失敗' : '建立失敗'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('確定要刪除此公告嗎?')) return;

        try {
            await announcementAPI.delete(id);
            alert('已刪除');
            loadAnnouncements();
        } catch (error) {
            alert(error.message || '刪除失敗');
        }
    };

    const formatDateRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const formatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return `${startDate.toLocaleDateString('zh-TW', formatOptions)} ~ ${endDate.toLocaleDateString('zh-TW', formatOptions)}`;
    };

    const handleUserSelect = (userName) => {
        setFormData({ ...formData, created_by: userName });
        setShowUserDropdown(false);
    };

    if (loading) {
        return <TableSkeleton />;
    }

    const filteredAnnouncements = getFilteredAnnouncements();

    return (
        <div className="page announcements-page">
            <div className="page-content">
                {/* 搜尋與篩選區 */}
                <div className="announcements-header">
                    <div className="announcements-search-wrapper">
                        <Icon name="search" size={18} className="announcements-search-icon" />
                        <input
                            type="text"
                            className="announcements-search"
                            placeholder="搜尋公告..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                    </div>

                    <div className="announcements-filters">
                        <Button onClick={handleOpenModal}>
                            <Icon name="add" size={18} />
                            新增公告
                        </Button>
                    </div>
                </div>

                {/* 頁籤切換 */}
                <div className="announcements-tabs">
                    <button
                        className={`announcements-tab ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        進行中
                    </button>
                    <button
                        className={`announcements-tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        未開始
                    </button>
                    <button
                        className={`announcements-tab ${activeTab === 'expired' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expired')}
                    >
                        已到期
                    </button>
                    <button
                        className={`announcements-tab ${activeTab === 'recurring' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recurring')}
                    >
                        例行公告
                    </button>
                </div>

                {/* 公告表格 */}
                {filteredAnnouncements.length === 0 ? (
                    <div className="announcements-empty">
                        <div className="announcements-empty-icon">📄</div>
                        <div className="announcements-empty-text">目前無公告</div>
                    </div>
                ) : (
                    <div className="modern-table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>公告內容</th>
                                    <th>日期範圍</th>
                                    <th>公告人</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAnnouncements.map((ann) => {
                                    const status = getAnnouncementStatus(ann);
                                    let statusClass = 'default';
                                    let statusText = '';
                                    const creatorName = ann.createby || ann.created_by || ann.announcer || '-';

                                    if (status === 'routine') { statusClass = 'active'; statusText = '例行'; }
                                    else if (status === 'pending') { statusClass = 'warning'; statusText = '未開始'; }
                                    else if (status === 'active') { statusClass = 'success'; statusText = '進行中'; }
                                    else if (status === 'inactive') { statusClass = 'default'; statusText = '已到期'; }

                                    return (
                                        <tr key={ann.id}>
                                            <td>
                                                <div className="announcement-content-full">
                                                    {ann.content}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="announcement-date-range">
                                                    {formatDateRange(ann.start_date, ann.end_date)}
                                                </div>
                                            </td>
                                            <td>{creatorName}</td>
                                            <td>
                                                <div className="announcement-actions">
                                                    <button
                                                        className="action-btn edit"
                                                        onClick={() => handleEdit(ann)}
                                                        title="編輯公告"
                                                    >
                                                        <Icon name="create" size={14} />
                                                        編輯
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(ann.id)}
                                                        title="刪除公告"
                                                    >
                                                        <Icon name="trash" size={14} />
                                                        刪除
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="table-footer">
                            <span className="table-stats">共 {filteredAnnouncements.length} 筆紀錄</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 新增/編輯公告 Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={isEditing ? '編輯公告' : '新增公告'}
                size="lg"
                closeOnOverlayClick={false}
            >
                <div className="announcement-form">
                    {/* 類型切換 */}
                    <div className="announcement-form-group">
                        <label className="announcement-form-label">公告類型</label>
                        <div className="announcement-type-toggle">
                            <button
                                type="button"
                                className={`announcement-type-btn ${formData.announcement_type === 'normal' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, announcement_type: 'normal' })}
                            >
                                一般
                            </button>
                            <button
                                type="button"
                                className={`announcement-type-btn ${formData.announcement_type === 'routine' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, announcement_type: 'routine' })}
                            >
                                例行
                            </button>
                        </div>
                    </div>

                    {/* 內容 */}
                    <div className="announcement-form-group">
                        <label className="announcement-form-label required">內容</label>
                        <textarea
                            className="announcement-form-textarea"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="請輸入公告內容..."
                        />
                    </div>

                    {/* 日期範圍 */}
                    <div className="announcement-form-group">
                        <label className="announcement-form-label required">公告日期</label>
                        <div className="announcement-date-inputs">
                            <input
                                type="date"
                                className="announcement-form-input"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                            <span className="announcement-date-separator">—</span>
                            <input
                                type="date"
                                className="announcement-form-input"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* 建立人 (下拉單選) */}
                    <div className="announcement-form-group" ref={dropdownRef}>
                        <label className="announcement-form-label">建立人</label>
                        <div
                            className={`announcement-user-select ${!formData.created_by ? 'placeholder' : ''}`}
                            onClick={() => setShowUserDropdown(!showUserDropdown)}
                            style={{ position: 'relative', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <span>{formData.created_by || '請選擇建立人'}</span>
                            <Icon name={showUserDropdown ? "chevron-up" : "chevron-down"} size={16} />

                            {/* 下拉選單 - 改為向上展開避免被遮擋 */}
                            {showUserDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%', // 向上展開
                                    left: 0,
                                    right: 0,
                                    marginBottom: '4px', // 調整 margin 方向
                                    backgroundColor: 'white',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: '0 -4px 12px rgba(0,0,0,0.15)', // 調整陰影方向
                                    zIndex: 100,
                                    maxHeight: '200px', // 稍微縮小高度以防頂部溢出
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
                                                onClick={() => handleUserSelect(user.full_name)}
                                                style={{
                                                    padding: '10px 16px',
                                                    cursor: 'pointer',
                                                    backgroundColor: formData.created_by === user.full_name ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                                    transition: 'background-color 0.2s',
                                                    color: formData.created_by === user.full_name ? 'var(--color-primary)' : 'var(--color-text)',
                                                    fontWeight: formData.created_by === user.full_name ? 600 : 400
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = formData.created_by === user.full_name ? 'rgba(46, 125, 50, 0.12)' : '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.created_by === user.full_name ? 'rgba(46, 125, 50, 0.08)' : 'transparent'}
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

                    {/* 表單按鈕 */}
                    <div className="announcement-form-actions">
                        <Button variant="secondary" fullWidth onClick={() => setShowModal(false)}>
                            取消
                        </Button>
                        <Button fullWidth onClick={handleSubmit}>
                            {isEditing ? '更新' : '建立'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default AnnouncementsPage;
