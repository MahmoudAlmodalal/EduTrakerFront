import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronRight,
    Clock,
    FileText,
    MessageSquare,
    Plus,
    TrendingUp,
    UserPlus,
    Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import {
    AvatarInitial,
    EmptyState,
    LoadingSpinner,
    PageHeader,
    StatCard,
} from './components';
import './Secretary.css';

const AttendanceTrendChart = lazy(() => import('./components/AttendanceTrendChart'));

const SecretaryDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalStudents: 0,
        unreadMessages: 0,
        absentToday: 0,
        schoolName: '',
    });
    const [recentApplications, setRecentApplications] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, applicationsData, yearsData] = await Promise.all([
                    secretaryService.getDashboardStats(),
                    secretaryService.getApplications({ page: 1 }),
                    secretaryService.getAcademicYears(),
                ]);

                if (!isMounted) {
                    return;
                }

                setStats({
                    totalStudents: statsData.statistics?.total_students || 0,
                    unreadMessages: statsData.statistics?.unread_messages || 0,
                    absentToday: statsData.statistics?.absent_today || 0,
                    schoolName: statsData.statistics?.school_name || 'My School',
                });

                setRecentApplications((applicationsData.results || applicationsData || []).slice(0, 5));
                setAcademicYears(yearsData.results || yearsData || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDashboardData();

        return () => {
            isMounted = false;
        };
    }, []);

    const currentYear = useMemo(() => {
        const now = new Date();
        const activeYear = academicYears.find((year) => {
            const start = new Date(year.start_date);
            const end = new Date(year.end_date);
            return now >= start && now <= end;
        });

        return activeYear || academicYears[0] || null;
    }, [academicYears]);

    const trendData = useMemo(() => {
        return [
            { name: 'Mon', count: Math.floor(stats.totalStudents * 0.95) },
            { name: 'Tue', count: Math.floor(stats.totalStudents * 0.92) },
            { name: 'Wed', count: Math.floor(stats.totalStudents * 0.96) },
            { name: 'Thu', count: Math.floor(stats.totalStudents * 0.94) },
            { name: 'Fri', count: Math.max(0, stats.totalStudents - stats.absentToday) },
        ];
    }, [stats.totalStudents, stats.absentToday]);

    const statCards = useMemo(() => {
        const attendanceRate = stats.totalStudents > 0
            ? Math.round(((stats.totalStudents - stats.absentToday) / stats.totalStudents) * 100)
            : 0;

        return [
            {
                title: t('secretary.dashboard.totalStudents') || 'Total Students',
                value: stats.totalStudents.toLocaleString(),
                icon: Users,
                trend: '+12%',
                trendUp: true,
                color: 'indigo',
            },
            {
                title: t('secretary.dashboard.unreadMessages') || 'Unread Messages',
                value: stats.unreadMessages,
                icon: MessageSquare,
                color: 'amber',
            },
            {
                title: t('secretary.dashboard.attendanceRate') || t('student.attendance.attendanceRate') || 'Attendance Rate',
                value: `${attendanceRate}%`,
                icon: TrendingUp,
                trend: '+2.3%',
                trendUp: true,
                color: 'green',
            },
            {
                title: t('secretary.dashboard.absentToday') || 'Absent Today',
                value: stats.absentToday,
                icon: Clock,
                color: 'rose',
            },
        ];
    }, [stats.totalStudents, stats.unreadMessages, stats.absentToday, t]);

    const quickAccessButtons = useMemo(() => {
        return [
            { icon: UserPlus, label: 'Student Registry', sub: 'Manage all students', link: '/secretary/admissions' },
            { icon: CalendarIcon, label: 'Attendance Log', sub: 'Daily reports', link: '/secretary/attendance' },
            { icon: MessageSquare, label: 'Parent Broadcast', sub: 'Send updates', link: '/secretary/communication' },
            { icon: FileText, label: 'Enrollment Center', sub: 'Process apps', link: '/secretary/admissions' },
        ];
    }, []);

    const handleNavigate = useCallback(
        (path) => {
            navigate(path);
        },
        [navigate]
    );

    const headerAction = useMemo(() => {
        return (
            <button className="btn-primary" onClick={() => handleNavigate('/secretary/admissions')}>
                <Plus size={18} />
                New Admission
            </button>
        );
    }, [handleNavigate]);

    if (loading) {
        return (
            <div className="secretary-dashboard">
                <LoadingSpinner message="Loading dashboard..." />
            </div>
        );
    }

    const firstName = user?.displayName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Secretary';

    return (
        <div className="secretary-dashboard">
            <PageHeader
                title={`Welcome back, ${firstName}!`}
                subtitle={`${stats.schoolName} - Secretary Control Panel`}
                action={headerAction}
            />

            <section className="sec-stats-grid">
                {statCards.map((stat) => (
                    <StatCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        trend={stat.trend}
                        trendUp={stat.trendUp}
                    />
                ))}
            </section>

            <section className="secretary-dashboard-main-grid">
                <article className="sec-card sec-chart-card">
                    <div className="sec-chart-header">
                        <div>
                            <h3>Weekly Attendance Trend</h3>
                            <p>Student attendance tracking for the current week</p>
                        </div>
                        <select className="form-select sec-chart-select" defaultValue="current-week">
                            <option value="current-week">Current Week</option>
                            <option value="last-week">Last Week</option>
                        </select>
                    </div>
                    <Suspense fallback={<LoadingSpinner message="Loading chart..." />}>
                        <AttendanceTrendChart trendData={trendData} />
                    </Suspense>
                </article>

                <aside className="sec-dashboard-sidebar">
                    <article className="sec-session-card">
                        <div className="sec-session-card__head">Current Session</div>
                        <h3>{currentYear?.academic_year_code || '---'}</h3>
                        <span className="sec-session-badge">Active</span>
                        <div className="sec-session-meta">
                            <div>
                                <span>Start Date</span>
                                <strong>{currentYear?.start_date || '---'}</strong>
                            </div>
                            <div>
                                <span>End Date</span>
                                <strong>{currentYear?.end_date || '---'}</strong>
                            </div>
                        </div>
                        <CalendarIcon className="sec-session-card__icon" size={110} />
                    </article>

                    <article className="widget-card sec-card">
                        <div className="widget-header">
                            <h3>Recent Activity</h3>
                            <button
                                type="button"
                                className="view-all-btn"
                                onClick={() => handleNavigate('/secretary/admissions')}
                            >
                                View All
                            </button>
                        </div>
                        <div className="sec-activity-list">
                            {recentApplications.length > 0 ? (
                                recentApplications.map((application) => (
                                    <button
                                        key={application.id}
                                        type="button"
                                        className="sec-activity-item"
                                        onClick={() => handleNavigate('/secretary/admissions')}
                                    >
                                        <div className="sec-activity-item__left">
                                            <AvatarInitial name={application.student_name || 'Student'} color="indigo" />
                                            <div>
                                                <p>{application.student_name}</p>
                                                <span>Applied for: {application.grade_name || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} />
                                    </button>
                                ))
                            ) : (
                                <EmptyState message="No recent activity" />
                            )}
                        </div>
                    </article>
                </aside>
            </section>

            <section className="sec-section">
                <h3>Quick Access</h3>
                <div className="sec-quick-grid">
                    {quickAccessButtons.map((button) => (
                        <button
                            key={button.label}
                            type="button"
                            className="sec-quick-card"
                            onClick={() => handleNavigate(button.link)}
                        >
                            <div className="sec-quick-icon">
                                <button.icon size={22} />
                            </div>
                            <span className="sec-quick-title">{button.label}</span>
                            <span className="sec-quick-subtitle">{button.sub}</span>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default SecretaryDashboard;
