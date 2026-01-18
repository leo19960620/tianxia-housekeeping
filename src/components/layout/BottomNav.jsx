import { NavLink } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
    const navItems = [
        { path: '/', label: '首頁', icon: 'home' },
        { path: '/announcements', label: '公告', icon: 'bell' },
        { path: '/handover-items', label: '交班', icon: 'clipboard' },
        { path: '/more', label: '更多', icon: 'menu' },
    ];

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-container">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end={item.path === '/'}
                    >
                        <div className={`nav-item-icon icon-${item.icon}`}></div>
                        <span className="nav-item-label">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

export default BottomNav;
