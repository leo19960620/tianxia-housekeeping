import { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';

// Lazy load ParkingPage locally since we render it manually
const ParkingPage = lazy(() => import('../../pages/ParkingPage'));

function Layout() {
    const location = useLocation();
    const [hasVisitedParking, setHasVisitedParking] = useState(false);

    // Check if current page is parking
    const isParkingPage = location.pathname === '/parking';

    useEffect(() => {
        if (isParkingPage && !hasVisitedParking) {
            setHasVisitedParking(true);
        }
    }, [isParkingPage, hasVisitedParking]);

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
        if (path === '/rental-management') return '租借管理';
        if (path === '/parking') return '停車管理';
        if (path === '/ozone-stats') return '臭氧統計';
        if (path === '/settings') return '系統設定';
        return '系統';
    };

    return (
        <div className="desktop-layout">
            <Sidebar />
            <div className="layout-main">
                <Topbar title={getPageTitle()} />
                <main
                    className="layout-content"
                    style={{
                        position: 'relative',
                        overflowY: isParkingPage ? 'hidden' : undefined,
                        padding: isParkingPage ? 0 : undefined
                    }}
                >

                    {/* Persistent Parking Page */}
                    {(hasVisitedParking || isParkingPage) && (
                        <div
                            style={{
                                visibility: isParkingPage ? 'visible' : 'hidden',
                                height: isParkingPage ? '100%' : '0px',
                                width: '100%',
                                position: isParkingPage ? 'relative' : 'absolute',
                                overflow: 'hidden'
                            }}
                        >
                            <Suspense fallback={<div className="loading-spinner"></div>}>
                                <ParkingPage />
                            </Suspense>
                        </div>
                    )}

                    {/* Standard Router Outlet */}
                    <div
                        style={{
                            display: isParkingPage ? 'none' : 'block',
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        <Outlet />
                    </div>

                </main>
            </div>
        </div>
    );
}

export default Layout;
