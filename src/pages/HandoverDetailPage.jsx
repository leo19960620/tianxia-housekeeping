import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { handoverAPI } from '../api/handover';
import { itemAPI } from '../api/item';
import { userAPI } from '../api/user';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import FloorSelectorModal from '../components/business/FloorSelectorModal';
import { INVENTORY_STATUS, FLOORS, SHIFTS, SHIFT_TIMES } from '../utils/constants';
import { getTaipeiTimeForInput } from '../utils/timezone';
import './HandoverDetailPage.css';

function HandoverDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [handover, setHandover] = useState(null);

    // Modal 狀態
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showOzoneModal, setShowOzoneModal] = useState(false);
    const [showFloorSelector, setShowFloorSelector] = useState(false);
    const [floorSelectorTarget, setFloorSelectorTarget] = useState('OZONE'); // 'OZONE' or 'INVENTORY'
    const [editingOzoneId, setEditingOzoneId] = useState(null); // 正在編輯的臭氧紀錄 ID

    // 備品相關
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [inventoryForm, setInventoryForm] = useState({
        floor: '',
        roomNumber: '',
        status: INVENTORY_STATUS.OUT,
        selectedItems: {},
    });

    // 臭氧相關
    const [ozoneForm, setOzoneForm] = useState({
        floor: '',
        roomNumbers: [],
        startTime: getTaipeiTimeForInput(),
        durationMinutes: 30,
        notes: '',
    });

    // 編輯模式相關
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        shift: '',
        staffNames: [], // 支援多個員工
    });
    const [users, setUsers] = useState([]); // 所有員工清單
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadData();
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
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await handoverAPI.getById(id);
            if (res.success) {
                setHandover(res.data);
            }
        } catch (error) {
            console.error('載入交接紀錄錯誤:', error);
            alert('無法載入交接紀錄');
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

    // === 編輯相關功能 ===
    const handleEdit = () => {
        // 將 staff_name 字串分割為陣列（假設以逗號分隔）
        const namesArray = handover.staff_name ? handover.staff_name.split(',').map(n => n.trim()) : [];
        setEditForm({
            shift: handover.shift,
            staffNames: namesArray,
        });
        setEditMode(true);
    };

    const handleSave = async () => {
        if (!editForm.shift) {
            alert('請選擇班別');
            return;
        }
        if (editForm.staffNames.length === 0) {
            alert('請至少選擇一位員工');
            return;
        }

        try {
            await handoverAPI.update(id, {
                shift: editForm.shift,
                staffName: editForm.staffNames.join(', '), // 將多名員工用逗號連接
            });
            setEditMode(false);
            loadData(); // 重新載入資料
            alert('資料已更新');
        } catch (error) {
            alert(error.message || '更新失敗');
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        setEditForm({
            shift: '',
            staffNames: [],
        });
    };

    const toggleUserSelection = (userName) => {
        const currentSelected = editForm.staffNames;
        if (currentSelected.includes(userName)) {
            setEditForm({
                ...editForm,
                staffNames: currentSelected.filter(name => name !== userName)
            });
        } else {
            setEditForm({
                ...editForm,
                staffNames: [...currentSelected, userName]
            });
        }
    };

    const loadItems = async () => {
        try {
            const res = await itemAPI.getAll();
            if (res.success) {
                setItems(res.data);
                const uniqueCategories = [...new Set(res.data.map(item => item.category))];
                setCategories(uniqueCategories);
                const initialExpanded = {};
                uniqueCategories.forEach(cat => {
                    initialExpanded[cat] = false;
                });
                setExpandedCategories(initialExpanded);
            }
        } catch (error) {
            console.error('載入備品失敗:', error);
        }
    };

    // 移除 handleDelete 和 toggleEditMode 函數

    // === 備品相關 ===
    const openInventoryModal = () => {
        setInventoryForm({
            floor: '',
            roomNumber: '',
            status: INVENTORY_STATUS.OUT,
            selectedItems: {},
        });
        setShowInventoryModal(true);
    };

    const updateItemQuantity = (itemId, change) => {
        const current = inventoryForm.selectedItems[itemId] || 0;
        const newQty = current + change;

        if (newQty <= 0) {
            const { [itemId]: removed, ...rest } = inventoryForm.selectedItems;
            setInventoryForm({ ...inventoryForm, selectedItems: rest });
        } else {
            setInventoryForm({
                ...inventoryForm,
                selectedItems: {
                    ...inventoryForm.selectedItems,
                    [itemId]: newQty,
                },
            });
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const confirmInventoryRecord = async () => {
        if (!inventoryForm.roomNumber.trim()) {
            alert('請輸入房號');
            return;
        }

        const selectedCount = Object.keys(inventoryForm.selectedItems).length;
        if (selectedCount === 0) {
            alert('請至少選擇一個物品');
            return;
        }

        try {
            // 將選擇的物品轉換為紀錄
            const newRecords = Object.entries(inventoryForm.selectedItems).map(
                ([itemId, quantity]) => {
                    const item = items.find(i => i.id === parseInt(itemId));

                    // 嘗試取得或推導樓層
                    let floor = inventoryForm.floor;
                    if (!floor && inventoryForm.roomNumber) {
                        const match = inventoryForm.roomNumber.match(/^(\d+)/);
                        if (match) {
                            // 根據房號長度判斷樓層
                            // 3位數: 第一碼 (501 -> 5F)
                            // 4位數: 前兩碼 (1201 -> 12F)
                            const roomNum = inventoryForm.roomNumber;
                            if (roomNum.length === 3) {
                                floor = roomNum.charAt(0) + 'F';
                            } else if (roomNum.length >= 4) {
                                floor = roomNum.substring(0, 2) + 'F';
                            }
                        }
                    }

                    return {
                        item_id: item.id,
                        itemType: item.name, // 改為 camelCase 以符合後端預期
                        category: item.category,
                        roomNumber: inventoryForm.roomNumber, // 改為 camelCase
                        quantity: parseInt(quantity, 10),
                        status: inventoryForm.status, // 恢復為原始值 (中文 '收'/'放')
                    };
                }
            );

            // 逐一新增備品記錄
            for (const record of newRecords) {
                await handoverAPI.addInventory(id, record);
            }

            alert('備品記錄已新增');
            setShowInventoryModal(false);
            loadData(); // 重新載入資料
        } catch (error) {
            alert(error.message || '新增失敗');
        }
    };

    const deleteInventoryRecord = async (recordId) => {
        if (!confirm('確定要刪除此備品記錄嗎?')) return;

        try {
            await handoverAPI.deleteInventory(recordId);
            alert('已刪除');
            loadData();
        } catch (error) {
            alert(error.message || '刪除失敗');
        }
    };

    // === 臭氧相關 ===
    const openOzoneModal = () => {
        // 取得當前本地時間字串 (YYYY-MM-DDTHH:mm)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        setEditingOzoneId(null); // 清除編輯狀態
        setOzoneForm({
            floor: '',
            roomNumbers: [],
            startTime: currentDateTime,
            durationMinutes: 30,
            notes: '',
        });
        setShowOzoneModal(true);
    };

    const openEditOzoneModal = (record) => {
        // 將 ISO 時間轉換為本地 datetime-local 格式 (修正時區問題)
        let startTime = '';
        if (record.start_time) {
            const date = new Date(record.start_time);
            // 修正：手動調整時區偏移，確保轉換為本地時間字串
            const offsetMs = date.getTimezoneOffset() * 60 * 1000;
            const localDate = new Date(date.getTime() - offsetMs);
            startTime = localDate.toISOString().slice(0, 16);
        }

        setEditingOzoneId(record.key_id);
        setOzoneForm({
            floor: record.floor,
            roomNumbers: record.room_numbers || [],
            startTime: startTime,
            durationMinutes: record.duration_minutes || 30,
            notes: record.notes || '',
        });
        setShowOzoneModal(true);
    };

    const handleFloorSelect = (floor) => {
        if (floorSelectorTarget === 'OZONE') {
            setOzoneForm({ ...ozoneForm, floor });
        } else {
            setInventoryForm({ ...inventoryForm, floor });
        }
        setShowFloorSelector(false);
    };

    const handleInventoryRoomSelect = (room) => {
        setInventoryForm({ ...inventoryForm, roomNumber: room });
    };

    const toggleRoomNumber = (roomNumber) => {
        const current = ozoneForm.roomNumbers;
        if (current.includes(roomNumber)) {
            setOzoneForm({
                ...ozoneForm,
                roomNumbers: current.filter(r => r !== roomNumber),
            });
        } else {
            setOzoneForm({
                ...ozoneForm,
                roomNumbers: [...current, roomNumber],
            });
        }
    };

    const confirmOzoneRecord = async () => {
        if (!ozoneForm.floor) {
            alert('請選擇樓層');
            return;
        }

        const ozoneData = {
            floor: ozoneForm.floor,
            roomNumbers: ozoneForm.roomNumbers,
            startTime: ozoneForm.startTime,
            durationMinutes: ozoneForm.durationMinutes,
            notes: ozoneForm.notes,
        };

        // 關閉 Modal 並清除編輯狀態（立即反應）
        setShowOzoneModal(false);
        const currentEditingId = editingOzoneId;
        setEditingOzoneId(null);

        if (currentEditingId) {
            // === 編輯模式：樂觀更新 ===
            // 1. 先更新本地狀態（立即顯示）
            const previousRecords = handover.ozone_records;
            const updatedRecords = handover.ozone_records.map(record => {
                if (record.key_id === currentEditingId) {
                    // 計算結束時間
                    const duration = ozoneData.durationMinutes || 30;
                    const start = new Date(ozoneData.startTime);
                    const end = new Date(start.getTime() + duration * 60000);

                    return {
                        ...record,
                        floor: ozoneData.floor,
                        room_numbers: ozoneData.roomNumbers,
                        start_time: ozoneData.startTime,
                        duration_minutes: ozoneData.durationMinutes,
                        end_time: end.toISOString(),
                        notes: ozoneData.notes,
                    };
                }
                return record;
            });

            setHandover({
                ...handover,
                ozone_records: updatedRecords,
            });

            // 2. 再呼叫 API 更新資料庫
            try {
                await handoverAPI.updateOzone(currentEditingId, ozoneData);
                // 成功後靜默完成，不需要 alert 和重新載入
            } catch (error) {
                // 如果 API 失敗，回滾到原本的狀態
                setHandover({
                    ...handover,
                    ozone_records: previousRecords,
                });
                alert(error.message || '更新失敗，已恢復原始資料');
            }
        } else {
            // === 新增模式 ===
            try {
                // 新增時仍需要等待 API 回應以取得完整資料
                const response = await handoverAPI.addOzone(id, ozoneData);

                // 樂觀新增到本地狀態
                if (response.success && response.data) {
                    setHandover({
                        ...handover,
                        ozone_records: [...(handover.ozone_records || []), response.data],
                    });
                } else {
                    // 如果沒有返回資料，則重新載入
                    loadData();
                }
            } catch (error) {
                alert(error.message || '新增失敗');
            }
        }
    };

    const deleteOzoneRecord = async (ozoneId) => {
        if (!confirm('確定要刪除此臭氧記錄嗎?')) return;

        // 樂觀刪除：先從本地狀態移除
        const previousRecords = handover.ozone_records;
        const updatedRecords = handover.ozone_records.filter(record => record.key_id !== ozoneId);

        setHandover({
            ...handover,
            ozone_records: updatedRecords,
        });

        // 再呼叫 API 刪除
        try {
            await handoverAPI.deleteOzone(ozoneId);
            // 成功後靜默完成，不需要 alert
        } catch (error) {
            // 如果 API 失敗，回滾到原本的狀態
            setHandover({
                ...handover,
                ozone_records: previousRecords,
            });
            alert(error.message || '刪除失敗，已恢復資料');
        }
    };



    // 取得樓層的房號列表
    const getRoomsForFloor = (floor) => {
        const floorConfig = FLOORS.find(f => f.id === floor || f.label === floor);
        return floorConfig?.rooms || [];
    };

    // 按分類分組物品
    const itemsByCategory = categories.map(category => ({
        category,
        items: items.filter(item => item.category === category),
    }));

    if (loading) {
        return (
            <div className="page handover-detail-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>載入中...</p>
                </div>
            </div>
        );
    }

    if (!handover) {
        return (
            <div className="page handover-detail-page">
                <div className="page-content">
                    <p>找不到交接紀錄</p>
                </div>
            </div>
        );
    }

    // 按房號分組備品
    const inventoryByRoom = handover.inventory_records?.reduce((acc, record) => {
        if (!acc[record.room_number]) {
            acc[record.room_number] = [];
        }
        acc[record.room_number].push(record);
        return acc;
    }, {});

    // 計算臭氧結束時間
    const calculateEndTime = (startTime, durationMinutes) => {
        if (!startTime || !durationMinutes) return null;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        return end;
    };

    return (
        <div className="page handover-detail-page">
            <div className="handover-detail-content">
                {/* 基本資訊 - 全寬 */}
                <div className="info-card">
                    {!editMode ? (
                        <>
                            <div className="info-header">
                                <div className="shift-badge">{handover.shift}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <div className="timestamp">
                                        <Icon name="time-outline" size={16} />
                                        {new Date(handover.timestamp || handover.created_at).toLocaleString('zh-TW', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        })}
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={handleEdit}>
                                        <Icon name="create-outline" size={16} />
                                        編輯
                                    </Button>
                                </div>
                            </div>
                            <div className="staff-name">員工: {handover.staff_name}</div>
                            {handover.handover_notes && (
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'rgba(255, 255, 255, 0.8)', marginTop: 'var(--spacing-xs)' }}>
                                    備註: {handover.handover_notes}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="info-header" style={{ marginBottom: 'var(--spacing-md)' }}>
                                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>編輯交接紀錄</h3>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <Button size="sm" variant="secondary" onClick={handleCancel}>
                                        取消
                                    </Button>
                                    <Button size="sm" onClick={handleSave}>
                                        <Icon name="save-outline" size={16} />
                                        儲存
                                    </Button>
                                </div>
                            </div>

                            {/* 班別選擇 */}
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600, color: 'var(--color-text)' }}>
                                    班別 *
                                </label>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    {Object.values(SHIFTS).map(shift => (
                                        <button
                                            key={shift}
                                            style={{
                                                flex: 1,
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                border: '1.5px solid',
                                                borderColor: editForm.shift === shift ? 'var(--color-primary)' : 'var(--color-border)',
                                                borderRadius: 'var(--radius-md)',
                                                background: editForm.shift === shift ? 'var(--color-primary)' : 'transparent',
                                                color: editForm.shift === shift ? 'white' : 'var(--color-text)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontWeight: editForm.shift === shift ? 600 : 400,
                                            }}
                                            onClick={() => setEditForm({ ...editForm, shift })}
                                        >
                                            <div style={{ fontSize: 'var(--font-size-md)' }}>{shift}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', marginTop: '4px', color: editForm.shift === shift ? 'rgba(255, 255, 255, 0.9)' : 'var(--color-text-secondary)' }}>
                                                {SHIFT_TIMES[shift]}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 員工選擇 - 改為下拉選單 */}
                            <div ref={dropdownRef}>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600, color: 'var(--color-text)' }}>
                                    員工姓名 * (可複選)
                                </label>
                                <div
                                    style={{
                                        position: 'relative',
                                        padding: 'var(--spacing-md)',
                                        border: '1.5px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        minHeight: '44px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: editForm.staffNames.length > 0 ? 'var(--color-text)' : 'var(--color-text-secondary)',
                                        justifyContent: 'space-between'
                                    }}
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                >
                                    <span>
                                        {editForm.staffNames.length > 0 ? editForm.staffNames.join(', ') : '請選擇員工'}
                                    </span>
                                    <Icon name={showUserDropdown ? "chevron-up" : "chevron-down"} size={16} />

                                    {/* 下拉選單列表 - 改為向上展開 */}
                                    {showUserDropdown && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: 0,
                                            right: 0,
                                            marginBottom: '4px',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
                                            zIndex: 100,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            border: '1px solid #e0e0e0',
                                            padding: '4px 0',
                                            color: '#333',
                                            textAlign: 'left'
                                        }}
                                            onClick={(e) => e.stopPropagation()} // 防止點擊內部關閉
                                        >
                                            {users.length > 0 ? (
                                                users.map(user => (
                                                    <div
                                                        key={user.id}
                                                        onClick={() => toggleUserSelection(user.full_name)}
                                                        style={{
                                                            padding: '10px 16px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            cursor: 'pointer',
                                                            backgroundColor: editForm.staffNames.includes(user.full_name) ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
                                                            transition: 'background-color 0.2s',
                                                            color: '#333'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = editForm.staffNames.includes(user.full_name) ? 'rgba(46, 125, 50, 0.12)' : '#f5f5f5'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = editForm.staffNames.includes(user.full_name) ? 'rgba(46, 125, 50, 0.08)' : 'transparent'}
                                                    >
                                                        <div style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '4px',
                                                            border: `2px solid ${editForm.staffNames.includes(user.full_name) ? '#2e7d32' : '#bdbdbd'}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: editForm.staffNames.includes(user.full_name) ? '#2e7d32' : 'white'
                                                        }}>
                                                            {editForm.staffNames.includes(user.full_name) && (
                                                                <Icon name="checkmark" size={12} color="white" />
                                                            )}
                                                        </div>
                                                        <span style={{
                                                            fontWeight: editForm.staffNames.includes(user.full_name) ? 600 : 400
                                                        }}>
                                                            {user.full_name}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                                                    載入中或無使用者資料...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 兩欄佈局 */}
                <div className="detail-grid">
                    {/* 左欄：收放備品 */}
                    <div className="detail-column">
                        <div className="detail-section">
                            <div className="detail-section-header">
                                <h2 className="detail-section-title">
                                    <Icon name="cube-outline" size={20} />
                                    收放備品
                                </h2>
                                <Button size="sm" onClick={openInventoryModal}>
                                    <Icon name="add-outline" size={16} />
                                    新增
                                </Button>
                            </div>

                            {Object.keys(inventoryByRoom || {}).length === 0 ? (
                                <div className="empty-state">
                                    <p>尚無備品紀錄</p>
                                </div>
                            ) : (
                                Object.entries(inventoryByRoom).map(([roomNumber, records]) => (
                                    <div key={roomNumber} className="room-group">
                                        <div className="room-title">
                                            <Icon name="home-outline" size={18} />
                                            {roomNumber}
                                        </div>
                                        {records.map((record, idx) => (
                                            <div key={idx} className="inventory-item">
                                                <div className="item-info">
                                                    <span
                                                        className={`status-badge ${record.status === INVENTORY_STATUS.IN ? 'in' : 'out'
                                                            }`}
                                                    >
                                                        {record.status}
                                                    </span>
                                                    <span className="item-text">
                                                        {record.item_type} × {record.quantity}
                                                    </span>
                                                </div>
                                                <button
                                                    className="delete-btn-inline"
                                                    onClick={() => deleteInventoryRecord(record.id)}
                                                    title="刪除"
                                                >
                                                    <Icon name="trash-outline" size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 右欄：臭氧紀錄 & 交班事項 */}
                    <div className="detail-column">
                        {/* 臭氧紀錄 */}
                        <div className="detail-section">
                            <div className="detail-section-header">
                                <h2 className="detail-section-title">
                                    <Icon name="water-outline" size={20} />
                                    臭氧紀錄
                                </h2>
                                <Button size="sm" onClick={openOzoneModal}>
                                    <Icon name="add-outline" size={16} />
                                    新增
                                </Button>
                            </div>

                            {handover.ozone_records?.length === 0 ? (
                                <div className="empty-state">
                                    <p>尚無臭氧紀錄</p>
                                </div>
                            ) : (
                                handover.ozone_records?.map((record, idx) => {
                                    const endTime = calculateEndTime(record.start_time, record.duration_minutes);
                                    return (
                                        <div key={idx} className="ozone-card" style={{ background: '#e3f2fd', border: 'none' }}>
                                            <div className="ozone-header">
                                                <div style={{ flex: 1 }}>
                                                    <div className="ozone-floor" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '1.1em', color: '#1565c0' }}>{record.floor}</span>
                                                        <span className="room-count" style={{ background: 'rgba(21, 101, 192, 0.1)', color: '#1565c0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85em' }}>
                                                            {record.room_numbers?.length || 0} 間
                                                        </span>
                                                    </div>
                                                    <div className="ozone-rooms" style={{ color: '#546e7a', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                                                        <Icon name="home-outline" size={16} style={{ marginTop: '2px' }} />
                                                        <span style={{ lineHeight: 1.4 }}>{record.room_numbers?.sort((a, b) => a.localeCompare(b)).join('、') || '無房號'}</span>
                                                    </div>
                                                    {record.start_time && (
                                                        <div className="ozone-time" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#546e7a', fontSize: '0.9em' }}>
                                                            <Icon name="time-outline" size={16} />
                                                            <span>
                                                                {new Date(record.start_time).toLocaleTimeString('zh-TW', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: false
                                                                })}
                                                                {endTime && (
                                                                    <>
                                                                        {' - '}
                                                                        {endTime.toLocaleTimeString('zh-TW', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                            hour12: false
                                                                        })}
                                                                    </>
                                                                )}
                                                            </span>
                                                            {record.duration_minutes && (
                                                                <span className="duration-badge" style={{ background: '#bbdefb', color: '#1565c0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em' }}>
                                                                    {record.duration_minutes}分鐘
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {record.notes && (
                                                        <div className="ozone-notes" style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px', fontSize: '0.9em', color: '#455a64' }}>
                                                            備註: {record.notes}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flex: 'none' }}>
                                                    <button
                                                        className="delete-btn-inline"
                                                        onClick={() => openEditOzoneModal(record)}
                                                        title="編輯"
                                                        style={{ color: '#1976d2' }}
                                                    >
                                                        <Icon name="create-outline" size={18} />
                                                    </button>
                                                    <button
                                                        className="delete-btn-inline"
                                                        onClick={() => deleteOzoneRecord(record.key_id)}
                                                        title="刪除"
                                                        style={{ color: '#ef5350' }}
                                                    >
                                                        <Icon name="trash-outline" size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 備品Modal - 重用 NewHandoverPage 的邏輯 */}
            <Modal
                isOpen={showInventoryModal}
                onClose={() => setShowInventoryModal(false)}
                title="新增備品紀錄"
                size="lg"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxHeight: '70vh', overflow: 'auto' }}>
                    {/* 樓層與房號 */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            房號 *
                        </label>

                        {/* 樓層選擇 */}
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <div
                                style={{
                                    padding: 'var(--spacing-sm)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    color: inventoryForm.floor ? 'var(--color-text)' : 'var(--color-text-secondary)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'var(--color-background-subtle)'
                                }}
                                onClick={() => {
                                    setFloorSelectorTarget('INVENTORY');
                                    setShowFloorSelector(true);
                                }}
                            >
                                <span>{inventoryForm.floor || '點擊選擇樓層'}</span>
                                <Icon name="chevron-down-outline" size={16} />
                            </div>
                        </div>

                        {/* 房號選擇列表 */}
                        {inventoryForm.floor && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                                gap: 'var(--spacing-xs)',
                                padding: 'var(--spacing-sm)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                maxHeight: '180px',
                                overflowY: 'auto',
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                {getRoomsForFloor(inventoryForm.floor).length > 0 ? (
                                    getRoomsForFloor(inventoryForm.floor).map(room => (
                                        <div
                                            key={room}
                                            style={{
                                                padding: 'var(--spacing-xs)',
                                                textAlign: 'center',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer',
                                                background: inventoryForm.roomNumber === room ? 'var(--color-primary)' : 'white',
                                                color: inventoryForm.roomNumber === room ? 'white' : 'var(--color-text)',
                                                fontSize: 'var(--font-size-sm)',
                                                fontWeight: inventoryForm.roomNumber === room ? 600 : 400,
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => handleInventoryRoomSelect(room)}
                                        >
                                            {room}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--spacing-sm)' }}>
                                        無房號資料
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 手動輸入備用 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>或手動輸入:</span>
                            <input
                                type="text"
                                style={{
                                    flex: 1,
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--font-size-sm)',
                                }}
                                value={inventoryForm.roomNumber}
                                onChange={(e) => setInventoryForm({ ...inventoryForm, roomNumber: e.target.value })}
                                placeholder="輸入房號 (例: 301)"
                            />
                        </div>
                    </div>

                    {/* 狀態 */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            狀態 *
                        </label>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <Button
                                variant={inventoryForm.status === INVENTORY_STATUS.IN ? 'success' : 'secondary'}
                                fullWidth
                                onClick={() => setInventoryForm({ ...inventoryForm, status: INVENTORY_STATUS.IN })}
                            >
                                {INVENTORY_STATUS.IN}
                            </Button>
                            <Button
                                variant={inventoryForm.status === INVENTORY_STATUS.OUT ? 'primary' : 'secondary'}
                                fullWidth
                                onClick={() => setInventoryForm({ ...inventoryForm, status: INVENTORY_STATUS.OUT })}
                            >
                                {INVENTORY_STATUS.OUT}
                            </Button>
                        </div>
                    </div>

                    {/* 選擇物品 */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            選擇物品 (點擊分類展開)
                        </label>
                        {itemsByCategory.map(({ category, items: categoryItems }) => {
                            const isExpanded = expandedCategories[category];
                            const categorySelectedCount = categoryItems.filter(
                                item => inventoryForm.selectedItems[item.id]
                            ).length;

                            return (
                                <div key={category} style={{ marginBottom: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            padding: 'var(--spacing-md)',
                                            background: 'var(--color-card)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                        onClick={() => toggleCategory(category)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <span>{isExpanded ? '▼' : '▶'}</span>
                                            <span style={{ fontWeight: 600 }}>{category}</span>
                                            {categorySelectedCount > 0 && (
                                                <span style={{
                                                    background: 'var(--color-primary)',
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: 'var(--font-size-xs)',
                                                }}>
                                                    {categorySelectedCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div style={{ padding: 'var(--spacing-md)', background: 'white' }}>
                                            {categoryItems.map(item => {
                                                const quantity = inventoryForm.selectedItems[item.id] || 0;
                                                return (
                                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--color-border)' }}>
                                                        <span>{item.name}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                            <button
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    border: '1px solid var(--color-border)',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    background: 'white',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => updateItemQuantity(item.id, -1)}
                                                            >
                                                                −
                                                            </button>
                                                            <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
                                                            <button
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    border: '1px solid var(--color-border)',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    background: 'white',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onClick={() => updateItemQuantity(item.id, 1)}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                        <Button variant="secondary" fullWidth onClick={() => setShowInventoryModal(false)}>
                            取消
                        </Button>
                        <Button fullWidth onClick={confirmInventoryRecord}>
                            確認新增 ({Object.keys(inventoryForm.selectedItems).length} 項)
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* 臭氧Modal */}
            <Modal
                isOpen={showOzoneModal}
                onClose={() => {
                    setShowOzoneModal(false);
                    setEditingOzoneId(null);
                }}
                title={editingOzoneId ? "編輯臭氧紀錄" : "新增臭氧紀錄"}
                size="lg"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {/* 樓層 */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            樓層 *
                        </label>
                        <div
                            style={{
                                padding: 'var(--spacing-sm)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                color: ozoneForm.floor ? 'var(--color-text)' : 'var(--color-text-secondary)',
                            }}
                            onClick={() => {
                                setFloorSelectorTarget('OZONE');
                                setShowFloorSelector(true);
                            }}
                        >
                            {ozoneForm.floor || '請選擇樓層'}
                        </div>
                    </div>

                    {/* 房號 */}
                    {ozoneForm.floor && (
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                                房號 (已選 {ozoneForm.roomNumbers.length} 間)
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 'var(--spacing-xs)', maxHeight: '200px', overflow: 'auto', padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                {getRoomsForFloor(ozoneForm.floor).map(room => (
                                    <div
                                        key={room}
                                        style={{
                                            padding: 'var(--spacing-xs)',
                                            textAlign: 'center',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            background: ozoneForm.roomNumbers.includes(room) ? 'var(--color-primary)' : 'white',
                                            color: ozoneForm.roomNumbers.includes(room) ? 'white' : 'var(--color-text)',
                                        }}
                                        onClick={() => toggleRoomNumber(room)}
                                    >
                                        {room}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 時間和持續時間 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                                開始時間
                            </label>
                            <input
                                type="datetime-local"
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-sm)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--font-size-base)',
                                }}
                                value={ozoneForm.startTime}
                                onChange={(e) => setOzoneForm({ ...ozoneForm, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                                持續時間(分鐘)
                            </label>
                            <input
                                type="number"
                                style={{
                                    width: '100%',
                                    padding: 'var(--spacing-sm)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--font-size-base)',
                                }}
                                value={ozoneForm.durationMinutes}
                                onChange={(e) => setOzoneForm({ ...ozoneForm, durationMinutes: parseInt(e.target.value) || 30 })}
                                min="1"
                            />
                        </div>
                    </div>

                    {/* 備註 */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            備註
                        </label>
                        <textarea
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: 'var(--spacing-sm)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-base)',
                                fontFamily: 'inherit',
                            }}
                            value={ozoneForm.notes}
                            onChange={(e) => setOzoneForm({ ...ozoneForm, notes: e.target.value })}
                            placeholder="選填"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                        <Button variant="secondary" fullWidth onClick={() => {
                            setShowOzoneModal(false);
                            setEditingOzoneId(null);
                        }}>
                            取消
                        </Button>
                        <Button fullWidth onClick={confirmOzoneRecord}>
                            {editingOzoneId ? '確認更新' : '確認新增'}
                        </Button>
                    </div>
                </div>
            </Modal>



            {/* 樓層選擇Modal */}
            <FloorSelectorModal
                visible={showFloorSelector}
                onSelect={handleFloorSelect}
                onCancel={() => setShowFloorSelector(false)}
            />


        </div >
    );
}

export default HandoverDetailPage;
