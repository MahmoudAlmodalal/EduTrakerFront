import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Users, School, Briefcase, TrendingUp, TrendingDown, Bell, Activity as ActivityIcon, UserPlus, ShieldCheck } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import styles from './Dashboard.module.css';
import { api } from '../../utils/api';
import reportService from '../../services/reportService';
import secretaryService from '../../services/secretaryService';

const StatCard = ({ title, value, change, icon: Icon, color, isNotification }) => {
    return (
        <div className={styles.statCard}>
            <div className={styles.statHeader}>
                <div className={`${styles.iconWrapper} ${styles[color]}`}>
                    {typeof Icon === 'string' && Icon === 'Bell' ? <Bell size={24} /> : <Icon size={24} />}
                </div>
                {!isNotification && (
                    <div className={change >= 0 ? styles.changePositive : styles.changeNegative}>
                        {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{Math.abs(change)}%</span>
                    </div>
                )}
            </div>
            <div>
                <p className={styles.statValue}>{value}</p>
                <p className={styles.statLabel}>{title}</p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    console.log('Dashboard component rendering...');

    const { t } = useTheme();
    const { user } = useAuth();
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activities, setActivities] = useState([]);

    console.log('Dashboard - user:', user);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log('Fetching dashboard data...');

                const [statsRes, activityRes] = await Promise.all([
                    reportService.getDashboardStats().catch(err => {
                        console.warn('Failed to fetch stats:', err);
                        return { statistics: {} };
                    }),
                    secretaryService.getNotifications().catch(err => {
                        console.warn('Failed to fetch notifications:', err);
                        return [];
                    })
                ]);

                console.log('Dashboard data fetched:', { statsRes, activityRes });
                setStatsData(statsRes.statistics || {});

                // Ensure activities is always an array
                const activitiesData = Array.isArray(activityRes) ? activityRes :
                    (activityRes?.results && Array.isArray(activityRes.results)) ? activityRes.results :
                        [];
                setActivities(activitiesData);
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message);
                // Set default values even on error
                setStatsData({});
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Map Backend Stats to UI
    const stats = [
        {
            title: t('dashboard.stats.workstreams'),
            value: loading ? '...' : (statsData?.total_workstreams || '0'),
            change: 4.5,
            icon: Briefcase,
            color: 'blue'
        },
        {
            title: t('dashboard.stats.schools'),
            value: loading ? '...' : (statsData?.total_schools || '0'),
            change: 12.3,
            icon: School,
            color: 'green'
        },
        {
            title: t('dashboard.stats.users'),
            value: loading ? '...' : ((statsData?.total_students || 0) + (statsData?.total_teachers || 0)).toLocaleString(),
            change: 8.1,
            icon: Users,
            color: 'purple'
        },
        {
            title: t('dashboard.stats.notifications'),
            value: '5',
            change: 0,
            icon: 'Bell',
            color: 'orange',
            isNotification: true
        },
    ];

    const activityData = [
        { name: 'Mon', logins: 4000 },
        { name: 'Tue', logins: 3000 },
        { name: 'Wed', logins: 5000 },
        { name: 'Thu', logins: 2780 },
        { name: 'Fri', logins: 1890 },
        { name: 'Sat', logins: 2390 },
        { name: 'Sun', logins: 3490 },
    ];

    const distributionData = [
        { name: 'Gaza North', value: 400 },
        { name: 'Gaza City', value: 300 },
        { name: 'Middle Area', value: 300 },
        { name: 'Khan Younis', value: 200 },
        { name: 'Rafah', value: 100 },
    ];

    const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Good morning, {user?.displayName || user?.email || 'Admin'}</h1>
                    <p className={styles.subtitle}>Here's what's happening across EduTraker today.</p>
                </div>
            </div>

            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.mainContent}>
                    <div className={styles.chartCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>{t('dashboard.charts.activity')}</h2>
                        </div>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityData}>
                                    <defs>
                                        <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--color-bg-surface)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--color-border)',
                                            boxShadow: 'var(--shadow-lg)'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="logins"
                                        stroke="var(--color-primary)"
                                        fillOpacity={1}
                                        fill="url(#colorLogins)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className={styles.activityCard}>
                    <h2 className={styles.cardTitle}>{t('dashboard.activity.title')}</h2>
                    <div className={styles.activityList}>
                        {loading ? (
                            <div className={styles.loadingPulse}>Fetching updates...</div>
                        ) : !Array.isArray(activities) || activities.length === 0 ? (
                            <div className={styles.emptyActivity}>No recent activity</div>
                        ) : (
                            activities.slice(0, 5).map((activity, index) => (
                                <div key={activity.id || index} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>
                                        {activity.type === 'alert' ? <ShieldCheck size={16} /> : <Bell size={16} />}
                                    </div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityText}>{activity.message || activity.title}</p>
                                        <span className={styles.activityTime}>{activity.created_at_human || 'Just now'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
