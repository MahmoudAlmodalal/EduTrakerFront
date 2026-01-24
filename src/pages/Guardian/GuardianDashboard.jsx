import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Calendar,
    TrendingUp,
    Bell,
    Award,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    BookOpen
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import './Guardian.css';

const GuardianDashboard = () => {
    const { t } = useTheme();
    const navigate = useNavigate();

    // Fetch real students from localStorage
    const [children, setChildren] = useState([]);

    useEffect(() => {
        const students = JSON.parse(localStorage.getItem('sec_students') || '[]');
        setChildren(students);
    }, []);

    // Chart Data (Mocked for visualization)
    const academicProgressData = [
        { month: 'Sep', average: 78 },
        { month: 'Oct', average: 82 },
        { month: 'Nov', average: 80 },
        { month: 'Dec', average: 85 },
        { month: 'Jan', average: 88 },
    ];

    const attendanceHealthData = [
        { name: 'Present', value: 94 },
        { name: 'Absent', value: 4 },
        { name: 'Late', value: 2 },
    ];

    const COLORS = ['#4F46E5', '#EF4444', '#F59E0B'];

    // Stats Grid
    const stats = [
        { label: 'Enrolled Children', value: children.length, icon: Users, color: '#4F46E5', bgColor: 'rgba(79, 70, 229, 0.1)', change: 'All Active' },
        { label: 'Attendance Health', value: '94.2%', icon: Clock, color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)', change: '+2% from last month' },
        { label: 'Overall Average', value: '88/100', icon: Award, color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', change: 'Top 10% of class' },
    ];

    // Activity & Notices
    const notices = [
        { id: 1, action: 'Term Schedule Ready', detail: 'The spring term schedule is now available.', time: '1 hour ago', icon: Calendar, color: '#4F46E5' },
        { id: 2, action: 'Exam Registration', detail: 'Mid-term exam registration ends tomorrow.', time: '5 hours ago', icon: AlertCircle, color: '#EF4444' },
        { id: 3, action: 'School Feedback', detail: 'A new parent feedback survey is open.', time: '1 day ago', icon: CheckCircle, color: '#10B981' },
    ];

    const upcomingEvents = [
        { id: 1, title: 'Parent-Teacher Meeting', date: 'Jan 20', child: 'John Doe', type: 'meeting' },
        { id: 2, title: 'Math Olympiad', date: 'Jan 22', child: 'All', type: 'competition' },
        { id: 3, title: 'Science Fair', date: 'Jan 25', child: 'John Doe', type: 'event' },
    ];

    return (
        <div className="guardian-dashboard">
            <header className="guardian-card-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="guardian-page-title" style={{ margin: 0 }}>{t('guardian.dashboard.title')}</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Welcome back! Here's an overview of your children's progress.</p>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="guardian-stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <p>{stat.label}</p>
                            <h3>{stat.value}</h3>
                            <span style={{ fontSize: '0.75rem', color: stat.color, fontWeight: 700 }}>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analytics Section */}
            <div className="analytics-grid">
                {/* Academic Progress Chart */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Academic Progress Trend</h2>
                        <TrendingUp size={20} color="#4F46E5" />
                    </div>
                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={academicProgressData}>
                                <defs>
                                    <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }} />
                                <Area type="monotone" dataKey="average" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAverage)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Attendance Health Pie Chart */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Attendance Health</h2>
                        <CheckCircle size={20} color="#10B981" />
                    </div>
                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={attendanceHealthData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {attendanceHealthData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="analytics-grid">
                {/* School Notices Feed */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>School Notices</h2>
                        <Bell size={20} color="var(--color-text-muted)" />
                    </div>
                    <div className="widget-body">
                        {notices.map((notice) => (
                            <div key={notice.id} className="task-item">
                                <div style={{
                                    padding: '10px',
                                    borderRadius: '12px',
                                    background: `${notice.color}15`,
                                    color: notice.color,
                                    marginRight: '1rem'
                                }}>
                                    <notice.icon size={20} />
                                </div>
                                <div className="task-content" style={{ flex: 1 }}>
                                    <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {notice.action}
                                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>{notice.time}</span>
                                    </h4>
                                    <p>{notice.detail}</p>
                                </div>
                                <ChevronRight size={16} color="var(--color-text-muted)" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Events Grid */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Upcoming Events</h2>
                        <Calendar size={20} color="var(--color-text-muted)" />
                    </div>
                    <div className="widget-body">
                        {upcomingEvents.map((event) => (
                            <div key={event.id} className="task-item">
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    background: 'var(--color-bg-body)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: '1rem',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-primary)' }}>{event.date.split(' ')[0]}</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-main)' }}>{event.date.split(' ')[1]}</span>
                                </div>
                                <div className="task-content" style={{ flex: 1 }}>
                                    <h4>{event.title}</h4>
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users size={12} /> {event.child}
                                    </p>
                                </div>
                                <div className="status-badge positive" style={{ fontSize: '0.7rem' }}>CONFIRMED</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Children Quick Access */}
            <div className="widget-card" style={{ marginTop: '2rem' }}>
                <div className="widget-header">
                    <h2>Children Overview</h2>
                    <BookOpen size={20} color="var(--color-primary)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {children.length > 0 ? (
                        children.map(child => (
                            <div
                                key={child.id}
                                className="task-item"
                                onClick={() => navigate('/guardian/monitoring')}
                                style={{ padding: '1.25rem', cursor: 'pointer' }}
                            >
                                <div className="child-avatar" style={{ marginRight: '1rem', width: '48px', height: '48px' }}>{child.name.charAt(0)}</div>
                                <div className="task-content" style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1rem' }}>{child.name}</h4>
                                    <p>{child.grade} • Class: {child.class || 'N/A'}</p>
                                </div>
                                <div className="status-badge present" style={{ fontSize: '0.75rem' }}>ACTIVE</div>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>No children registered yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuardianDashboard;
