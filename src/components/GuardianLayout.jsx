import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users, // For Children Monitoring
    MessageSquare, // For Communication
    Settings, // For Settings
    LogOut,
    ShieldCheck // Guardian Icon/Brand
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import '../pages/Guardian/Guardian.css';

const GuardianLayout = () => {
    const { t } = useTheme();

    const navItems = [
        { path: '/guardian/dashboard', labelKey: 'guardian.nav.dashboard', icon: LayoutDashboard },
        { path: '/guardian/monitoring', labelKey: 'guardian.nav.monitoring', icon: Users },
        { path: '/guardian/communication', labelKey: 'guardian.nav.communication', icon: MessageSquare },
        { path: '/guardian/settings', labelKey: 'guardian.nav.settings', icon: Settings },
    ];

    return (
        <div className="guardian-layout">
            {/* Sidebar */}
            <aside className="guardian-sidebar">
                <div className="guardian-brand">
                    <ShieldCheck size={32} />
                    <span>{t('app.name')}</span>
                </div>

                <div className="user-profile" style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--color-bg-body)', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('header.welcome') || 'Welcome,'}</div>
                    <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{t('auth.role.guardian')}</div>
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

                <div style={{ marginTop: 'auto' }}>
                    <button className="guardian-nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>{t('header.logout')}</span>
                    </button>
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

