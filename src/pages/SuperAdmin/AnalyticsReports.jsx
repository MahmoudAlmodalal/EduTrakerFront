import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileBarChart, PieChart, TrendingUp, CheckCircle } from 'lucide-react';
import styles from './AnalyticsReports.module.css';
import reportService from '../../services/reportService';

const AnalyticsReports = () => {
    const { t } = useTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await reportService.getComprehensiveStats();
                setStats(data.statistics);
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
    const chartData = stats?.students_by_workstream?.by_workstream?.map(ws => ({
        name: ws.workstream_name,
        students: ws.student_count,
        schools: ws.school_count
    })) || [];

    const teacherData = stats?.teachers_by_workstream?.by_workstream?.map(ws => ({
        name: ws.workstream_name,
        teachers: ws.teacher_count
    })) || [];

    const handleExport = async (format) => {
        try {
            // Determine report type based on format
            // PDF: student_performance, CSV: attendance
            const reportType = format === 'pdf' ? 'student_performance' : 'attendance';
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
                            {entry.name}: {entry.value}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.container}>
            <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h1 className={styles.title}>{t('analytics.title')}</h1>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>
                    Real-time academic performance and system metrics across all workstreams
                </p>
            </header>

            <div className={styles.grid}>
                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'var(--color-primary-light)', padding: '10px', borderRadius: '12px' }}>
                                <TrendingUp size={24} color="var(--color-primary)" />
                            </div>
                            <h2 className={styles.cardTitle}>{t('analytics.academic')}</h2>
                        </div>
                        {loading && <span className={styles.loadingPulse}>Syncing Data...</span>}
                    </div>

                    <div className={styles.chartContainer}>
                        {loading ? (
                            <div className={styles.loaderPlaceholder} />
                        ) : error ? (
                            <div className={styles.errorState}>{error}</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '20px' }}
                                    />
                                    <Bar dataKey="students" fill="url(#gradMath)" name="Students" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="schools" fill="url(#gradScience)" name="Schools" radius={[6, 6, 0, 0]} />
                                    <defs>
                                        <linearGradient id="gradMath" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#4f46e5" />
                                            <stop offset="100%" stopColor="#818cf8" />
                                        </linearGradient>
                                        <linearGradient id="gradScience" x1="0" y1="0" x2="0" y2="1">
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
                            <button className={styles.downloadBtn} onClick={() => handleExport('pdf')}>
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
                            <button className={styles.downloadBtn} onClick={() => handleExport('csv')}>
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
