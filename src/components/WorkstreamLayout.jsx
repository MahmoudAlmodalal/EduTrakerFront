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
import headerStyles from './Layout/Header.module.css';

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
    const [showNotifications, setShowNotifications] = useState(false);

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
    const { data: unreadData, error: unreadError, refetch: refetchUnreadCount } = useCachedApi(
        () => notificationService.getUnreadCount(),
        {
            enabled: hasValidToken,
            cacheKey: `unread_count_${user?.id}`,
            ttl: 2 * 60 * 1000, // 2 minutes
            dependencies: [user?.id]
        }
    );

    // Fetch notifications list with caching (5 minute TTL)
    const {
        data: notificationsData,
        loading: notificationsLoading,
        refetch: refetchNotifications,
        error: notificationsError
    } = useCachedApi(
        () => notificationService.getNotifications({ page_size: 5 }),
        {
            enabled: hasValidToken,
            cacheKey: `workstream_notifications_${user?.id}`,
            ttl: 5 * 60 * 1000,
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
        if (unreadError?.includes('401') || notificationsError?.includes('401')) {
            console.warn('Token expired, logging out...');
            logout();
            navigate('/login');
        }
    }, [unreadError, notificationsError, logout, navigate]);

    const notifications = notificationsData?.results || notificationsData || [];
    const notificationsBusy = notificationsLoading;
    const unreadCount = unreadData?.unread_count || 0;

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            refetchNotifications();
            refetchUnreadCount();
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await notificationService.markAsRead(notif.id);
                refetchNotifications();
                refetchUnreadCount();
            } catch (err) {
                console.error('Error marking notification read:', err);
            }
        }

        const actionUrl = typeof notif.action_url === 'string' ? notif.action_url.trim() : '';
        const allowedWorkstreamPrefixes = [
            '/workstream/dashboard',
            '/workstream/schools',
            '/workstream/assignments',
            '/workstream/reports',
            '/workstream/communication',
            '/workstream/settings',
        ];
        const isAllowedWorkstreamRoute = actionUrl && allowedWorkstreamPrefixes.some(prefix => actionUrl.startsWith(prefix));

        if (isAllowedWorkstreamRoute) {
            navigate(actionUrl);
        } else {
            // Fallback for legacy notifications that still point to admin paths.
            navigate('/workstream/communication', { state: { activeTab: 'notifications' } });
        }
        setShowNotifications(false);
    };

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
                    <button
                        className={headerStyles.iconBtn}
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className={headerStyles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            top: '120%',
                            insetInlineEnd: 0,
                            width: '320px',
                            backgroundColor: 'var(--color-bg-surface)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid var(--color-border)',
                            zIndex: 100,
                            overflow: 'hidden',
                            animation: 'scaleIn var(--transition-normal)'
                        }}>
                            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                    {t('header.notifications')}
                                </h3>
                                {unreadCount > 0 && (
                                    <span
                                        onClick={handleMarkAllRead}
                                        style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        {t('header.markAllRead')}
                                    </span>
                                )}
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {notificationsBusy ? (
                                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
                                ) : notifications.length === 0 ? (
                                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                                        <p style={{ fontSize: 'var(--font-size-sm)' }}>{t('header.noNotifications')}</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            style={{
                                                padding: '1rem 1.25rem',
                                                borderBottom: '1px solid var(--color-border-subtle)',
                                                backgroundColor: !notif.is_read ? 'var(--color-primary-light)' : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-main)', marginBottom: '0.25rem', fontWeight: !notif.is_read ? 600 : 400 }}>
                                                {t(notif.title)}
                                            </p>
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {t(notif.message)}
                                            </p>
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                                {new Date(notif.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div style={{ padding: '1rem', textAlign: 'center' }}>
                                <button
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate('/workstream/communication', { state: { activeTab: 'notifications' } });
                                    }}
                                    style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    {t('header.viewAll')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default WorkstreamLayout;
