import { useState } from 'react';
import PropTypes from 'prop-types';
import './FilterBar.css';

function FilterBar({
    onDateChange = null,
    onStatusChange = null,
    onSearch = null,
    onSortChange = null,
    showDateFilter = false,
    showStatusFilter = false,
    showSearch = false,
    showSort = false,
    statusOptions = [],
    sortOptions = [],
    dateRange = null,
}) {
    const [searchValue, setSearchValue] = useState('');

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);
        if (onSearch) {
            onSearch(value);
        }
    };

    return (
        <div className="filter-bar">
            {showDateFilter && onDateChange && (
                <div className="filter-section">
                    <label className="filter-label">日期範圍</label>
                    <div className="filter-date-inputs">
                        <input
                            type="date"
                            className="filter-input filter-date"
                            value={dateRange?.startDate || ''}
                            onChange={(e) => onDateChange({ ...dateRange, startDate: e.target.value })}
                        />
                        <span className="filter-separator">至</span>
                        <input
                            type="date"
                            className="filter-input filter-date"
                            value={dateRange?.endDate || ''}
                            onChange={(e) => onDateChange({ ...dateRange, endDate: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {showStatusFilter && onStatusChange && statusOptions.length > 0 && (
                <div className="filter-section">
                    <label className="filter-label">狀態</label>
                    <select
                        className="filter-input filter-select"
                        onChange={(e) => onStatusChange(e.target.value)}
                    >
                        <option value="">全部</option>
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {showSearch && onSearch && (
                <div className="filter-section filter-search-section">
                    <label className="filter-label">搜尋</label>
                    <input
                        type="text"
                        className="filter-input filter-search"
                        placeholder="輸入關鍵字..."
                        value={searchValue}
                        onChange={handleSearchChange}
                    />
                </div>
            )}

            {showSort && onSortChange && sortOptions.length > 0 && (
                <div className="filter-section">
                    <label className="filter-label">排序</label>
                    <select
                        className="filter-input filter-select"
                        onChange={(e) => onSortChange(e.target.value)}
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

FilterBar.propTypes = {
    onDateChange: PropTypes.func,
    onStatusChange: PropTypes.func,
    onSearch: PropTypes.func,
    onSortChange: PropTypes.func,
    showDateFilter: PropTypes.bool,
    showStatusFilter: PropTypes.bool,
    showSearch: PropTypes.bool,
    showSort: PropTypes.bool,
    statusOptions: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ),
    sortOptions: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ),
    dateRange: PropTypes.shape({
        startDate: PropTypes.string,
        endDate: PropTypes.string,
    }),
};

export default FilterBar;
