// 樓層選擇 Modal 組件
import './FloorSelectorModal.css';

function FloorSelectorModal({ visible, onSelect, onCancel }) {
    const floors = ['5F', '6F', '7F', '8F', '9F', '10F', '11F', '12F'];

    if (!visible) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="floor-selector-overlay" onClick={handleOverlayClick}>
            <div className="floor-selector-container">
                <div className="floor-selector-header">
                    <h2>選擇樓層</h2>
                    <button className="close-btn" onClick={onCancel}>✕</button>
                </div>
                <div className="floor-selector-grid">
                    {floors.map((floor) => (
                        <button
                            key={floor}
                            className="floor-selector-button"
                            onClick={() => onSelect(floor)}
                        >
                            {floor}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default FloorSelectorModal;
