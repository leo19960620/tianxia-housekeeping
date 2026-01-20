import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../common/Icon';
import './Sidebar.css';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            id: 'dashboard',
            label: '儀表板',
            icon: 'home',
            path: '/',
        },
        {
            id: 'announcements',
            label: '公告管理',
            icon: 'megaphone',
            path: '/announcements',
        },
        {
            id: 'handover-items',
            label: '交班紀錄',
            icon: 'document-text',
            path: '/handover-items',
        },
        {
            id: 'handover-new',
            label: '新增交接',
            icon: 'add-circle',
            path: '/handover/new',
        },
        {
            id: 'items',
            label: '備品管理',
            icon: 'cube',
            path: '/items',
        },
        {
            id: 'users',
            label: '使用者管理',
            icon: 'people',
            path: '/users',
        },
        {
            id: 'ozone',
            label: '臭氧統計',
            icon: 'analytics',
            path: '/ozone-stats',
        },
        {
            id: 'rental',
            label: '租借管理',
            icon: 'bicycle',
            path: '/rental-management',
        },
        {
            id: 'settings',
            label: '系統設定',
            icon: 'settings',
            path: '/settings',
        },
    ];


    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <Icon name="business" size={28} color="white" />
                    </div>
                    <div className="logo-text">
                        <div className="logo-title">天下服中</div>
                        <div className="logo-subtitle">Service Centre</div>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">主要功能</div>
                    {menuItems.slice(0, 4).map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-item-icon">
                                <Icon name={item.icon} size={20} />
                            </span>
                            <span className="nav-item-label">{item.label}</span>
                            {isActive(item.path) && <div className="nav-item-indicator" />}
                        </button>
                    ))}
                </div>

                <div className="nav-section">
                    <div className="nav-section-title">管理功能</div>
                    {menuItems.slice(4).map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className="nav-item-icon">
                                <Icon name={item.icon} size={20} />
                            </span>
                            <span className="nav-item-label">{item.label}</span>
                            {isActive(item.path) && <div className="nav-item-indicator" />}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-version">v1.0.0</div>
            </div>
        </aside>
    );
}

export default Sidebar;
