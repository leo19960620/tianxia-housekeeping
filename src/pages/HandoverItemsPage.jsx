import { useState, useEffect } from 'react';
import { handoverItemAPI } from '../api/handoverItem';
import FilterBar from '../components/common/FilterBar';
import './HandoverItemsPage.css';

function HandoverItemsPage() {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadItems();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [items, dateRange, searchQuery]);

    const loadItems = async () => {
        try {
            setLoading(true);
            const res = await handoverItemAPI.getAll();
            if (res.success) {
                setItems(res.data);
            }
        } catch (error) {
            console.error('載入交班事項失敗:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...items];

        // 日期篩選
        if (dateRange.startDate || dateRange.endDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.created_at);
                itemDate.setHours(0, 0, 0, 0);

                if (dateRange.startDate && dateRange.endDate) {
                    const start = new Date(dateRange.startDate);
                    const end = new Date(dateRange.endDate);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    return itemDate >= start && itemDate <= end;
                } else if (dateRange.startDate) {
                    const start = new Date(dateRange.startDate);
                    start.setHours(0, 0, 0, 0);
                    return itemDate >= start;
                } else if (dateRange.endDate) {
                    const end = new Date(dateRange.endDate);
                    end.setHours(23, 59, 59, 999);
                    return itemDate <= end;
                }
                return true;
            });
        }

        // 搜尋篩選
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const content = (item.item_content || item.content || '').toLowerCase();
                const staff = (item.staff_name || '').toLowerCase();
                return content.includes(query) || staff.includes(query);
            });
        }

        setFilteredItems(filtered);
    };

    if (loading) {
        return (
            <div className="handover-items-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>載入中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="handover-items-page">
            <div className="page-content">
                {/* 篩選欄 */}
                <FilterBar
                    showDateFilter
                    showSearch
                    dateRange={dateRange}
                    onDateChange={setDateRange}
                    onSearch={setSearchQuery}
                />

                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <p>
                            {searchQuery || dateRange.startDate || dateRange.endDate
                                ? '找不到符合條件的交班事項'
                                : '尚無交班事項'}
                        </p>
                    </div>
                ) : (
                    <div className="items-table-container">
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>日期</th>
                                    <th>交班內容</th>
                                    <th>建立人</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr key={item.key_id || item.id}>
                                        <td className="item-date-cell">
                                            {item.created_at &&
                                                new Date(item.created_at).toLocaleDateString('zh-TW')}
                                        </td>
                                        <td className="item-content-cell">
                                            {item.item_content || item.content}
                                        </td>
                                        <td className="item-staff-cell">
                                            {item.staff_name || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HandoverItemsPage;
