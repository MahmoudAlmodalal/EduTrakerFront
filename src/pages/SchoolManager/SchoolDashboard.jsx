import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Users, GraduationCap, BookOpen, UserCheck, TrendingUp, Calendar } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { api } from '../../utils/api';
import styles from './SchoolDashboard.module.css';

const StatCard = ({ title, value, change, icon: Icon, color, isPositive, fromLastMonthText }) => (
    <div className={styles.statCard}>
        <div className={styles.statHeader}>
            <span className={styles.statTitle}>{title}</span>
            <div className={`${styles.iconWrapper} ${styles[color]}`}>
                <Icon size={22} strokeWidth={2} />
            </div>
        </div>
        <div className={styles.statBody}>
            <span className={styles.statValue}>{value}</span>
            {change !== undefined && (
                <span className={styles.statChange}>
                    <span className={isPositive ? styles.positive : styles.negative}>
                        {isPositive ? '+' : ''}{change}%
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>{fromLastMonthText}</span>
                </span>
            )}
        </div>
    </div>
);

const SchoolDashboard = () => {
    const { t, theme } = useTheme();
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const isDark = theme === 'dark';
    const textMuted = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/reports/statistics/dashboard/');
                setStatsData(response.statistics);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const fromLastMonth = t('school.dashboard.fromLastMonth');

    // Process stats for cards
    const stats = [
        {
            title: t('school.dashboard.totalStudents'),
            value: statsData?.total_students?.toLocaleString() || '0',
            change: 0, // Backend doesn't provide change yet
            icon: Users,
            color: 'blue',
            isPositive: true,
            fromLastMonthText: fromLastMonth
        },
        {
            title: t('school.dashboard.totalTeachers') || 'Total Teachers',
            value: statsData?.total_teachers?.toLocaleString() || '0',
            change: 0,
            icon: GraduationCap,
            color: 'green',
            isPositive: true,
            fromLastMonthText: fromLastMonth
        },
        {
            title: t('school.dashboard.totalClasses') || 'Total Classrooms',
            value: statsData?.classroom_count?.toLocaleString() || statsData?.total_classrooms?.toLocaleString() || '0',
            change: 0,
            icon: BookOpen,
            color: 'purple',
            isPositive: true,
            fromLastMonthText: fromLastMonth
        },
        {
            title: t('school.dashboard.attendance') || 'Attendance',
            value: '96%', // Mock attendance as backend doesn't provide it in dashboard stats yet
            change: 0,
            icon: UserCheck,
            color: 'orange',
            isPositive: true,
            fromLastMonthText: fromLastMonth
        },
    ];

    // Process grade data for chart
    const gradeData = statsData?.by_grade?.map(item => ({
        name: item.grade_name,
        avg: item.count // Using count as mock for average grade for now since backend provides count
    })) || [];

    const successData = [
        { name: 'Passed', value: 85 },
        { name: 'Failed', value: 15 },
    ];

    const COLORS = ['#10b981', '#ef4444'];

    if (loading) {
        return <div className={styles.container}>Loading dashboard...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>{t('school.dashboard.title')}</h1>
            </div>

            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.mainChartSection}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.cardTitle}>{t('school.dashboard.avgGrades') || 'Student Distribution by Grade'}</h2>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gradeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: textMuted, fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: textMuted, fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', background: tooltipBg, color: isDark ? '#f8fafc' : '#0f172a' }}
                                    />
                                    <Bar dataKey="avg" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className={styles.secondaryCharts}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.cardTitle}>{t('school.dashboard.successRate')}</h2>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={successData}
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {successData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', background: tooltipBg, color: isDark ? '#f8fafc' : '#0f172a' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolDashboard;

