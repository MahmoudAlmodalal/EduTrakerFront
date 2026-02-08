import React, { useState, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    Clock,
    AlertCircle,
    ChevronRight,
    UserCheck,
    Briefcase,
    BookOpen,
    Activity
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import managerService from '../../services/managerService';
import './SchoolManager.css';

const SchoolDashboard = () => {
    const { t } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                // Backend: GET /api/statistics/dashboard/
                // Response: { role, statistics: { school_name, total_students, total_teachers, total_secretaries, classroom_count, course_count, by_grade }, recent_activity, activity_chart }
                const data = await managerService.getDashboardStats();
                setStats(data?.statistics || {
                    total_students: 0,
                    total_teachers: 0,
                    total_secretaries: 0,
                    classroom_count: 0,
                    course_count: 0
                });
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
                setError(err.message || 'Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const dashboardCards = [
        { title: t('school.dashboard.totalStudents') || 'Total Students', value: stats?.total_students ?? 0, icon: Users, color: 'blue', bgColor: '#dbeafe', iconColor: '#2563eb' },
        { title: t('activeTeachers') || 'Active Teachers', value: stats?.total_teachers ?? 0, icon: UserCheck, color: 'green', bgColor: '#dcfce7', iconColor: '#16a34a' },
        { title: t('secretaries') || 'Secretaries', value: stats?.total_secretaries ?? 0, icon: Briefcase, color: 'purple', bgColor: '#f3e8ff', iconColor: '#9333ea' },
        { title: t('classrooms') || 'Classrooms', value: stats?.classroom_count ?? 0, icon: GraduationCap, color: 'orange', bgColor: '#ffedd5', iconColor: '#ea580c' },
        { title: t('courses') || 'Courses', value: stats?.course_count ?? 0, icon: BookOpen, color: 'teal', bgColor: '#ccfbf1', iconColor: '#0d9488' }
    ];

    if (loading) {
        return (
            <div className="school-dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: 'var(--color-text-muted)' }}>{t('common.loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="school-dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-error)' }}>
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '1rem' }}>
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="school-dashboard-page">
            <div className="school-manager-header">
                <div>
                    <h1 className="school-manager-title">
                        {stats?.school_name
                            ? `${stats.school_name} — ${t('school.dashboard.title') || 'Command Center'}`
                            : (t('school.dashboard.title') || 'Command Center')
                        }
                    </h1>
                    <p className="school-manager-subtitle">{t('school.dashboard.subtitle') || 'Real-time overview of school operations and academic status.'}</p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid">
                {dashboardCards.map((card, index) => (
                    <div key={index} className="stat-card" style={{
                        background: 'var(--color-bg-surface)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid var(--color-border)',
                        transition: 'all 0.2s ease',
                        cursor: 'default'
                    }}>
                        <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                backgroundColor: card.bgColor,
                                color: card.iconColor,
                                padding: '14px',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `0 4px 12px ${card.bgColor}`
                            }}>
                                <card.icon size={28} strokeWidth={2.25} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ fontSize: '2rem', fontWeight: '800', marginTop: '1.25rem', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>{card.value}</div>
                        <div className="stat-label" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.375rem', fontWeight: '500' }}>{card.title}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                {/* Performance Chart */}
                <SchoolPerformanceChart />

                {/* Notifications/Alerts Sidebar */}
                <SchoolAlertsWidget />
            </div>

            {/* Grade Breakdown + Recent Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                <GradeBreakdown grades={stats?.by_grade || []} />
            </div>
        </div>
    );
};

// Sub-component: Performance Chart
const SchoolPerformanceChart = () => {
    const { t } = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const res = await managerService.getSchoolPerformance(period);
                setData(res?.performance_trend || []);
            } catch (e) {
                console.error("Performance fetch error", e);
                setData([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [period]);

    const maxScore = Math.max(...data.map(d => d.score || 0), 1);

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">{t('performanceTrend') || 'Academic Performance Trend'}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['weekly', 'monthly'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.75rem',
                                borderRadius: '6px',
                                border: period === p ? 'none' : '1px solid var(--color-border)',
                                background: period === p ? 'var(--color-primary)' : 'var(--color-bg-body)',
                                color: period === p ? '#fff' : 'inherit',
                                cursor: 'pointer'
                            }}
                        >
                            {p === 'weekly' ? (t('common.weekly') || 'Weekly') : (t('common.monthly') || 'Monthly')}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ padding: '1.5rem', height: '350px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '4px' }}>
                {loading ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        {t('common.loading') || 'Loading...'}
                    </div>
                ) : data.length === 0 ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        {t('noData') || 'No data available'}
                    </div>
                ) : (
                    data.map((val, i) => {
                        const score = val.score || 0;
                        const barHeight = maxScore > 0 ? (score / maxScore) * 100 : 0;
                        const label = val.month || val.week || val.label || '';
                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '60px' }}>
                                <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{score}%</span>
                                <div
                                    style={{
                                        width: '100%',
                                        height: `${Math.max(barHeight, 2)}%`,
                                        backgroundColor: 'var(--color-primary)',
                                        borderRadius: '4px 4px 0 0',
                                        opacity: 0.85,
                                        transition: 'height 0.3s ease',
                                        minHeight: '4px'
                                    }}
                                    title={`${label}: ${score}%`}
                                />
                                <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '8px', whiteSpace: 'nowrap' }}>{label}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// Sub-component: Alerts Widget
const SchoolAlertsWidget = () => {
    const { t } = useTheme();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAlerts = async () => {
            try {
                setLoading(true);
                const res = await managerService.getAlerts();
                const alertsData = Array.isArray(res) ? res : (res?.results || []);
                setAlerts(alertsData);
            } catch (e) {
                console.error("Alerts fetch error", e);
                setAlerts([]);
            } finally {
                setLoading(false);
            }
        };
        loadAlerts();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="management-card">
                <div className="table-header-actions">
                    <h3 className="chart-title">{t('attentionNeeded') || 'Attention Needed'}</h3>
                </div>
                <div style={{ padding: '0' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            {t('common.loading') || 'Loading alerts...'}
                        </div>
                    ) : alerts.length > 0 ? (
                        alerts.slice(0, 5).map((alert, idx) => (
                            <div key={alert.id || idx} style={{
                                padding: '1.25rem',
                                borderBottom: idx < alerts.length - 1 ? '1px solid var(--color-border)' : 'none',
                                display: 'flex',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    minWidth: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: alert.is_read ? 'var(--color-bg-body)' : 'rgba(239,68,68,0.1)',
                                    color: alert.is_read ? 'var(--color-text-muted)' : 'var(--color-error, #ef4444)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {alert.notification_type === 'system' ? <AlertCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0, color: 'var(--color-text-main)' }}>
                                        {alert.title || alert.message || 'Notification'}
                                    </h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {alert.message || ''}
                                    </p>
                                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                                        {alert.created_at ? new Date(alert.created_at).toLocaleString() : ''}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            {t('noAlerts') || 'No active alerts'}
                        </div>
                    )}
                </div>
                {alerts.length > 5 && (
                    <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--color-border)' }}>
                        <button style={{
                            color: 'var(--color-primary)',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            width: '100%'
                        }}>
                            {t('school.dashboard.viewAllAlerts') || 'View All Alerts'}
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-component: Grade Breakdown (from dashboard stats by_grade)
const GradeBreakdown = ({ grades = [] }) => {
    const { t } = useTheme();

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">{t('gradeBreakdown') || 'Students by Grade'}</h3>
            </div>
            <div style={{ padding: '1rem' }}>
                {grades.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        {t('noData') || 'No grade data available'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {grades.map((grade, idx) => {
                            const maxStudents = Math.max(...grades.map(g => g.student_count || g.total_students || 0), 1);
                            const count = grade.student_count || grade.total_students || 0;
                            const barWidth = maxStudents > 0 ? (count / maxStudents) * 100 : 0;
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ minWidth: '100px', fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: '500' }}>
                                        {grade.grade_name || grade.name || `Grade ${idx + 1}`}
                                    </span>
                                    <div style={{ flex: 1, height: '24px', backgroundColor: 'var(--color-bg-body)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.max(barWidth, 2)}%`,
                                            height: '100%',
                                            backgroundColor: 'var(--color-primary)',
                                            borderRadius: '6px',
                                            transition: 'width 0.4s ease',
                                            opacity: 0.8
                                        }} />
                                    </div>
                                    <span style={{ minWidth: '40px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-main)' }}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolDashboard;
