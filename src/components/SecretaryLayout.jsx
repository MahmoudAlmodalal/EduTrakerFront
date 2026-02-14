import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    UserPlus,
    Users,
    FileText,
    Settings,
    LogOut,
    Shield,
    Menu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/WorkstreamManager/Workstream.css';

const SIDEBAR_BREAKPOINT = 1024;

const SecretaryLayout = () => {
    const { t } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= SIDEBAR_BREAKPOINT : false
    );
    const [isSidebarOpen, setSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth > SIDEBAR_BREAKPOINT : true
    );

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= SIDEBAR_BREAKPOINT;
            setIsMobile(mobile);
            setSidebarOpen(!mobile);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

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
        <div className={`workstream-layout ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
            {isMobile && isSidebarOpen && (
                <div
                    className="workstream-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Toggle Button (Visible when sidebar is closed) */}
            {!isSidebarOpen && (
                <button
                    onClick={toggleSidebar}
                    className="workstream-sidebar-toggle-floating"
                    title="Open Sidebar"
                >
                    <div className="workstream-logo-icon">
                        <Shield size={24} />
                    </div>
                </button>
            )}

            {/* Sidebar */}
            <aside className={`workstream-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="workstream-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <Shield size={32} />
                        <span>{t('app.name') || 'EduTraker'}</span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="workstream-sidebar-toggle-inline"
                        title="Close Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="workstream-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (isMobile) {
                                    setSidebarOpen(false);
                                }
                            }}
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
            <main className={`workstream-main ${!isSidebarOpen ? 'expanded' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default SecretaryLayout;
