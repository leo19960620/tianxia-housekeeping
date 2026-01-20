import { useState, useEffect } from 'react';
import { bicycleAPI, bicycleRentalAPI, bicycleMaintenanceAPI, umbrellaRentalAPI } from '../api/rental';
import { userAPI } from '../api/user';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import './RentalManagementPage.css';

function RentalManagementPage() {
    const [activeTab, setActiveTab] = useState('bicycle-rental'); // bicycle-rental, bicycle-maintenance, umbrella-rental, rental-history
    const [bicycles, setBicycles] = useState([]);
    const [bicycleRentals, setBicycleRentals] = useState([]);
    const [umbrellaRentals, setUmbrellaRentals] = useState([]);
    const [rentalHistory, setRentalHistory] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedBicycle, setSelectedBicycle] = useState(null);

    // 腳踏車租借表單（支援複選）
    const [bicycleRentalForm, setBicycleRentalForm] = useState({
        bicycle_ids: [],  // 改為陣列支援複選
        room_number: '',
        room_status: 'checked_in',
        rented_by: '',
        notes: ''
    });

    // 雨傘租借表單
    const [umbrellaRentalForm, setUmbrellaRentalForm] = useState({
        umbrella_number: '',
        room_number: '',
        room_status: 'checked_in',
        rented_by: '',
        notes: ''
    });

    // 維護表單
    const [maintenanceForm, setMaintenanceForm] = useState({
        maintenance_type: 'air_check',
        performed_by: '',
        notes: ''
    });

    // 歸還表單
    const [returnForm, setReturnForm] = useState({
        returned_by: ''
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            const usersRes = await userAPI.getAll();
            if (usersRes.success) {
                setUsers(usersRes.data);
            }

            if (activeTab === 'bicycle-rental' || activeTab === 'bicycle-maintenance') {
                const [bicyclesRes, rentalsRes] = await Promise.all([
                    bicycleAPI.getAll(),
                    bicycleRentalAPI.getActive()
                ]);
                if (bicyclesRes.success) setBicycles(bicyclesRes.data);
                if (rentalsRes.success) setBicycleRentals(rentalsRes.data);
            }

            if (activeTab === 'umbrella-rental') {
                const rentalsRes = await umbrellaRentalAPI.getActive();
                if (rentalsRes.success) setUmbrellaRentals(rentalsRes.data);
            }

            if (activeTab === 'rental-history') {
                const [bicycleHistoryRes, umbrellaHistoryRes] = await Promise.all([
                    bicycleRentalAPI.getAll(),
                    umbrellaRentalAPI.getAll()
                ]);
                if (bicycleHistoryRes.success && umbrellaHistoryRes.success) {
                    const combined = [
                        ...bicycleHistoryRes.data.map(r => ({ ...r, type: 'bicycle' })),
                        ...umbrellaHistoryRes.data.map(r => ({ ...r, type: 'umbrella' }))
                    ].sort((a, b) => new Date(b.rental_start_time) - new Date(a.rental_start_time));
                    setRentalHistory(combined);
                }
            }
        } catch (error) {
            console.error('載入資料失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    // 腳踏車租借（支援批次）
    const handleBicycleRental = async () => {
        if (bicycleRentalForm.bicycle_ids.length === 0 || !bicycleRentalForm.rented_by) {
            alert('請至少選擇一輛腳踏車和經手人');
            return;
        }

        try {
            await bicycleRentalAPI.create({
                bicycle_id: bicycleRentalForm.bicycle_ids,
                room_number: bicycleRentalForm.room_number,
                room_status: bicycleRentalForm.room_status,
                rented_by: bicycleRentalForm.rented_by,
                notes: bicycleRentalForm.notes
            });
            alert(`成功借出 ${bicycleRentalForm.bicycle_ids.length} 輛腳踏車`);
            setBicycleRentalForm({
                bicycle_ids: [],
                room_number: '',
                room_status: 'checked_in',
                rented_by: '',
                notes: ''
            });
            loadData();
        } catch (error) {
            alert(error.message || '借出失敗');
        }
    };

    // 雨傘租借
    const handleUmbrellaRental = async () => {
        if (!umbrellaRentalForm.umbrella_number || !umbrellaRentalForm.rented_by) {
            alert('請填寫雨傘編號和經手人');
            return;
        }

        try {
            await umbrellaRentalAPI.create(umbrellaRentalForm);
            alert('借出成功');
            setUmbrellaRentalForm({
                umbrella_number: '',
                room_number: '',
                room_status: 'checked_in',
                rented_by: '',
                notes: ''
            });
            loadData();
        } catch (error) {
            alert(error.message || '借出失敗');
        }
    };

    // 歸還
    const handleReturn = async () => {
        if (!returnForm.returned_by) {
            alert('請選擇經手人');
            return;
        }

        try {
            if (selectedItem.type === 'bicycle') {
                await bicycleRentalAPI.return(selectedItem.id, returnForm.returned_by);
            } else {
                await umbrellaRentalAPI.return(selectedItem.id, returnForm.returned_by);
            }
            alert('歸還成功');
            setShowReturnModal(false);
            setReturnForm({ returned_by: '' });
            loadData();
        } catch (error) {
            alert(error.message || '歸還失敗');
        }
    };

    // 記錄維護
    const handleMaintenance = async () => {
        if (!maintenanceForm.performed_by) {
            alert('請選擇執行人員');
            return;
        }

        try {
            await bicycleMaintenanceAPI.create({
                bicycle_id: selectedBicycle.id,
                ...maintenanceForm
            });
            alert('維護記錄已建立');
            setShowMaintenanceModal(false);
            setMaintenanceForm({
                maintenance_type: 'air_check',
                performed_by: '',
                notes: ''
            });
            loadData();
        } catch (error) {
            alert(error.message || '記錄失敗');
        }
    };

    // 開啟歸還對話框
    const openReturnModal = (item, type) => {
        setSelectedItem({ ...item, type });
        setShowReturnModal(true);
    };

    // 開啟維護對話框
    const openMaintenanceModal = (bicycle) => {
        setSelectedBicycle(bicycle);
        setShowMaintenanceModal(true);
    };

    // 檢查是否該打氣（週二提醒）
    const shouldRemindAirCheck = (lastCheckDate) => {
        if (!lastCheckDate) return true;
        const today = new Date();
        const lastCheck = new Date(lastCheckDate);
        const diffDays = Math.floor((today - lastCheck) / (1000 * 60 * 60 * 24));
        return diffDays >= 7; // 超過一週提醒
    };

    // 格式化時間
    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('zh-TW');
    };

    // 切換腳踏車啟用狀態
    const handleToggleActive = async (bicycle) => {
        try {
            await bicycleAPI.update(bicycle.id, { is_active: !bicycle.is_active });
            alert(`已${bicycle.is_active ? '關閉' : '開啟'} ${bicycle.bicycle_number} 號`);
            loadData();
        } catch (error) {
            alert(error.message || '操作失敗');
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
        <div className="page rental-management-page">
            <div className="page-content">
                <h1 className="page-title">租借管理</h1>

                {/* 頁籤 */}
                <div className="rental-tabs">
                    <button
                        className={`rental-tab ${activeTab === 'bicycle-rental' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bicycle-rental')}
                    >
                        <Icon name="bicycle" size={20} />
                        腳踏車租借
                    </button>
                    <button
                        className={`rental-tab ${activeTab === 'bicycle-maintenance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bicycle-maintenance')}
                    >
                        <Icon name="build" size={20} />
                        腳踏車維護
                    </button>
                    <button
                        className={`rental-tab ${activeTab === 'umbrella-rental' ? 'active' : ''}`}
                        onClick={() => setActiveTab('umbrella-rental')}
                    >
                        <Icon name="umbrella" size={20} />
                        雨傘租借
                    </button>
                    <button
                        className={`rental-tab ${activeTab === 'rental-history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rental-history')}
                    >
                        <Icon name="time" size={20} />
                        租借紀錄
                    </button>
                </div>

                {/* 腳踏車租借頁籤 */}
                {activeTab === 'bicycle-rental' && (
                    <div className="rental-content">
                        {/* 快速借出表單 */}
                        <div className="rental-form-card">
                            <h3>快速借出</h3>
                            <div className="form-group">
                                <label>選擇腳踏車 * (可複選)</label>
                                <div className="bicycle-checkboxes">
                                    {bicycles.filter(b => b.status === 'available').map(bicycle => (
                                        <label key={bicycle.id} className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={bicycleRentalForm.bicycle_ids.includes(bicycle.id)}
                                                onChange={(e) => {
                                                    const newIds = e.target.checked
                                                        ? [...bicycleRentalForm.bicycle_ids, bicycle.id]
                                                        : bicycleRentalForm.bicycle_ids.filter(id => id !== bicycle.id);
                                                    setBicycleRentalForm({ ...bicycleRentalForm, bicycle_ids: newIds });
                                                }}
                                            />
                                            <span>{bicycle.bicycle_number} 號 - {bicycle.appearance_condition}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-grid">

                                <div className="form-group">
                                    <label>房號</label>
                                    <input
                                        type="text"
                                        value={bicycleRentalForm.room_number}
                                        onChange={(e) => setBicycleRentalForm({ ...bicycleRentalForm, room_number: e.target.value })}
                                        placeholder="例如: 501"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>房間狀態</label>
                                    <select
                                        value={bicycleRentalForm.room_status}
                                        onChange={(e) => setBicycleRentalForm({ ...bicycleRentalForm, room_status: e.target.value })}
                                        className="form-select"
                                    >
                                        <option value="checked_in">已入住</option>
                                        <option value="checked_out">已退房</option>
                                        <option value="not_yet">尚未入住</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>經手人 *</label>
                                    <select
                                        value={bicycleRentalForm.rented_by}
                                        onChange={(e) => setBicycleRentalForm({ ...bicycleRentalForm, rented_by: e.target.value })}
                                        className="form-select"
                                    >
                                        <option value="">請選擇經手人</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.full_name}>
                                                {user.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>備註</label>
                                    <input
                                        type="text"
                                        value={bicycleRentalForm.notes}
                                        onChange={(e) => setBicycleRentalForm({ ...bicycleRentalForm, notes: e.target.value })}
                                        placeholder="選填"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleBicycleRental} fullWidth>借出</Button>
                        </div>

                        {/* 目前租借中 */}
                        <div className="rental-list-section">
                            <h3>目前租借中 ({bicycleRentals.length})</h3>
                            {bicycleRentals.length === 0 ? (
                                <p className="empty-message">目前無租借紀錄</p>
                            ) : (
                                <div className="rental-cards">
                                    {bicycleRentals.map(rental => (
                                        <div key={rental.id} className="rental-card">
                                            <div className="rental-card-header">
                                                <div className="rental-card-title">
                                                    <Icon name="bicycle" size={24} color="var(--color-primary)" />
                                                    <span>{rental.bicycle_number} 號</span>
                                                </div>
                                                <Button
                                                    variant="success"
                                                    size="small"
                                                    onClick={() => openReturnModal(rental, 'bicycle')}
                                                >
                                                    歸還
                                                </Button>
                                            </div>
                                            <div className="rental-card-body">
                                                <div className="rental-info-row">
                                                    <Icon name="home" size={16} />
                                                    <span>房號: {rental.room_number || '未登記'}</span>
                                                </div>
                                                <div className="rental-info-row">
                                                    <Icon name="time" size={16} />
                                                    <span>{formatDateTime(rental.rental_start_time)}</span>
                                                </div>
                                                <div className="rental-info-row">
                                                    <Icon name="person" size={16} />
                                                    <span>經手人: {rental.rented_by}</span>
                                                </div>
                                                {rental.notes && (
                                                    <div className="rental-info-row">
                                                        <Icon name="document-text" size={16} />
                                                        <span>{rental.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 腳踏車維護頁籤 */}
                {activeTab === 'bicycle-maintenance' && (
                    <div className="rental-content">
                        <div className="maintenance-grid">
                            {bicycles.map(bicycle => {
                                const maintenanceInfo = bicycle.maintenance_info || {};
                                const needsAirCheck = shouldRemindAirCheck(bicycle.last_air_check_date);

                                return (
                                    <div key={bicycle.id} className={`bicycle-card ${bicycle.status === 'maintenance' ? 'maintenance' : ''} ${bicycle.is_active === false ? 'inactive' : ''}`}>
                                        <div className="bicycle-card-header">
                                            <div className="bicycle-number">{bicycle.bicycle_number} 號</div>
                                            <div className="bicycle-header-right">
                                                <div className={`bicycle-status status-${bicycle.status}`}>
                                                    {bicycle.status === 'available' ? '可借' : bicycle.status === 'rented' ? '已借出' : '維護中'}
                                                </div>
                                                <label className="switch" title={bicycle.status === 'rented' ? '已借出無法切換' : '切換開啟/關閉'}>
                                                    <input
                                                        type="checkbox"
                                                        checked={bicycle.is_active !== false}
                                                        onChange={() => handleToggleActive(bicycle)}
                                                        disabled={bicycle.status === 'rented'}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="bicycle-card-body">
                                            <div className="maintenance-item">
                                                <Icon name={needsAirCheck ? "warning" : "checkmark-circle"}
                                                    size={18}
                                                    color={needsAirCheck ? "var(--color-warning)" : "var(--color-success)"} />
                                                <div>
                                                    <div className="maintenance-label">上次打氣</div>
                                                    <div className="maintenance-value">{formatDate(bicycle.last_air_check_date)}</div>
                                                    {needsAirCheck && <div className="maintenance-reminder">⚠️ 建議打氣</div>}
                                                </div>
                                            </div>
                                            <div className="maintenance-item">
                                                <Icon name="water" size={18} color="var(--color-info)" />
                                                <div>
                                                    <div className="maintenance-label">上次擦拭</div>
                                                    <div className="maintenance-value">{formatDate(bicycle.last_cleaning_date)}</div>
                                                </div>
                                            </div>
                                            <div className="maintenance-item">
                                                <Icon name="eye" size={18} color="var(--color-secondary)" />
                                                <div>
                                                    <div className="maintenance-label">外觀狀況</div>
                                                    <div className="maintenance-value">{bicycle.appearance_condition || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            fullWidth
                                            onClick={() => openMaintenanceModal(bicycle)}
                                            disabled={bicycle.status === 'rented'}
                                        >
                                            記錄維護
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 雨傘租借頁籤 */}
                {activeTab === 'umbrella-rental' && (
                    <div className="rental-content">
                        {/* 快速借出表單 */}
                        <div className="rental-form-card">
                            <h3>快速借出</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>雨傘編號 *</label>
                                    <input
                                        type="text"
                                        value={umbrellaRentalForm.umbrella_number}
                                        onChange={(e) => setUmbrellaRentalForm({ ...umbrellaRentalForm, umbrella_number: e.target.value })}
                                        placeholder="請輸入雨傘編號"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>房號</label>
                                    <input
                                        type="text"
                                        value={umbrellaRentalForm.room_number}
                                        onChange={(e) => setUmbrellaRentalForm({ ...umbrellaRentalForm, room_number: e.target.value })}
                                        placeholder="例如: 501"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>房間狀態</label>
                                    <select
                                        value={umbrellaRentalForm.room_status}
                                        onChange={(e) => setUmbrellaRentalForm({ ...umbrellaRentalForm, room_status: e.target.value })}
                                        className="form-select"
                                    >
                                        <option value="checked_in">已入住</option>
                                        <option value="checked_out">已退房</option>
                                        <option value="not_yet">尚未入住</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>經手人 *</label>
                                    <select
                                        value={umbrellaRentalForm.rented_by}
                                        onChange={(e) => setUmbrellaRentalForm({ ...umbrellaRentalForm, rented_by: e.target.value })}
                                        className="form-select"
                                    >
                                        <option value="">請選擇經手人</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.full_name}>
                                                {user.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>備註</label>
                                    <input
                                        type="text"
                                        value={umbrellaRentalForm.notes}
                                        onChange={(e) => setUmbrellaRentalForm({ ...umbrellaRentalForm, notes: e.target.value })}
                                        placeholder="選填"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleUmbrellaRental} fullWidth>借出</Button>
                        </div>

                        {/* 目前租借中 */}
                        <div className="rental-list-section">
                            <h3>目前租借中 ({umbrellaRentals.length})</h3>
                            {umbrellaRentals.length === 0 ? (
                                <p className="empty-message">目前無租借紀錄</p>
                            ) : (
                                <div className="rental-cards">
                                    {umbrellaRentals.map(rental => (
                                        <div key={rental.id} className="rental-card">
                                            <div className="rental-card-header">
                                                <div className="rental-card-title">
                                                    <Icon name="umbrella" size={24} color="var(--color-info)" />
                                                    <span>{rental.umbrella_number}</span>
                                                </div>
                                                <Button
                                                    variant="success"
                                                    size="small"
                                                    onClick={() => openReturnModal(rental, 'umbrella')}
                                                >
                                                    歸還
                                                </Button>
                                            </div>
                                            <div className="rental-card-body">
                                                <div className="rental-info-row">
                                                    <Icon name="home" size={16} />
                                                    <span>房號: {rental.room_number || '未登記'}</span>
                                                </div>
                                                <div className="rental-info-row">
                                                    <Icon name="time" size={16} />
                                                    <span>{formatDateTime(rental.rental_start_time)}</span>
                                                </div>
                                                <div className="rental-info-row">
                                                    <Icon name="person" size={16} />
                                                    <span>經手人: {rental.rented_by}</span>
                                                </div>
                                                {rental.notes && (
                                                    <div className="rental-info-row">
                                                        <Icon name="document-text" size={16} />
                                                        <span>{rental.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 租借紀錄頁籤 */}
            {activeTab === 'rental-history' && (
                <div className="rental-content">
                    <div className="rental-list-section">
                        <h3>所有租借紀錄 ({rentalHistory.length})</h3>
                        {rentalHistory.length === 0 ? (
                            <p className="empty-message">目前無租借紀錄</p>
                        ) : (
                            <div className="rental-cards">
                                {rentalHistory.map(rental => (
                                    <div key={`${rental.type}-${rental.id}`} className="rental-card">
                                        <div className="rental-card-header">
                                            <div className="rental-card-title">
                                                <Icon
                                                    name={rental.type === 'bicycle' ? 'bicycle' : 'umbrella'}
                                                    size={24}
                                                    color={rental.type === 'bicycle' ? 'var(--color-primary)' : 'var(--color-info)'}
                                                />
                                                <span>
                                                    {rental.type === 'bicycle'
                                                        ? `${rental.bicycle_number} 號`
                                                        : rental.umbrella_number}
                                                </span>
                                            </div>
                                            <div className={`status-badge status-${rental.status}`}>
                                                {rental.status === 'active' ? '租借中' : '已歸還'}
                                            </div>
                                        </div>
                                        <div className="rental-card-body">
                                            <div className="rental-info-row">
                                                <Icon name="home" size={16} />
                                                <span>房號: {rental.room_number || '未登記'}</span>
                                            </div>
                                            <div className="rental-info-row">
                                                <Icon name="log-in" size={16} />
                                                <span>借出: {formatDateTime(rental.rental_start_time)}</span>
                                            </div>
                                            <div className="rental-info-row">
                                                <Icon name="person" size={16} />
                                                <span>借出經手人: {rental.rented_by}</span>
                                            </div>
                                            {rental.rental_end_time && (
                                                <div className="rental-info-row">
                                                    <Icon name="log-out" size={16} />
                                                    <span>歸還: {formatDateTime(rental.rental_end_time)}</span>
                                                </div>
                                            )}
                                            {rental.returned_by && (
                                                <div className="rental-info-row">
                                                    <Icon name="person" size={16} />
                                                    <span>歸還經手人: {rental.returned_by}</span>
                                                </div>
                                            )}
                                            {rental.notes && (
                                                <div className="rental-info-row">
                                                    <Icon name="document-text" size={16} />
                                                    <span>{rental.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 歸還 Modal */}
            <Modal
                isOpen={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                title="歸還確認"
            >
                <div style={{ padding: 'var(--spacing-md)' }}>
                    <div className="form-group">
                        <label>歸還經手人 *</label>
                        <select
                            value={returnForm.returned_by}
                            onChange={(e) => setReturnForm({ returned_by: e.target.value })}
                            className="form-select"
                        >
                            <option value="">請選擇經手人</option>
                            {users.map(user => (
                                <option key={user.id} value={user.full_name}>
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                        <Button variant="secondary" fullWidth onClick={() => setShowReturnModal(false)}>
                            取消
                        </Button>
                        <Button fullWidth onClick={handleReturn}>
                            確認歸還
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 維護 Modal */}
            <Modal
                isOpen={showMaintenanceModal}
                onClose={() => setShowMaintenanceModal(false)}
                title={`記錄維護 - ${selectedBicycle?.bicycle_number} 號`}
            >
                <div style={{ padding: 'var(--spacing-md)' }}>
                    <div className="form-group">
                        <label>維護類型 *</label>
                        <select
                            value={maintenanceForm.maintenance_type}
                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value })}
                            className="form-select"
                        >
                            <option value="air_check">車胎打氣</option>
                            <option value="cleaning">車身擦拭</option>
                            <option value="appearance_check">外觀檢查</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>執行人員 *</label>
                        <select
                            value={maintenanceForm.performed_by}
                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })}
                            className="form-select"
                        >
                            <option value="">請選擇執行人員</option>
                            {users.map(user => (
                                <option key={user.id} value={user.full_name}>
                                    {user.full_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>備註 {maintenanceForm.maintenance_type === 'appearance_check' && '(外觀狀況描述)'}</label>
                        <textarea
                            value={maintenanceForm.notes}
                            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                            className="form-textarea"
                            rows={3}
                            placeholder={maintenanceForm.maintenance_type === 'appearance_check' ? '請描述外觀狀況' : '選填'}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                        <Button variant="secondary" fullWidth onClick={() => setShowMaintenanceModal(false)}>
                            取消
                        </Button>
                        <Button fullWidth onClick={handleMaintenance}>
                            記錄
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default RentalManagementPage;
