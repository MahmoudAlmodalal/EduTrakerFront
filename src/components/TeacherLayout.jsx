import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    FileText,
    MessageSquare,
    LogOut,
    GraduationCap,
    Settings
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import '../pages/Teacher/Teacher.css';

const TeacherLayout = () => {
    const { t } = useTheme();
    const { logout, user } = useAuth();

    const navItems = [
        { path: '/teacher/dashboard', label: t('teacher.nav.dashboard'), icon: LayoutDashboard },
        { path: '/teacher/classes', label: t('teacher.nav.classes'), icon: Users },
        { path: '/teacher/assessments', label: t('teacher.nav.assessments'), icon: FileText },
        { path: '/teacher/lesson-plans', label: t('teacher.nav.lessonPlans'), icon: BookOpen },
        { path: '/teacher/communication', label: t('teacher.nav.communication'), icon: MessageSquare },
        { path: '/teacher/settings', label: t('teacher.nav.settings'), icon: Settings },
    ];

    return (
        <div className="teacher-layout">
            <aside className="teacher-sidebar">
                <div className="teacher-brand mb-6">
                    <div className="teacher-brand-icon">
                        <GraduationCap size={32} />
                    </div>
                    <span>EduTraker</span>
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
                        className="teacher-nav-item teacher-logout-btn"
                        onClick={logout}
                        title={t('header.logout')}
                    >
                        <LogOut size={22} strokeWidth={1.5} />
                        <span>{t('header.logout')}</span>
                    </button>

                    <div className="teacher-profile">
                        <div className="teacher-avatar">
                            {user?.name?.[0] || 'T'}
                        </div>
                        <div className="teacher-profile-info">
                            <p className="teacher-profile-name">{user?.name || 'Teacher'}</p>
                            <p className="teacher-profile-email">{user?.role || 'Teacher'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="teacher-main">
                <Outlet />
            </main>
        </div>
    );
};

export default TeacherLayout;
