import React from 'react';
import { School, Users, GraduationCap, TrendingUp, TrendingDown, Activity, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './Workstream.css';

const WorkstreamDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Dynamic Data Loading
    const schools = JSON.parse(localStorage.getItem('ws_schools') || '[]');
    
    // Calculate Stats
    const totalSchools = schools.length;
    const totalStudents = schools.reduce((acc, curr) => acc + (parseInt(curr.students) || 0), 0);
    const totalTeachers = schools.reduce((acc, curr) => acc + (parseInt(curr.teachers) || 0), 0);
    const avgPerformance = totalSchools > 0 
        ? Math.round(schools.reduce((acc, curr) => acc + (parseInt(curr.performanceScore) || 0), 0) / totalSchools) 
        : 0;

    const stats = [
        { 
            title: t('workstream.dashboard.totalSchools'), 
            value: totalSchools.toString(), 
            icon: School, 
            trend: 'Active Schools', 
            trendUp: true, 
            color: 'purple',
            onClick: () => navigate('/workstream-manager/schools')
        },
        { 
            title: t('workstream.dashboard.totalStudents'), 
            value: totalStudents.toLocaleString(), 
            icon: GraduationCap, 
            trend: 'Enrolled Across Cluster', 
            trendUp: true, 
            color: 'blue',
            onClick: () => navigate('/workstream-manager/reports') // Or a specific student list if it existed
        },
        { 
            title: t('workstream.dashboard.totalTeachers'), 
            value: totalTeachers.toString(), 
            icon: Users, 
            trend: 'Assigned Teachers', 
            trendUp: true, 
            color: 'indigo',
             onClick: () => navigate('/workstream-manager/managers') // Or reports
        },
        { 
            title: 'Avg. Performance', 
            value: `${avgPerformance}%`, 
            icon: Award, 
            trend: 'Academic Score', 
            trendUp: true, 
            color: 'green',
            onClick: () => navigate('/workstream-manager/reports')
        },
    ];

    const schoolPerformance = [...schools].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 6);

    const recentActivity = JSON.parse(localStorage.getItem('ws_activity') || '[]').length > 0 
        ? JSON.parse(localStorage.getItem('ws_activity')) 
        : [
            // Keep empty or show a placeholder message if real activity log implementation is separate
            // For now, let's keep it empty to reflect "real" state, or maybe a "No recent activity" message
        ];
    
    // If no activity, maybe show a default welcome log?
    // The user asked to "adjust it to what is registered", so if nothing is registered, show nothing or meaningful empty state.

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

    return (
        <div className="workstream-dashboard">
            {/* Header */}
            <div className="workstream-header">
                <h1 className="workstream-title">Welcome back, {user?.name?.split(' ')[0] || 'Manager'}! 👋</h1>
                <p className="workstream-subtitle">{t('workstream.dashboard.subtitle')}</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div 
                        key={index} 
                        className="stat-card" 
                        onClick={stat.onClick}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div className="stat-header">
                            <span className="stat-title">{stat.title}</span>
                            <div className="stat-icon" style={getIconStyle(stat.color)}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-trend">
                            {stat.trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span className={stat.trendUp ? 'trend-up' : 'trend-down'}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* School Performance Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">{t('workstream.dashboard.academicPerformance')}</h3>
                    </div>
                    {schoolPerformance.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {schoolPerformance.map((school, index) => (
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
                                        background: `linear-gradient(135deg, ${getScoreColor(school.performanceScore)}20, ${getScoreColor(school.performanceScore)}10)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: getScoreColor(school.performanceScore),
                                        fontWeight: '700',
                                        fontSize: '0.875rem'
                                    }}>
                                        {school.performanceScore}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '4px' }}>{school.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{school.students} students</div>
                                    </div>
                                    <div style={{ width: '120px' }}>
                                        <div style={{
                                            height: '8px',
                                            background: 'var(--color-border-subtle)',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${school.performanceScore}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, ${getScoreColor(school.performanceScore)}, ${getScoreColor(school.performanceScore)}aa)`,
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                            No schools registered yet.
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">
                            <Activity size={18} style={{ marginRight: '8px' }} />
                            Recent Activity
                        </h3>
                    </div>
                    {recentActivity.length > 0 ? (
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
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                           No recent activity.
                        </div>
                    )}
                </div>
            </div>

            {/* Enrollment Trends - Example chart (using simple CSS for now as in original) */}
            <div className="chart-card" style={{ marginTop: '24px' }}>
                <div className="chart-header">
                    <h3 className="chart-title">{t('workstream.dashboard.enrollmentTrends')}</h3>
                </div>
                <div className="css-chart-container" style={{ height: '180px' }}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                        const enrollment = [85, 92, 78, 95, 88, 102][index]; // Keep mock for trends as we don't have historical data
                        const graduates = [45, 52, 48, 55, 62, 58][index];
                        return (
                            <div key={month} className="css-bar-group">
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                                    <div
                                        className="css-bar"
                                        style={{ height: `${enrollment * 1.2}px`, width: '24px' }}
                                        data-value={enrollment}
                                    ></div>
                                    <div
                                        className="css-bar secondary"
                                        style={{ height: `${graduates * 1.2}px`, width: '24px' }}
                                        data-value={graduates}
                                    ></div>
                                </div>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>{month}</span>
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
            </div>
        </div>
    );
};

export default WorkstreamDashboard;
