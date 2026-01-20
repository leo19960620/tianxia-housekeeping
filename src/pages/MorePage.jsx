import { useNavigate } from 'react-router-dom';
import './MorePage.css';

function MorePage() {
    const navigate = useNavigate();

    const menuItems = [
        { title: '備品管理', path: '/items', description: '管理備品項目與分類', color: 'var(--color-primary)' },
        { title: '使用者管理', path: '/users', description: '管理系統使用者', color: 'var(--color-info)' },
        { title: '臭氧統計', path: '/ozone-stats', description: '查看臭氧使用統計', color: 'var(--color-success)' },
        { title: '租借管理', path: '/rental-management', description: '腳踏車與雨傘租借管理', color: 'var(--color-warning)' },
        { title: '系統設定', path: '/settings', description: '系統相關設定', color: 'var(--color-secondary)' },
    ];


    return (
        <div className="page more-page">
            <header className="page-header">
                <h1 className="page-title">更多功能</h1>
            </header>

            <div className="more-content">
                <div className="menu-grid">
                    {menuItems.map((item) => (
                        <div
                            key={item.path}
                            className="menu-card"
                            onClick={() => navigate(item.path)}
                        >
                            <div className="menu-card-color" style={{ background: item.color }}></div>
                            <div className="menu-card-content">
                                <h3 className="menu-card-title">{item.title}</h3>
                                <p className="menu-card-description">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default MorePage;
