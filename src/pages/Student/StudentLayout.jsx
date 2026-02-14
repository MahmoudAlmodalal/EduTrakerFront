import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    CalendarCheck,
    Settings,
    LogOut,
    Sparkles,
    Bell,
    MessageSquare,
    RefreshCw,
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { StudentDataProvider, useStudentData } from '../../context/StudentDataContext';
import './Student.css';

const SIDEBAR_BREAKPOINT = 992;

const StudentLayoutContent = () => {
    const { t } = useTheme();
    const { user, logout } = useAuth();
    const { dashboardData, loading } = useStudentData();

    // Initialize sidebar state based on screen width
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

    const stats = {
        attendance: `${dashboardData?.attendance?.attendance_rate || 0}%`,
        gpa: dashboardData?.grades?.overall_average
            ? (dashboardData.grades.overall_average / 25).toFixed(1)
            : '0.0',
        classroom: `${dashboardData?.profile?.current_classroom?.classroom_name || ''} • ${dashboardData?.profile?.current_classroom?.grade_name || ''}`
    };

    const navItems = [
        { path: '/student/dashboard', labelKey: 'student.nav.dashboard', icon: LayoutDashboard },
        { path: '/student/subjects', labelKey: 'student.nav.subjects', icon: BookOpen },
        { path: '/student/results', labelKey: 'student.nav.results', icon: GraduationCap },
        { path: '/student/attendance', labelKey: 'student.nav.attendance', icon: CalendarCheck },
        { path: '/student/communication', labelKey: 'student.nav.communication', icon: MessageSquare },
        { path: '/student/settings', labelKey: 'student.nav.settings', icon: Settings },
    ];

    const getInitials = () => {
        if (user?.full_name) {
            return user.full_name.split(' ').map((name) => name[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'ST';
    };

    return (
        <div className="student-layout">
            {/* Sidebar Overlay for Mobile */}
            {isMobile && isSidebarOpen && (
                <div
                    className="student-sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`student-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="student-brand">
                    <div className="student-brand-icon">
                        <Sparkles size={24} />
                    </div>
                    <div className="student-brand-content">
                        <span className="student-brand-name">{t('app.name') || 'EduTraker'}</span>
                        <span className="student-brand-role">Student Portal</span>
                    </div>
                    <button
                        className="student-sidebar-close-btn"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        {isMobile ? <X size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <nav className="student-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (isMobile) {
                                    setIsSidebarOpen(false);
                                }
                            }}
                            className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="student-nav-icon">
                                <item.icon size={20} strokeWidth={1.5} />
                            </div>
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="student-sidebar-footer">
                    <div className="student-quick-stats">
                        <div className="student-stat-mini">
                            <span className="student-stat-value">
                                {loading ? <RefreshCw className="animate-spin" size={14} /> : stats.attendance}
                            </span>
                            <span className="student-stat-label">Attendance</span>
                        </div>
                        <div className="student-stat-divider"></div>
                        <div className="student-stat-mini">
                            <span className="student-stat-value">
                                {loading ? <RefreshCw className="animate-spin" size={14} /> : stats.gpa}
                            </span>
                            <span className="student-stat-label">GPA</span>
                        </div>
                    </div>

                    <button className="student-logout-btn" onClick={logout}>
                        <LogOut size={18} />
                        <span>{t('header.logout') || 'Logout'}</span>
                    </button>

                    <div className="student-profile">
                        <div className="student-avatar">
                            {getInitials()}
                        </div>
                        <div className="student-profile-info">
                            <span className="student-profile-name">{user?.full_name || 'Student'}</span>
                            <span className="student-profile-class">{loading ? 'Loading...' : stats.classroom}</span>
                        </div>
                        <button className="student-notification-btn">
                            <Bell size={16} />
                            <span className="student-notification-badge">3</span>
                        </button>
                    </div>
                </div>
            </aside>

            <main className={`student-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                {/* Top Trigger Button - Visible ONLY when sidebar is closed */}
                {!isSidebarOpen && (
                    <div className="student-main-header">
                        <button
                            className="student-trigger-btn"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>

                        {/* Mobile Brand Display */}
                        {isMobile && (
                            <div className="student-mobile-brand-display">
                                <Sparkles size={20} className="text-primary" />
                                <span className="font-bold">EduTraker</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="student-content-wrapper">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

const StudentLayout = () => {
    return (
        <StudentDataProvider>
            <StudentLayoutContent />
        </StudentDataProvider>
    );
};

export default StudentLayout;
