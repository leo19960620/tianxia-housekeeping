import PropTypes from 'prop-types';
import './KPICard.css';

function KPICard({
    title,
    value,
    unit = '',
    trend = null,
    trendValue = null,
    color = 'primary',
    icon = null,
    onClick = null,
    subtext = null
}) {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    const getTrendClass = () => {
        if (!trend) return '';
        if (trend === 'up') return 'kpi-trend-up';
        if (trend === 'down') return 'kpi-trend-down';
        return 'kpi-trend-neutral';
    };

    return (
        <div
            className={`kpi-card kpi-card-${color} ${onClick ? 'kpi-card-clickable' : ''}`}
            onClick={onClick}
        >
            <div className="kpi-card-header">
                {icon && <div className="kpi-card-icon">{icon}</div>}
                <div className="kpi-card-title">{title}</div>
            </div>

            <div className="kpi-card-body">
                <div className="kpi-card-value">
                    {value}
                    {unit && <span className="kpi-card-unit">{unit}</span>}
                </div>

                {trend && (
                    <div className={`kpi-card-trend ${getTrendClass()}`}>
                        <span className="kpi-trend-icon">{getTrendIcon()}</span>
                        {trendValue && <span className="kpi-trend-value">{trendValue}</span>}
                    </div>
                )}

                {subtext && (
                    <div className="kpi-card-subtext">{subtext}</div>
                )}
            </div>
        </div>
    );
}

KPICard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit: PropTypes.string,
    trend: PropTypes.oneOf(['up', 'down', 'neutral', null]),
    trendValue: PropTypes.string,
    color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info']),
    icon: PropTypes.node,
    onClick: PropTypes.func,
    subtext: PropTypes.string,
};

export default KPICard;
