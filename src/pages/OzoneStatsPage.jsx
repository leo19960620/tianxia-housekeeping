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

    // 預約管理 (整合在日查詢頁籤的右側)
    const [reservations, setReservations] = useState([]);
    const [formError, setFormError] = useState('');
    const [reservationForm, setReservationForm] = useState({
        floor: '',
        roomNumbers: [],
        requestedDate: (() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })(),
        startTime: new Date().toTimeString().slice(0, 5), // 初始化為當前時間 HH:mm
        duration: 30,
        notes: '',
    });

    // ================== 月統計狀態 ==================
    const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
    const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
    const [monthlyStats, setMonthlyStats] = useState(null);

    // ================== 優先順序狀態 ==================
    const [priorityYear, setPriorityYear] = useState(new Date().getFullYear());
    const [priorityMonth, setPriorityMonth] = useState(new Date().getMonth() + 1);
    const [priorityData, setPriorityData] = useState([]);

    // 初始載入與 Tab 切換監聽
    useEffect(() => {
        if (activeTab === 'daily') {
            loadDailyRecords(selectedDate);
            loadReservations();
            // 切換回日查詢時，重置時間為當前
            setReservationForm(prev => ({
                ...prev,
                startTime: new Date().toTimeString().slice(0, 5)
            }));
        } else if (activeTab === 'monthly') {
            loadMonthlyStats();
        } else if (activeTab === 'priority') {
            loadPriority();
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

    useEffect(() => {
        if (activeTab === 'priority') {
            loadPriority();
        }
    }, [priorityYear, priorityMonth]);


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

    const loadReservations = async () => {
        try {
            const res = await ozoneAPI.getReservations();
            if (res.success) {
                // 載入所有預約，不進行過濾，以便在「預約管理」顯示完整紀錄
                // 前端顯示時再根據需求進行過濾（例如日查詢只顯示今日）
                const all = res.data || [];
                const sorted = all.sort((a, b) => new Date(a.requested_date) - new Date(b.requested_date));
                setReservations(sorted);
            }
        } catch (error) {
            console.error('載入預約失敗:', error);
        }
    };

    const loadMonthlyStats = async () => {
        setLoading(true);
        try {
            const res = await ozoneAPI.getStats({ year: monthlyYear, month: monthlyMonth });
            if (res.success) {
                setMonthlyStats(res.data);
            }
        } catch (error) {
            console.error('載入月統計失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPriority = async () => {
        setLoading(true);
        try {
            const res = await ozoneAPI.getStats({ year: priorityYear, month: priorityMonth, type: 'priority' });
            if (res.success) {
                setPriorityData(res.data || []);
            }
        } catch (error) {
            console.error('載入優先順序失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    // ================== Action Handlers ==================

    const handleCreateReservation = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!reservationForm.floor || reservationForm.roomNumbers.length === 0) {
            setFormError('請選擇樓層和房號');
            return;
        }

        try {
            const targetDateTime = new Date(`${reservationForm.requestedDate}T${reservationForm.startTime}`);

            // 根據 Native App (OzoneStatisticsScreen.js) 的實作調整 Payload
            // 必須使用 camelCase 且日期僅為 YYYY-MM-DD 字串
            // 使用本地時區的日期字串
            const year = targetDateTime.getFullYear();
            const month = String(targetDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(targetDateTime.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const payload = {
                floor: reservationForm.floor,
                roomNumbers: reservationForm.roomNumbers,
                requestedDate: dateStr,
                notes: reservationForm.notes || ''
            };

            const res = await ozoneAPI.createReservation(payload);
            if (res.success) {
                alert('預約建立成功');
                loadReservations();
                setReservationForm(prev => ({
                    ...prev,
                    roomNumbers: [],
                    notes: '',
                    startTime: new Date().toTimeString().slice(0, 5) // Reset time to now
                }));
            }
        } catch (error) {
            console.error('Full Reservation Error:', error);
            if (error.response) {
                console.error('Error Response Data:', error.response.data);
                console.error('Error Status:', error.response.status);
            }
            setFormError(error.message || '建立失敗');
        }
    };

    const handleCompleteReservation = async (id) => {
        if (!confirm('確認將此預約標記為完成？')) return;
        try {
            const res = await ozoneAPI.updateReservation(id, { status: 'completed' });
            if (res.success) {
                loadReservations();
            }
        } catch (error) {
            alert('操作失敗');
        }
    };

    const handleDeleteReservation = async (id) => {
        if (!confirm('確認刪除此預約？此操作無法復原。')) return;
        try {
            const res = await ozoneAPI.deleteReservation(id);
            if (res.success) {
                loadReservations();
            }
        } catch (error) {
            console.error('刪除失敗:', error);
            alert('刪除失敗');
        }
    };

    // 房號多選處理
    const handleRoomToggle = (room) => {
        setReservationForm(prev => {
            const currentRooms = prev.roomNumbers;
            if (currentRooms.includes(room)) {
                return { ...prev, roomNumbers: currentRooms.filter(r => r !== room) };
            } else {
                return { ...prev, roomNumbers: [...currentRooms, room] };
            }
        });
    };

    const handleFloorChange = (e) => {
        setReservationForm({
            ...reservationForm,
            floor: e.target.value,
            roomNumbers: []
        });
    };

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

    const availableRooms = FLOORS.find(f => f.label === reservationForm.floor)?.rooms || [];

    if (loading) {
        return <DashboardSkeleton />;
    }

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
                <button
                    className={`ozone-tab ${activeTab === 'priority' ? 'active' : ''}`}
                    onClick={() => setActiveTab('priority')}
                >
                    <Icon name="flag-outline" size={18} />
                    優先順序
                </button>
                <button
                    className={`ozone-tab ${activeTab === 'reservations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reservations')}
                >
                    <Icon name="list-outline" size={18} />
                    預約管理
                </button>
            </div>

            {/* 日查詢 (分割儀表板) */}
            {activeTab === 'daily' && (
                <div className="ozone-dashboard-container">
                    {/* 左側：查詢面板 */}
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

                        <div className="daily-records-list">
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

                    {/* 右側：預約管理 */}
                    <div className="dashboard-right-panel">
                        <div className="panel-title">預約管理</div>

                        <div className="reservation-inner-layout">
                            {/* 預約列表 */}
                            <div className="reservation-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                                {reservations.filter(r => new Date(r.requested_date).toDateString() === new Date().toDateString()).length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>今日無預約</div>
                                ) : (
                                    reservations.filter(r => new Date(r.requested_date).toDateString() === new Date().toDateString()).map(res => (
                                        <div key={res.id} className="reservation-card-simple">
                                            <div className="res-card-info">
                                                <h4>{res.floor} ({res.room_numbers?.join(', ')})</h4>
                                                <div className="res-card-time">
                                                    {new Date(res.requested_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {res.notes && <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>({res.notes})</span>}
                                                </div>
                                            </div>
                                            {res.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="status-badge status-scheduled" style={{ border: 'none', cursor: 'pointer' }} onClick={() => handleCompleteReservation(res.id)}>
                                                        完成
                                                    </button>
                                                    <button className="status-badge" style={{ border: 'none', cursor: 'pointer', backgroundColor: '#e53935', color: 'white' }} onClick={() => handleDeleteReservation(res.id)}>
                                                        刪除
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="status-badge status-completed">已完成</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* 快速新增表單 */}
                            <div className="quick-add-form">
                                <h4 className="quick-add-title">快速新增</h4>
                                <form onSubmit={handleCreateReservation} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <div className="form-group-sm">
                                        <label>樓層</label>
                                        <select className="form-control-sm" value={reservationForm.floor} onChange={handleFloorChange} required>
                                            <option value="">請選擇</option>
                                            {FLOORS.filter(f => f.label !== 'B1').map(f => <option key={f.id} value={f.label}>{f.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="form-group-sm">
                                        <label>房號 (可複選)</label>
                                        {!reservationForm.floor ? (
                                            <div style={{ fontSize: '12px', color: '#999', padding: '4px' }}>請先選擇樓層</div>
                                        ) : (
                                            <div className="room-selector-grid">
                                                {availableRooms.map(room => (
                                                    <button
                                                        key={room}
                                                        type="button"
                                                        className={`room-select-btn ${reservationForm.roomNumbers.includes(room) ? 'selected' : ''}`}
                                                        onClick={() => handleRoomToggle(room)}
                                                    >
                                                        {room}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group-sm">
                                        <label>日期</label>
                                        <input type="date" className="form-control-sm" value={reservationForm.requestedDate} onChange={(e) => setReservationForm({ ...reservationForm, requestedDate: e.target.value })} required />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group-sm" style={{ flex: 1 }}>
                                            <label>時間</label>
                                            <input type="time" className="form-control-sm" value={reservationForm.startTime} onChange={(e) => setReservationForm({ ...reservationForm, startTime: e.target.value })} required />
                                        </div>
                                        <div className="form-group-sm" style={{ flex: 1 }}>
                                            <label>長度(分)</label>
                                            <input type="number" className="form-control-sm" value={reservationForm.duration} onChange={(e) => setReservationForm({ ...reservationForm, duration: e.target.value })} min="15" step="15" />
                                        </div>
                                    </div>

                                    {formError && <div style={{ color: 'red', fontSize: '12px', marginBottom: '8px' }}>{formError}</div>}

                                    <button type="submit" className="btn-add-reservation">新增預約</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 月統計 */}
            {activeTab === 'monthly' && (
                <div className="tab-content monthly-tab-content">
                    {/* Filter Row */}
                    <div className="filter-row-clean">
                        <div className="filter-group">
                            <label>年份：</label>
                            <input type="number" className="clean-input" value={monthlyYear} onChange={(e) => setMonthlyYear(parseInt(e.target.value))} min="2020" max="2099" />
                        </div>
                        <div className="filter-group">
                            <label>月份：</label>
                            <select className="clean-select" value={monthlyMonth} onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => <option key={m} value={m}>{m} 月</option>)}
                            </select>
                        </div>
                    </div>

                    {loading ? <div className="loading-state">載入中...</div> : !monthlyStats ? <div className="empty-state">無統計資料</div> : (() => {
                        // 計算圖表資料
                        const totalTreatments = monthlyStats.floorStats.reduce((sum, f) => sum + f.totalCount, 0);
                        const CHART_COLORS = ['#43a047', '#fb8c00', '#1e88e5', '#e53935', '#8e24aa', '#00acc1', '#3949ab', '#d81b60'];

                        let currentAngle = 0;
                        const gradientSegments = monthlyStats.floorStats.map((f, i) => {
                            const percentage = (f.totalCount / totalTreatments) * 100;
                            const color = CHART_COLORS[i % CHART_COLORS.length];
                            const start = currentAngle;
                            currentAngle += percentage;
                            return `${color} ${start}% ${currentAngle}%`;
                        });

                        const chartStyle = {
                            background: `conic-gradient(${gradientSegments.join(', ')})`
                        };

                        return (
                            <div className="monthly-layout">
                                {/* Chart Section */}
                                <div className="chart-section-card">
                                    <h3>Ozone Treatment Distribution by Floor</h3>
                                    <div className="chart-content">
                                        <div className="donut-chart" style={chartStyle}>
                                            <div className="donut-inner-circle"></div>
                                        </div>
                                        <div className="chart-legend">
                                            {monthlyStats.floorStats.map((f, i) => (
                                                <div key={i} className="legend-item">
                                                    <span className="legend-color" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                                                    <span className="legend-label">{f.floor}: </span>
                                                    <span className="legend-value">{f.totalCount}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Floor Stats Grid */}
                                <div className="floor-stats-grid-layout">
                                    {monthlyStats.floorStats.map((floor, idx) => (
                                        <div key={idx} className="floor-stat-card-clean">
                                            <div className="floor-head-clean">
                                                <span className="floor-title">{floor.floor}</span>
                                                <span className="floor-total">總計：{floor.totalCount} 次</span>
                                            </div>
                                            <div className="floor-rooms-list">
                                                {floor.rooms?.map((room, ridx) => (
                                                    <div key={ridx} className="room-item-clean">
                                                        <span className="room-num">{room.roomNumber}</span>
                                                        <span className="room-val">{room.count} 次</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* 優先順序 */}
            {activeTab === 'priority' && (
                <div className="tab-content">
                    <div className="filter-row">
                        <label>年份：</label>
                        <input type="number" value={priorityYear} onChange={(e) => setPriorityYear(parseInt(e.target.value))} min="2020" max="2099" style={{ padding: '4px' }} />
                        <label style={{ marginLeft: '16px' }}>月份：</label>
                        <select value={priorityMonth} onChange={(e) => setPriorityMonth(parseInt(e.target.value))} style={{ padding: '4px' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => <option key={m} value={m}>{m} 月</option>)}
                        </select>
                    </div>

                    {loading ? <div className="loading-state">載入中...</div> : priorityData.length === 0 ? <div className="empty-state">無優先順序資料</div> : (
                        <div className="priority-list">
                            {priorityData.map((item, idx) => (
                                <div key={idx} className="priority-card">
                                    <div className="priority-floor">{item.floor}</div>
                                    <div className="priority-info" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <span className="priority-count">使用次數：{item.usageCount}</span>
                                        <span className="priority-badge" style={{ backgroundColor: item.priority === 'high' ? 'var(--color-success)' : item.priority === 'medium' ? 'var(--color-warning)' : '#9e9e9e' }}>
                                            {item.priority === 'high' ? '高優先' : item.priority === 'medium' ? '中優先' : '低優先'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 預約管理 (全部清單) */}
            {activeTab === 'reservations' && (
                <div className="tab-content">
                    <div className="panel-title">所有預約記錄</div>
                    <div className="reservation-list-full" style={{ marginTop: '20px' }}>
                        <table className="ozone-table">
                            <thead>
                                <tr>
                                    <th>日期</th>
                                    <th>樓層</th>
                                    <th>房號</th>
                                    <th>備註</th>
                                    <th>狀態</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>無資料</td></tr>
                                ) : (
                                    reservations.map(res => (
                                        <tr key={res.id}>
                                            <td>{new Date(res.requested_date).toLocaleDateString()}</td>
                                            <td>{res.floor}</td>
                                            <td>{res.room_numbers?.join('、')}</td>
                                            <td>{res.notes || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${res.status === 'completed' ? 'status-completed' : 'status-scheduled'}`}>
                                                    {res.status === 'completed' ? '已完成' : '待處理'}
                                                </span>
                                            </td>
                                            <td>
                                                {res.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="btn-action" onClick={() => handleCompleteReservation(res.id)}>完成</button>
                                                        <button className="btn-action" style={{ backgroundColor: '#e53935' }} onClick={() => handleDeleteReservation(res.id)}>刪除</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


        </div>
    );
}

export default OzoneStatsPage;
