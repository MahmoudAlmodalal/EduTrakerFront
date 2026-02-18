import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    School,
    Users,
    FileBarChart,
    Settings,
    MessageSquare,
    LogOut,
    GraduationCap,
    Sparkles,
    Menu
} from 'lucide-react';
import '../pages/WorkstreamManager/Workstream.css';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import workstreamService from '../services/workstreamService';
import { useCachedApi } from '../hooks/useCachedApi';
import NotificationDropdown from './shared/NotificationDropdown';

const SIDEBAR_BREAKPOINT = 1024;

const WorkstreamLayout = () => {
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
        { path: '/workstream/dashboard', label: t('workstream.nav.dashboard'), icon: LayoutDashboard },
        { path: '/workstream/schools', label: t('workstream.nav.schools'), icon: School },
        { path: '/workstream/assignments', label: t('workstream.nav.assignments'), icon: Users },
        { path: '/workstream/academic-year', label: t('workstream.nav.academicYear'), icon: GraduationCap },
        { path: '/workstream/reports', label: t('workstream.nav.reports'), icon: FileBarChart },
        { path: '/workstream/communication', label: t('workstream.nav.communication'), icon: MessageSquare },
        { path: '/workstream/settings', label: t('workstream.nav.settings'), icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Check if we have a valid token
    const hasValidToken = !!user && !!localStorage.getItem('accessToken');

    // Fetch dashboard statistics for quick stats (5 minute TTL)
    const { data: statsData, refetch: refetchSidebarStats } = useCachedApi(
        () => workstreamService.getDashboardStatistics(),
        {
            enabled: hasValidToken,
            cacheKey: `workstream_nav_stats_${user?.id}`,
            ttl: 5 * 60 * 1000, // 5 minutes
            dependencies: [user?.id]
        }
    );

    useEffect(() => {
        const handleStatsUpdated = () => {
            refetchSidebarStats();
        };

        window.addEventListener('workstream_stats_updated', handleStatsUpdated);
        return () => window.removeEventListener('workstream_stats_updated', handleStatsUpdated);
    }, [refetchSidebarStats]);

    const getInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'WM';
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
                        <GraduationCap size={24} />
                    </div>
                </button>
            )}

            {/* Sidebar */}
            <aside className={`workstream-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                {/* Brand Section */}
                <div className="workstream-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <GraduationCap size={28} />
                        <span>{t('app.name')}</span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="workstream-sidebar-toggle-inline"
                        title="Close Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Quick Stats */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        flex: 1,
                        background: 'rgba(79, 70, 229, 0.1)',
                        borderRadius: '12px',
                        padding: '12px',
                        textAlign: 'center',
                        border: '1px solid rgba(79, 70, 229, 0.2)'
                    }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#8b5cf6' }}>
                            {statsData?.statistics?.school_count || 0}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(226, 232, 240, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schools</div>
                    </div>
                    <div style={{
                        flex: 1,
                        background: 'rgba(14, 165, 233, 0.1)',
                        borderRadius: '12px',
                        padding: '12px',
                        textAlign: 'center',
                        border: '1px solid rgba(14, 165, 233, 0.2)'
                    }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0ea5e9' }}>
                            {statsData?.statistics?.manager_count || 0}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(226, 232, 240, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Managers</div>
                    </div>
                </div>

                {/* Navigation */}
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
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile Section */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    {/* User Card */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{
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
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}>
                            {getInitials()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: 'white'
                            }}>{user?.name || 'Workstream Manager'}</div>
                            <div style={{
                                fontSize: '0.6875rem',
                                color: 'rgba(148, 163, 184, 0.8)',
                                textTransform: 'capitalize'
                            }}>Workstream Manager</div>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                color: 'rgba(148, 163, 184, 0.8)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            title={t('auth.logout')}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`workstream-main ${!isSidebarOpen ? 'expanded' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative' }}>
                    <NotificationDropdown
                        communicationPath="/workstream/communication"
                        allowedRoutePrefixes={[
                            '/workstream/dashboard',
                            '/workstream/schools',
                            '/workstream/assignments',
                            '/workstream/academic-year',
                            '/workstream/reports',
                            '/workstream/communication',
                            '/workstream/settings',
                        ]}
                    />
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default WorkstreamLayout;
