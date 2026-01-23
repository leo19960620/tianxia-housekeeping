import React from 'react';
import './Skeleton.css';

const TableSkeleton = ({ rowCount = 5 }) => {
    return (
        <div className="common-skeleton-container">
            {/* Header / Filter Area */}
            <div className="common-skeleton-header">
                <div className="common-skeleton-search"></div>
                <div className="common-skeleton-actions">
                    <div className="common-skeleton-button"></div>
                    <div className="common-skeleton-button"></div>
                </div>
            </div>

            {/* Table Card */}
            <div className="common-skeleton-table-card">
                {/* Table Header */}
                <div className="common-skeleton-row" style={{ borderBottom: '2px solid #e0e0e0', paddingBottom: '16px' }}>
                    <div className="common-skeleton-cell" style={{ width: '15%' }}></div>
                    <div className="common-skeleton-cell" style={{ width: '40%' }}></div>
                    <div className="common-skeleton-cell" style={{ width: '20%' }}></div>
                    <div className="common-skeleton-cell" style={{ width: '15%' }}></div>
                </div>

                {/* Rows */}
                {Array.from({ length: rowCount }).map((_, index) => (
                    <div key={index} className="common-skeleton-row">
                        <div className="common-skeleton-cell" style={{ width: '15%' }}></div>
                        <div className="common-skeleton-cell" style={{ width: '40%' }}></div>
                        <div className="common-skeleton-cell" style={{ width: '20%' }}></div>
                        <div className="common-skeleton-cell" style={{ width: '15%' }}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableSkeleton;
