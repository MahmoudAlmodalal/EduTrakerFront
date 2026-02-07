import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    School,
    Users,
    FileBarChart,
    Settings,
    MessageSquare,
    LogOut,
    Bell,
    GraduationCap,
    Sparkles,
    Menu
} from 'lucide-react';
import '../pages/WorkstreamManager/Workstream.css';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import workstreamService from '../services/workstreamService';
import { useEffect, useState } from 'react';
import { useCachedApi } from '../hooks/useCachedApi';

const WorkstreamLayout = () => {
    const { t } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const navItems = [
        { path: '/workstream/dashboard', label: t('workstream.nav.dashboard'), icon: LayoutDashboard },
        { path: '/workstream/schools', label: t('workstream.nav.schools'), icon: School },
        { path: '/workstream/assignments', label: t('workstream.nav.assignments'), icon: Users },
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

    // Fetch unread count with caching (2 minute TTL)
    const { data: unreadData, error: unreadError } = useCachedApi(
        () => notificationService.getUnreadCount(),
        {
            enabled: hasValidToken,
            cacheKey: `unread_count_${user?.id}`,
            ttl: 2 * 60 * 1000, // 2 minutes
            dependencies: [user?.id]
        }
    );

    // Fetch dashboard statistics for quick stats (5 minute TTL)
    const { data: statsData } = useCachedApi(
        () => workstreamService.getDashboardStatistics(),
        {
            enabled: hasValidToken,
            cacheKey: `workstream_nav_stats_${user?.id}`,
            ttl: 5 * 60 * 1000, // 5 minutes
            dependencies: [user?.id]
        }
    );

    // If we get 401 errors, logout the user
    useEffect(() => {
        if (unreadError?.includes('401')) {
            console.warn('Token expired, logging out...');
            logout();
            navigate('/login');
        }
    }, [unreadError, logout, navigate]);

    const unreadCount = unreadData?.unread_count || 0;

    const getInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'WM';
    };

    return (
        <div className={`workstream-layout ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
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
                    <div
                        onClick={() => navigate('/workstream/communication')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '12px',
                            marginBottom: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            <Bell size={18} style={{ color: 'rgba(226, 232, 240, 0.7)' }} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    width: '10px',
                                    height: '10px',
                                    background: '#ef4444',
                                    borderRadius: '50%',
                                    border: '2px solid #0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8px',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}></span>
                            )}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            {unreadCount > 0 ? `${unreadCount} ${t('header.newNotifications')}` : t('header.noNewNotifications')}
                        </span>
                    </div>

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
                <Outlet />
            </main>
        </div>
    );
};

export default WorkstreamLayout;
