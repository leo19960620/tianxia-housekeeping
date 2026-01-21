import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementAPI } from '../api/announcement';
import { handoverAPI } from '../api/handover';
import { handoverItemAPI } from '../api/handoverItem';
import { bicycleRentalAPI, umbrellaRentalAPI } from '../api/rental';
import { getTodayMidnight } from '../utils/timezone';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import './HomePage.css';

function HomePage() {
    const navigate = useNavigate();
    const [generalAnnouncements, setGeneralAnnouncements] = useState([]);
    const [routineAnnouncements, setRoutineAnnouncements] = useState([]);
    const [todayHandovers, setTodayHandovers] = useState([]);
    const [handoverItems, setHandoverItems] = useState([]);
    const [activeBicycles, setActiveBicycles] = useState([]);
    const [activeUmbrellas, setActiveUmbrellas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [expandedShiftId, setExpandedShiftId] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // 使用本地時區的日期，而非 UTC 日期
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayDate = `${year}-${month}-${day}`;

            // 用於前端日期比較的今日 00:00
            const todayMidnight = getTodayMidnight(); // 使用時區工具

            // 並行執行所有 API 請求以提升載入速度
            const [announcementsRes, handoversRes, itemsRes, bicyclesRes, umbrellasRes] = await Promise.all([
                announcementAPI.getAll(),
                handoverAPI.getAll({ date: todayDate }),
                handoverItemAPI.getAll(),
                bicycleRentalAPI.getActive(),
                umbrellaRentalAPI.getActive(),
            ]);

            // 處理公告資料
            if (announcementsRes.success) {
                const activeAnnouncements = announcementsRes.data.filter((ann) => {
                    const start = new Date(ann.start_date);
                    const end = new Date(ann.end_date);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    // 無論是一般還是例行，都必須在有效日期內
                    return start <= todayMidnight && todayMidnight <= end;
                });

                const general = [];
                const routine = [];

                activeAnnouncements.forEach(ann => {
                    if (ann.announcement_type === 'routine') {
                        routine.push(ann);
                    } else {
                        general.push(ann);
                    }
                });

                // 所有公告都按開始日期降序（最新在上）
                general.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
                routine.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

                setGeneralAnnouncements(general);
                setRoutineAnnouncements(routine);
            }

            // 處理交接紀錄資料
            if (handoversRes.success) {
                const handoversWithDetails = handoversRes.data.map(detail => {
                    let receiveCount = detail.receive_count || 0;
                    let returnCount = detail.return_count || 0;

                    // 如果後端沒傳統計值但傳了陣列，前端補算 (防禦性程式設計)
                    if ((!receiveCount && !returnCount) && detail.inventory_records) {
                        detail.inventory_records.forEach((inv) => {
                            if (inv.status === '收') {
                                receiveCount += inv.quantity || 0;
                            } else if (inv.status === '放') {
                                returnCount += inv.quantity || 0;
                            }
                        });
                    }

                    return {
                        ...detail,
                        receive_count: receiveCount,
                        return_count: returnCount,
                        ozone_count: detail.ozone_records?.length || 0,
                        item_count: detail.handover_items?.length || 0,
                        inventory_records: detail.inventory_records || [],
                        ozone_records: detail.ozone_records || [],
                    };
                });

                setTodayHandovers(handoversWithDetails);
            }

            // 處理交接事項資料
            if (itemsRes.success) {
                const todayItems = itemsRes.data.filter(item => {
                    const itemDate = new Date(item.created_at);
                    itemDate.setHours(0, 0, 0, 0);
                    return itemDate.getTime() === todayMidnight.getTime();
                });

                setHandoverItems(todayItems);
            }

            // 處理租借中的腳踏車資料
            if (bicyclesRes.success) {
                setActiveBicycles(bicyclesRes.data);
            }

            // 處理租借中的雨傘資料
            if (umbrellasRes.success) {
                setActiveUmbrellas(umbrellasRes.data);
            }
        } catch (error) {
            console.error('載入資料錯誤:', error);
        } finally {
            setLoading(false);
        }
    };

    const getShiftLabel = (shift) => {
        if (shift === '早班') return '早班';
        if (shift === '中班') return '中班';
        if (shift === '晚班') return '晚班';
        return shift;
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        // 資料庫已存台北時間（UTC+8），直接使用
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const formatDateRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleDateString()} ~${endDate.toLocaleDateString()} `;
    };

    if (loading) {
        return (
            <div className="home-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>載入中...</p>
                </div>
            </div>
        );
    }



    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="home-page">
            {/* 租借提示橫幅 */}
            {(activeBicycles.length > 0 || activeUmbrellas.length > 0) && (
                <div
                    className="rental-alert-banner"
                    onClick={() => navigate('/rental-management')}
                >
                    <div className="rental-alert-content">
                        {activeBicycles.length > 0 && (
                            <div className="rental-alert-item">
                                <Icon name="bicycle" size={18} />
                                <span className="rental-alert-text">
                                    {activeBicycles.length} 台租借中
                                </span>
                            </div>
                        )}
                        {activeBicycles.length > 0 && activeUmbrellas.length > 0 && (
                            <span className="rental-alert-divider">|</span>
                        )}
                        {activeUmbrellas.length > 0 && (
                            <div className="rental-alert-item">
                                <Icon name="umbrella" size={18} />
                                <span className="rental-alert-text">
                                    {activeUmbrellas.reduce((sum, u) => sum + (u.quantity || 1), 0)} 把租借中
                                </span>
                            </div>
                        )}
                        <Icon name="chevron-forward" size={16} className="rental-alert-arrow" />
                    </div>
                </div>
            )}

            {/* 今日公告 - 最頂部，無外框 */}
            <div className="announcements-top">
                <div className="announcements-top-header">
                    <Icon name="megaphone" size={18} />
                    <h2 className="announcements-top-title">今日公告</h2>
                </div>

                {generalAnnouncements.length === 0 ? (
                    <div className="empty-announcements">目前無一般公告</div>
                ) : (
                    <div className="announcements-carousel-wrapper">
                        <button
                            className="carousel-nav-btn left"
                            onClick={() => scroll('left')}
                            aria-label="往左捲動"
                        >
                            <Icon name="chevron-back" size={24} />
                        </button>

                        <div className="announcements-horizontal" ref={scrollRef}>
                            {generalAnnouncements.map((item) => (
                                <div
                                    key={item.id}
                                    className="announcement-card-dark"
                                    onClick={() => {
                                        setSelectedAnnouncement(item);
                                        setShowAnnouncementModal(true);
                                    }}
                                >
                                    <div className="announcement-dark-date">
                                        <Icon name="calendar-outline" size={12} />
                                        {formatDateRange(item.start_date, item.end_date)}
                                    </div>
                                    <div className="announcement-dark-content">{item.content}</div>
                                    {item.announcer && (
                                        <div className="announcement-dark-author">
                                            <Icon name="person-outline" size={12} />
                                            {item.announcer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            className="carousel-nav-btn right"
                            onClick={() => scroll('right')}
                            aria-label="往右捲動"
                        >
                            <Icon name="chevron-forward" size={24} />
                        </button>
                    </div>
                )}
            </div>

            {/* 今日例行 - compact style below general announcements */}
            <div className="routine-section">
                <div className="routine-section-header">
                    <Icon name="repeat" size={18} />
                    <h2 className="routine-section-title">今日例行</h2>
                </div>

                {routineAnnouncements.length === 0 ? (
                    <div className="empty-announcements">目前無例行公告</div>
                ) : (
                    <div className="routine-list">
                        {routineAnnouncements.map((item) => (
                            <div
                                key={item.id}
                                className="routine-card"
                                onClick={() => {
                                    setSelectedAnnouncement(item);
                                    setShowAnnouncementModal(true);
                                }}
                            >
                                <div className="routine-content">{item.content}</div>
                                {item.announcer && (
                                    <div className="routine-meta">
                                        <Icon name="person-outline" size={12} />
                                        {item.announcer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="home-content">
                {/* 佈局使用 2 欄 - 各佔 50% */}
                <div className="dashboard-layout-equal">
                    {/* 左側 - 交接事項 */}
                    <div className="dashboard-column">
                        <div className="section-header-simple">
                            <Icon name="list" size={20} />
                            <h2 className="section-title-simple">交接事項</h2>
                        </div>

                        {handoverItems.length === 0 ? (
                            <div className="empty-state-simple">今日無交接事項</div>
                        ) : (
                            <div className="handover-items-list">
                                {handoverItems.map((item) => (
                                    <div
                                        key={item.key_id || item.id}
                                        className="handover-item-card"
                                        onClick={() => navigate('/handover-items')}
                                    >
                                        <div className="handover-item-title-row">
                                            <span className="handover-item-name">{item.item_content || item.content}</span>
                                        </div>
                                        <div className="handover-item-meta-row">
                                            <span className="handover-item-time">
                                                <Icon name="time-outline" size={14} />
                                                {formatTime(item.created_at)}
                                            </span>
                                        </div>
                                        {item.staff_name && (
                                            <div className="handover-item-user-row">
                                                <Icon name="person-outline" size={14} />
                                                <span className="handover-item-user-name">{item.staff_name}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 右側 - 今日當班 */}
                    <div className="dashboard-column">
                        <div className="section-header-simple">
                            <Icon name="people" size={20} />
                            <h2 className="section-title-simple">今日當班</h2>
                        </div>

                        {todayHandovers.length === 0 ? (
                            <div className="empty-state-simple">尚無當班紀錄</div>
                        ) : (
                            <div className="today-shifts-list">
                                {todayHandovers.map((item) => (
                                    <div key={item.id} className="shift-card-wrapper">
                                        <div className="shift-card-simple">
                                            {/* 卡片主體 - 點擊展開 */}
                                            <div
                                                className="shift-card-main"
                                                onClick={() => setExpandedShiftId(expandedShiftId === item.id ? null : item.id)}
                                            >
                                                <div className="shift-header-simple">
                                                    <Icon name="sunny" size={20} />
                                                    <div className="shift-info-simple">
                                                        <div className="shift-name-simple">{getShiftLabel(item.shift)}</div>
                                                        <div className="shift-time-simple">
                                                            <Icon name="time-outline" size={14} /> {formatTime(item.created_at)} · {item.staff_name}
                                                        </div>
                                                    </div>
                                                    {/* 編輯按鈕 */}
                                                    <button
                                                        className="shift-edit-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/ handover / ${item.id}?edit = true`);
                                                        }}
                                                        title="編輯交接紀錄"
                                                    >
                                                        <Icon name="create-outline" size={18} />
                                                    </button>
                                                </div>
                                                <div className="shift-stats-simple">
                                                    <div className="shift-stat-item">
                                                        <Icon name="arrow-down-circle" size={32} color="var(--color-success)" />
                                                        <div className="shift-stat-text">
                                                            <span className="shift-stat-name">收備品</span>
                                                            <span className="shift-stat-number">{item.receive_count || 0}</span>
                                                        </div>
                                                    </div>
                                                    <div className="shift-stat-item">
                                                        <Icon name="arrow-up-circle" size={32} color="var(--color-warning)" />
                                                        <div className="shift-stat-text">
                                                            <span className="shift-stat-name">放備品</span>
                                                            <span className="shift-stat-number">{item.return_count || 0}</span>
                                                        </div>
                                                    </div>
                                                    <div className="shift-stat-item">
                                                        <Icon name="water" size={32} color="var(--color-info)" />
                                                        <div className="shift-stat-text">
                                                            <span className="shift-stat-name">臭氧記錄</span>
                                                            <span className="shift-stat-number">{item.ozone_count || 0}</span>
                                                        </div>
                                                    </div>
                                                    <div className="shift-stat-item">
                                                        <Icon name="document-text" size={32} color="var(--color-primary)" />
                                                        <div className="shift-stat-text">
                                                            <span className="shift-stat-name">交接事項</span>
                                                            <span className="shift-stat-number">{item.item_count || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* 展開提示 */}
                                                <div className="shift-expand-hint">
                                                    <Icon
                                                        name={expandedShiftId === item.id ? "chevron-up" : "chevron-down"}
                                                        size={16}
                                                    />
                                                    <span>{expandedShiftId === item.id ? "點擊收合" : "點擊查看詳情"}</span>
                                                </div>
                                            </div>

                                            {/* 展開的詳細記錄 */}
                                            {expandedShiftId === item.id && (
                                                <div className="shift-details-expanded">
                                                    {/* 收放備品記錄 */}
                                                    <div className="detail-section-mini">
                                                        <div className="detail-section-header-mini">
                                                            <Icon name="archive-outline" size={16} />
                                                            <h3>收放備品記錄</h3>
                                                        </div>
                                                        {(!item.inventory_records || item.inventory_records.length === 0) ? (
                                                            <div className="empty-detail">尚無備品記錄</div>
                                                        ) : (
                                                            <div className="detail-records-list">
                                                                {item.inventory_records.map((record, idx) => (
                                                                    <div key={record.id || idx} className="detail-record-item">
                                                                        <span className={`inventory - status - badge ${record.status === '收' ? 'receive' : 'return'} `}>
                                                                            {record.status}
                                                                        </span>
                                                                        <span className="detail-record-text">
                                                                            房號 {record.room_number} - {record.item_type} × {record.quantity}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 臭氧記錄 */}
                                                    <div className="detail-section-mini">
                                                        <div className="detail-section-header-mini">
                                                            <Icon name="water-outline" size={16} />
                                                            <h3>臭氧記錄</h3>
                                                        </div>
                                                        {(!item.ozone_records || item.ozone_records.length === 0) ? (
                                                            <div className="empty-detail">尚無臭氧記錄</div>
                                                        ) : (
                                                            <div className="detail-records-list">
                                                                {item.ozone_records.map((record, idx) => (
                                                                    <div key={record.id || idx} className="detail-record-item">
                                                                        <span className="ozone-floor-badge">{record.floor}</span>
                                                                        <span className="detail-record-text">
                                                                            {[...(record.room_numbers || [])].sort((a, b) => a.localeCompare(b)).join('、') || '無房號'}
                                                                            {record.start_time && (
                                                                                <span className="ozone-time-text">
                                                                                    {' · '}
                                                                                    {new Date(record.start_time).toLocaleTimeString('zh-TW', {
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit',
                                                                                    })}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 公告詳情 Modal */}
            <Modal
                isOpen={showAnnouncementModal}
                onClose={() => setShowAnnouncementModal(false)}
                title="公告詳情"
                size="md"
            >
                {selectedAnnouncement && (
                    <div>
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                公告內容
                            </div>
                            <div style={{ fontSize: 'var(--font-size-base)', lineHeight: '1.6' }}>
                                {selectedAnnouncement.content}
                            </div>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                有效日期
                            </div>
                            <div style={{ fontSize: 'var(--font-size-base)' }}>
                                {new Date(selectedAnnouncement.start_date).toLocaleDateString()} -{' '}
                                {new Date(selectedAnnouncement.end_date).toLocaleDateString()}
                            </div>
                        </div>

                        {selectedAnnouncement.announcer && (
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                    建立人
                                </div>
                                <div style={{ fontSize: 'var(--font-size-base)' }}>
                                    {selectedAnnouncement.announcer}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default HomePage;
