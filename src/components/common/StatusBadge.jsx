import PropTypes from 'prop-types';
import './StatusBadge.css';

function StatusBadge({
    status,
    size = 'md',
    icon = null,
    customColor = null
}) {
    const getStatusConfig = () => {
        const configs = {
            'success': { label: '正常', color: 'success' },
            'completed': { label: '已完成', color: 'success' },
            'active': { label: '進行中', color: 'info' },
            'pending': { label: '待處理', color: 'warning' },
            'warning': { label: '警告', color: 'warning' },
            'error': { label: '錯誤', color: 'danger' },
            'danger': { label: '危險', color: 'danger' },
            'resolved': { label: '已解決', color: 'success' },
            'unresolved': { label: '未解決', color: 'warning' },
            'default': { label: status, color: 'primary' },
        };

        return configs[status] || configs['default'];
    };

    const config = getStatusConfig();
    const colorClass = customColor || config.color;

    return (
        <span className={`status-badge status-badge-${size} status-badge-${colorClass}`}>
            {icon && <span className="status-badge-icon">{icon}</span>}
            <span className="status-badge-label">{config.label}</span>
        </span>
    );
}

StatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    icon: PropTypes.node,
    customColor: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info']),
};

export default StatusBadge;
