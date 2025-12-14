import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users, // For Children Monitoring
    MessageSquare, // For Communication
    LogOut,
    ShieldCheck // Guardian Icon/Brand
} from 'lucide-react';
import '../pages/Guardian/Guardian.css';

const GuardianLayout = () => {
    const navItems = [
        { path: '/guardian/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/guardian/monitoring', label: 'Children Monitoring', icon: Users },
        { path: '/guardian/communication', label: 'Communication', icon: MessageSquare },
    ];

    return (
        <div className="guardian-layout">
            {/* Sidebar */}
            <aside className="guardian-sidebar">
                <div className="guardian-brand">
                    <ShieldCheck size={32} />
                    <span>EduTraker</span>
                </div>

                <div className="user-profile" style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Welcome,</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>Guardian Name</div>
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
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button className="guardian-nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
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
