import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    UserPlus,
    Users,
    FileText,
    Settings,
    LogOut,
    Shield
} from 'lucide-react';
import '../pages/WorkstreamManager/Workstream.css'; // Reusing Workstream styles for consistency

const SecretaryLayout = () => {
    const navItems = [
        { path: '/secretary/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/secretary/admissions', label: 'Admissions', icon: UserPlus },
        { path: '/secretary/guardians', label: 'Guardians', icon: Users },
        { path: '/secretary/admin-support', label: 'Admin Support', icon: Shield },
        // { path: '/secretary/settings', label: 'Settings', icon: Settings }, // Optional, based on reqs
    ];

    return (
        <div className="workstream-layout">
            {/* Sidebar */}
            <aside className="workstream-sidebar">
                <div className="workstream-brand">
                    <Shield size={32} />
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

export default SecretaryLayout;
