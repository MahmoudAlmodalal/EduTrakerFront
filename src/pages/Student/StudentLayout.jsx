import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    GraduationCap,
    CalendarCheck,
    LogOut,
    UserCircle
} from 'lucide-react';
import './Student.css';

const StudentLayout = () => {
    const navItems = [
        { path: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/student/subjects', label: 'Subjects', icon: BookOpen },
        { path: '/student/results', label: 'Academic Results', icon: GraduationCap },
        { path: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    ];

    return (
        <div className="student-layout">
            {/* Sidebar */}
            <aside className="student-sidebar">
                <div className="student-brand">
                    <UserCircle size={32} className="text-blue-600" />
                    <span>Student Portal</span>
                </div>

                <nav className="student-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `student-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', padding: '1rem' }}>
                    <button className="student-nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="student-main">
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;
