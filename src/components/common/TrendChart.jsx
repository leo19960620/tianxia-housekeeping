import PropTypes from 'prop-types';
import './TrendChart.css';

function TrendChart({
    data = [],
    type = 'bar',
    height = 200,
    color = 'primary',
    showValues = false,
    maxValue = null
}) {
    if (!data || data.length === 0) {
        return (
            <div className="trend-chart-empty">
                <p>無數據</p>
            </div>
        );
    }

    const max = maxValue || Math.max(...data.map(d => d.value));
    const chartHeight = height;

    const getColorClass = () => {
        return `trend-chart-${color}`;
    };

    if (type === 'bar') {
        return (
            <div className="trend-chart">
                <div className="trend-chart-bars" style={{ height: `${chartHeight}px` }}>
                    {data.map((item, index) => {
                        const percentage = max > 0 ? (item.value / max) * 100 : 0;
                        return (
                            <div key={index} className="bar-container">
                                <div className="bar-wrapper">
                                    {showValues && (
                                        <div className="bar-value">{item.value}</div>
                                    )}
                                    <div
                                        className={`bar ${getColorClass()}`}
                                        style={{ height: `${percentage}%` }}
                                        title={`${item.label}: ${item.value}`}
                                    />
                                </div>
                                <div className="bar-label">{item.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (type === 'line') {
        const points = data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = max > 0 ? 100 - (item.value / max) * 100 : 100;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="trend-chart" style={{ height: `${chartHeight}px` }}>
                <svg className="trend-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                        className={`trend-line ${getColorClass()}`}
                        points={points}
                        fill="none"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
                <div className="trend-chart-labels">
                    {data.map((item, index) => (
                        <div key={index} className="line-label">{item.label}</div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
}

TrendChart.propTypes = {
    data: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            value: PropTypes.number.isRequired,
        })
    ).isRequired,
    type: PropTypes.oneOf(['bar', 'line']),
    height: PropTypes.number,
    color: PropTypes.oneOf(['primary', 'success', 'warning', 'danger', 'info']),
    showValues: PropTypes.bool,
    maxValue: PropTypes.number,
};

export default TrendChart;
