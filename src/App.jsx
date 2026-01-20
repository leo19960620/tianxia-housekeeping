import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import './styles/global.css';
import './App.css';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const HandoverItemsPage = lazy(() => import('./pages/HandoverItemsPage'));
const MorePage = lazy(() => import('./pages/MorePage'));
const NewHandoverPage = lazy(() => import('./pages/NewHandoverPage'));
const HandoverDetailPage = lazy(() => import('./pages/HandoverDetailPage'));
const ItemsPage = lazy(() => import('./pages/ItemsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const OzoneStatsPage = lazy(() => import('./pages/OzoneStatsPage'));
const RentalManagementPage = lazy(() => import('./pages/RentalManagementPage'));


function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="app-loading">
          <div className="loading-spinner"></div>
          <p>載入系統中...</p>
        </div>
      }>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="handover-items" element={<HandoverItemsPage />} />
            <Route path="more" element={<MorePage />} />

            {/* 交接紀錄 */}
            <Route path="handover/new" element={<NewHandoverPage />} />
            <Route path="handover/:id" element={<HandoverDetailPage />} />

            {/* 管理頁面 */}
            <Route path="items" element={<ItemsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="ozone-stats" element={<OzoneStatsPage />} />
            <Route path="rental-management" element={<RentalManagementPage />} />
            <Route path="settings" element={<div className="page"><div className="page-header"><h1 className="page-title">系統設定</h1></div><div className="page-content"><div className="loading-container"><p>🏗️ 開發中...</p></div></div></div>} />

          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
