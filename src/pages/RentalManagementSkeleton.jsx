import React from 'react';
import './RentalManagementPage.css';

export default function RentalManagementSkeleton() {
    return (
        <div className="rental-skeleton">
            {/* 頁籤骨架 */}
            <div className="skeleton-tabs">
                <div className="skeleton-tab"></div>
                <div className="skeleton-tab"></div>
                <div className="skeleton-tab"></div>
                <div className="skeleton-tab"></div>
            </div>

            {/* 表單卡片骨架 */}
            <div className="skeleton-form-card">
                <div className="skeleton-title"></div>
                <div className="skeleton-input"></div>
                <div className="skeleton-input"></div>
                <div className="skeleton-input"></div>
                <div className="skeleton-button"></div>
            </div>

            {/* 租借卡片列表骨架 */}
            <div className="skeleton-section">
                <div className="skeleton-section-title"></div>
                <div className="skeleton-cards-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton-rental-card">
                            <div className="skeleton-card-header">
                                <div className="skeleton-icon"></div>
                                <div className="skeleton-card-title-text"></div>
                            </div>
                            <div className="skeleton-card-line"></div>
                            <div className="skeleton-card-line"></div>
                            <div className="skeleton-card-line short"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
