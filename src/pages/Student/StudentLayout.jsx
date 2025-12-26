import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    CalendarCheck,
    Settings,
    LogOut,
    UserCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Student.css';

const StudentLayout = () => {
    const { t } = useTheme();

    const navItems = [
        { path: '/student/dashboard', labelKey: 'student.nav.dashboard', icon: LayoutDashboard },
        { path: '/student/subjects', labelKey: 'student.nav.subjects', icon: BookOpen },
        { path: '/student/results', labelKey: 'student.nav.results', icon: GraduationCap },
        { path: '/student/attendance', labelKey: 'student.nav.attendance', icon: CalendarCheck },
        { path: '/student/settings', labelKey: 'student.nav.settings', icon: Settings },
    ];

    return (
        <div className="student-layout">
            {/* Sidebar */}
            <aside className="student-sidebar">
                <div className="student-brand">
                    <UserCircle size={32} className="text-blue-600" />
                    <span>{t('app.name')}</span>
                </div>

                <nav className="student-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `student-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', padding: '1rem' }}>
                    <button className="student-nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>{t('header.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="student-main">
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;

