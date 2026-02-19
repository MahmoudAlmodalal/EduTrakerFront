import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    BookMarked,
    ClipboardList,
    FileText,
    Info,
    MessageSquare,
    LogOut,
    GraduationCap,
    Settings,
    Menu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/Teacher/Teacher.css';

const TeacherLayout = () => {
    const { t } = useTheme();
    const { logout, user } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const fullName = user?.full_name || user?.displayName || user?.username || 'Teacher';
    const email = user?.email || 'No email';
    const initials = fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'T';

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = async () => {
        await logout();
    };

    const navItems = [
        { path: '/teacher/dashboard', label: t('teacher.nav.dashboard'), icon: LayoutDashboard },
        { path: '/teacher/classes', label: t('teacher.nav.classes'), icon: Users },
        { path: '/teacher/assessments', label: t('teacher.nav.assessments'), icon: FileText },
        { path: '/teacher/lesson-plans', label: t('teacher.nav.lessonPlans'), icon: BookOpen },
        { path: '/teacher/content', label: 'Content', icon: BookMarked },
        { path: '/teacher/gradebook', label: 'Gradebook', icon: ClipboardList },
        { path: '/teacher/communication', label: t('teacher.nav.communication'), icon: MessageSquare },
        { path: '/teacher/info', label: t('teacher.nav.info'), icon: Info },
        { path: '/teacher/settings', label: t('teacher.nav.settings'), icon: Settings },
    ];

    return (
        <div className={`teacher-layout ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
            {/* Mobile/Collapsed Menu Toggle */}
            {!isSidebarOpen && (
                <button
                    onClick={toggleSidebar}
                    className="teacher-sidebar-toggle-floating"
                    title="Open Sidebar"
                >
                    <Menu size={24} />
                </button>
            )}

            <aside className={`teacher-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="teacher-brand mb-6">
                    <div className="teacher-brand-content">
                        <div className="teacher-brand-icon">
                            <GraduationCap size={32} />
                        </div>
                        <span>EduTraker</span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="teacher-sidebar-toggle-inline"
                        title="Close Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                <nav className="teacher-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `teacher-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={22} strokeWidth={1.5} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="teacher-logout-section">
                    <button
                        type="button"
                        className="teacher-nav-item teacher-logout-btn"
                        onClick={handleLogout}
                    >
                        <LogOut size={22} strokeWidth={1.5} />
                        <span>{t('header.logout')}</span>
                    </button>

                    <div className="teacher-profile">
                        <div className="teacher-avatar">
                            {initials}
                        </div>
                        <div className="teacher-profile-info">
                            <p className="teacher-profile-name">{fullName}</p>
                            <p className="teacher-profile-email">{email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className={`teacher-main ${!isSidebarOpen ? 'expanded' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default TeacherLayout;
