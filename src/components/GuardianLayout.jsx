import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users, // For Children Monitoring
    MessageSquare, // For Communication
    Info,
    Settings, // For Settings
    LogOut,
    ShieldCheck, // Guardian Icon/Brand
    Sparkles,
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './shared/NotificationDropdown';
import '../pages/Guardian/Guardian.css';

const SIDEBAR_BREAKPOINT = 1024;

const GuardianLayout = () => {
    const { t } = useTheme();
    const { logout, user } = useAuth();

    const getInitials = () => {
        const name = user?.full_name || user?.name || user?.displayName || '';
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'GU';
    };

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
        { path: '/guardian/info', labelKey: 'guardian.nav.info', icon: Info },
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={28} />
                        <span>{t('app.name')}</span>
                    </div>

                    {/* Close Button (Mobile & Desktop) */}
                    <button
                        className="guardian-sidebar-close-btn"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close Sidebar"
                    >
                        {isMobile ? <X size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        {getInitials()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#ffffff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {user?.full_name || user?.name || user?.displayName || t('auth.role.guardian')}
                        </div>
                        <div style={{
                            fontSize: '0.6875rem',
                            color: 'rgba(148,163,184,0.8)',
                            textTransform: 'capitalize'
                        }}>
                            {t('auth.role.guardian')}
                        </div>
                    </div>
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
                        className="guardian-nav-item guardian-logout-btn"
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
                <div className="guardian-topbar">
                    {!isSidebarOpen && (
                        <button
                            className="guardian-trigger-btn"
                            onClick={() => setIsSidebarOpen(true)}
                            aria-label="Open Menu"
                        >
                            <Menu size={24} />
                        </button>
                    )}

                    {!isSidebarOpen && isMobile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={24} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{t('app.name')}</span>
                        </div>
                    )}

                    <div style={{ marginLeft: 'auto', position: 'relative' }}>
                        <NotificationDropdown
                            communicationPath="/guardian/communication"
                            allowedRoutePrefixes={[
                                '/guardian/dashboard',
                                '/guardian/monitoring',
                                '/guardian/communication',
                                '/guardian/info',
                                '/guardian/settings',
                            ]}
                        />
                    </div>
                </div>

                <Outlet />
            </main>
        </div>
    );
};

export default GuardianLayout;
