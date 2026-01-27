import React, { useState } from 'react';

const ParkingPage = () => {
    // 使用內嵌模式的 URL
    const PARKING_URL = 'https://parking-admin-5fd9c.web.app/?mode=embedded';
    const [loading, setLoading] = useState(true);

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 100px)', // 扣除 header 高度 
            position: 'relative',
            backgroundColor: '#F8F6F3',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: '#2F4539'
                }}>
                    <div className="loading-spinner"></div>
                    <p style={{ marginTop: '12px', color: '#757873' }}>載入停車系統中...</p>
                </div>
            )}
            <iframe
                src={PARKING_URL}
                title="Parking Management"
                width="100%"
                height="100%"
                style={{
                    border: 'none',
                    backgroundColor: '#F8F6F3'
                }}
                onLoad={() => setLoading(false)}
            />
        </div>
    );
};

export default ParkingPage;
