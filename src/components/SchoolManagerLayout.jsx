import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    FileBarChart,
    Users,
    Briefcase,
    UserCheck,
    Sparkles,
    Bell,
    MessageSquare
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/SchoolManager/SchoolManager.css';

const SchoolManagerLayout = () => {
    const { t } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/school-manager/dashboard', labelKey: 'school.nav.overview', icon: LayoutDashboard },
        { path: '/school-manager/configuration', labelKey: 'school.nav.academicConfig', icon: Settings },
        { path: '/school-manager/reports', labelKey: 'school.nav.reports', icon: FileBarChart },
        { path: '/school-manager/teachers', labelKey: 'school.nav.teacherMonitoring', icon: UserCheck },
        { path: '/school-manager/departments', labelKey: 'school.nav.departments', icon: Briefcase },
        { path: '/school-manager/secretaries', labelKey: 'school.nav.secretaryMonitoring', icon: Users },
        { path: '/school-manager/communication', labelKey: 'school.nav.communication', icon: MessageSquare },
        { path: '/school-manager/settings', labelKey: 'school.nav.settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'SM';
    };

    return (
        <div className="school-manager-layout">
            <aside className="school-manager-sidebar">
                {/* Brand Section */}
                <div className="school-manager-brand">
                    <Sparkles size={28} />
                    <span>{t('app.name')}</span>
                </div>

                {/* Quick Stats */}
                {/* Quick Stats - Dynamic */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <div style={{ flex: 1, background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#8b5cf6' }}>
                            {(() => {
                                try {
                                    const users = JSON.parse(localStorage.getItem('edutraker_users') || '[]');
                                    const teachers = users.filter(u => u.role === 'TEACHER').length;
                                    return teachers > 0 ? teachers : 42; // Default if empty
                                } catch { return 42; }
                            })()}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(226, 232, 240, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teachers</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0ea5e9' }}>
                            {(() => {
                                try {
                                    return JSON.parse(localStorage.getItem('sec_students') || '[]').length || 1250;
                                } catch { return '1.2K'; }
                            })()}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(226, 232, 240, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Students</div>
                    </div>
                </div>

                {/* Navigation */}
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

                {/* User Profile Section */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    {/* Notification Bell */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                        onClick={() => navigate('/school-manager/communication', { state: { activeTab: 'notifications' } })}
                    >
                        <div style={{ position: 'relative' }}>
                            <Bell size={18} style={{ color: 'rgba(226, 232, 240, 0.7)' }} />
                            <span style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '8px',
                                height: '8px',
                                background: '#8b5cf6',
                                borderRadius: '50%',
                                border: '2px solid #0f172a'
                            }}></span>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(226, 232, 240, 0.7)' }}>5 new notifications</span>
                    </div>

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

            <main className="school-manager-main">
                <Outlet />
            </main>
        </div>
    );
};

export default SchoolManagerLayout;
