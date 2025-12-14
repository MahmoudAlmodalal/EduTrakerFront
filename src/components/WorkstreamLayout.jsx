import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    School,
    Users,
    FileBarChart,
    Settings,
    LogOut
} from 'lucide-react';
import '../pages/WorkstreamManager/Workstream.css';

const WorkstreamLayout = () => {
    const navItems = [
        { path: '/workstream/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/workstream/schools', label: 'My Schools', icon: School },
        { path: '/workstream/assignments', label: 'Assignments', icon: Users },
        { path: '/workstream/reports', label: 'Reports', icon: FileBarChart },
        { path: '/workstream/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="workstream-layout">
            {/* Sidebar */}
            <aside className="workstream-sidebar">
                <div className="workstream-brand">
                    <School size={32} />
                    <span>EduTraker</span>
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
                        <span>Logout</span>
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
