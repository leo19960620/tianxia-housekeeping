import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: '🏠', label: '首頁' },
        { path: '/records', icon: '📝', label: '紀錄' },
        { path: '/announcements', icon: '📢', label: '公告' },
        { path: '/handover-items', icon: '📋', label: '事項' },
        { path: '/settings', icon: '⚙️', label: '更多' }
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export default BottomNav;
