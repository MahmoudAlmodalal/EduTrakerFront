import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Settings,
    LogOut,
    ShieldCheck,
    Bell
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import '../pages/Guardian/Guardian.css';

const GuardianLayout = () => {
    const { t } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleNotificationClick = () => {
        navigate('/guardian/communication', { state: { activeTab: 'notifications' } });
    };

    const navItems = [
        { path: '/guardian/dashboard', labelKey: 'guardian.nav.dashboard', icon: LayoutDashboard },
        { path: '/guardian/monitoring', labelKey: 'guardian.nav.monitoring', icon: Users },
        { path: '/guardian/communication', labelKey: 'guardian.nav.communication', icon: MessageSquare },
        { path: '/guardian/settings', labelKey: 'guardian.nav.settings', icon: Settings },
    ];

    const getInitials = () => {
        if (user?.name) {
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return 'GD';
    };

    return (
        <div className="guardian-layout">
            {/* Sidebar */}
            <aside className="guardian-sidebar">
                <div className="guardian-brand">
                    <ShieldCheck size={32} />
                    <span className="guardian-brand-text">{t('app.name')}</span>
                </div>

                <nav className="guardian-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `guardian-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{t(item.labelKey)}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                    {/* Notifications indicator */}
                    <div
                        onClick={handleNotificationClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: 'var(--color-primary-light)',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid var(--color-border)'
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            <Bell size={18} style={{ color: 'var(--color-primary)' }} />
                            <span style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                width: '8px',
                                height: '8px',
                                background: '#ef4444',
                                borderRadius: '50%',
                                border: '2px solid var(--color-bg-surface)'
                            }}></span>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>3 new alerts</span>
                    </div>

                    {/* User Card */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-bg-surface)',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '0.875rem'
                        }}>
                            {getInitials()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '0.875rem',
                                fontWeight: '700',
                                color: 'var(--color-text-main)'
                            }}>{user?.name || 'Guardian'}</div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em'
                            }}>Guardian</div>
                        </div>
                        <button
                            onClick={logout}
                            style={{
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                            title={t('auth.logout')}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="guardian-main">
                <Outlet />
            </main>
        </div>
    );
};

export default GuardianLayout;
