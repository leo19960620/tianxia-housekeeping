import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handoverAPI } from '../api/handover';
import { itemAPI } from '../api/item';
import { roomAPI } from '../api/room';
import { SHIFTS, SHIFT_TIMES, INVENTORY_STATUS, FLOORS } from '../utils/constants';
import MultiUserPicker from '../components/business/MultiUserPicker';
import FloorSelectorModal from '../components/business/FloorSelectorModal';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Icon from '../components/common/Icon';
import './NewHandoverPage.css';

function NewHandoverPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [floors, setFloors] = useState([]); // 從資料庫載入的樓層資料
    const [roomsByFloor, setRoomsByFloor] = useState({}); // 依樓層分組的房號

    // Modal 狀態
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showOzoneModal, setShowOzoneModal] = useState(false);
    const [showFloorSelector, setShowFloorSelector] = useState(false);

    // 表單資料
    const [formData, setFormData] = useState({
        shift: '',
        staffNames: [],
        handoverNotes: '',
        inventoryRecords: [],
        ozoneRecords: [],

    });

    const [selectedUsers, setSelectedUsers] = useState([]);

    // 取得當前本地時間 (UTC+8) 的字串格式
    const getCurrentLocalTime = () => {
        const now = new Date();
        // 將 UTC 時間轉換為 UTC+8
        const localTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        return localTime.toISOString().slice(0, 16);
    };

    // 備品表單
    const [inventoryForm, setInventoryForm] = useState({
        roomNumber: '',
        selectedFloor: '', // 選擇的樓層
        status: INVENTORY_STATUS.IN,  // 預設為「收」
        selectedItems: {}, // {item_id: quantity}
    });

    // 分類展開狀態
    const [expandedCategories, setExpandedCategories] = useState({});

    // 臭氧表單
    const [ozoneForm, setOzoneForm] = useState({
        floor: '',
        roomNumbers: [],
        startTime: getCurrentLocalTime(),
        durationMinutes: 30,
    });



    useEffect(() => {
        loadItems();
        loadRooms();
    }, []);

    const loadItems = async () => {
        try {
            const res = await itemAPI.getAll();
            if (res.success) {
                setItems(res.data);
                const uniqueCategories = [...new Set(res.data.map(item => item.category))];
                setCategories(uniqueCategories);

                // 初始化展開狀態
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

    const loadRooms = async () => {
        try {
            const res = await roomAPI.getAll();
            if (res.success) {
                setFloors(res.data);
                // 建立樓層 -> 房號的對應
                const mapping = {};
                res.data.forEach(floor => {
                    mapping[floor.id] = floor.rooms;
                });
                setRoomsByFloor(mapping);
            }
        } catch (error) {
            console.error('載入房號資料失敗:', error);
            // 如果載入失敗，使用前端常數作為備用
            setFloors(FLOORS);
            const mapping = {};
            FLOORS.forEach(floor => {
                mapping[floor.id] = floor.rooms;
            });
            setRoomsByFloor(mapping);
        }
    };

    const selectShift = (shift) => {
        setFormData({ ...formData, shift });
    };

    // === 備品相關 ===
    const openInventoryModal = () => {
        setInventoryForm({
            roomNumber: '',
            selectedFloor: '',
            status: INVENTORY_STATUS.IN,  // 預設為「收」
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

    const confirmInventoryRecord = () => {
        if (!inventoryForm.roomNumber.trim()) {
            alert('請輸入房號');
            return;
        }

        const selectedCount = Object.keys(inventoryForm.selectedItems).length;
        if (selectedCount === 0) {
            alert('請至少選擇一個物品');
            return;
        }

        // 將選擇的物品轉換為紀錄
        const newRecords = Object.entries(inventoryForm.selectedItems).map(
            ([itemId, quantity]) => {
                const item = items.find(i => i.id === parseInt(itemId));
                return {
                    status: inventoryForm.status,
                    category: item.category,
                    item_id: item.id,
                    itemType: item.name,
                    roomNumber: inventoryForm.roomNumber,
                    quantity,
                };
            }
        );

        setFormData({
            ...formData,
            inventoryRecords: [...formData.inventoryRecords, ...newRecords],
        });

        setShowInventoryModal(false);
    };

    const removeInventoryRecord = (index) => {
        const updated = formData.inventoryRecords.filter((_, i) => i !== index);
        setFormData({ ...formData, inventoryRecords: updated });
    };

    // === 臭氧相關 ===
    const openOzoneModal = () => {
        setOzoneForm({
            floor: '',
            roomNumbers: [],
            startTime: getCurrentLocalTime(),  // 使用當前本地時間 (UTC+8)
            durationMinutes: 30,
        });
        setShowOzoneModal(true);
    };

    const handleFloorSelect = (floor) => {
        setOzoneForm({ ...ozoneForm, floor });
        setShowFloorSelector(false);
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

    const confirmOzoneRecord = () => {
        if (!ozoneForm.floor) {
            alert('請選擇樓層');
            return;
        }

        const newRecord = {
            floor: ozoneForm.floor,
            roomNumbers: ozoneForm.roomNumbers,
            startTime: ozoneForm.startTime,
            durationMinutes: ozoneForm.durationMinutes,
            _tempId: Date.now(),
        };

        setFormData({
            ...formData,
            ozoneRecords: [...formData.ozoneRecords, newRecord],
        });

        setShowOzoneModal(false);
    };

    const removeOzoneRecord = (index) => {
        const updated = formData.ozoneRecords.filter((_, i) => i !== index);
        setFormData({ ...formData, ozoneRecords: updated });
    };



    // === 提交 ===
    const handleSubmit = async () => {
        if (!formData.shift) {
            alert('請選擇班別');
            return;
        }
        if (formData.staffNames.length === 0) {
            alert('請至少選擇一位員工');
            return;
        }

        setLoading(true);
        try {
            // 將前端的 staffNames 陣列轉換為後端期望的 staffName 字串
            const submitData = {
                ...formData,
                staffName: formData.staffNames.join(', '), // 轉換為逗號分隔的字串
            };
            // 移除 staffNames 避免傳送不必要的欄位
            delete submitData.staffNames;

            await handoverAPI.create(submitData);
            alert('交接紀錄已建立');
            navigate('/');
        } catch (error) {
            alert(error.message || '建立失敗,請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    // 按分類分組物品
    const itemsByCategory = categories.map(category => ({
        category,
        items: items.filter(item => item.category === category),
    }));

    // 取得樓層的房號列表
    const getRoomsForFloor = (floor) => {
        const floorConfig = FLOORS.find(f => f.id === floor || f.label === floor);
        return floorConfig?.rooms || [];
    };

    return (
        <div className="page new-handover-page">
            <div className="new-handover-content">
                {/* 基本資訊卡片 - 深綠色漸變背景 */}
                <div className="info-card">
                    {/* 班別選擇 */}
                    <div className="shift-selection">
                        <label className="shift-selection-label">班別 *</label>
                        <div className="shift-buttons">
                            {Object.values(SHIFTS).map((shift) => (
                                <div
                                    key={shift}
                                    className={`shift-button ${formData.shift === shift ? 'active' : ''}`}
                                    onClick={() => selectShift(shift)}
                                >
                                    <div className="shift-button-text">{shift}</div>
                                    <div className="shift-button-time">{SHIFT_TIMES[shift]}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 員工選擇 */}
                    <div className="staff-selection">
                        <label className="staff-selection-label">員工姓名 (可複選) *</label>
                        <div
                            className={`staff-input ${formData.staffNames.length > 0 ? 'selected' : 'placeholder'}`}
                            onClick={() => setShowUserPicker(true)}
                        >
                            {formData.staffNames.length > 0
                                ? formData.staffNames.join(', ')
                                : '點擊選擇員工'}
                        </div>
                    </div>
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

                            {formData.inventoryRecords.length === 0 ? (
                                <div className="empty-state">
                                    <p>尚無備品紀錄</p>
                                </div>
                            ) : (
                                formData.inventoryRecords.map((record, index) => (
                                    <div key={index} className="record-card">
                                        <div className="record-header">
                                            <div className="record-header-left">
                                                <span className={`status-badge ${record.status === '收' ? 'in' : 'out'}`}>
                                                    {record.status}
                                                </span>
                                                <span className="room-number">{record.roomNumber}</span>
                                            </div>
                                            <button className="delete-button" onClick={() => removeInventoryRecord(index)}>
                                                <Icon name="trash-outline" size={16} />
                                            </button>
                                        </div>
                                        <div className="record-text">
                                            {record.itemType} × {record.quantity}
                                        </div>
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

                            {formData.ozoneRecords.length === 0 ? (
                                <div className="empty-state">
                                    <p>尚無臭氧紀錄</p>
                                </div>
                            ) : (
                                formData.ozoneRecords.map((record, index) => (
                                    <div key={record._tempId || index} className="record-card">
                                        <div className="record-header">
                                            <div className="record-header-left">
                                                <span className="room-number">{record.floor}</span>
                                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                                    ({record.roomNumbers.length} 間)
                                                </span>
                                            </div>
                                            <button className="delete-button" onClick={() => removeOzoneRecord(index)}>
                                                <Icon name="trash-outline" size={16} />
                                            </button>
                                        </div>
                                        <div className="record-text">
                                            {record.roomNumbers.sort().join('、') || '無房號'}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                            {(() => {
                                                const start = new Date(record.startTime);
                                                const activeStartTimeStr = start.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
                                                let endTimeStr = '';
                                                if (record.durationMinutes) {
                                                    const end = new Date(start.getTime() + record.durationMinutes * 60000);
                                                    endTimeStr = end.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
                                                }
                                                return `${activeStartTimeStr} - ${endTimeStr} (${record.durationMinutes}分鐘)`;
                                            })()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>


                    </div>
                </div>

                {/* 提交按鈕 */}
                <div className="submit-section">
                    <button
                        className="submit-button"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="loading-spinner"></div>
                                <span>建立中...</span>
                            </>
                        ) : (
                            <>
                                <Icon name="checkmark-circle-outline" size={24} />
                                <span>建立交接紀錄</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 使用者選擇器 */}
            <MultiUserPicker
                visible={showUserPicker}
                selectedUsers={selectedUsers.map((u) => u.id)}
                onConfirm={(users) => {
                    setSelectedUsers(users);
                    setFormData({
                        ...formData,
                        staffNames: users.map((u) => u.full_name),
                    });
                }}
                onClose={() => setShowUserPicker(false)}
            />

            {/* 備品Modal */}
            <Modal
                isOpen={showInventoryModal}
                onClose={() => setShowInventoryModal(false)}
                title="新增備品紀錄"
                size="lg"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxHeight: '70vh', overflow: 'auto' }}>
                    {/* 房號 */}
                    <div>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                            房號 *
                        </label>
                        <input
                            type="text"
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-sm)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-base)',
                                marginBottom: 'var(--spacing-sm)',
                            }}
                            value={inventoryForm.roomNumber}
                            onChange={(e) => setInventoryForm({ ...inventoryForm, roomNumber: e.target.value })}
                            placeholder="請輸入房號 (例: 501) 或使用下方選擇"
                        />

                        {/* 選擇樓層 */}
                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                選擇樓層：
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                                {floors.filter(f => f.rooms && f.rooms.length > 0).map(floor => (
                                    <button
                                        key={floor.id}
                                        type="button"
                                        style={{
                                            padding: '8px 16px',
                                            border: `2px solid ${inventoryForm.selectedFloor === floor.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            borderRadius: 'var(--radius-sm)',
                                            background: inventoryForm.selectedFloor === floor.id ? 'var(--color-primary)' : 'white',
                                            color: inventoryForm.selectedFloor === floor.id ? 'white' : 'var(--color-text)',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: 'var(--font-size-sm)',
                                            transition: 'all 0.2s',
                                        }}
                                        onClick={() => setInventoryForm({ ...inventoryForm, selectedFloor: floor.id, roomNumber: '' })}
                                    >
                                        {floor.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 房號選擇 */}
                        {inventoryForm.selectedFloor && roomsByFloor[inventoryForm.selectedFloor] && (
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                    房號：
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                                    gap: 'var(--spacing-xs)',
                                    maxHeight: '180px',
                                    overflow: 'auto',
                                }}>
                                    {roomsByFloor[inventoryForm.selectedFloor].map(room => (
                                        <button
                                            key={room}
                                            type="button"
                                            style={{
                                                padding: '8px 16px',
                                                border: `2px solid ${inventoryForm.roomNumber === room ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                borderRadius: 'var(--radius-sm)',
                                                background: inventoryForm.roomNumber === room ? 'var(--color-primary)' : 'white',
                                                color: inventoryForm.roomNumber === room ? 'white' : 'var(--color-text)',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: 'var(--font-size-sm)',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() => setInventoryForm({ ...inventoryForm, roomNumber: room })}
                                        >
                                            {room}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
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
                onClose={() => setShowOzoneModal(false)}
                title="新增臭氧紀錄"
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
                            onClick={() => setShowFloorSelector(true)}
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



                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                        <Button variant="secondary" fullWidth onClick={() => setShowOzoneModal(false)}>
                            取消
                        </Button>
                        <Button fullWidth onClick={confirmOzoneRecord}>
                            確認新增
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
        </div>
    );
}

export default NewHandoverPage;
