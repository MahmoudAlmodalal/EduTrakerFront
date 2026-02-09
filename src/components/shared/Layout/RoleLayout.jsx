import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useRole } from '../../../hooks/useRole';
import './RoleLayout.css';

/**
 * Dynamic icon component that renders lucide-react icons by name
 */
const DynamicIcon = ({ name, size = 20, ...props }) => {
    const IconComponent = Icons[name];
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in lucide-react`);
        return null;
    }
    return <IconComponent size={size} {...props} />;
};

/**
 * User profile section in sidebar
 */
const UserProfile = ({ user, displayName }) => {
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : displayName?.slice(0, 2).toUpperCase() || 'U';

    return (
        <div className="role-profile">
            <div className="role-avatar">{initials}</div>
            <div className="role-profile-info">
                <p className="role-profile-name">{user?.name || displayName}</p>
                <p className="role-profile-email">{user?.email || ''}</p>
            </div>
        </div>
    );
};

/**
 * Unified layout component for all roles
 * Replaces duplicate layout files (TeacherLayout, GuardianLayout, etc.)
 * 
 * @param {string} role - Optional role override (uses auth context by default)
 * @param {string} className - Additional CSS class
 */
const RoleLayout = ({ role: propRole, className = '' }) => {
    const { t } = useTheme();
    const { user, logout } = useAuth();
    const { role: authRole, config, navigation, basePath, displayName, brandIcon } = useRole();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigate = useNavigate();
    const currentRole = propRole || authRole;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!config) {
        return (
            <div className="role-layout-error">
                <p>Error: No configuration found for role</p>
            </div>
        );
    }

    return (
        <div className={`role-layout ${className}`} data-role={currentRole}>
            {/* Mobile Header */}
            <header className="role-mobile-header">
                <button
                    className="role-menu-toggle-btn"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                >
                    <div className="_logoIcon_lgw59_28" style={{
                        width: '44px',
                        height: '44px',
                        background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                        color: 'white',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                        position: 'relative'
                    }}>
                        <Icons.GraduationCap size={24} />
                    </div>
                </button>
                <div className="role-mobile-brand">
                    <span className="role-brand-text">{t('app.name') || 'EduTraker'}</span>
                </div>
                <div style={{ width: 40 }} /> {/* Spacer */}
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="role-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`role-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                {/* Sidebar Header (Brand + Close Button) */}
                <div className="role-sidebar-header-container">
                    <div className="role-brand" onClick={() => setIsSidebarOpen(false)} style={{ cursor: 'pointer' }}>
                        <div className="role-brand-icon">
                            <Icons.GraduationCap size={28} />
                        </div>
                        <span className="role-brand-text">{t('app.name') || 'EduTraker'}</span>
                    </div>

                    <button className="role-sidebar-close" onClick={() => setIsSidebarOpen(false)}>
                        <Icons.X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="role-nav">
                    {navigation.map((item) => {
                        const fullPath = item.path
                            ? `${basePath}/${item.path}`
                            : basePath;

                        return (
                            <NavLink
                                key={item.path || 'index'}
                                to={fullPath}
                                end={!item.path}
                                className={({ isActive }) =>
                                    `role-nav-item ${isActive ? 'active' : ''}`
                                }
                            >
                                <DynamicIcon name={item.icon} size={20} />
                                <span>{t(item.labelKey) || item.labelKey}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Logout and Profile Section */}
                <div className="role-logout-section">
                    <button className="role-nav-item role-logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>{t('auth.logout') || t('header.logout') || 'Logout'}</span>
                    </button>

                    <UserProfile user={user} displayName={displayName} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="role-main">
                <div className="role-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default RoleLayout;
