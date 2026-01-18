// Icon component wrapper for Ionicons
import PropTypes from 'prop-types';

function Icon({ name, size = 24, color = 'currentColor', className = '' }) {
    return (
        <ion-icon
            name={name}
            style={{
                fontSize: `${size}px`,
                color: color,
                verticalAlign: 'middle'
            }}
            className={className}
        />
    );
}

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    size: PropTypes.number,
    color: PropTypes.string,
    className: PropTypes.string,
};

export default Icon;
