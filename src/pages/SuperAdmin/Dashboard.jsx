import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Users, School, Briefcase, TrendingUp, Bell } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import styles from './Dashboard.module.css';

const StatCard = ({ title, value, change, icon: Icon, color, changeText, isNotification }) => (
    <div className={styles.statCard}>
        <div className={styles.statHeader}>
            <span className={styles.statTitle}>{title}</span>
            <div className={`${styles.iconWrapper} ${styles[color]}`}>
                {typeof Icon === 'string' && Icon === 'Bell' ? <Bell size={20} /> : <Icon size={20} />}
            </div>
        </div>
        <div className={styles.statBody}>
            <span className={styles.statValue}>{value}</span>
            {!isNotification ? (
                <span className={`${styles.statChange} ${change >= 0 ? styles.positive : styles.negative}`}>
                    {change > 0 ? '+' : ''}{change}% {changeText}
                </span>
            ) : (
                <span className={styles.statChange} style={{ color: 'var(--color-text-muted)' }}>
                    {t('dashboard.stats.unread')}
                </span>
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const { t } = useTheme();

    // Mock Data
    const stats = [
        { title: t('dashboard.stats.workstreams'), value: '12', change: 4.5, icon: Briefcase, color: 'blue' },
        { title: t('dashboard.stats.schools'), value: '148', change: 12.3, icon: School, color: 'green' },
        { title: t('dashboard.stats.users'), value: '24,592', change: 8.1, icon: Users, color: 'purple' },
        { title: t('dashboard.stats.notifications'), value: '5', change: 0, icon: 'Bell', color: 'orange', isNotification: true }, // Using generic icon logic below
    ];

    // Mock Data for Charts
    const activityData = [
        { name: 'Mon', logins: 4000 },
        { name: 'Tue', logins: 3000 },
        { name: 'Wed', logins: 2000 },
        { name: 'Thu', logins: 2780 },
        { name: 'Fri', logins: 1890 },
        { name: 'Sat', logins: 2390 },
        { name: 'Sun', logins: 3490 },
    ];

    const growthData = [
        { name: 'Jan', schools: 120 },
        { name: 'Feb', schools: 132 },
        { name: 'Mar', schools: 141 },
        { name: 'Apr', schools: 148 },
    ];

    const distributionData = [
        { name: 'Gaza North', value: 400 },
        { name: 'Gaza City', value: 300 },
        { name: 'Middle Area', value: 300 },
        { name: 'Khan Younis', value: 200 },
        { name: 'Rafah', value: 100 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];


    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>{t('dashboard.title')}</h1>

            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} changeText={t('dashboard.stats.fromLastMonth')} />
                ))}
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.mainChartSection}>
                    <div className={styles.chartCard}>
                        <h2 className={styles.cardTitle}>{t('dashboard.charts.activity')}</h2>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="logins" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.secondaryCharts}>
                        <div className={styles.chartCard}>
                            <h2 className={styles.cardTitle}>{t('dashboard.charts.schoolGrowth')}</h2>
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={growthData}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="schools" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.chartCard}>
                            <h2 className={styles.cardTitle}>{t('dashboard.charts.userDistribution')}</h2>
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.recentActivity}>
                    <h2 className={styles.cardTitle}>{t('dashboard.activity.title')}</h2>
                    <ul className={styles.activityList}>
                        <li className={styles.activityItem}>
                            <span className={styles.activityTime}>2 mins ago</span>
                            <p>{t('mock.activity.1')}</p>
                        </li>
                        <li className={styles.activityItem}>
                            <span className={styles.activityTime}>15 mins ago</span>
                            <p>{t('mock.activity.2')}</p>
                        </li>
                        <li className={styles.activityItem}>
                            <span className={styles.activityTime}>1 hr ago</span>
                            <p>{t('mock.activity.3')}</p>
                        </li>
                        <li className={styles.activityItem}>
                            <span className={styles.activityTime}>3 hrs ago</span>
                            <p>{t('mock.activity.4')}</p>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
