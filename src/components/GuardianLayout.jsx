import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users, // For Children Monitoring
    MessageSquare, // For Communication
    Settings, // For Settings
    LogOut,
    ShieldCheck, // Guardian Icon/Brand
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/Guardian/Guardian.css';

const SIDEBAR_BREAKPOINT = 1024;

const GuardianLayout = () => {
    const { t } = useTheme();
    const { logout } = useAuth();

    const [isSidebarOpen, setIsSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth > SIDEBAR_BREAKPOINT : true
    );
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= SIDEBAR_BREAKPOINT : false
    );

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= SIDEBAR_BREAKPOINT;
            setIsMobile(mobile);
            setIsSidebarOpen(!mobile);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const navItems = [
        { path: '/guardian/dashboard', labelKey: 'guardian.nav.dashboard', icon: LayoutDashboard },
        { path: '/guardian/monitoring', labelKey: 'guardian.nav.monitoring', icon: Users },
        { path: '/guardian/communication', labelKey: 'guardian.nav.communication', icon: MessageSquare },
        { path: '/guardian/settings', labelKey: 'guardian.nav.settings', icon: Settings },
    ];

    return (
        <div className="guardian-layout">
            {/* Sidebar Overlay for Mobile */}
            {isMobile && isSidebarOpen && (
                <div
                    className="guardian-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`guardian-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="guardian-brand">
                    <ShieldCheck size={32} />
                    <span>{t('app.name')}</span>

                    {/* Close Button (Mobile & Desktop) */}
                    <button
                        className="guardian-sidebar-close-btn"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close Sidebar"
                    >
                        {isMobile ? <X size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <div className="user-profile" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--color-bg-body)', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('header.welcome') || 'Welcome,'}</div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{t('auth.role.guardian')}</div>
                </div>

                <nav className="guardian-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (isMobile) {
                                    setIsSidebarOpen(false);
                                }
                            }}
                            className={({ isActive }) =>
                                `guardian-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button
                        className="guardian-nav-item"
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>{t('header.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`guardian-main ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
                {!isSidebarOpen && (
                    <div
                        className="guardian-header-actions"
                        style={{ position: isMobile ? 'relative' : 'sticky', top: 0, zIndex: 10 }}
                    >
                        <button
                            className="guardian-trigger-btn"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open Menu"
                        >
                            <Menu size={24} />
                        </button>

                        {isMobile && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} />
                                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{t('app.name')}</span>
                            </div>
                        )}
                    </div>
                )}

                <Outlet />
            </main>
        </div>
    );
};

export default GuardianLayout;
