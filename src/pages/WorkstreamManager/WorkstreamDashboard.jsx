import React, { useState, useEffect } from 'react';
import { School, Users, GraduationCap, TrendingUp, TrendingDown, Activity, Award } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import workstreamService from '../../services/workstreamService';
import ActivityChart from '../../components/charts/ActivityChart';
import './Workstream.css';

const WorkstreamDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [activityData, setActivityData] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await workstreamService.getDashboardStatistics();
                setDashboardData(response.statistics);
                setRecentActivities(response.recent_activity || []);
                setActivityData(response.activity_chart || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const stats = [
        {
            title: t('workstream.dashboard.totalSchools'),
            value: dashboardData?.school_count || dashboardData?.total_schools || '0',
            icon: School,
            trend: '',
            trendUp: true,
            color: 'purple'
        },
        {
            title: t('workstream.dashboard.totalStudents'),
            value: dashboardData?.total_students?.toLocaleString() || '0',
            icon: GraduationCap,
            trend: '',
            trendUp: true,
            color: 'blue'
        },
        {
            title: t('workstream.dashboard.totalTeachers'),
            value: dashboardData?.total_teachers?.toLocaleString() || '0',
            icon: Users,
            trend: '',
            trendUp: false,
            color: 'indigo'
        },
        {
            title: 'Avg. Performance',
            value: '87%',
            icon: Award,
            trend: '',
            trendUp: true,
            color: 'green'
        },
    ];

    const schoolPerformance = dashboardData?.schools || [
        { name: 'Al-Noor Academy', score: 92, students: 420 },
        { name: 'Gaza Central', score: 88, students: 380 },
        { name: 'Al-Quds School', score: 85, students: 350 },
        { name: 'Hope Academy', score: 78, students: 290 },
        { name: 'Al-Aqsa School', score: 95, students: 450 },
        { name: 'Sunrise School', score: 72, students: 260 },
    ];

    const recentActivity = recentActivities.length > 0 ? recentActivities.map(item => ({
        action: item.description,
        school: item.entity_type,
        time: item.created_at_human,
        type: item.action_type === 'login' ? 'info' : (item.action_type === 'create' ? 'success' : 'warning')
    })) : [];

    const getScoreColor = (score) => {
        if (score >= 90) return '#059669';
        if (score >= 80) return '#0ea5e9';
        if (score >= 70) return '#8b5cf6';
        return '#dc2626';
    };

    const getIconStyle = (color) => {
        const styles = {
            purple: { background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', color: '#7c3aed' },
            blue: { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#2563eb' },
            indigo: { background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', color: '#4f46e5' },
            green: { background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669' }
        };
        return styles[color] || styles.purple;
    };

    if (loading) {
        return <div className="workstream-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
    }

    return (
        <div className="workstream-dashboard">
            {/* Header */}
            <div className="workstream-header">
                <h1 className="workstream-title">Welcome back, {user?.displayName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Manager'}! 👋</h1>
                <p className="workstream-subtitle">{t('workstream.dashboard.subtitle')}</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">{stat.title}</span>
                            <div className="stat-icon" style={getIconStyle(stat.color)}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        {stat.trend && (
                            <div className="stat-trend">
                                {stat.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span className={stat.trendUp ? 'trend-up' : 'trend-down'}>{stat.trend}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Activity Chart */}
            <div style={{ marginBottom: '24px' }}>
                <ActivityChart
                    data={activityData}
                    loading={loading}
                    title={t('dashboard.charts.activity')}
                    subtitle="Workstream-wide login activity and engagement trends"
                />
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* School Performance Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">{t('workstream.dashboard.academicPerformance')}</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {schoolPerformance.length > 0 ? schoolPerformance.map((school, index) => {
                            const score = school.score || 85;
                            const name = school.school_name || school.name;
                            const students = school.count || school.students;
                            return (
                                <div key={index} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '12px 16px',
                                    background: 'var(--color-bg-hover)',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: `linear-gradient(135deg, ${getScoreColor(score)}20, ${getScoreColor(score)}10)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: getScoreColor(score),
                                        fontWeight: '700',
                                        fontSize: '0.875rem'
                                    }}>
                                        {score}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '4px' }}>{name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{students} students</div>
                                    </div>
                                    <div style={{ width: '120px' }}>
                                        <div style={{
                                            height: '8px',
                                            background: 'var(--color-border-subtle)',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${score}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, ${getScoreColor(score)}, ${getScoreColor(score)}aa)`,
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : <div style={{ padding: '20px', color: 'var(--color-text-muted)' }}>No school data available</div>}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">
                            <Activity size={18} style={{ marginRight: '8px' }} />
                            Recent Activity
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentActivity.map((activity, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '12px',
                                background: 'var(--color-bg-hover)',
                                borderRadius: '12px',
                                borderLeft: `3px solid ${activity.type === 'success' ? '#059669' :
                                    activity.type === 'warning' ? '#8b5cf6' : '#4f46e5'
                                    }`
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: 'var(--color-text-main)', fontSize: '0.875rem', marginBottom: '4px' }}>
                                        {activity.action}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {activity.school}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap' }}>
                                    {activity.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enrollment Trends */}
            <EnrollmentTrendsChart />
        </div>
    );
};

const EnrollmentTrendsChart = () => {
    const { t } = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await workstreamService.getEnrollmentTrends();
                setData(res.results || res || []);
            } catch (e) {
                console.error("Trends error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const chartData = data.length > 0 ? data : [
        { month: 'Jan', enrollment: 85, graduates: 45 },
        { month: 'Feb', enrollment: 92, graduates: 52 },
        { month: 'Mar', enrollment: 78, graduates: 48 },
        { month: 'Apr', enrollment: 95, graduates: 55 },
        { month: 'May', enrollment: 88, graduates: 62 },
        { month: 'Jun', enrollment: 102, graduates: 58 },
    ];

    return (
        <div className="chart-card" style={{ marginTop: '24px' }}>
            <div className="chart-header">
                <h3 className="chart-title">{t('workstream.dashboard.enrollmentTrends')}</h3>
            </div>
            {loading ? <div style={{ padding: '20px' }}>Loading trends...</div> : (
                <>
                    <div className="css-chart-container" style={{ height: '180px' }}>
                        {chartData.map((item, index) => {
                            return (
                                <div key={item.month || index} className="css-bar-group">
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                                        <div
                                            className="css-bar"
                                            style={{ height: `${(item.enrollment || 0) * 1.2}px`, width: '24px' }}
                                            data-value={item.enrollment}
                                        ></div>
                                        <div
                                            className="css-bar secondary"
                                            style={{ height: `${(item.graduates || 0) * 1.2}px`, width: '24px' }}
                                            data-value={item.graduates}
                                        ></div>
                                    </div>
                                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>{item.month}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}></div>
                            <span>New Enrollments</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}></div>
                            <span>Graduates</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkstreamDashboard;
