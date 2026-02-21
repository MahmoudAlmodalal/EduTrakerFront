import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    FileBarChart,
    Users,
    Layers,
    UserCheck,
    Sparkles,
    MessageSquare,
    Activity,
    Menu,
    X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/SchoolManager/SchoolManager.css';
import managerService from '../services/managerService';
import { useCachedApi } from '../hooks/useCachedApi';
import NotificationDropdown from './shared/NotificationDropdown';

const SIDEBAR_BREAKPOINT = 1024;
const SIDEBAR_COUNT_REFRESH_EVENT = 'school_manager_stats_updated';

const getActiveCountFromListResponse = (payload) => {
    const teachers = Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload)
            ? payload
            : null;

    if (teachers) {
        return teachers.filter((teacher) => teacher?.is_active !== false).length;
    }

    const countValue = Number(payload?.count);
    return Number.isFinite(countValue) ? countValue : null;
};

const SchoolManagerLayout = () => {
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
        { path: '/school-manager/dashboard', labelKey: 'schoolManager.nav.dashboard', icon: LayoutDashboard },
        { path: '/school-manager/grades', labelKey: 'schoolManager.nav.grades', icon: Layers },
        { path: '/school-manager/configuration', labelKey: 'schoolManager.nav.configuration', icon: Settings },
        { path: '/school-manager/teachers', labelKey: 'schoolManager.nav.teachers', icon: UserCheck },
        { path: '/school-manager/secretaries', labelKey: 'schoolManager.nav.secretaries', icon: Users },
        { path: '/school-manager/reports', labelKey: 'schoolManager.nav.reports', icon: FileBarChart },
        { path: '/school-manager/communication', labelKey: 'schoolManager.nav.communication', icon: MessageSquare },
        { path: '/school-manager/activity-log', labelKey: 'schoolManager.nav.activityLog', icon: Activity },
        { path: '/school-manager/settings', labelKey: 'schoolManager.nav.settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        const path = window.location.pathname || '';
        if (path.includes('/workstream')) {
            navigate('/workstream/login');
        } else {
            navigate('/login');
        }
    };

    // Check if we have a valid token
    const hasValidToken = !!user && !!sessionStorage.getItem('accessToken');
    const schoolId = user?.school_id || user?.school?.id || user?.school;

    // Fetch dashboard stats for sidebar quick stats (5 minute TTL)
    const { data: dashboardData, refetch: refetchSidebarStats } = useCachedApi(
        () => managerService.getDashboardStats(),
        {
            enabled: hasValidToken,
            cacheKey: `sidebar_stats_${user?.id}`,
            ttl: 5 * 60 * 1000, // 5 minutes
            dependencies: [user?.id]
        }
    );

    // Active teachers count for sidebar: source of truth from teachers API.
    const { data: activeTeachersData, refetch: refetchActiveTeachersCount } = useCachedApi(
        () => {
            const params = {
                include_inactive: true
            };
            if (schoolId) params.school_id = schoolId;
            return managerService.getTeachers(params);
        },
        {
            enabled: hasValidToken && !!schoolId,
            cacheKey: `sidebar_active_teachers_${user?.id}_${schoolId || 'none'}`,
            ttl: 60 * 1000, // 1 minute
            dependencies: [user?.id, schoolId]
        }
    );

    useEffect(() => {
        const handleStatsUpdated = () => {
            refetchSidebarStats();
            refetchActiveTeachersCount();
        };

        window.addEventListener(SIDEBAR_COUNT_REFRESH_EVENT, handleStatsUpdated);
        return () => window.removeEventListener(SIDEBAR_COUNT_REFRESH_EVENT, handleStatsUpdated);
    }, [refetchSidebarStats, refetchActiveTeachersCount]);

    const sidebarStats = dashboardData?.statistics || {};
    const activeTeachersCount = getActiveCountFromListResponse(activeTeachersData);
    const teachersSidebarValue = activeTeachersCount ?? '—';

    const getInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'SM';
    };

    return (
        <div className={`school-manager-layout ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
            {isMobile && isSidebarOpen && (
                <div
                    className="school-manager-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile/Collapsed Menu Toggle */}
            {!isSidebarOpen && (
                <button
                    onClick={toggleSidebar}
                    className="sm-sidebar-toggle-floating"
                    title="Open Sidebar"
                >
                    <Menu size={24} />
                </button>
            )}

            <aside className={`school-manager-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                {/* Brand Section */}
                <div className="school-manager-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={28} />
                        <span>{t('app.name')}</span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="sm-sidebar-toggle-inline"
                        title="Close Sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Quick Stats from Backend */}
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
                            {teachersSidebarValue}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(226, 232, 240, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('activeTeachers') || 'Active Teachers'}
                        </div>
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
                            {sidebarStats.total_students ?? '—'}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(226, 232, 240, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('students') || 'Students'}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="school-manager-nav">
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
                                `school-manager-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{t(item.labelKey)}</span>
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
                            }}>{user?.name || 'School Manager'}</div>
                            <div style={{
                                fontSize: '0.6875rem',
                                color: 'rgba(148, 163, 184, 0.8)',
                                textTransform: 'capitalize'
                            }}>School Manager</div>
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

            <main className={`school-manager-main ${!isSidebarOpen ? 'expanded' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', position: 'relative' }}>
                    <NotificationDropdown
                        communicationPath="/school-manager/communication"
                        allowedRoutePrefixes={[
                            '/school-manager/dashboard',
                            '/school-manager/grades',
                            '/school-manager/configuration',
                            '/school-manager/reports',
                            '/school-manager/teachers',
                            '/school-manager/activity-log',
                            '/school-manager/secretaries',
                            '/school-manager/communication',
                            '/school-manager/settings',
                        ]}
                    />
                </div>
                <Outlet />
            </main>
        </div>
    );
};

export default SchoolManagerLayout;
