import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    BookOpen,
    FileBarChart,
    Users,
    Briefcase,
    UserCheck,
    GraduationCap
} from 'lucide-react';
import '../pages/SchoolManager/SchoolManager.css';

const SchoolManagerLayout = () => {
    const navItems = [
        { path: '/school-manager/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/school-manager/configuration', label: 'Academic Config', icon: Settings },
        { path: '/school-manager/reports', label: 'Reports', icon: FileBarChart },
        { path: '/school-manager/teachers', label: 'Teachers', icon: UserCheck },
        { path: '/school-manager/departments', label: 'Departments', icon: Briefcase },
        { path: '/school-manager/secretaries', label: 'Secretaries', icon: Users },
        { path: '/school-manager/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="school-manager-layout">
            <aside className="school-manager-sidebar">
                <div className="school-manager-brand">
                    <GraduationCap size={32} />
                    <span>EduTraker</span>
                </div>

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
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button className="school-manager-nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="school-manager-main">
                <Outlet />
            </main>
        </div>
    );
};

export default SchoolManagerLayout;
