import { useState, useEffect } from 'react';
import { bicycleAPI, bicycleRentalAPI, bicycleMaintenanceAPI, umbrellaRentalAPI } from '../api/rental';
import { userAPI } from '../api/user';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import RentalManagementSkeleton from './RentalManagementSkeleton';
import '../styles/ModernTable.css';
import './RentalManagementPage.css';



function RentalManagementPage() {
    const [activeTab, setActiveTab] = useState('bicycle-rental'); // bicycle-rental, bicycle-maintenance, umbrella-rental, rental-history
    const [bicycles, setBicycles] = useState([]);
    const [bicycleRentals, setBicycleRentals] = useState([]);
    const [umbrellaRentals, setUmbrellaRentals] = useState([]);
    const [rentalHistory, setRentalHistory] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        // 直接使用本地今天的日期
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [dateRangeStart, setDateRangeStart] = useState(() => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [dateRangeEnd, setDateRangeEnd] = useState(() => {
        const today = new Date();
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return lastDay.toISOString().split('T')[0];
    });
    const [filterItemType, setFilterItemType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showMaintenanceHistoryModal, setShowMaintenanceHistoryModal] = useState(false);
    const [showBatchMaintenanceModal, setShowBatchMaintenanceModal] = useState(false);
    const [showEditRentalModal, setShowEditRentalModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedBicycle, setSelectedBicycle] = useState(null);
    const [maintenanceHistory, setMaintenanceHistory] = useState([]);
    const [selectedMaintenanceMonth, setSelectedMaintenanceMonth] = useState(new Date());
    const [selectedBicyclesForBatch, setSelectedBicyclesForBatch] = useState([]);
    const [editRentalForm, setEditRentalForm] = useState({
        bicycle_number: '',
        quantity: 1,
        room_number: ''
    });

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
        quantity: 1,
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

    // 批次維護表單
    const [batchMaintenanceForm, setBatchMaintenanceForm] = useState({
        maintenance_types: ['air_check', 'cleaning'], // 預設勾選打氣和擦拭
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
        if (!umbrellaRentalForm.quantity || !umbrellaRentalForm.rented_by) {
            alert('請確認數量和經手人');
            return;
        }

        try {
            await umbrellaRentalAPI.create(umbrellaRentalForm);
            alert('借出成功');
            setUmbrellaRentalForm({
                quantity: 1,
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

    // 開啟編輯租借對話框
    const openEditRentalModal = (item, type) => {
        setSelectedItem({ ...item, type });
        setEditRentalForm({
            bicycle_number: type === 'bicycle' ? item.bicycle_number : '',
            quantity: type === 'umbrella' ? (item.quantity || 1) : 1,
            room_number: item.room_number || ''
        });
        setShowEditRentalModal(true);
    };

    // 處理編輯租借資訊
    const handleEditRental = async () => {
        try {
            const updateData = {
                room_number: editRentalForm.room_number
            };

            if (selectedItem.type === 'bicycle') {
                updateData.bicycle_number = editRentalForm.bicycle_number;
                await bicycleRentalAPI.update(selectedItem.id, updateData);
            } else {
                updateData.quantity = parseInt(editRentalForm.quantity) || 1;
                await umbrellaRentalAPI.update(selectedItem.id, updateData);
            }

            alert('更新成功');
            setShowEditRentalModal(false);
            setEditRentalForm({ bicycle_number: '', quantity: 1, room_number: '' });
            loadData();
        } catch (error) {
            alert(error.message || '更新失敗');
        }
    };

    // 開啟維護紀錄對話框
    const openMaintenanceHistoryModal = async (bicycle) => {
        setSelectedBicycle(bicycle);
        setSelectedMaintenanceMonth(new Date()); // 重置為當前月份
        try {
            const response = await bicycleMaintenanceAPI.getByBicycleId(bicycle.id);
            if (response.success) {
                setMaintenanceHistory(response.data || []);
            }
            setShowMaintenanceHistoryModal(true);
        } catch (error) {
            alert('無法載入維護紀錄');
        }
    };

    // 批次維護處理
    const handleBatchMaintenance = async () => {
        if (!batchMaintenanceForm.performed_by) {
            alert('請選擇執行人員');
            return;
        }

        if (selectedBicyclesForBatch.length === 0) {
            alert('請選擇至少一台車輛');
            return;
        }

        if (batchMaintenanceForm.maintenance_types.length === 0) {
            alert('請選擇至少一種維護類型');
            return;
        }

        try {
            let successCount = 0;
            let failCount = 0;

            // 為每台選中的車輛建立維護紀錄
            for (const bicycleId of selectedBicyclesForBatch) {
                try {
                    // 為每種維護類型建立一筆紀錄
                    for (const maintenanceType of batchMaintenanceForm.maintenance_types) {
                        await bicycleMaintenanceAPI.create({
                            bicycle_id: bicycleId,
                            maintenance_type: maintenanceType,
                            performed_by: batchMaintenanceForm.performed_by,
                            notes: batchMaintenanceForm.notes
                        });
                    }
                    successCount++;
                } catch (error) {
                    console.error(`車輛 ${bicycleId} 維護失敗:`, error);
                    failCount++;
                }
            }

            if (failCount === 0) {
                alert(`成功為 ${successCount} 台車輛建立維護紀錄`);
            } else {
                alert(`成功: ${successCount} 台\n失敗: ${failCount} 台`);
            }

            setShowBatchMaintenanceModal(false);
            setSelectedBicyclesForBatch([]);
            setBatchMaintenanceForm({
                maintenance_types: ['air_check', 'cleaning'],
                performed_by: '',
                notes: ''
            });
            loadData();
        } catch (error) {
            alert(error.message || '批次維護失敗');
        }
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

    // 切換腳踏車啟用狀態（樂觀更新）
    const handleToggleActive = async (bicycle) => {
        const newIsActive = !bicycle.is_active;

        // 立即更新 UI（樂觀更新）
        setBicycles(prev => prev.map(b =>
            b.id === bicycle.id ? { ...b, is_active: newIsActive } : b
        ));

        try {
            // 背景更新到伺服器
            await bicycleAPI.update(bicycle.id, { is_active: newIsActive });
        } catch (error) {
            // 如果失敗，回滾狀態
            setBicycles(prev => prev.map(b =>
                b.id === bicycle.id ? { ...b, is_active: bicycle.is_active } : b
            ));
            alert(error.message || '操作失敗');
        }
    };



    return (
        <div className="page rental-management-page">
            <div className="page-content fade-in">

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

                <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                    {/* 腳踏車租借頁籤 */}
                    {activeTab === 'bicycle-rental' && (
                        <div className="rental-content">
                            {/* 快速借出表單 */}
                            <div className="rental-form-card modern-form-card">
                                <h3 className="form-card-title">
                                    <span className="title-bar"></span>
                                    快速借出
                                </h3>
                                <div className="form-group">
                                    <label>選擇腳踏車號碼 *</label>
                                    <div className="bicycle-button-group">
                                        {bicycles.filter(b => b.status === 'available').map(bicycle => (
                                            <button
                                                key={bicycle.id}
                                                type="button"
                                                className={`bicycle-number-btn ${bicycleRentalForm.bicycle_ids.includes(bicycle.id) ? 'selected' : ''}`}
                                                onClick={() => {
                                                    const newIds = bicycleRentalForm.bicycle_ids.includes(bicycle.id)
                                                        ? bicycleRentalForm.bicycle_ids.filter(id => id !== bicycle.id)
                                                        : [...bicycleRentalForm.bicycle_ids, bicycle.id];
                                                    setBicycleRentalForm({ ...bicycleRentalForm, bicycle_ids: newIds });
                                                }}
                                            >
                                                #{bicycle.bicycle_number}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>房號 (例如: 501)</label>
                                        <input
                                            type="text"
                                            value={bicycleRentalForm.room_number}
                                            onChange={(e) => setBicycleRentalForm({ ...bicycleRentalForm, room_number: e.target.value })}
                                            placeholder="808"
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
                                            <option value="">Carol</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.full_name}>
                                                    {user.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>備註 (選填)</label>
                                        <input
                                            type="text"
                                            value={bicycleRentalForm.notes}
                                            onChange={(e) => setBicycleRentalForm({ ...bicycleRentalForm, notes: e.target.value })}
                                            placeholder="備註 (選填)"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <button className="confirm-rental-btn" onClick={handleBicycleRental}>
                                    <Icon name="bicycle" size={20} />
                                    確認借出
                                </button>
                            </div>

                            {/* 目前租借中 */}
                            <div className="rental-list-section">
                                <h3>目前租借中 ({bicycleRentals.length})</h3>
                                {bicycleRentals.length === 0 ? (
                                    <p className="empty-message">目前無租借紀錄</p>
                                ) : (
                                    <div className="rental-cards">
                                        {bicycleRentals.map(rental => (
                                            <div key={rental.id} className="rental-card modern-rental-card">
                                                <div className="rental-card-header">
                                                    <div className="rental-card-title">
                                                        <div className="icon-wrapper">
                                                            <Icon name="bicycle" size={20} color="var(--color-primary)" />
                                                        </div>
                                                        <span>{rental.bicycle_number} 號</span>
                                                    </div>
                                                    <div className="rental-card-actions">
                                                        <button
                                                            className="icon-btn edit-btn"
                                                            onClick={() => openEditRentalModal(rental, 'bicycle')}
                                                            title="編輯"
                                                        >
                                                            <Icon name="create" size={18} />
                                                        </button>
                                                        <button
                                                            className="icon-btn return-btn"
                                                            onClick={() => openReturnModal(rental, 'bicycle')}
                                                            title="歸還"
                                                        >
                                                            <Icon name="checkmark-circle" size={18} />
                                                        </button>
                                                    </div>
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
                            {/* 批次維護按鈕 - 全寬深綠色 */}
                            <button
                                className="batch-maintenance-banner"
                                onClick={() => setShowBatchMaintenanceModal(true)}
                            >
                                <Icon name="checkmark-done" size={20} />
                                批次維護
                            </button>

                            <div className="maintenance-grid">
                                {bicycles.map(bicycle => {
                                    const maintenanceInfo = bicycle.maintenance_info || {};
                                    const needsAirCheck = shouldRemindAirCheck(bicycle.last_air_check_date);

                                    return (
                                        <div key={bicycle.id} className={`bicycle-maintenance-card ${bicycle.is_active === false ? 'inactive' : ''}`}>
                                            <div className="bicycle-maintenance-header">
                                                <div className="bicycle-maintenance-title">
                                                    <Icon name="bicycle" size={24} />
                                                    <span className="bicycle-maintenance-number">{bicycle.bicycle_number} 號</span>
                                                </div>
                                                <div className="bicycle-maintenance-controls">
                                                    <div className={`bicycle-maintenance-status ${bicycle.status === 'rented' ? 'rented' : bicycle.status === 'available' ? 'available' : 'maintenance'}`}>
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
                                            <div className="bicycle-maintenance-body">
                                                <div className="maintenance-info-row">
                                                    <Icon name="fitness" size={16} />
                                                    <span className="maintenance-info-text">
                                                        上次打氣：{formatDate(bicycle.last_air_check_date)} · {bicycle.last_air_check_by || '-'}
                                                    </span>
                                                </div>
                                                <div className="maintenance-info-row">
                                                    <Icon name="water" size={16} />
                                                    <span className="maintenance-info-text">
                                                        上次擦拭：{formatDate(bicycle.last_cleaning_date)} · {bicycle.last_cleaning_by || '-'}
                                                    </span>
                                                </div>
                                                <div className="maintenance-info-row">
                                                    <Icon name="eye" size={16} />
                                                    <span className="maintenance-info-text">
                                                        外觀狀況：{bicycle.appearance_condition || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bicycle-maintenance-actions">
                                                <button
                                                    className="maintenance-action-btn start-maintenance"
                                                    onClick={() => openMaintenanceModal(bicycle)}
                                                    disabled={bicycle.status === 'rented'}
                                                >
                                                    開始維護
                                                </button>
                                                <button
                                                    className="maintenance-action-btn view-records"
                                                    onClick={() => openMaintenanceHistoryModal(bicycle)}
                                                >
                                                    維護紀錄
                                                </button>
                                            </div>
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
                            <div className="rental-form-card modern-form-card">
                                <h3 className="form-card-title">
                                    <span className="title-bar"></span>
                                    快速借出
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>借出數量 *</label>
                                        <div className="quantity-selector">
                                            <button
                                                className="quantity-btn"
                                                onClick={() => setUmbrellaRentalForm(prev => ({
                                                    ...prev,
                                                    quantity: Math.max(1, (prev.quantity || 1) - 1)
                                                }))}
                                            >
                                                <Icon name="remove" size={16} />
                                            </button>
                                            <input
                                                type="number"
                                                value={umbrellaRentalForm.quantity || 1}
                                                onChange={(e) => setUmbrellaRentalForm({
                                                    ...umbrellaRentalForm,
                                                    quantity: Math.max(1, parseInt(e.target.value) || 1)
                                                })}
                                                className="quantity-input"
                                                min="1"
                                            />
                                            <button
                                                className="quantity-btn"
                                                onClick={() => setUmbrellaRentalForm(prev => ({
                                                    ...prev,
                                                    quantity: (prev.quantity || 1) + 1
                                                }))}
                                            >
                                                <Icon name="add" size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>房號 (例如: 501)</label>
                                        <input
                                            type="text"
                                            value={umbrellaRentalForm.room_number}
                                            onChange={(e) => setUmbrellaRentalForm({ ...umbrellaRentalForm, room_number: e.target.value })}
                                            placeholder="808"
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

                                    <div className="form-group">
                                        <label>備註 (選填)</label>
                                        <input
                                            type="text"
                                            value={umbrellaRentalForm.notes}
                                            onChange={(e) => setUmbrellaRentalForm({ ...umbrellaRentalForm, notes: e.target.value })}
                                            placeholder="備註 (選填)"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <button className="confirm-rental-btn" onClick={handleUmbrellaRental}>
                                    <Icon name="umbrella" size={20} />
                                    確認借出
                                </button>
                            </div>

                            {/* 目前租借中 */}
                            <div className="rental-list-section">
                                <h3>目前租借中 ({umbrellaRentals.length})</h3>
                                {umbrellaRentals.length === 0 ? (
                                    <p className="empty-message">目前無租借紀錄</p>
                                ) : (
                                    <div className="rental-cards">
                                        {umbrellaRentals.map(rental => (
                                            <div key={rental.id} className="rental-card modern-rental-card">
                                                <div className="rental-card-header">
                                                    <div className="rental-card-title">
                                                        <div className="icon-wrapper">
                                                            <Icon name="umbrella" size={20} color="var(--color-info)" />
                                                        </div>
                                                        <span>{rental.quantity} 把</span>
                                                    </div>
                                                    <div className="rental-card-actions">
                                                        <button
                                                            className="icon-btn edit-btn"
                                                            onClick={() => openEditRentalModal(rental, 'umbrella')}
                                                            title="編輯"
                                                        >
                                                            <Icon name="create" size={18} />
                                                        </button>
                                                        <button
                                                            className="icon-btn return-btn"
                                                            onClick={() => openReturnModal(rental, 'umbrella')}
                                                            title="歸還"
                                                        >
                                                            <Icon name="checkmark-circle" size={18} />
                                                        </button>
                                                    </div>
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
                {
                    activeTab === 'rental-history' && (
                        <div className="rental-content">
                            {/* 篩選區域 */}
                            <div className="rental-history-filters">
                                {/* 日期範圍 */}
                                <div className="filter-group">
                                    <label>日期</label>
                                    <div className="date-range-inputs">
                                        <input
                                            type="date"
                                            value={dateRangeStart}
                                            onChange={(e) => setDateRangeStart(e.target.value)}
                                            className="date-input"
                                        />
                                        <span>-</span>
                                        <input
                                            type="date"
                                            value={dateRangeEnd}
                                            onChange={(e) => setDateRangeEnd(e.target.value)}
                                            className="date-input"
                                        />
                                    </div>
                                </div>

                                {/* 物品類型 */}
                                <div className="filter-group">
                                    <label>物品類型</label>
                                    <div className="filter-tabs">
                                        <button
                                            className={`filter-tab ${filterItemType === '' ? 'active' : ''}`}
                                            onClick={() => setFilterItemType('')}
                                        >
                                            全部
                                        </button>
                                        <button
                                            className={`filter-tab ${filterItemType === 'bicycle' ? 'active' : ''}`}
                                            onClick={() => setFilterItemType('bicycle')}
                                        >
                                            腳踏車
                                        </button>
                                        <button
                                            className={`filter-tab ${filterItemType === 'umbrella' ? 'active' : ''}`}
                                            onClick={() => setFilterItemType('umbrella')}
                                        >
                                            雨傘
                                        </button>
                                    </div>
                                </div>

                                {/* 狀態 */}
                                <div className="filter-group">
                                    <label>狀態</label>
                                    <div className="filter-tabs">
                                        <button
                                            className={`filter-tab ${filterStatus === '' ? 'active' : ''}`}
                                            onClick={() => setFilterStatus('')}
                                        >
                                            全部
                                        </button>
                                        <button
                                            className={`filter-tab ${filterStatus === 'returned' ? 'active' : ''}`}
                                            onClick={() => setFilterStatus('returned')}
                                        >
                                            退還
                                        </button>
                                        <button
                                            className={`filter-tab ${filterStatus === 'active' ? 'active' : ''}`}
                                            onClick={() => setFilterStatus('active')}
                                        >
                                            借出
                                        </button>
                                    </div>
                                </div>

                                {/* 搜索 */}
                                <div className="filter-group">
                                    <label>搜索</label>
                                    <div className="search-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="搜尋編號、房號或姓名"
                                            className="search-input"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Icon name="search" size={20} className="search-icon" />
                                    </div>
                                </div>
                            </div>

                            {/* 表格 */}
                            <div className="modern-table-container">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>編號</th>
                                            <th>物品</th>
                                            <th>房號</th>
                                            <th>借出人</th>
                                            <th>借出時間</th>
                                            <th>歸還時間</th>
                                            <th>經手人</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            // 篩選邏輯
                                            let filtered = rentalHistory;

                                            // 日期範圍篩選
                                            if (dateRangeStart || dateRangeEnd) {
                                                filtered = filtered.filter(rental => {
                                                    const rentalDate = new Date(rental.rental_start_time);
                                                    const start = dateRangeStart ? new Date(dateRangeStart) : null;
                                                    const end = dateRangeEnd ? new Date(dateRangeEnd + 'T23:59:59') : null;

                                                    if (start && rentalDate < start) return false;
                                                    if (end && rentalDate > end) return false;
                                                    return true;
                                                });
                                            }

                                            // 物品類型篩選
                                            if (filterItemType) {
                                                filtered = filtered.filter(rental => rental.type === filterItemType);
                                            }

                                            // 狀態篩選
                                            if (filterStatus) {
                                                filtered = filtered.filter(rental => rental.status === filterStatus);
                                            }

                                            // 搜索篩選
                                            if (searchQuery) {
                                                const query = searchQuery.toLowerCase();
                                                filtered = filtered.filter(rental => {
                                                    const number = rental.type === 'bicycle' ? rental.bicycle_number : rental.quantity?.toString();
                                                    const room = rental.room_number || '';
                                                    const rentedBy = rental.rented_by || '';
                                                    const returnedBy = rental.returned_by || '';

                                                    return (
                                                        number?.toLowerCase().includes(query) ||
                                                        room.toLowerCase().includes(query) ||
                                                        rentedBy.toLowerCase().includes(query) ||
                                                        returnedBy.toLowerCase().includes(query)
                                                    );
                                                });
                                            }

                                            // 渲染結果
                                            if (filtered.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>目前無租借紀錄</td>
                                                    </tr>
                                                );
                                            }

                                            return filtered.map((rental, index) => (
                                                <tr key={`${rental.type}-${rental.id}`}>
                                                    <td>{index + 1}號</td>
                                                    <td>
                                                        {rental.type === 'bicycle'
                                                            ? `腳踏車 ${rental.bicycle_number}號`
                                                            : `雨傘 ${rental.quantity}把`}
                                                    </td>
                                                    <td>{rental.room_number || '-'}</td>
                                                    <td>{rental.rented_by}</td>
                                                    <td>{formatDateTime(rental.rental_start_time)}</td>
                                                    <td>{rental.rental_end_time ? formatDateTime(rental.rental_end_time) : '-'}</td>
                                                    <td>{rental.returned_by || rental.rented_by}</td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>

                                {/* 底部統計和分頁 */}
                                <div className="table-footer">
                                    <span className="table-stats">
                                        共 {(() => {
                                            // 計算篩選後的數量
                                            let filtered = rentalHistory;
                                            if (dateRangeStart || dateRangeEnd) {
                                                filtered = filtered.filter(rental => {
                                                    const rentalDate = new Date(rental.rental_start_time);
                                                    const start = dateRangeStart ? new Date(dateRangeStart) : null;
                                                    const end = dateRangeEnd ? new Date(dateRangeEnd + 'T23:59:59') : null;
                                                    if (start && rentalDate < start) return false;
                                                    if (end && rentalDate > end) return false;
                                                    return true;
                                                });
                                            }
                                            if (filterItemType) filtered = filtered.filter(r => r.type === filterItemType);
                                            if (filterStatus) filtered = filtered.filter(r => r.status === filterStatus);
                                            if (searchQuery) {
                                                const query = searchQuery.toLowerCase();
                                                filtered = filtered.filter(rental => {
                                                    const number = rental.type === 'bicycle' ? rental.bicycle_number : rental.quantity?.toString();
                                                    const room = rental.room_number || '';
                                                    const rentedBy = rental.rented_by || '';
                                                    const returnedBy = rental.returned_by || '';
                                                    return (
                                                        number?.toLowerCase().includes(query) ||
                                                        room.toLowerCase().includes(query) ||
                                                        rentedBy.toLowerCase().includes(query) ||
                                                        returnedBy.toLowerCase().includes(query)
                                                    );
                                                });
                                            }
                                            return filtered.length;
                                        })()} 筆記錄
                                    </span>
                                    <div className="pagination">
                                        <span className="pagination-text">第 1 頁 / 共 1 頁</span>
                                        <button className="pagination-btn" disabled>
                                            <Icon name="chevron-back" size={20} />
                                        </button>
                                        <button className="pagination-btn" disabled>
                                            <Icon name="chevron-forward" size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

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
                {/* 維護紀錄 Modal */}
                <Modal
                    isOpen={showMaintenanceHistoryModal}
                    onClose={() => setShowMaintenanceHistoryModal(false)}
                    title={`維護紀錄 - ${selectedBicycle?.bicycle_number} 號`}
                >
                    <div style={{ padding: 'var(--spacing-md)' }}>
                        {/* 月份選擇器 */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                            padding: '12px',
                            backgroundColor: 'var(--color-background-secondary)',
                            borderRadius: '8px'
                        }}>
                            <button
                                onClick={() => {
                                    const newMonth = new Date(selectedMaintenanceMonth);
                                    newMonth.setMonth(newMonth.getMonth() - 1);
                                    setSelectedMaintenanceMonth(newMonth);
                                }}
                                style={{ padding: '4px 8px', cursor: 'pointer' }}
                            >
                                <Icon name="chevron-back" size={24} />
                            </button>
                            <span style={{ fontWeight: '600', fontSize: '16px' }}>
                                {selectedMaintenanceMonth.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
                            </span>
                            <button
                                onClick={() => {
                                    const newMonth = new Date(selectedMaintenanceMonth);
                                    newMonth.setMonth(newMonth.getMonth() + 1);
                                    setSelectedMaintenanceMonth(newMonth);
                                }}
                                style={{ padding: '4px 8px', cursor: 'pointer' }}
                            >
                                <Icon name="chevron-forward" size={24} />
                            </button>
                        </div>

                        {/* 紀錄列表 */}
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {(() => {
                                // 篩選當前選擇月份的維護紀錄
                                const filteredRecords = maintenanceHistory.filter(record => {
                                    const recordDate = new Date(record.maintenance_date);
                                    return recordDate.getFullYear() === selectedMaintenanceMonth.getFullYear() &&
                                        recordDate.getMonth() === selectedMaintenanceMonth.getMonth();
                                });

                                if (filteredRecords.length === 0) {
                                    return <p className="empty-message">此月份無維護紀錄</p>;
                                }

                                return filteredRecords.map((record, index) => (
                                    <div key={index} style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        backgroundColor: 'var(--color-background-secondary)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <strong>
                                                {record.maintenance_type === 'air_check' ? '車胎打氣' :
                                                    record.maintenance_type === 'cleaning' ? '車身擦拭' : '外觀檢查'}
                                            </strong>
                                            <span>{new Date(record.maintenance_date).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}</span>
                                        </div>
                                        <div><Icon name="person" size={16} /> 執行人：{record.performed_by}</div>
                                        {record.notes && <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>備註：{record.notes}</div>}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </Modal>
                {/* 批次維護 Modal */}
                <Modal
                    isOpen={showBatchMaintenanceModal}
                    onClose={() => setShowBatchMaintenanceModal(false)}
                    title="批次維護"
                >
                    <div style={{ padding: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label>選擇車輛 * ({selectedBicyclesForBatch.length} 台已選)</label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px' }}>
                                {bicycles.filter(b => b.status !== 'rented').map((bicycle) => (
                                    <label key={bicycle.id} style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedBicyclesForBatch.includes(bicycle.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedBicyclesForBatch([...selectedBicyclesForBatch, bicycle.id]);
                                                } else {
                                                    setSelectedBicyclesForBatch(selectedBicyclesForBatch.filter(id => id !== bicycle.id));
                                                }
                                            }}
                                            style={{ marginRight: '8px' }}
                                        />
                                        <span>{bicycle.bicycle_number} 號</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>維護類型 *</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[
                                    { key: 'air_check', label: '車胎打氣' },
                                    { key: 'cleaning', label: '車身擦拭' }
                                ].map((item) => (
                                    <label key={item.key} style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', border: '1px solid var(--color-primary)', borderRadius: '20px', cursor: 'pointer', backgroundColor: batchMaintenanceForm.maintenance_types.includes(item.key) ? 'var(--color-primary)' : 'transparent', color: batchMaintenanceForm.maintenance_types.includes(item.key) ? 'white' : 'var(--color-primary)' }}>
                                        <input
                                            type="checkbox"
                                            checked={batchMaintenanceForm.maintenance_types.includes(item.key)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setBatchMaintenanceForm({
                                                        ...batchMaintenanceForm,
                                                        maintenance_types: [...batchMaintenanceForm.maintenance_types, item.key]
                                                    });
                                                } else {
                                                    setBatchMaintenanceForm({
                                                        ...batchMaintenanceForm,
                                                        maintenance_types: batchMaintenanceForm.maintenance_types.filter(t => t !== item.key)
                                                    });
                                                }
                                            }}
                                            style={{ display: 'none' }}
                                        />
                                        <span>{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>執行人員 *</label>
                            <select
                                value={batchMaintenanceForm.performed_by}
                                onChange={(e) => setBatchMaintenanceForm({ ...batchMaintenanceForm, performed_by: e.target.value })}
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
                            <label>備註（選填）</label>
                            <textarea
                                value={batchMaintenanceForm.notes}
                                onChange={(e) => setBatchMaintenanceForm({ ...batchMaintenanceForm, notes: e.target.value })}
                                className="form-textarea"
                                rows={3}
                                placeholder="選填"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                            <Button variant="secondary" fullWidth onClick={() => setShowBatchMaintenanceModal(false)}>
                                取消
                            </Button>
                            <Button fullWidth onClick={handleBatchMaintenance}>
                                確認建立
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* 編輯租借資訊 Modal */}
                <Modal
                    isOpen={showEditRentalModal}
                    onClose={() => setShowEditRentalModal(false)}
                    title={`編輯${selectedItem?.type === 'bicycle' ? '腳踏車' : '雨傘'}租借資訊`}
                >
                    <div style={{ padding: 'var(--spacing-md)' }}>
                        {selectedItem?.type === 'bicycle' ? (
                            <div className="form-group">
                                <label>車號 *</label>
                                <input
                                    type="text"
                                    value={editRentalForm.bicycle_number}
                                    onChange={(e) => setEditRentalForm({ ...editRentalForm, bicycle_number: e.target.value })}
                                    className="form-input"
                                    placeholder="例如: 1 或 2"
                                />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>數量 *</label>
                                <div className="quantity-selector">
                                    <button
                                        className="quantity-btn"
                                        onClick={() => setEditRentalForm(prev => ({
                                            ...prev,
                                            quantity: Math.max(1, (parseInt(prev.quantity) || 1) - 1)
                                        }))}
                                    >
                                        <Icon name="remove" size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        value={editRentalForm.quantity}
                                        onChange={(e) => setEditRentalForm({
                                            ...editRentalForm,
                                            quantity: Math.max(1, parseInt(e.target.value) || 1)
                                        })}
                                        className="quantity-input"
                                        min="1"
                                    />
                                    <button
                                        className="quantity-btn"
                                        onClick={() => setEditRentalForm(prev => ({
                                            ...prev,
                                            quantity: (parseInt(prev.quantity) || 1) + 1
                                        }))}
                                    >
                                        <Icon name="add" size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>房號</label>
                            <input
                                type="text"
                                value={editRentalForm.room_number}
                                onChange={(e) => setEditRentalForm({ ...editRentalForm, room_number: e.target.value })}
                                className="form-input"
                                placeholder="例如: 501"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                            <Button variant="secondary" fullWidth onClick={() => setShowEditRentalModal(false)}>
                                取消
                            </Button>
                            <Button fullWidth onClick={handleEditRental}>
                                確認更新
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div >
    );
}

export default RentalManagementPage;
