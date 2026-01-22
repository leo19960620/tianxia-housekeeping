import { useState, useEffect } from 'react';
import { announcementAPI } from '../api/announcement';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import UserPicker from '../components/business/UserPicker';
import { getTodayMidnight } from '../utils/timezone';
import '../styles/ModernTable.css';
import './AnnouncementsPage.css';

function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'expired', or 'recurring'
    const [searchKeyword, setSearchKeyword] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        start_date: '',
        end_date: '',
        announcer: '',
        announcement_type: 'normal',
    });
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadAnnouncements();
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
                ann.announcer?.toLowerCase().includes(searchKeyword.toLowerCase())
            );
        }

        // 移除狀態篩選（已透過頁籤處理）
        // 移除作者篩選

        // 日期範圍篩選
        if (dateRange.startDate || dateRange.endDate) {
            filtered = filtered.filter(ann => {
                const annStart = new Date(ann.start_date);
                const annEnd = new Date(ann.end_date);

                if (dateRange.startDate && dateRange.endDate) {
                    const filterStart = new Date(dateRange.startDate);
                    const filterEnd = new Date(dateRange.endDate);
                    return (annStart >= filterStart && annStart <= filterEnd) ||
                        (annEnd >= filterStart && annEnd <= filterEnd) ||
                        (annStart <= filterStart && annEnd >= filterEnd);
                } else if (dateRange.startDate) {
                    const filterStart = new Date(dateRange.startDate);
                    return annEnd >= filterStart;
                } else if (dateRange.endDate) {
                    const filterEnd = new Date(dateRange.endDate);
                    return annStart <= filterEnd;
                }
                return true;
            });
        }

        // 排序邏輯 - 所有公告都按開始日期降序（最新在上）
        filtered.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date) : new Date(0);
            const dateB = b.start_date ? new Date(b.start_date) : new Date(0);
            return dateB - dateA;
        });

        return filtered;
    };

    // 移除作者列表函數（不再需要）

    const handleOpenModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({
            title: '',
            content: '',
            start_date: '',
            end_date: '',
            announcer: '',
            announcement_type: activeTab === 'recurring' ? 'routine' : 'normal',
        });
        setSelectedUser(null);
        setShowModal(true);
    };

    const handleEdit = (announcement) => {
        setIsEditing(true);
        setEditingId(announcement.id);
        setFormData({
            title: extractTitle(announcement.content),
            content: announcement.content,
            start_date: announcement.start_date,
            end_date: announcement.end_date,
            announcer: announcement.announcer || '',
            announcement_type: announcement.announcement_type,
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.content || !formData.start_date || !formData.end_date) {
            alert('請填寫公告內容、開始日期和結束日期');
            return;
        }

        try {
            const submitData = {
                content: formData.content,
                startDate: formData.start_date,  // 後端期望駝峰式
                endDate: formData.end_date,      // 後端期望駝峰式
                announcer: formData.announcer,
                announcementType: formData.announcement_type,  // 後端期望駝峰式
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

                        <input
                            type="date"
                            className="announcements-filter-select"
                            placeholder="Date Range"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                        <input
                            type="date"
                            className="announcements-filter-select"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
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
                                            <td>{ann.announcer || '-'}</td>
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

                    {/* 移除標題欄位，僅保留內容欄位 */}

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

                    {/* 建立人 */}
                    <div className="announcement-form-group">
                        <label className="announcement-form-label">建立人</label>
                        <div
                            className={`announcement-user-select ${!formData.announcer ? 'placeholder' : ''}`}
                            onClick={() => setShowUserPicker(true)}
                        >
                            {formData.announcer || '請選擇建立人'}
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

            {/* 使用者選擇器 */}
            <UserPicker
                visible={showUserPicker}
                selectedUser={selectedUser}
                onSelect={(user) => {
                    setSelectedUser(user);
                    setFormData({ ...formData, announcer: user.full_name });
                }}
                onClose={() => setShowUserPicker(false)}
            />
        </div>
    );
}

export default AnnouncementsPage;
