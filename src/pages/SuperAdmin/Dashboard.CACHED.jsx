import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Users, School, Briefcase, TrendingUp, TrendingDown, Bell, Activity as ActivityIcon, UserPlus, ShieldCheck } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import styles from './Dashboard.module.css';
import ActivityChart from '../../components/charts/ActivityChart';
import reportService from '../../services/reportService';
import notificationService from '../../services/notificationService';
import { useCachedApi } from '../../hooks/useCachedApi';

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
    console.log('Dashboard component rendering (with caching)...');

    const { t } = useTheme();
    const { user } = useAuth();

    // Fetch dashboard stats with caching (30 min TTL)
    const {
        data: statsResponse,
        loading: statsLoading,
        error: statsError
    } = useCachedApi(
        () => reportService.getDashboardStats(),
        {
            cacheKey: 'admin_dashboard_stats',
            ttl: 30 * 60 * 1000 // 30 minutes
        }
    );

    // Fetch unread notifications with caching (5 min TTL - more frequent updates)
    const {
        data: unreadResponse,
        loading: unreadLoading
    } = useCachedApi(
        () => notificationService.getUnreadCount(),
        {
            cacheKey: 'admin_unread_notifications',
            ttl: 5 * 60 * 1000 // 5 minutes (notifications should be more current)
        }
    );

    // Combine loading states
    const loading = statsLoading || unreadLoading;
    const error = statsError;

    // Extract data with defaults
    const statsData = statsResponse?.statistics || {};
    const activities = statsResponse?.recent_activity || [];
    const chartData = statsResponse?.activity_chart || [];
    const unreadNotifications = unreadResponse?.unread_count || 0;

    console.log('Dashboard - user:', user);

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

    // Show error state
    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorMessage}>
                    <p>Error loading dashboard: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Good morning, {user?.displayName || user?.email || 'Admin'}</h1>
                    <p className={styles.subtitle}>Here's what's happening across EduTraker today.</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts Section */}
            <div className={styles.chartsGrid}>
                {/* Activity Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3>Weekly Activity</h3>
                        <span className={styles.chartSubtitle}>User logins over the last 7 days</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="logins"
                                stroke="#2563eb"
                                fillOpacity={1}
                                fill="url(#colorLogins)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Distribution Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3>Regional Distribution</h3>
                        <span className={styles.chartSubtitle}>Schools by governorate</span>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={distributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
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

            {/* Recent Activity */}
            <div className={styles.activitySection}>
                <div className={styles.activityHeader}>
                    <h3>Recent Activity</h3>
                    <button className={styles.viewAllButton}>View All</button>
                </div>
                <div className={styles.activityList}>
                    {loading ? (
                        <p>Loading activities...</p>
                    ) : activities.length > 0 ? (
                        activities.map((activity, index) => (
                            <div key={activity.id || index} className={styles.activityItem}>
                                <div className={styles.activityIcon}>
                                    {activity.action_type === 'create' && <UserPlus size={16} />}
                                    {activity.action_type === 'update' && <ActivityIcon size={16} />}
                                    {activity.action_type === 'delete' && <ShieldCheck size={16} />}
                                    {!activity.action_type && (activity.type === 'user' ? <Users size={16} /> : activity.type === 'school' ? <School size={16} /> : <Briefcase size={16} />)}
                                </div>
                                <div className={styles.activityContent}>
                                    <p className={styles.activityText}>
                                        {activity.description || activity.title}
                                    </p>
                                    <div className={styles.activityMeta}>
                                        <span className={styles.activityUser}>
                                            {activity.actor_name || 'System'}
                                        </span>
                                        <span className={styles.activitySeparator}>•</span>
                                        <span className={styles.activityTime}>
                                            {activity.created_at_human || 'Just now'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={styles.emptyState}>No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
