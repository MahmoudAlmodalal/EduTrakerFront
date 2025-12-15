import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    FileText,
    MessageSquare,
    LogOut,
    GraduationCap
} from 'lucide-react';
import '../pages/Teacher/Teacher.css'; // Will create this css file next

const TeacherLayout = () => {
    const navItems = [
        { path: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/teacher/classes', label: 'Class Management', icon: Users },
        { path: '/teacher/assessments', label: 'Assessments', icon: FileText },
        { path: '/teacher/lesson-plans', label: 'Lesson Plans', icon: BookOpen },
        { path: '/teacher/communication', label: 'Communication', icon: MessageSquare },
    ];

    return (
        <div className="teacher-layout">
            <aside className="teacher-sidebar">
                <div className="teacher-brand">
                    <GraduationCap size={32} />
                    <span>EduTraker</span>
                </div>

                <nav className="teacher-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `teacher-nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button className="teacher-nav-item" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="teacher-main">
                <Outlet />
            </main>
        </div>
    );
};

export default TeacherLayout;
