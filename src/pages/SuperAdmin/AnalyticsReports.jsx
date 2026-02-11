import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileBarChart, PieChart, TrendingUp, CheckCircle, User } from 'lucide-react';
import styles from './AnalyticsReports.module.css';
import reportService from '../../services/reportService';
import ActivityChart from '../../components/charts/ActivityChart';

const AnalyticsReports = () => {
    const { t } = useTheme();
    const [stats, setStats] = useState(null);
    const [activityData, setActivityData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await reportService.getComprehensiveStats();
                setStats(data.statistics);
                setActivityData(data.activity_chart || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching comprehensive stats:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Map backend workstream data to chart format
    // Ensure we handle different possible data structures from backend
    const studentStats = stats?.students_by_workstream;
    const workstreamData = studentStats?.by_workstream || studentStats || [];

    const chartData = Array.isArray(workstreamData) ? workstreamData.map(ws => ({
        name: ws.workstream_name || ws.name || 'N/A',
        students: ws.student_count || 0,
        schools: ws.school_count || 0
    })) : [];

    const teacherStats = stats?.teachers_by_workstream;
    const teacherWsData = teacherStats?.by_workstream || teacherStats || [];

    const teacherData = Array.isArray(teacherWsData) ? teacherWsData.map(ws => ({
        name: ws.workstream_name || ws.name || 'N/A',
        teachers: ws.teacher_count || 0
    })) : [];

    const handleExport = async (format, reportType) => {
        try {
            await reportService.exportReport(format, reportType);
        } catch (err) {
            alert('Failed to export report: ' + err.message);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(var(--glass-blur))',
                    padding: '1rem',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--glass-shadow)'
                }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 800, color: 'var(--color-text-main)' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '4px 0', fontSize: '0.875rem', fontWeight: 600, color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                <h1 className={styles.title}>{t('analytics.title')}</h1>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>
                    Real-time academic performance and system metrics across all workstreams
                </p>
            </header>

            {/* Quick Stats Overview */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div className={styles.card} style={{ gap: '0.5rem', padding: '1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Students</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                            {stats?.global?.total_students || 0}
                        </span>
                        <TrendingUp size={32} color="var(--color-primary)" opacity={0.2} />
                    </div>
                </div>
                <div className={styles.card} style={{ gap: '0.5rem', padding: '1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Teachers</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0ea5e9' }}>
                            {stats?.global?.total_teachers || 0}
                        </span>
                        <User size={32} color="#0ea5e9" opacity={0.2} />
                    </div>
                </div>
                <div className={styles.card} style={{ gap: '0.5rem', padding: '1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Schools</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
                            {stats?.global?.total_schools || 0}
                        </span>
                        <CheckCircle size={32} color="#f59e0b" opacity={0.2} />
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                <TrendingUp size={24} color="var(--color-primary)" />
                            </div>
                            <h2 className={styles.cardTitle}>Student Distribution</h2>
                        </div>
                        {loading && <span className={styles.loadingPulse}>Refreshing...</span>}
                    </div>

                    <div className={styles.chartContainer}>
                        {loading ? (
                            <div className={styles.loaderPlaceholder} />
                        ) : error ? (
                            <div className={styles.errorState}>{error}</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                                    <Bar dataKey="students" fill="url(#gradStudents)" name="Students" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="schools" fill="url(#gradSchools)" name="Schools" radius={[6, 6, 0, 0]} />
                                    <defs>
                                        <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4f46e5" />
                                            <stop offset="100%" stopColor="#818cf8" />
                                        </linearGradient>
                                        <linearGradient id="gradSchools" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#0ea5e9" />
                                            <stop offset="100%" stopColor="#7dd3fc" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className={styles.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '10px', borderRadius: '12px' }}>
                            <User size={24} color="#0ea5e9" />
                        </div>
                        <h2 className={styles.cardTitle}>Teacher Metrics</h2>
                    </div>
                    <div className={styles.chartContainer} style={{ height: '300px' }}>
                        {loading ? (
                            <div className={styles.loaderPlaceholder} />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                                <BarChart data={teacherData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 600 }}
                                    />
                                    <Tooltip cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }} />
                                    <Bar dataKey="teachers" fill="#0ea5e9" name="Teachers" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className={styles.fullWidth}>
                    <ActivityChart
                        data={activityData}
                        loading={loading}
                        title={t('dashboard.charts.activity')}
                        subtitle="System-wide login frequency monitoring"
                    />
                </div>

                <div className={styles.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'var(--color-secondary-light)', padding: '10px', borderRadius: '12px' }}>
                            <FileBarChart size={24} color="var(--color-secondary)" />
                        </div>
                        <h2 className={styles.cardTitle}>{t('analytics.downloads')}</h2>
                    </div>

                    <div className={styles.reportList}>
                        <div className={styles.reportItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileBarChart size={20} color="var(--color-primary)" />
                                </div>
                                <span className={styles.reportName}>{t('analytics.globalReport')}</span>
                            </div>
                            <button className={styles.downloadBtn} onClick={() => handleExport('pdf', 'comprehensive_academic')}>
                                <Download size={16} /> PDF
                            </button>
                        </div>
                        <div className={styles.reportItem}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PieChart size={20} color="#0ea5e9" />
                                </div>
                                <span className={styles.reportName}>{t('analytics.systemUsage')}</span>
                            </div>
                            <button className={styles.downloadBtn} onClick={() => handleExport('csv', 'system_usage')}>
                                <Download size={16} /> CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'var(--color-success-light)', padding: '10px', borderRadius: '12px' }}>
                            <CheckCircle size={24} color="var(--color-success)" />
                        </div>
                        <h2 className={styles.cardTitle}>System Health</h2>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-success)' }}>99.9%</div>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-muted)' }}>All systems operational</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsReports;
