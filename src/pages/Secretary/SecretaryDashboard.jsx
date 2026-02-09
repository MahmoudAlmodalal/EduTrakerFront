import React, { useState, useEffect } from 'react';
import {
    Users,
    FileText,
    Calendar as CalendarIcon,
    Clock,
    UserPlus,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    ChevronRight,
    Plus,
    ClipboardList
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Secretary.css';

const SecretaryDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        unreadMessages: 0,
        absentToday: 0,
        schoolName: '',
    });
    const [recentApplications, setRecentApplications] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, applicationsData, yearsData] = await Promise.all([
                    secretaryService.getDashboardStats(),
                    secretaryService.getApplications({ page: 1 }),
                    secretaryService.getAcademicYears()
                ]);

                setStats({
                    totalStudents: statsData.statistics?.total_students || 0,
                    unreadMessages: statsData.statistics?.unread_messages || 0,
                    absentToday: statsData.statistics?.absent_today || 0,
                    schoolName: statsData.statistics?.school_name || 'My School'
                });

                setRecentApplications((applicationsData.results || applicationsData || []).slice(0, 5));
                setAcademicYears(yearsData.results || yearsData || []);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const currentYear = academicYears.find(y => {
        const now = new Date();
        const start = new Date(y.start_date);
        const end = new Date(y.end_date);
        return now >= start && now <= end;
    }) || academicYears[0];

    // Trend data for the chart
    const trendData = [
        { name: 'Mon', count: Math.floor(stats.totalStudents * 0.95) },
        { name: 'Tue', count: Math.floor(stats.totalStudents * 0.92) },
        { name: 'Wed', count: Math.floor(stats.totalStudents * 0.96) },
        { name: 'Thu', count: Math.floor(stats.totalStudents * 0.94) },
        { name: 'Fri', count: Math.max(0, stats.totalStudents - stats.absentToday) },
    ];

    const statCards = [
        {
            title: t('secretary.dashboard.totalStudents') || 'Total Students',
            value: stats.totalStudents.toLocaleString(),
            icon: Users,
            trend: '+12%',
            trendUp: true,
            color: 'indigo'
        },
        {
            title: t('secretary.dashboard.messages') || 'Unread Messages',
            value: stats.unreadMessages,
            icon: MessageSquare,
            trend: '',
            trendUp: true,
            color: 'amber'
        },
        {
            title: t('secretary.dashboard.attendanceRate') || 'Attendance Rate',
            value: `${stats.totalStudents > 0 ? Math.round(((stats.totalStudents - stats.absentToday) / stats.totalStudents) * 100) : 0}%`,
            icon: TrendingUp,
            trend: '+2.3%',
            trendUp: true,
            color: 'green'
        },
        {
            title: t('secretary.dashboard.absentToday') || 'Absent Today',
            value: stats.absentToday,
            icon: Clock,
            trend: '',
            trendUp: false,
            color: 'rose'
        }
    ];

    const getIconStyle = (color) => {
        const styles = {
            indigo: { background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4f46e5' },
            amber: { background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706' },
            green: { background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669' },
            rose: { background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)', color: '#e11d48' },
            purple: { background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', color: '#7c3aed' },
            blue: { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#2563eb' }
        };
        return styles[color] || styles.indigo;
    };

    const quickAccessButtons = [
        { icon: UserPlus, label: 'Student Registry', sub: 'Manage all students', link: '/secretary/students' },
        { icon: CalendarIcon, label: 'Attendance Log', sub: 'Daily reports', link: '/secretary/attendance' },
        { icon: MessageSquare, label: 'Parent Broadcast', sub: 'Send updates', link: '/secretary/communication' },
        { icon: FileText, label: 'Enrollment Center', sub: 'Process apps', link: '/secretary/admissions' },
    ];

    if (loading) {
        return (
            <div className="secretary-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid var(--sec-primary)',
                        borderTop: '4px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: 'var(--sec-text-muted)' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="secretary-dashboard">
            {/* Header */}
            <div className="secretary-header">
                <div>
                    <h1>Welcome back, {user?.displayName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Secretary'}!</h1>
                    <p>{stats.schoolName} - Secretary Control Panel</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/secretary/admissions')}>
                    <Plus size={18} />
                    New Admission
                </button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <span className="stat-title" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--sec-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {stat.title}
                            </span>
                            <div className="stat-icon" style={{ ...getIconStyle(stat.color), width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ fontSize: '28px', fontWeight: '700', color: 'var(--sec-text-main)', marginBottom: '8px' }}>
                            {stat.value}
                        </div>
                        {stat.trend && (
                            <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                {stat.trendUp ? <TrendingUp size={14} style={{ color: '#059669' }} /> : <TrendingDown size={14} style={{ color: '#dc2626' }} />}
                                <span style={{ color: stat.trendUp ? '#059669' : '#dc2626', fontWeight: '600' }}>{stat.trend}</span>
                                <span style={{ color: 'var(--sec-text-muted)' }}>this month</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', marginBottom: '32px' }}>
                {/* Attendance Trend Chart */}
                <div className="chart-card" style={{ background: 'var(--sec-surface)', borderRadius: '16px', border: '1px solid var(--sec-border)', padding: '24px', boxShadow: 'var(--sec-shadow)' }}>
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>Weekly Attendance Trend</h3>
                            <p style={{ fontSize: '13px', color: 'var(--sec-text-muted)', margin: '4px 0 0' }}>Student attendance tracking for the current week</p>
                        </div>
                        <select style={{ background: 'var(--sec-border)', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--sec-text-main)', cursor: 'pointer' }}>
                            <option>Current Week</option>
                            <option>Last Week</option>
                        </select>
                    </div>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--sec-primary)" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="var(--sec-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--sec-border)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--sec-text-muted)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--sec-text-muted)', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--sec-border)', background: 'var(--sec-surface)', boxShadow: 'var(--sec-shadow-lg)' }}
                                    itemStyle={{ color: 'var(--sec-primary)', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="var(--sec-primary)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Current Session Info */}
                    <div style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '8px' }}>
                                Current Session
                            </p>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>
                                {currentYear?.academic_year_code || '---'}
                            </h3>
                            <span style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                padding: '4px 10px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '20px',
                                marginBottom: '20px'
                            }}>
                                Active
                            </span>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                                    <span style={{ opacity: 0.8 }}>Start Date</span>
                                    <span style={{ fontWeight: '600' }}>{currentYear?.start_date || '---'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ opacity: 0.8 }}>End Date</span>
                                    <span style={{ fontWeight: '600' }}>{currentYear?.end_date || '---'}</span>
                                </div>
                            </div>
                        </div>
                        <CalendarIcon size={120} style={{ position: 'absolute', bottom: '-30px', right: '-20px', opacity: 0.1 }} />
                    </div>

                    {/* Recent Activity */}
                    <div className="widget-card" style={{ flex: 1 }}>
                        <div className="widget-header">
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--sec-text-main)', margin: 0 }}>Recent Activity</h3>
                            <button className="view-all-btn" onClick={() => navigate('/secretary/admissions')}>View All</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {recentApplications.length > 0 ? recentApplications.map((app) => (
                                <div key={app.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sec-border)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                            color: '#4f46e5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '700',
                                            fontSize: '15px'
                                        }}>
                                            {(app.student_name || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', color: 'var(--sec-text-main)', margin: 0, fontSize: '14px' }}>{app.student_name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--sec-text-muted)', margin: '2px 0 0' }}>Applied for: {app.grade_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} style={{ color: 'var(--sec-text-muted)' }} />
                                </div>
                            )) : (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--sec-text-muted)', fontSize: '14px' }}>
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--sec-text-main)', marginBottom: '16px' }}>Quick Access</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    {quickAccessButtons.map((btn, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(btn.link)}
                            style={{
                                background: 'var(--sec-surface)',
                                padding: '24px',
                                borderRadius: '16px',
                                border: '1px solid var(--sec-border)',
                                boxShadow: 'var(--sec-shadow-sm)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--sec-primary)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = 'var(--sec-shadow)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--sec-border)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--sec-shadow-sm)';
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'var(--sec-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '16px',
                                color: 'var(--sec-primary)',
                                transition: 'all 0.2s ease'
                            }}>
                                <btn.icon size={24} />
                            </div>
                            <span style={{ fontWeight: '700', color: 'var(--sec-text-main)', fontSize: '15px', marginBottom: '4px' }}>{btn.label}</span>
                            <span style={{ fontSize: '13px', color: 'var(--sec-text-muted)' }}>{btn.sub}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Add keyframes for spinner animation */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 1024px) {
                    .secretary-dashboard > div:nth-child(3) {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default SecretaryDashboard;
