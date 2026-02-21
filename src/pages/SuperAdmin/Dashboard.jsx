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
import ActivityChart from '../../components/charts/ActivityChart';
import reportService from '../../services/reportService';
import secretaryService from '../../services/secretaryService';
import notificationService from '../../services/notificationService';

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
    const { t } = useTheme();
    const { user } = useAuth();
    const [statsData, setStatsData] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activities, setActivities] = useState([]);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [statsRes, unreadRes] = await Promise.all([
                    reportService.getDashboardStats().catch(err => {
                        console.warn('Failed to fetch stats:', err);
                        return { statistics: {}, recent_activity: [], activity_chart: [] };
                    }),
                    notificationService.getUnreadCount().catch(err => {
                        console.warn('Failed to fetch unread count:', err);
                        return { unread_count: 0 };
                    })
                ]);

                setStatsData(statsRes.statistics || {});
                setUnreadNotifications(unreadRes.unread_count || 0);
                setActivities(statsRes.recent_activity || []);
                setChartData(statsRes.activity_chart || []);

                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message);
                // Set default values even on error
                setStatsData({});
                setActivities([]);
                setChartData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const renderActivityDescription = (activity) => {
        const desc = activity.description || '';

        // Handle Export Pattern
        const exportMatch = desc.match(/Exported (.*) report as (.*)/i);
        if (exportMatch) {
            return t('activity.patterns.exportedReport', {
                report: exportMatch[1],
                format: exportMatch[2]
            });
        }

        if (desc.startsWith('Updated user:')) {
            const name = desc.replace('Updated user:', '').trim();
            return t('activity.patterns.updatedUser', { name });
        }
        if (desc.startsWith('Created Workstream Manager:')) {
            const name = desc.replace('Created Workstream Manager:', '').trim();
            return t('activity.patterns.createdWSManager', { name });
        }

        // Handle Login Pattern (with optional "User " prefix)
        if (desc.toLowerCase().endsWith('logged in')) {
            const email = desc.replace(/User\s+/i, '').replace(/logged in/i, '').trim();
            return t('activity.patterns.loggedIn', { email });
        }

        return activity.description?.replace(/^User\s+/i, '').replace(/user\s+/gi, '') || t(activity.message) || t(activity.title);
    };

    const renderActorName = (actor) => {
        if (actor === 'Super User' || actor === 'الادمن') return t('activity.actor.superUser');
        return actor?.replace(/^User\s+/i, '') || t('dashboard.source.system');
    };

    const renderRelativeTime = (timeStr) => {
        if (!timeStr) return t('dashboard.activity.justNow');

        // X hours, Y minutes ago
        const hrMinMatch = timeStr.match(/(\d+)\s+hour[s]?,\s+(\d+)\s+minute[s]?\s+ago/i);
        if (hrMinMatch) {
            return t('activity.time.hoursMinutesAgo', { hours: hrMinMatch[1], minutes: hrMinMatch[2] });
        }

        // X minutes ago
        const minMatch = timeStr.match(/(\d+)\s+minute[s]?\s+ago/i);
        if (minMatch) {
            return t('activity.time.minutesAgo', { count: minMatch[1] });
        }

        // X hours ago
        const hrMatch = timeStr.match(/(\d+)\s+hour[s]?\s+ago/i);
        if (hrMatch) {
            return t('activity.time.hoursAgo', { count: hrMatch[1] });
        }

        return timeStr;
    };

    // Map Backend Stats to UI
    const stats = [
        {
            title: t('dashboard.stats.workstreams'),
            value: loading ? '...' : (statsData?.total_workstreams || '0'),
            change: statsData?.workstreams_change || 0,
            icon: Briefcase,
            color: 'blue'
        },
        {
            title: t('dashboard.stats.schools'),
            value: loading ? '...' : (statsData?.total_schools || '0'),
            change: statsData?.schools_change || 0,
            icon: School,
            color: 'green'
        },
        {
            title: t('dashboard.stats.users'),
            value: loading ? '...' : (statsData?.total_users || '0').toLocaleString(),
            change: statsData?.users_change || 0,
            icon: Users,
            color: 'purple'
        },
        {
            title: t('dashboard.stats.notifications'),
            value: loading ? '...' : unreadNotifications,
            icon: 'Bell',
            color: 'orange',
            isNotification: true
        },
    ];

    const activityData = chartData.length > 0 ? chartData : [
        { name: 'Mon', logins: 0 },
        { name: 'Tue', logins: 0 },
        { name: 'Wed', logins: 0 },
        { name: 'Thu', logins: 0 },
        { name: 'Fri', logins: 0 },
        { name: 'Sat', logins: 0 },
        { name: 'Sun', logins: 0 },
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
                    <h1 className={styles.pageTitle}>{t('dashboard.greeting')}, {user?.displayName || user?.email || 'Admin'}</h1>
                    <p className={styles.subtitle}>{t('dashboard.subtitle')}</p>
                </div>
            </div>

            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.mainContent}>
                    <ActivityChart
                        data={chartData}
                        loading={loading}
                        title={t('dashboard.charts.activity')}
                        subtitle={t('dashboard.activity.subtitle')}
                    />
                </div>

                <div className={styles.activityCard}>
                    <h2 className={styles.cardTitle}>{t('dashboard.activity.title')}</h2>
                    <div className={styles.activityList}>
                        {loading ? (
                            <div className={styles.loadingPulse}>{t('dashboard.fetching')}</div>
                        ) : !Array.isArray(activities) || activities.length === 0 ? (
                            <div className={styles.emptyActivity}>{t('dashboard.noActivity')}</div>
                        ) : (
                            activities.slice(0, 5).map((activity, index) => (
                                <div key={activity.id || index} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>
                                        {activity.action_type === 'create' && <UserPlus size={16} />}
                                        {activity.action_type === 'update' && <ActivityIcon size={16} />}
                                        {(activity.action_type === 'delete' || activity.action_type === 'EXPORT') && <ShieldCheck size={16} />}
                                        {!activity.action_type && (activity.type === 'alert' ? <ShieldCheck size={16} /> : <Bell size={16} />)}
                                    </div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityText}>
                                            {renderActivityDescription(activity)}
                                        </p>
                                        <div className={styles.activityMeta}>
                                            <span className={styles.activityUser}>
                                                {renderActorName(activity.actor_name)}
                                            </span>
                                            <span className={styles.activitySeparator}>•</span>
                                            <span className={styles.activityTime}>
                                                {renderRelativeTime(activity.created_at_human)}
                                            </span>
                                        </div>
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
