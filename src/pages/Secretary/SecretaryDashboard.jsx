import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Calendar as CalendarIcon, Clock, TrendingUp, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import './Secretary.css';

const SecretaryDashboard = () => {
    const { t } = useTheme();
    const navigate = useNavigate();

    // Dynamic Stats
    const students = JSON.parse(localStorage.getItem('sec_students') || '[]');
    const studentsCount = students.length;

    const messages = JSON.parse(localStorage.getItem('edutraker_messages') || '[]');
    const unreadCount = messages.filter(m => !m.read).length;

    // Calculate Absent Today
    const today = new Date().toISOString().split('T')[0];
    const attendance = JSON.parse(localStorage.getItem('sec_attendance') || '{}');
    const todayAttendance = attendance[today] || {};
    const absentCount = Object.values(todayAttendance).filter(r => r.status === 'Absent').length;

    const stats = [
        { labelKey: 'secretary.dashboard.totalStudents', value: studentsCount.toString(), icon: Users, color: '#4F46E5', bgColor: '#EEF2FF', link: '/secretary/admissions', change: '+12% from last month' },
        { labelKey: 'secretary.dashboard.unreadMessages', value: unreadCount.toString(), icon: FileText, color: '#F59E0B', bgColor: '#FEF3C7', link: '/secretary/communication', change: '5 urgent replies needed' },
        { labelKey: 'secretary.dashboard.absentToday', value: absentCount.toString(), icon: Clock, color: '#EF4444', bgColor: '#FEE2E2', link: '/secretary/attendance', change: '2% decrease from yesterday' },
    ];

    // Chart Data
    const attendanceData = [
        { day: 'Mon', attendance: 92 },
        { day: 'Tue', attendance: 95 },
        { day: 'Wed', attendance: 88 },
        { day: 'Thu', attendance: 94 },
        { day: 'Fri', attendance: 91 },
    ];

    const distributionData = [
        { name: 'Grade 1', value: students.filter(s => s.grade?.includes('1st')).length || 45 },
        { name: 'Grade 2', value: students.filter(s => s.grade?.includes('2nd')).length || 38 },
        { name: 'Grade 3', value: students.filter(s => s.grade?.includes('3rd')).length || 32 },
    ];

    const enrollmentData = [
        { month: 'Sep', count: 20 },
        { month: 'Oct', count: 15 },
        { month: 'Nov', count: 25 },
        { month: 'Dec', count: 10 },
    ];

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

    // Tasks & Events
    const pendingTasks = JSON.parse(localStorage.getItem('sec_tasks') || '[]').length > 0
        ? JSON.parse(localStorage.getItem('sec_tasks'))
        : [
            { id: 1, title: 'Review Application #1023 - John Doe', time: '2 hours ago', type: 'application' },
            { id: 2, title: 'Verify Documents for Class 1-A', time: '5 hours ago', type: 'doc' },
        ];

    const recentActivity = [
        { id: 1, action: 'Student Registered', detail: 'Alice Johnson was added to 1st Grade', time: '10 mins ago', icon: UserPlus, color: '#4F46E5' },
        { id: 2, action: 'Attendance Shared', detail: 'Principal Skinner shared Friday reports', time: '1 hour ago', icon: CheckCircle, color: '#10B981' },
        { id: 3, action: 'Document Missing', detail: 'Bob Smith - Missing Birth Certificate', time: '3 hours ago', icon: AlertCircle, color: '#EF4444' },
    ];

    const events = JSON.parse(localStorage.getItem('sec_events') || '[]').length > 0
        ? JSON.parse(localStorage.getItem('sec_events'))
        : [
            { id: 1, title: 'Parent-Teacher Meeting', date: 'Dec 15, 2025', time: '10:00 AM' },
            { id: 2, title: 'School Assembly', date: 'Dec 16, 2025', time: '08:00 AM' },
        ];

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <div>
                    <h1>{t('secretary.dashboard.title')}</h1>
                    <p>{t('secretary.dashboard.welcome')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" onClick={() => navigate('/secretary/admissions')}>
                        <UserPlus size={18} />
                        New Admission
                    </button>
                    <button className="btn-primary" onClick={() => navigate('/secretary/communication')}>
                        <FileText size={18} />
                        {t('secretary.communication.compose')}
                    </button>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="secretary-stats-grid">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="stat-card"
                        onClick={() => navigate(stat.link)}
                    >
                        <div
                            className="stat-icon-wrapper"
                            style={{ backgroundColor: stat.bgColor, color: stat.color }}
                        >
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <p>{t(stat.labelKey)}</p>
                            <h3>{stat.value}</h3>
                            <span style={{ fontSize: '0.75rem', color: stat.color, fontWeight: 600 }}>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analytics Section */}
            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Weekly Attendance Trend</h2>
                        <TrendingUp size={20} color="#10B981" />
                    </div>
                    <div style={{ height: '250px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceData}>
                                <defs>
                                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sec-border)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--sec-text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--sec-text-muted)', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--sec-border)' }} />
                                <Area type="monotone" dataKey="attendance" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Monthly Enrollment</h2>
                    </div>
                    <div style={{ height: '250px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={enrollmentData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sec-border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--sec-text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--sec-text-muted)', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--sec-border)' }} />
                                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Grade Distribution</h2>
                    </div>
                    <div style={{ height: '250px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distributionData.map((entry, index) => (
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

            <div className="secretary-widgets-grid">
                {/* Recent Activity Feed */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Recent Activity</h2>
                        <Clock size={20} color="#9ca3af" />
                    </div>
                    <div className="widget-body">
                        {recentActivity.map((act) => (
                            <div key={act.id} className="task-item">
                                <div style={{
                                    padding: '10px',
                                    borderRadius: '10px',
                                    background: `${act.color}15`,
                                    color: act.color,
                                    marginRight: '1rem'
                                }}>
                                    <act.icon size={18} />
                                </div>
                                <div className="task-content" style={{ flex: 1 }}>
                                    <h4 style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        {act.action}
                                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--sec-text-muted)' }}>{act.time}</span>
                                    </h4>
                                    <p>{act.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Events Calendar Widget */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>{t('secretary.dashboard.upcomingEvents')}</h2>
                        <CalendarIcon size={20} color="#9ca3af" />
                    </div>
                    <div className="widget-body">
                        {events.map((event) => (
                            <div key={event.id} className="event-item">
                                <div className="event-date">
                                    <span className="event-month">{event.date.split(' ')[0]}</span>
                                    <span className="event-day">{event.date.split(' ')[1].replace(',', '')}</span>
                                </div>
                                <div className="task-content">
                                    <h4>{event.title}</h4>
                                    <p>{event.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecretaryDashboard;
