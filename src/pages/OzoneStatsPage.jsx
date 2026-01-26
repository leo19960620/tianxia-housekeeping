import { useState, useEffect } from 'react';
import { ozoneAPI } from '../api/ozone';
import { FLOORS } from '../utils/constants';
import Icon from '../components/common/Icon';
import DashboardSkeleton from '../components/common/DashboardSkeleton';
import './OzoneStatsPage.css';

function OzoneStatsPage() {
    // 頁籤狀態: daily (含儀表板), monthly, priority
    const [activeTab, setActiveTab] = useState('daily');
    const [loading, setLoading] = useState(false);

    // ================== 日查詢 & 儀表板狀態 ==================
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarViewDate, setCalendarViewDate] = useState(new Date());
    const [dailyRecords, setDailyRecords] = useState([]);



    // ================== 月統計狀態 ==================
    const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
    const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
    const [monthlyStats, setMonthlyStats] = useState(null);

    const [monthlyPriority, setMonthlyPriority] = useState([]);

    // 初始載入與 Tab 切換監聽
    useEffect(() => {
        if (activeTab === 'daily') {
            loadDailyRecords(selectedDate);
        } else if (activeTab === 'monthly') {
            loadMonthlyStats();
        }
    }, [activeTab]);

    // 日期變更監聽
    useEffect(() => {
        if (activeTab === 'daily') {
            loadDailyRecords(selectedDate);
        }
    }, [selectedDate]);

    useEffect(() => {
        if (activeTab === 'monthly') {
            loadMonthlyStats();
        }
    }, [monthlyYear, monthlyMonth]);




    // ================== API 邏輯 ==================

    const loadDailyRecords = async (date) => {
        setLoading(true);
        try {
            // 使用本地時區的日期字串
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const res = await ozoneAPI.getStats({ date: dateStr });
            if (res.success) {
                setDailyRecords(res.data || []);
            }
        } catch (error) {
            console.error('載入日查詢失敗:', error);
        } finally {
            setLoading(false);
        }
    };



    const loadMonthlyStats = async () => {
        setLoading(true);
        try {
            const [statsRes, priorityRes] = await Promise.all([
                ozoneAPI.getStats({ year: monthlyYear, month: monthlyMonth }),
                ozoneAPI.getStats({ year: monthlyYear, month: monthlyMonth, type: 'priority' })
            ]);

            if (statsRes.success) {
                setMonthlyStats(statsRes.data);
            }
            if (priorityRes.success) {
                setMonthlyPriority(priorityRes.data || []);
            }
        } catch (error) {
            console.error('載入月統計失敗:', error);
        } finally {
            setLoading(false);
        }
    };



    // ================== Action Handlers ==================



    // ================== Calendar Helpers ==================
    const getDaysInMonth = (year, month) => {
        const date = new Date(year, month, 1);
        const days = [];
        const firstDay = date.getDay();
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const days = getDaysInMonth(calendarViewDate.getFullYear(), calendarViewDate.getMonth());
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const isSameDate = (d1, d2) => d1 && d2 && d1.toDateString() === d2.toDateString();





    // ================== Render ==================
    return (
        <div className="ozone-stats-page">
            {/* 頁籤切換 */}
            <div className="ozone-tabs">
                <button
                    className={`ozone-tab ${activeTab === 'daily' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    <Icon name="calendar-outline" size={18} />
                    日查詢
                </button>
                <button
                    className={`ozone-tab ${activeTab === 'monthly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monthly')}
                >
                    <Icon name="stats-chart-outline" size={18} />
                    月統計
                </button>


            </div>

            {/* 日查詢 (分割儀表板) */}
            {activeTab === 'daily' && (
                <div className="ozone-dashboard-container">
                    {/* 左側：查詢面板 - Now full width since right panel is removed */}
                    <div className="dashboard-left-panel">
                        <div className="panel-title">
                            查詢 - {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()}
                        </div>

                        <div className="custom-calendar">
                            <div className="calendar-header">
                                <button className="calendar-nav-btn" onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}>&lt;</button>
                                <span>{monthNames[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}</span>
                                <button className="calendar-nav-btn" onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}>&gt;</button>
                            </div>
                            <div className="calendar-grid">
                                {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
                                {days.map((day, idx) => (
                                    <div
                                        key={idx}
                                        className={`calendar-day ${!day ? 'empty' : ''} ${isSameDate(day, selectedDate) ? 'selected' : ''} ${isSameDate(day, new Date()) ? 'today' : ''}`}
                                        onClick={() => day && setSelectedDate(day)}
                                    >
                                        {day ? day.getDate() : ''}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="daily-records-list" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                            <table className="ozone-table">
                                <thead>
                                    <tr>
                                        <th>樓層</th>
                                        <th>房號</th>
                                        <th>開始時間</th>
                                        <th>結束時間</th>
                                        <th>持續時間</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', color: '#999', padding: '20px' }}>無紀錄</td>
                                        </tr>
                                    ) : (
                                        dailyRecords.map((record, idx) => {
                                            const start = new Date(record.start_time);
                                            const end = new Date(start.getTime() + record.duration_minutes * 60000);
                                            return (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: 'bold' }}>{record.floor}</td>
                                                    <td>{record.room_numbers?.join('、')}</td>
                                                    <td>{start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td>{end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td>{record.duration_minutes} 分</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* 月統計儀表板 */}
            {activeTab === 'monthly' && (
                <div className="monthly-dashboard">

                    {/* 篩選列 */}
                    {/* 篩選列 - 僅選取月份 */}
                    <div className="filter-section" style={{ justifyContent: 'center', background: 'transparent', boxShadow: 'none', padding: '0 0 var(--spacing-md) 0' }}>
                        <div className="month-navigator" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'white', padding: '8px 24px', borderRadius: '50px', boxShadow: 'var(--shadow-sm)' }}>
                            <button
                                onClick={() => {
                                    let newMonth = monthlyMonth - 1;
                                    let newYear = monthlyYear;
                                    if (newMonth < 1) { newMonth = 12; newYear -= 1; }
                                    setMonthlyMonth(newMonth);
                                    setMonthlyYear(newYear);
                                }}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666' }}
                            >
                                <Icon name="chevron-back-outline" size={20} />
                            </button>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333' }}>
                                {monthlyYear}年 {monthlyMonth}月
                            </span>
                            <button
                                onClick={() => {
                                    let newMonth = monthlyMonth + 1;
                                    let newYear = monthlyYear;
                                    if (newMonth > 12) { newMonth = 1; newYear += 1; }
                                    setMonthlyMonth(newMonth);
                                    setMonthlyYear(newYear);
                                }}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#666' }}
                            >
                                <Icon name="chevron-forward-outline" size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Loading State Logic: Show Skeleton only if no data AND loading. If data exists, show data with opacity. */}
                    {loading && !monthlyStats ? (
                        <div className="loading-container">
                            <DashboardSkeleton />
                        </div>
                    ) : !monthlyStats && !loading ? (
                        <div className="empty-state">無統計資料</div>
                    ) : (
                        <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                            {monthlyStats ? (
                                <>
                                    {/* 上方：統計圖表與優先順序 */}
                                    {/* 上方：統計圖表與優先順序 */}
                                    <div className="stats-overview-section">
                                        {/* 左：統計圖表 */}
                                        <div className="overview-card">
                                            <h3 className="card-title">
                                                <Icon name="pie-chart-outline" size={20} />
                                                樓層分佈
                                            </h3>
                                            <div className="chart-content" style={{ padding: '0' }}>
                                                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {monthlyStats.floorStats
                                                        .sort((a, b) => a.totalCount - b.totalCount) // 低到高排序
                                                        .map((f, i) => {
                                                            const totalTreatments = monthlyStats.floorStats.reduce((sum, item) => sum + item.totalCount, 0);
                                                            const percentage = totalTreatments > 0 ? (f.totalCount / totalTreatments) * 100 : 0;
                                                            // 統一色系，使用 Teal/Blue 類顏色
                                                            const barColor = '#26a69a';

                                                            return (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                    <div style={{ width: '40px', fontWeight: 'bold', color: '#444' }}>{f.floor}</div>
                                                                    <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', height: '10px' }}>
                                                                        <div style={{ width: `${percentage}%`, background: barColor, height: '100%', borderRadius: '4px' }}></div>
                                                                    </div>
                                                                    <div style={{ width: '80px', textAlign: 'right', fontSize: '13px', color: '#666' }}>
                                                                        {f.totalCount} 次 <span style={{ color: '#999', fontSize: '12px' }}>({percentage.toFixed(0)}%)</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 右：優先順序摘要 */}
                                        <div className="overview-card">
                                            <h3 className="card-title">
                                                <Icon name="flag-outline" size={20} />
                                                前 5 名優先順序
                                            </h3>
                                            <div className="priority-widget">
                                                {monthlyPriority.length === 0 ? (
                                                    <div className="empty-state" style={{ padding: '20px' }}>無優先順序資料</div>
                                                ) : (
                                                    monthlyPriority.slice(0, 5).map((item, idx) => (
                                                        <div key={idx} className="priority-item-row" style={{
                                                            background: 'white',
                                                            border: '1px solid #eee',
                                                            borderLeft: item.priority === 'high' ? '4px solid #ef5350' : '4px solid #ffa726',
                                                            borderRadius: '8px',
                                                            padding: '12px'
                                                        }}>
                                                            <div className="priority-info-group" style={{ width: '100%' }}>
                                                                <div className="priority-floor-badge" style={{ background: '#f5f5f5', color: '#333' }}>{item.floor}</div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: 600, color: '#333' }}>使用次數: {item.usageCount}</div>
                                                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                                                        {item.priority === 'high' ? '高優先' : item.priority === 'medium' ? '中優先' : '低優先'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 下方：詳細樓層卡片 */}
                                    <div className="floor-details-section">
                                        <h3 className="section-subtitle">
                                            <Icon name="list-outline" size={18} />
                                            樓層詳細數據
                                        </h3>
                                        <div className="floors-grid">
                                            {monthlyStats.floorStats.map((floor, idx) => {
                                                // 檢查該樓層是否有高優先順序
                                                const floorPriority = monthlyPriority.find(p => p.floor === floor.floor);
                                                const isHighPriority = floorPriority?.priority === 'high';

                                                return (
                                                    <div key={idx} className="modern-floor-card" style={isHighPriority ? { border: '1px solid #ef5350' } : { border: '1px solid #eee' }}>
                                                        <div className="floor-card-header" style={{ padding: '12px 16px', background: isHighPriority ? '#fff5f5' : '#fafafa' }}>
                                                            <div className="floor-identity">
                                                                <div className="floor-icon-wrapper" style={{ width: '30px', height: '30px', background: 'transparent', color: '#555', padding: 0 }}>
                                                                    <Icon name="business-outline" size={18} />
                                                                </div>
                                                                <div className="floor-name" style={{ fontSize: '1.1rem' }}>{floor.floor}</div>
                                                                {isHighPriority && (
                                                                    <span style={{ fontSize: '12px', color: '#ef5350', background: 'white', border: '1px solid #ef5350', padding: '1px 6px', borderRadius: '4px' }}>
                                                                        高優先
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="floor-stats-badge" style={{ background: 'transparent', color: '#666', border: '1px solid #ddd', padding: '2px 8px', fontSize: '12px' }}>
                                                                {floor.totalCount} 次
                                                            </div>
                                                        </div>
                                                        <div className="floor-card-body" style={{ padding: '12px' }}>
                                                            <div className="room-chips-container">
                                                                {floor.rooms?.map((room, ridx) => (
                                                                    <div key={ridx} className="room-chip" style={{
                                                                        fontSize: '13px',
                                                                        padding: '4px 10px',
                                                                        background: isHighPriority && parseInt(room.count) > 0 ? '#fff' : '#fff',
                                                                        border: isHighPriority && parseInt(room.count) > 0 ? '1px solid #ffcdd2' : '1px solid #ddd',
                                                                        color: '#444'
                                                                    }}>
                                                                        <span>{room.roomNumber}</span>
                                                                        <span className="count" style={{ background: '#f5f5f5', color: '#333' }}>{room.count}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            )}


        </div>
    );
}

export default OzoneStatsPage;
