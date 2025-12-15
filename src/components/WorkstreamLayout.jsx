import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    School,
    Users,
    FileBarChart,
    Settings,
    MessageSquare,
    LogOut
} from 'lucide-react';
import '../pages/WorkstreamManager/Workstream.css';

import { useTheme } from '../context/ThemeContext';

const WorkstreamLayout = () => {
    const { t } = useTheme();

    const navItems = [
        { path: '/workstream/dashboard', label: t('workstream.nav.dashboard'), icon: LayoutDashboard },
        { path: '/workstream/schools', label: t('workstream.nav.schools'), icon: School },
        { path: '/workstream/assignments', label: t('workstream.nav.assignments'), icon: Users },
        { path: '/workstream/reports', label: t('workstream.nav.reports'), icon: FileBarChart },
        { path: '/workstream/communication', label: t('workstream.nav.communication'), icon: MessageSquare },
        { path: '/workstream/settings', label: t('workstream.nav.settings'), icon: Settings },
    ];

    return (
        <div className="workstream-layout">
            {/* Sidebar */}
            <aside className="workstream-sidebar">
                <div className="workstream-brand">
                    <School size={32} />
                    <span>{t('app.name')}</span>
                </div>

                <nav className="workstream-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `workstream-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button className="workstream-nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>{t('header.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="workstream-main">
                <Outlet />
            </main>
        </div>
    );
};

export default WorkstreamLayout;
