import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
    RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import studentService from '../../services/studentService';
import './Student.css';

const StudentLayout = () => {
    const { t } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ attendance: '0%', gpa: '0.0', classroom: '...' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLayoutStats = async () => {
            try {
                const response = await studentService.getDashboardStats();
                const { statistics } = response || {};

                setStats({
                    attendance: `${statistics?.attendance?.attendance_rate || 0}%`,
                    gpa: statistics?.grades?.overall_average ? (statistics.grades.overall_average / 25).toFixed(1) : '0.0', // Assuming 100 base to 4.0 scale
                    classroom: `${statistics?.profile?.current_classroom?.classroom_name || ''} • ${statistics?.profile?.current_classroom?.grade_name || ''}`
                });
            } catch (error) {
                console.error('Error fetching layout stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchLayoutStats();
        }
    }, [user]);

    const navItems = [
        { path: '/student/dashboard', labelKey: 'student.nav.dashboard', icon: LayoutDashboard },
        { path: '/student/subjects', labelKey: 'student.nav.subjects', icon: BookOpen },
        { path: '/student/results', labelKey: 'student.nav.results', icon: GraduationCap },
        { path: '/student/attendance', labelKey: 'student.nav.attendance', icon: CalendarCheck },
        { path: '/student/communication', labelKey: 'student.nav.communication', icon: MessageSquare },
        { path: '/student/settings', labelKey: 'student.nav.settings', icon: Settings },
    ];


    const handleLogout = () => {
        logout();
    };

    // Get user initials for avatar
    const getInitials = () => {
        if (user?.full_name) {
            return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'ST';
    };

    return (
        <div className="student-layout">
            {/* Premium Sidebar */}
            <aside className="student-sidebar">
                {/* Brand Section */}
                <div className="student-brand">
                    <div className="student-brand-icon">
                        <Sparkles size={24} />
                    </div>
                    <div className="student-brand-content">
                        <span className="student-brand-name">{t('app.name') || 'EduTraker'}</span>
                        <span className="student-brand-role">Student Portal</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="student-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `student-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <div className="student-nav-icon">
                                <item.icon size={20} strokeWidth={1.5} />
                            </div>
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="student-sidebar-footer">
                    {/* Quick Stats */}
                    <div className="student-quick-stats">
                        <div className="student-stat-mini">
                            <span className="student-stat-value">{loading ? <RefreshCw className="animate-spin" size={14} /> : stats.attendance}</span>
                            <span className="student-stat-label">Attendance</span>
                        </div>
                        <div className="student-stat-divider"></div>
                        <div className="student-stat-mini">
                            <span className="student-stat-value">{loading ? <RefreshCw className="animate-spin" size={14} /> : stats.gpa}</span>
                            <span className="student-stat-label">GPA</span>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button className="student-logout-btn" onClick={handleLogout}>
                        <LogOut size={18} />
                        <span>{t('header.logout') || 'Logout'}</span>
                    </button>

                    {/* User Profile */}
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

            {/* Main Content */}
            <main className="student-main">
                <div className="student-content-wrapper">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default StudentLayout;
