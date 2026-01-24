import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Activity,
    Settings,
    HelpCircle,
    GraduationCap,
    ClipboardList,
    MessageSquare,
    Calendar,
    FileText,
    UserCheck,
    Layers,
    LogOut,
    School,
    FileBarChart,
    UserPlus,
    ShieldCheck,
    BookOpen,
    CalendarCheck,
    Sparkles,
    Menu,
    X
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { t } = useTheme();
    const role = user?.role;
    const location = useLocation();

    // Close sidebar on route change for mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768 && isOpen) {
                // toggleSidebar(); // Don't auto-close on resize, only on nav
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen]);

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
        WORKSTREAM_MANAGER: [
            { path: '/workstream/dashboard', label: t('workstream.nav.dashboard'), icon: LayoutDashboard },
            { path: '/workstream/schools', label: t('workstream.nav.schools'), icon: School },
            { path: '/workstream/assignments', label: t('workstream.nav.assignments'), icon: Users },
            { path: '/workstream/reports', label: t('workstream.nav.reports'), icon: FileBarChart },
            { path: '/workstream/communication', label: t('workstream.nav.communication'), icon: MessageSquare },
            { path: '/workstream/settings', label: t('workstream.nav.settings'), icon: Settings },
        ],
        SCHOOL_MANAGER: [
            { path: '/school-manager/dashboard', label: t('school.nav.overview'), icon: LayoutDashboard },
            { path: '/school-manager/configuration', label: t('school.nav.academicConfig'), icon: Settings },
            { path: '/school-manager/reports', label: t('school.nav.reports'), icon: FileBarChart },
            { path: '/school-manager/teachers', label: t('school.nav.teacherMonitoring'), icon: UserCheck },
            { path: '/school-manager/departments', label: t('school.nav.departments'), icon: Briefcase },
            { path: '/school-manager/secretaries', label: t('school.nav.secretaryMonitoring'), icon: Users },
            { path: '/school-manager/communication', label: t('school.nav.communication'), icon: MessageSquare },
            { path: '/school-manager/settings', label: t('school.nav.settings'), icon: Settings },
        ],
        SECRETARY: [
            { path: '/secretary/dashboard', label: t('secretary.nav.overview'), icon: LayoutDashboard },
            { path: '/secretary/admissions', label: t('secretary.nav.admissions'), icon: UserPlus },
            { path: '/secretary/guardians', label: t('secretary.nav.guardians'), icon: Users },
            { path: '/secretary/attendance', label: t('secretary.nav.attendance'), icon: FileText },
            { path: '/secretary/communication', label: t('secretary.nav.communication'), icon: MessageSquare },
            { path: '/secretary/settings', label: t('secretary.nav.settings'), icon: Settings },
        ],
        TEACHER: [
            { path: '/teacher/dashboard', label: t('teacher.nav.dashboard'), icon: LayoutDashboard },
            { path: '/teacher/classes', label: t('teacher.nav.classes'), icon: Users },
            { path: '/teacher/assessments', label: t('teacher.nav.assessments'), icon: FileText },
            { path: '/teacher/lesson-plans', label: t('teacher.nav.lessonPlans'), icon: BookOpen },
            { path: '/teacher/communication', label: t('teacher.nav.communication'), icon: MessageSquare },
            { path: '/teacher/settings', label: t('teacher.nav.settings'), icon: Settings },
        ],
        STUDENT: [
            { path: '/student/dashboard', label: t('student.nav.dashboard'), icon: LayoutDashboard },
            { path: '/student/subjects', label: t('student.nav.subjects'), icon: BookOpen },
            { path: '/student/results', label: t('student.nav.results'), icon: GraduationCap },
            { path: '/student/attendance', label: t('student.nav.attendance'), icon: CalendarCheck },
            { path: '/student/communication', label: t('student.nav.communication'), icon: MessageSquare },
            { path: '/student/settings', label: t('student.nav.settings'), icon: Settings },
        ],
        GUARDIAN: [
            { path: '/guardian/dashboard', label: t('guardian.nav.dashboard'), icon: LayoutDashboard },
            { path: '/guardian/monitoring', label: t('guardian.nav.monitoring'), icon: Users },
            { path: '/guardian/communication', label: t('guardian.nav.communication'), icon: MessageSquare },
            { path: '/guardian/settings', label: t('guardian.nav.settings'), icon: Settings },
        ],
    };

    const currentLinks = links[role] || links.SUPER_ADMIN;

    // Handle Closing Sidebar on Mobile Link Click
    const handleLinkClick = () => {
        if (window.innerWidth < 768 && isOpen) {
            toggleSidebar();
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''} visible-mobile`}
                onClick={toggleSidebar}
            />

            <aside
                className={`${styles.sidebar} ${!isOpen ? styles.closed : ''} ${isOpen ? styles.openMobile : ''}`}
                id="app-sidebar"
            >
                <div className={styles.logo}>
                    <div className={styles.logoIcon} onClick={toggleSidebar} title="Toggle Sidebar">
                        <Sparkles size={24} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <span className={styles.logoText}>{t('app.name') || 'EduTraker'}</span>

                    {/* Mobile Close Button */}
                    <button
                        className={styles.mobileToggle}
                        onClick={toggleSidebar}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    <ul>
                        {currentLinks.map((link) => (
                            <li key={link.path}>
                                <NavLink
                                    to={link.path}
                                    className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                                    end={false} // Allow deep matching for most parts
                                    onClick={handleLinkClick}
                                >
                                    <link.icon size={20} strokeWidth={1.5} />
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
                        <button
                            onClick={logout}
                            className={styles.logoutBtn}
                            title={t('auth.logout')}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

