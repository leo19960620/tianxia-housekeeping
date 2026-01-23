import React from 'react';
import './Skeleton.css';

const DashboardSkeleton = () => {
    return (
        <div className="common-skeleton-container">
            {/* Top Announcements Area */}
            <div className="common-skeleton-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                <div className="common-skeleton-title" style={{ width: '200px' }}></div>
                <div className="common-skeleton-text-lg" style={{ width: '100%', height: '120px', borderRadius: '12px' }}></div>
            </div>

            {/* Main Stats / Cards Grid */}
            <div className="common-skeleton-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Column 1 */}
                <div className="common-skeleton-card">
                    <div className="common-skeleton-title" style={{ width: '150px' }}></div>
                    {/* List Items */}
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <div className="common-skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="common-skeleton-text-md"></div>
                                <div className="common-skeleton-text-sm"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Column 2 */}
                <div className="common-skeleton-card">
                    <div className="common-skeleton-title" style={{ width: '150px' }}></div>
                    {/* Shift Cards */}
                    {[1, 2].map(i => (
                        <div key={i} style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div className="common-skeleton-text-md" style={{ width: '40%' }}></div>
                                <div className="common-skeleton-text-sm" style={{ width: '20%' }}></div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className="common-skeleton-circle" style={{ width: '32px', height: '32px' }}></div>
                                <div className="common-skeleton-circle" style={{ width: '32px', height: '32px' }}></div>
                                <div className="common-skeleton-circle" style={{ width: '32px', height: '32px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
