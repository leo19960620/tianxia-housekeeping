import Icon from '../common/Icon';
import './Topbar.css';

function Topbar({ title = '儀表板' }) {
    const currentDate = new Date().toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    return (
        <header className="topbar">
            <div className="topbar-left">
                <h1 className="topbar-title">{title}</h1>
                <div className="topbar-breadcrumb">
                    <span className="breadcrumb-item">首頁</span>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-item breadcrumb-current">{title}</span>
                </div>
            </div>

            <div className="topbar-right">
                <div className="topbar-date">
                    <span className="date-icon">
                        <Icon name="calendar" size={16} />
                    </span>
                    <span className="date-text">{currentDate}</span>
                </div>
            </div>
        </header>
    );
}

export default Topbar;
