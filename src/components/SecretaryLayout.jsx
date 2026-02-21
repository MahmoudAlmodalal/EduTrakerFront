import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Info,
    UserPlus,
    Users,
    FileText,
    Settings,
    LogOut,
    Sparkles,
    Menu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SecretaryDataProvider } from '../context/SecretaryDataContext';
import '../pages/WorkstreamManager/Workstream.css';

const SIDEBAR_BREAKPOINT = 1024;

const SecretaryLayoutContent = () => {
    const { t } = useTheme();
    const { user, logout } = useAuth();
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
        { path: '/secretary/info', labelKey: 'secretary.nav.info', icon: Info },
        { path: '/secretary/settings', labelKey: 'secretary.nav.settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fullName = user?.full_name || user?.name || user?.displayName || 'Secretary';
    const roleLabel = t('auth.role.secretary') || 'Secretary';
    const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'SE';

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
                        <Sparkles size={24} />
                    </div>
                </button>
            )}

            {/* Sidebar */}
            <aside className={`workstream-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="workstream-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <Sparkles size={28} />
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

                <div
                    style={{
                        marginTop: 'auto',
                        paddingTop: '20px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        <div
                            style={{
                                width: '42px',
                                height: '42px',
                                background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '0.875rem',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                                flexShrink: 0
                            }}
                        >
                            {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: 'white',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {fullName}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.6875rem',
                                    color: 'rgba(148, 163, 184, 0.8)',
                                    textTransform: 'capitalize',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {roleLabel}
                            </div>
                        </div>

                    </div>

                    <button
                        className="workstream-nav-item"
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', marginTop: '12px' }}
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

const SecretaryLayout = () => {
    return (
        <SecretaryDataProvider>
            <SecretaryLayoutContent />
        </SecretaryDataProvider>
    );
};

export default SecretaryLayout;
