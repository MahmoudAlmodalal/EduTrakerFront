import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    UserPlus,
    Users,
    FileText,
    Settings,
    LogOut,
    Shield
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/WorkstreamManager/Workstream.css';

const SecretaryLayout = () => {
    const { t } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/secretary/dashboard', labelKey: 'secretary.nav.overview', icon: LayoutDashboard },
        { path: '/secretary/admissions', labelKey: 'secretary.nav.admissions', icon: UserPlus },
        { path: '/secretary/guardians', labelKey: 'secretary.nav.guardians', icon: Users },
        { path: '/secretary/attendance', labelKey: 'secretary.nav.attendance', icon: FileText },
        { path: '/secretary/communication', labelKey: 'secretary.nav.communication', icon: FileText },
        { path: '/secretary/settings', labelKey: 'secretary.nav.settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="workstream-layout">
            {/* Sidebar */}
            <aside className="workstream-sidebar">
                <div className="workstream-brand">
                    <Shield size={32} />
                    <span>{t('app.name') || 'EduTraker'}</span>
                </div>

                <nav className="workstream-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `workstream-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button
                        className="workstream-nav-item"
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>{t('auth.logout') || 'Logout'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="workstream-main">
                <Outlet />
            </main>
        </div>
    );
};

export default SecretaryLayout;
