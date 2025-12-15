import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Users, Briefcase, Activity, Settings, HelpCircle, School, GraduationCap, ClipboardList, MessageSquare, Calendar, FileText, UserCheck, Layers } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen }) => {
    const { user } = useAuth();
    const { t } = useTheme();
    const role = user?.role;

    const links = {
        SUPER_ADMIN: [
            { path: '/super-admin', label: t('nav.dashboard'), icon: LayoutDashboard },
            { path: '/super-admin/users', label: t('nav.userManagement'), icon: Users },
            { path: '/super-admin/workstreams', label: t('nav.workstreams'), icon: Briefcase },
            { path: '/super-admin/communication', label: t('nav.communication'), icon: MessageSquare },
            { path: '/super-admin/reports', label: t('nav.analytics'), icon: Activity },
            { path: '/super-admin/settings', label: t('nav.settings'), icon: Settings },
            { path: '/super-admin/support', label: t('nav.support'), icon: HelpCircle },
            { path: '/super-admin/activity', label: t('nav.activity'), icon: ClipboardList },
        ],
        SCHOOL_MANAGER: [
            { path: '/school-manager', label: t('school.nav.dashboard'), icon: LayoutDashboard },
            { path: '/school-manager/configuration', label: t('school.nav.configuration'), icon: Calendar },
            { path: '/school-manager/reports', label: t('school.nav.reports'), icon: FileText },
            { path: '/school-manager/teachers', label: t('school.nav.teachers'), icon: GraduationCap },
            { path: '/school-manager/departments', label: t('school.nav.departments'), icon: Layers },
            { path: '/school-manager/secretaries', label: t('school.nav.secretaries'), icon: UserCheck },
        ],
        // Workstream Manager and others will go here
    };

    const currentLinks = links[role] || links.SUPER_ADMIN; // Fallback to Super Admin for dev if role missing

    return (
        <aside id="app-sidebar" className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>ET</div>
                <span className={styles.logoText}>{t('app.name')}</span>
            </div>

            <nav className={styles.nav}>
                <ul>
                    {currentLinks.map((link) => (
                        <li key={link.path}>
                            <NavLink
                                to={link.path}
                                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                                end={link.path === '/super-admin' || link.path === '/workstream-manager'} // Exact match for root
                            >
                                <link.icon size={20} />
                                <span className={styles.linkText}>{link.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className={styles.footer}>
                <div className={styles.userProfile}>
                    <div className={styles.avatar}>{user?.name?.[0] || 'U'}</div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.name || 'User'}</span>
                        <span className={styles.userRole}>{role?.replace('_', ' ') || 'Guest'}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
