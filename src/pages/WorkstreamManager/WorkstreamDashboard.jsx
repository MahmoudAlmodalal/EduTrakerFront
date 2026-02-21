import React, { useCallback, useEffect, useRef, useState } from 'react';
import { School, Users, GraduationCap, TrendingUp, TrendingDown, Calendar, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import workstreamService from '../../services/workstreamService';
import './Workstream.css';

const WorkstreamDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isRefreshingRows, setIsRefreshingRows] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const hasLoadedRef = useRef(false);
    const lastDashboardSignatureRef = useRef('');

    const fetchDashboardData = useCallback(async ({ showSkeletonRows = false, onlyIfChanged = false } = {}) => {
        const isInitialLoad = !hasLoadedRef.current;
        if (isInitialLoad) {
            setLoading(true);
        } else if (showSkeletonRows) {
            setIsRefreshingRows(true);
        }

        try {
            const response = await workstreamService.getDashboardStatistics();
            const nextStatistics = response?.statistics || null;
            const nextSignature = JSON.stringify(nextStatistics || {});
            const hasChanged = nextSignature !== lastDashboardSignatureRef.current;

            if (hasChanged || !onlyIfChanged) {
                setDashboardData(nextStatistics);
                lastDashboardSignatureRef.current = nextSignature;
                setLastUpdated(new Date());

                // Signal layout to refresh sidebar stats if they share the same source
                window.dispatchEvent(new CustomEvent('workstream_stats_updated'));
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            hasLoadedRef.current = true;
            setLoading(false);
            setIsRefreshingRows(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        const handleFocus = () => {
            // Silent refresh on focus: update UI only when payload changed.
            fetchDashboardData({ onlyIfChanged: true });
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchDashboardData]);

    const stats = [
        {
            title: t('workstream.dashboard.totalSchools'),
            value: dashboardData?.school_count || '0',
            icon: School,
            trend: '',
            trendUp: true,
            color: 'purple'
        },
        {
            title: t('workstream.dashboard.totalManagers'),
            value: dashboardData?.manager_count || '0',
            icon: Users,
            trend: '',
            trendUp: true,
            color: 'indigo'
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
            title: t('workstream.dashboard.enrolledStudents'),
            value: dashboardData?.enrolled_students?.toLocaleString() || '0',
            icon: Users,
            trend: '',
            trendUp: true,
            color: 'orange'
        },
        {
            title: t('workstream.dashboard.totalTeachers'),
            value: dashboardData?.total_teachers?.toLocaleString() || '0',
            icon: Users,
            trend: '',
            trendUp: false,
            color: 'green'
        },
    ];

    // Map backend school data to the expected format.
    // Score is sourced from backend academic performance when available.
    const schoolPerformance = (dashboardData?.schools || []).map(school => ({
        name: school.school_name,
        score: school?.academic_performance_score == null
            ? null
            : Math.round(Number(school.academic_performance_score)),
        students: school.student_count || 0,
        enrolledStudents: school.enrolled_student_count || 0,
        pendingStudents: school.pending_student_count || 0,
        manager: school.manager_name,
        teachers: school.teacher_count || 0,
        classrooms: school.classroom_count || 0
    }));


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
            orange: { background: 'linear-gradient(135deg, #ffedd5, #fed7aa)', color: '#ea580c' },
            green: { background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', color: '#059669' }
        };
        return styles[color] || styles.purple;
    };

    if (loading) {
        return <div className="workstream-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
    }

    const lastUpdatedLabel = lastUpdated
        ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : t('workstream.dashboard.notAvailable');

    return (
        <div className="workstream-dashboard">
            {/* Header */}
            <div className="workstream-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                        <h1 className="workstream-title">{t('workstream.dashboard.welcomeBack', { name: user?.displayName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Manager' })}! 👋</h1>
                        <p className="workstream-subtitle">{t('workstream.dashboard.subtitle')}</p>
                    </div>
                    <div className="workstream-refresh-meta">
                        <button
                            type="button"
                            className="workstream-refresh-btn"
                            onClick={() => fetchDashboardData({ showSkeletonRows: true })}
                            title={t('workstream.dashboard.refresh')}
                            aria-label={t('workstream.dashboard.refresh')}
                        >
                            <RefreshCw size={16} />
                        </button>
                        <span className="workstream-last-updated">
                            {t('workstream.dashboard.updated', { time: lastUpdatedLabel })}
                        </span>
                    </div>
                </div>
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


            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {/* School Performance Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">{t('workstream.dashboard.academicPerformance')}</h3>
                        <p style={{ marginTop: '0.5rem', marginBottom: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            {t('workstream.dashboard.scoreDesc')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {isRefreshingRows ? Array.from({ length: Math.max(3, schoolPerformance.length || 0) }).map((_, index) => (
                            <div key={`skeleton-${index}`} className="workstream-skeleton-row">
                                <div className="workstream-skeleton-badge"></div>
                                <div className="workstream-skeleton-main">
                                    <div className="workstream-skeleton-line"></div>
                                    <div className="workstream-skeleton-line short"></div>
                                </div>
                                <div className="workstream-skeleton-progress"></div>
                            </div>
                        )) : schoolPerformance.length > 0 ? schoolPerformance.map((school, index) => {
                            const score = school.score;
                            const name = school.name;
                            const students = school.students;
                            const enrolledStudents = school.enrolledStudents;
                            const pendingStudents = school.pendingStudents;
                            const managerName = school.manager || t('workstream.dashboard.stats.unassigned');
                            const hasData = Number.isFinite(score);
                            const numericScore = hasData ? score : 0;
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
                                        background: hasData
                                            ? `linear-gradient(135deg, ${getScoreColor(numericScore)}20, ${getScoreColor(numericScore)}10)`
                                            : 'var(--color-bg-subtle)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: hasData ? getScoreColor(numericScore) : 'var(--color-text-muted)',
                                        fontWeight: '700',
                                        fontSize: hasData ? '0.875rem' : '0.625rem'
                                    }}>
                                        {hasData ? numericScore : t('workstream.dashboard.notAvailable')}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '4px' }}>{name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {students} {t('workstream.dashboard.stats.total')} • {enrolledStudents} {t('workstream.dashboard.stats.enrolled')} • {pendingStudents} {t('workstream.dashboard.stats.pending')} • {t('workstream.dashboard.stats.manager')}: {managerName}
                                        </div>
                                    </div>
                                    <div style={{ width: '120px' }}>
                                        <div style={{
                                            height: '8px',
                                            background: 'var(--color-border-subtle)',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: hasData ? `${numericScore}%` : '0%',
                                                height: '100%',
                                                background: hasData
                                                    ? `linear-gradient(90deg, ${getScoreColor(numericScore)}, ${getScoreColor(numericScore)}aa)`
                                                    : 'var(--color-border)',
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease'
                                            }}></div>
                                        </div>
                                        {!hasData && (
                                            <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                {t('workstream.dashboard.noGradedMarks')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : <div style={{ padding: '20px', color: 'var(--color-text-muted)' }}>{t('workstream.dashboard.noSchoolData')}</div>}
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
                setData(Array.isArray(res) ? res : []);
            } catch (e) {
                console.error("Trends error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const maxEnrollment = Math.max(...data.map((item) => item.enrollment || 0), 1);

    return (
        <div className="chart-card" style={{ marginTop: '24px' }}>
            <div className="chart-header">
                <h3 className="chart-title">{t('workstream.dashboard.enrollmentTrends')}</h3>
            </div>
            {loading ? <div style={{ padding: '20px' }}>{t('workstream.dashboard.loadingTrends')}</div> : (
                <>
                    {data.length === 0 ? (
                        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <Calendar size={32} style={{ opacity: 0.6, marginBottom: '8px' }} />
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>
                                {t('workstream.dashboard.noEnrollmentData')}
                            </div>
                            <div style={{ fontSize: '0.875rem' }}>
                                {t('workstream.dashboard.studentsAppearOnceEnrolled')}
                            </div>
                        </div>
                    ) : (
                        <div className="css-chart-container" style={{ height: '180px' }}>
                            {data.map((item, index) => {
                                const enrollment = item.enrollment || 0;
                                return (
                                    <div key={item.month || index} className="css-bar-group">
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                                            <div
                                                className="css-bar"
                                                style={{ height: `${(enrollment / maxEnrollment) * 160}px`, width: '28px' }}
                                                data-value={enrollment}
                                            ></div>
                                        </div>
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>{item.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="chart-legend">
                        <div className="legend-item">
                            <div className="legend-color" style={{ background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}></div>
                            <span>{t('workstream.dashboard.newEnrollments')}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkstreamDashboard;
