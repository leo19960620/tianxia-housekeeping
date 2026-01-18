import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';

function Layout() {
    const location = useLocation();

    // 根據路由設置頁面標題
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return '儀表板';
        if (path === '/announcements') return '公告管理';
        if (path === '/handover-items') return '交班紀錄';
        if (path.startsWith('/handover/new')) return '新增交接';
        if (path.startsWith('/handover/')) return '交接詳情';
        if (path === '/items') return '備品管理';
        if (path === '/users') return '使用者管理';
        if (path === '/ozone-stats') return '臭氧統計';
        if (path === '/settings') return '系統設定';
        return '系統';
    };

    return (
        <div className="desktop-layout">
            <Sidebar />
            <div className="layout-main">
                <Topbar title={getPageTitle()} />
                <main className="layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;
