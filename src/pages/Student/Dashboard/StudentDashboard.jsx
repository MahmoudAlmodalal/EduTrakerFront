import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    AlertCircle,
    Calendar,
    BookOpen,
    TrendingUp,
    Award,
    CheckCircle,
    Target,
    Zap,
    RefreshCw,
    Bell
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useStudentData } from '../../../context/StudentDataContext';
import studentService from '../../../services/studentService';
import notificationService from '../../../services/notificationService';
import '../Student.css';

const resolveText = (value, fallbackKey, fallbackText) => {
    if (!value || value === fallbackKey) {
        return fallbackText;
    }
    return value;
};

const StudentDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        dashboardData,
        loading: dashboardLoading,
        error: dashboardError,
        refreshData
    } = useStudentData();
    const [schedule, setSchedule] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [scheduleError, setScheduleError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(true);

    const dashboardErrorText = resolveText(
        t('student.dashboard.error'),
        'student.dashboard.error',
        'Failed to load dashboard data. Please try again.'
    );
    const notificationCardTitle = resolveText(
        t('communication.notificationCenter'),
        'communication.notificationCenter',
        'Recent Notifications'
    );

    const fetchSchedule = useCallback(async () => {
        if (!user?.id) {
            setSchedule([]);
            setScheduleLoading(false);
            setScheduleError(null);
            return;
        }

        setScheduleLoading(true);
        setScheduleError(null);
        try {
            const scheduleData = await studentService.getSchedule(user.id);
            const nextSchedule = Array.isArray(scheduleData?.results)
                ? scheduleData.results
                : Array.isArray(scheduleData)
                    ? scheduleData
                    : [];
            setSchedule(nextSchedule);
        } catch (err) {
            console.error('Error fetching schedule:', err);
            setScheduleError('Failed to load schedule. Please try again.');
            setSchedule([]);
        } finally {
            setScheduleLoading(false);
        }
    }, [user?.id]);

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setNotifLoading(false);
            return;
        }

        setNotifLoading(true);
        try {
            const [notifsData, countData] = await Promise.all([
                notificationService.getNotifications({ page_size: 5 }),
                notificationService.getUnreadCount()
            ]);
            setNotifications(notifsData?.results || (Array.isArray(notifsData) ? notifsData : []));
            setUnreadCount(countData?.unread_count ?? 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setNotifLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        void fetchSchedule();
    }, [fetchSchedule]);

    useEffect(() => {
        void fetchNotifications();
    }, [fetchNotifications]);

    const handleRetryDashboard = async () => {
        await refreshData();
    };

    const openNotifications = () => {
        navigate('/student/communication', { state: { activeTab: 'notifications' } });
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((previous) => previous.map((notification) => (
                notification.id === id ? { ...notification, is_read: true } : notification
            )));
            setUnreadCount((previous) => Math.max(0, previous - 1));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((previous) => previous.map((notification) => ({ ...notification, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    if (dashboardLoading && !dashboardData) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner">
                    <RefreshCw className="animate-spin" size={40} />
                </div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    if (dashboardError && !dashboardData) {
        return (
            <div className="dashboard-error">
                <AlertCircle size={48} color="#ef4444" />
                <h2>Oops! Something went wrong</h2>
                <p>{dashboardErrorText}</p>
                <button onClick={handleRetryDashboard} className="retry-btn">
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    const { profile, grades, attendance, classmates } = dashboardData || {};

    const assignments = grades?.marks?.slice(0, 3).map((mark, index) => ({
        id: mark.assignment_id || index,
        title: mark.title || 'Assignment',
        subject: mark.course_name || 'Subject',
        due: mark.due_date ? new Date(mark.due_date).toLocaleDateString() : 'N/A',
        status: mark.score !== null ? 'graded' : 'pending',
        progress: mark.percentage || 0
    })) || [];

    const stats = {
        attendance: attendance?.attendance_rate || 0,
        gpa: grades?.overall_average ? (grades.overall_average / 25).toFixed(2) : '0.00',
        completedTasks: grades?.graded_assignments || 0,
        rank: classmates?.rank || `Top ${classmates?.active_classmates || 'N/A'}`
    };

    const todaySchedule = schedule.length > 0 ? schedule : [];
    const hasUnreadNotifications = unreadCount > 0;
    const noNotificationsText = resolveText(
        t('communication.noNotifications'),
        'communication.noNotifications',
        'No notifications'
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
            case 'graded':
            case 'done':
                return <span className="status-badge status-done"><CheckCircle size={12} /> Completed</span>;
            case 'current':
            case 'now':
                return <span className="status-badge status-now"><Zap size={12} /> In Progress</span>;
            case 'upcoming':
            case 'pending':
                return <span className="status-badge status-upcoming"><Clock size={12} /> Pending</span>;
            default:
                return null;
        }
    };

    return (
        <div className="student-dashboard">
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <h1 className="dashboard-title">
                        {t('student.dashboard.welcome') || 'Welcome back'}, <span className="text-gradient">{user?.full_name || 'Student'}!</span>
                    </h1>
                    <p className="dashboard-subtitle">
                        {profile?.current_classroom?.classroom_name || ''} • {profile?.current_grade?.grade_name || ''}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={openNotifications}
                        aria-label="View notifications"
                        style={{
                            position: 'relative',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    minWidth: '18px',
                                    height: '18px',
                                    borderRadius: '999px',
                                    padding: '0 4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <div className="dashboard-date">
                        <Calendar size={18} />
                        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </header>

            <div className="stat-cards-row">
                <div className="stat-card-premium">
                    <div className="stat-card-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-card-content">
                        <h3>{stats.attendance}%</h3>
                        <p>{t('student.dashboard.attendance') || 'Attendance'}</p>
                    </div>
                </div>
                <div className="stat-card-premium">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
                        <Award size={24} />
                    </div>
                    <div className="stat-card-content">
                        <h3>{stats.gpa}</h3>
                        <p>Current GPA</p>
                    </div>
                </div>
                <div className="stat-card-premium">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
                        <Target size={24} />
                    </div>
                    <div className="stat-card-content">
                        <h3>{stats.completedTasks}</h3>
                        <p>Tasks Done</p>
                    </div>
                </div>
                <div className="stat-card-premium">
                    <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-card-content">
                        <h3>{stats.rank}</h3>
                        <p>Class Rank</p>
                    </div>
                </div>
            </div>

            <div className="student-dashboard-grid">
                <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <Clock size={20} />
                            {t('student.dashboard.dailySchedule') || "Today's Schedule"}
                        </h2>
                        <span className="card-badge">{scheduleLoading ? '...' : `${todaySchedule.length} Classes`}</span>
                    </div>
                    <div className="schedule-list">
                        {scheduleLoading && (
                            <div className="empty-state">Loading schedule...</div>
                        )}
                        {!scheduleLoading && scheduleError && (
                            <div className="empty-state">
                                <p>{scheduleError}</p>
                                <button onClick={fetchSchedule} className="retry-btn" type="button">
                                    <RefreshCw size={14} />
                                    Retry Schedule
                                </button>
                            </div>
                        )}
                        {!scheduleLoading && !scheduleError && todaySchedule.length === 0 && (
                            <div className="empty-state">No schedule available.</div>
                        )}
                        {!scheduleLoading && !scheduleError && todaySchedule.map((item) => (
                            <div key={item.id} className={`schedule-item ${item.status === 'now' ? 'current' : ''}`}>
                                <div className="schedule-time">
                                    <span className="schedule-time-text">{item.time}</span>
                                </div>
                                <div className="schedule-details">
                                    <div className="schedule-subject">{item.subject}</div>
                                    <div className="schedule-meta">
                                        {item.teacher_name || 'Teacher'} • {item.room || 'Room TBD'}
                                    </div>
                                </div>
                                {getStatusBadge(item.status)}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-side-column">
                    <div className="dashboard-card attendance-widget">
                        <div className="card-header">
                            <h2 className="card-title">
                                <Calendar size={20} />
                                {t('student.dashboard.attendance') || 'Attendance'}
                            </h2>
                        </div>
                        <div className="attendance-ring-container">
                            <div className="attendance-ring">
                                <svg viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke="#e0f2fe"
                                        strokeWidth="10"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${stats.attendance * 2.51} 251`}
                                        transform="rotate(-90 50 50)"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#0891b2" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="attendance-ring-value">
                                    <span className="attendance-percentage">{stats.attendance}%</span>
                                    <span className="attendance-label">Present</span>
                                </div>
                            </div>
                        </div>
                        <div className="attendance-stats">
                            <div className="attendance-stat">
                                <span className="attendance-stat-value text-success">{attendance?.by_status?.present || 0}</span>
                                <span className="attendance-stat-label">Days Present</span>
                            </div>
                            <div className="attendance-stat">
                                <span className="attendance-stat-value text-danger">{attendance?.by_status?.absent || 0}</span>
                                <span className="attendance-stat-label">Days Absent</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-header" style={{ alignItems: 'center' }}>
                            <h2 className="card-title">
                                <Bell size={20} />
                                {notificationCardTitle}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {hasUnreadNotifications && (
                                    <button
                                        type="button"
                                        onClick={handleMarkAllRead}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        Mark all as read
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={openNotifications}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-text-muted)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: 0 }}>
                            {notifLoading && Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={`notif-skeleton-${index}`}
                                    style={{
                                        padding: '1rem 0.75rem',
                                        borderBottom: '1px solid var(--color-border-light)'
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '12px',
                                            width: '58%',
                                            background: 'var(--color-bg-hover)',
                                            borderRadius: '999px',
                                            marginBottom: '0.6rem'
                                        }}
                                    />
                                    <div
                                        style={{
                                            height: '10px',
                                            width: '90%',
                                            background: 'var(--color-bg-hover)',
                                            borderRadius: '999px'
                                        }}
                                    />
                                </div>
                            ))}

                            {!notifLoading && notifications.length === 0 && (
                                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                                    <Bell size={22} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                    <p style={{ margin: 0 }}>{noNotificationsText}</p>
                                </div>
                            )}

                            {!notifLoading && notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    style={{
                                        padding: '1.5rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        display: 'flex',
                                        gap: '1.25rem',
                                        backgroundColor: notification.is_read ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.03)',
                                        position: 'relative',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {!notification.is_read && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '4px',
                                                background: 'var(--color-primary)'
                                            }}
                                        />
                                    )}
                                    <div
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '12px',
                                            background: 'var(--color-bg-body)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--color-primary)',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Bell size={22} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '1rem' }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>
                                                {notification.title || 'Notification'}
                                            </h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} />
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.925rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 0', lineHeight: '1.5' }}>
                                            {notification.message || notification.content}
                                        </p>
                                        {!notification.is_read && (
                                            <button
                                                type="button"
                                                onClick={() => handleMarkRead(notification.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    color: 'var(--color-primary)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    marginTop: '0.5rem'
                                                }}
                                            >
                                                Mark as read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2 className="card-title">
                                <BookOpen size={20} />
                                {t('student.dashboard.assignments') || 'Recent Marks'}
                            </h2>
                            <span className="card-badge">{grades?.total_assignments || 0} Total</span>
                        </div>
                        <div className="assignment-list">
                            {assignments.length > 0 ? assignments.map((assignment) => (
                                <div key={assignment.id} className="assignment-item">
                                    <div className="assignment-header">
                                        <div className="assignment-title">{assignment.title}</div>
                                        {assignment.status === 'pending' && <AlertCircle size={16} className="text-warning" />}
                                    </div>
                                    <div className="assignment-meta">
                                        <span>{assignment.subject}</span>
                                        <span className="assignment-due">
                                            {assignment.due}
                                        </span>
                                    </div>
                                    <div className="assignment-progress">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${assignment.progress}%` }}></div>
                                        </div>
                                        <span className="progress-text">{assignment.progress}%</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state">No recent marks found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
