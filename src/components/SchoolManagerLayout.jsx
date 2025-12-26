import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    BookOpen,
    FileBarChart,
    Users,
    Briefcase,
    UserCheck,
    GraduationCap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/SchoolManager/SchoolManager.css';

const SchoolManagerLayout = () => {
    const { t } = useTheme();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/school-manager/dashboard', labelKey: 'school.nav.overview', icon: LayoutDashboard },
        { path: '/school-manager/configuration', labelKey: 'school.nav.academicConfig', icon: Settings },
        { path: '/school-manager/reports', labelKey: 'school.nav.reports', icon: FileBarChart },
        { path: '/school-manager/teachers', labelKey: 'school.nav.teacherMonitoring', icon: UserCheck },
        { path: '/school-manager/departments', labelKey: 'school.nav.departments', icon: Briefcase },
        { path: '/school-manager/secretaries', labelKey: 'school.nav.secretaryMonitoring', icon: Users },
        { path: '/school-manager/settings', labelKey: 'school.nav.settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="school-manager-layout">
            <aside className="school-manager-sidebar">
                <div className="school-manager-brand">
                    <GraduationCap size={32} />
                    <span>{t('app.name')}</span>
                </div>

                <nav className="school-manager-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `school-manager-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button
                        className="school-manager-nav-item"
                        style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>{t('auth.logout')}</span>
                    </button>
                </div>
            </aside>

            <main className="school-manager-main">
                <Outlet />
            </main>
        </div>
    );
};

export default SchoolManagerLayout;
