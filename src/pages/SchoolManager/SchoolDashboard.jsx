import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Users, GraduationCap, BookOpen, UserCheck, TrendingUp, Calendar } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
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
            <span className={styles.statChange}>
                <span className={isPositive ? styles.positive : styles.negative}>
                    {isPositive ? '+' : ''}{change}%
                </span>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>{fromLastMonthText}</span>
            </span>
        </div>
    </div>
);

const SchoolDashboard = () => {
    const { t, theme } = useTheme();

    const isDark = theme === 'dark';
    const textMuted = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';

    // Mock Data
    const fromLastMonth = t('school.dashboard.fromLastMonth');
    const stats = [
        { title: t('school.dashboard.totalStudents'), value: '1,250', change: 5.2, icon: Users, color: 'blue', isPositive: true, fromLastMonthText: fromLastMonth },
        { title: t('school.dashboard.totalTeachers'), value: '85', change: 2.1, icon: GraduationCap, color: 'green', isPositive: true, fromLastMonthText: fromLastMonth },
        { title: t('school.dashboard.totalClasses'), value: '42', change: 0, icon: BookOpen, color: 'purple', isPositive: true, fromLastMonthText: fromLastMonth },
        { title: t('school.dashboard.attendance'), value: '96%', change: -1.5, icon: UserCheck, color: 'orange', isPositive: false, fromLastMonthText: fromLastMonth },
    ];

    const gradeData = [
        { name: 'Grade 1', avg: 88 },
        { name: 'Grade 2', avg: 85 },
        { name: 'Grade 3', avg: 82 },
        { name: 'Grade 4', avg: 89 },
        { name: 'Grade 5', avg: 84 },
        { name: 'Grade 6', avg: 86 },
    ];

    const successData = [
        { name: 'Passed', value: 1150 },
        { name: 'Failed', value: 100 },
    ];

    const COLORS = ['#10b981', '#ef4444'];

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
                        <h2 className={styles.cardTitle}>{t('school.dashboard.avgGrades')}</h2>
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
                                        domain={[0, 100]}
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
