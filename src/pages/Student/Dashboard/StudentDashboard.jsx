import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    Award,
    Bell,
    BookOpen,
    Building2,
    Calendar,
    Clock,
    FileText,
    MessageCircle,
    RefreshCw,
    Target,
    TrendingUp,
    User
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useStudentData } from '../../../context/StudentDataContext';
import notificationService, { resolveNotificationRedirect } from '../../../services/notificationService';
import studentService from '../../../services/studentService';
import '../Student.css';

const NOTIFICATION_PREVIEW_LIMIT = 5;

const resolveText = (value, fallbackKey, fallbackText) => {
    if (!value || value === fallbackKey) {
        return fallbackText;
    }
    return value;
};

const getInitials = (fullName = '') => {
    const tokens = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
        return 'ST';
    }
    if (tokens.length === 1) {
        return tokens[0].slice(0, 2).toUpperCase();
    }
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
};

const notifConfig = {
    grade_posted: { icon: Award, bg: '#dcfce7', color: '#166534', label: 'Grade' },
    assignment_due: { icon: Clock, bg: '#fef3c7', color: '#92400e', label: 'Due Soon' },
    attendance_marked: { icon: Calendar, bg: '#dbeafe', color: '#1e40af', label: 'Attendance' },
    announcement: { icon: BookOpen, bg: '#ede9fe', color: '#6d28d9', label: 'Content' },
    material_published: { icon: FileText, bg: '#cffafe', color: '#155e75', label: 'Material' },
    message_received: { icon: MessageCircle, bg: '#fce7f3', color: '#9d174d', label: 'Message' },
    system: { icon: Bell, bg: '#f1f5f9', color: '#475569', label: 'System' }
};

const getNotifConfig = (type) => notifConfig[type] || notifConfig.system;

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

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifLoading, setNotifLoading] = useState(true);
    const [hasMoreNotifications, setHasMoreNotifications] = useState(false);

    const [assignmentPageSize, setAssignmentPageSize] = useState(5);
    const [assignmentData, setAssignmentData] = useState([]);
    const [assignmentTotal, setAssignmentTotal] = useState(null);
    const [assignmentLoading, setAssignmentLoading] = useState(true);

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

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setHasMoreNotifications(false);
            setNotifLoading(false);
            return;
        }

        setNotifLoading(true);
        try {
            const [notifsData, countData] = await Promise.all([
                notificationService.getNotifications({
                    is_read: false,
                    page_size: NOTIFICATION_PREVIEW_LIMIT + 1
                }),
                notificationService.getUnreadCount()
            ]);

            const fetchedNotifications = Array.isArray(notifsData?.results)
                ? notifsData.results
                : Array.isArray(notifsData)
                    ? notifsData
                    : [];

            setNotifications(fetchedNotifications.slice(0, NOTIFICATION_PREVIEW_LIMIT));
            setHasMoreNotifications(
                (notifsData?.count ?? fetchedNotifications.length) > NOTIFICATION_PREVIEW_LIMIT
            );
            setUnreadCount(countData?.unread_count ?? fetchedNotifications.length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setNotifications([]);
            setUnreadCount(0);
            setHasMoreNotifications(false);
        } finally {
            setNotifLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        void fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        setAssignmentLoading(true);
        studentService.getAssignments({ page_size: assignmentPageSize })
            .then((res) => {
                if (cancelled) return;
                const list = Array.isArray(res?.results) ? res.results
                    : Array.isArray(res) ? res : [];
                setAssignmentData(list);
                setAssignmentTotal(res?.count ?? list.length);
                setAssignmentLoading(false);
            })
            .catch(() => { if (!cancelled) setAssignmentLoading(false); });
        return () => { cancelled = true; };
    }, [user?.id, assignmentPageSize]);

    const handleRetryDashboard = async () => {
        await refreshData();
    };

    const openNotifications = () => {
        navigate('/student/communication', { state: { activeTab: 'notifications' } });
    };

    const decrementUnreadPreview = () => {
        setUnreadCount((previous) => {
            const next = Math.max(0, previous - 1);
            setHasMoreNotifications(next > NOTIFICATION_PREVIEW_LIMIT);
            return next;
        });
    };

    const handleMarkRead = async (id) => {
        if (!id) {
            return;
        }

        setNotifications((previous) => previous.filter((notification) => notification.id !== id));
        decrementUnreadPreview();

        try {
            await notificationService.markAsRead(id);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            await fetchNotifications();
        }
    };

    const handleMarkAllRead = async () => {
        if (!notifications.length) {
            return;
        }

        setNotifications([]);
        setHasMoreNotifications(false);
        setUnreadCount(0);

        try {
            await notificationService.markAllAsRead();
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            await fetchNotifications();
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification?.id) {
            return;
        }

        if (!notification.is_read) {
            setNotifications((previous) => previous.filter((item) => item.id !== notification.id));
            decrementUnreadPreview();

            try {
                await notificationService.markAsRead(notification.id);
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
                await fetchNotifications();
            }
        }

        navigate(resolveNotificationRedirect(notification));
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
                <button onClick={handleRetryDashboard} className="retry-btn" type="button">
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    const { profile, grades, attendance, classmates } = dashboardData || {};

    const assignments = assignmentData.map((a, index) => {
        const pct = a.grade?.percentage != null
            ? Math.round(parseFloat(a.grade.percentage))
            : null;
        return {
            id: a.id || index,
            title: a.title || 'Assignment',
            subject: a.course_name || 'Subject',
            due: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A',
            status: a.status || 'not_submitted',
            progress: pct,
        };
    });

    const stats = {
        attendance: attendance?.attendance_rate || 0,
        gpa: grades?.overall_average ? (grades.overall_average / 25).toFixed(2) : '0.00',
        completedTasks: grades?.graded_assignments || 0,
        rank: classmates?.rank || `Top ${classmates?.active_classmates || 'N/A'}`
    };

    const classroomName = profile?.current_classroom?.classroom_name || 'No classroom';
    const gradeName = profile?.current_grade?.grade_name || profile?.current_classroom?.grade_name || 'Grade N/A';
    const academicYear = profile?.current_classroom?.academic_year || 'Academic year N/A';
    const profileCard = {
        fullName: profile?.student_name || user?.full_name || 'Student',
        email: profile?.email || user?.email || '—',
        schoolName: profile?.school_name || 'School not available',
        homeroomTeacher: profile?.current_classroom?.homeroom_teacher || 'Homeroom teacher not assigned',
        classroomText: `${classroomName} • ${academicYear}`,
        gradeText: gradeName
    };

    const hasUnreadNotifications = unreadCount > 0;
    const noNotificationsText = resolveText(
        t('communication.noNotifications'),
        'communication.noNotifications',
        'No new notifications'
    );

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

            <div className="student-dashboard-grid dashboard-grid">
                <div className="dashboard-card card-full-width">
                    <div className="card-header">
                        <h2 className="card-title">
                            <BookOpen size={20} />
                            Assignments
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {assignmentTotal !== null && (
                                <span className="card-badge">{assignmentTotal} Total</span>
                            )}
                            <select
                                value={assignmentPageSize}
                                onChange={(e) => setAssignmentPageSize(Number(e.target.value))}
                                style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-surface)',
                                    color: 'var(--color-text-main)',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                {[5, 10, 15, 25].map((n) => (
                                    <option key={n} value={n}>Show {n}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="assignment-list">
                        {assignmentLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="assignment-item" style={{ opacity: 0.5 }}>
                                    <div style={{ height: 12, width: '55%', background: 'var(--color-bg-hover)', borderRadius: 999, marginBottom: 8 }} />
                                    <div style={{ height: 10, width: '80%', background: 'var(--color-bg-hover)', borderRadius: 999 }} />
                                </div>
                            ))
                        ) : assignments.length > 0 ? assignments.map((assignment) => {
                            const statusColors = {
                                submitted: { bg: '#dcfce7', color: '#166534', label: 'Submitted' },
                                graded:    { bg: '#dbeafe', color: '#1e40af', label: 'Graded' },
                                late:      { bg: '#fef3c7', color: '#92400e', label: 'Late' },
                                not_submitted: { bg: '#f1f5f9', color: '#64748b', label: 'Pending' },
                            };
                            const sc = statusColors[assignment.status] || statusColors.not_submitted;
                            return (
                                <div key={assignment.id} className="assignment-item">
                                    <div className="assignment-header">
                                        <div className="assignment-title">{assignment.title}</div>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: 700,
                                            background: sc.bg, color: sc.color,
                                            borderRadius: 999, padding: '0.2rem 0.55rem',
                                            textTransform: 'uppercase', letterSpacing: '0.04em'
                                        }}>{sc.label}</span>
                                    </div>
                                    <div className="assignment-meta">
                                        <span>{assignment.subject}</span>
                                        <span className="assignment-due">{assignment.due}</span>
                                    </div>
                                    {assignment.progress != null && (
                                        <div className="assignment-progress">
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${assignment.progress}%` }} />
                                            </div>
                                            <span className="progress-text">{assignment.progress}%</span>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="empty-state">No assignments found.</div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card student-profile-card">
                    <div className="student-profile-top">
                        <div className="student-profile-avatar">
                            {getInitials(profileCard.fullName)}
                        </div>
                        <div className="student-profile-meta">
                            <h3>{profileCard.fullName}</h3>
                            <p>{profileCard.email}</p>
                            <span className="student-profile-pill">{profileCard.gradeText} • {profileCard.classroomText}</span>
                        </div>
                    </div>

                    <div className="student-profile-lines">
                        <div className="student-profile-line school">
                            <Building2 size={15} />
                            <span>{profileCard.schoolName}</span>
                        </div>
                        <div className="student-profile-line">
                            <User size={15} />
                            <span>{profileCard.homeroomTeacher} (Homeroom Teacher)</span>
                        </div>
                    </div>

                    <div className="student-profile-badges">
                        <span className="student-profile-badge gpa">
                            <Award size={13} />
                            GPA: {stats.gpa}
                        </span>
                        <span className="student-profile-badge attendance">
                            <Calendar size={13} />
                            Att: {stats.attendance}%
                        </span>
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
                            {hasMoreNotifications && (
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
                            )}
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

                        {!notifLoading && notifications.map((notification) => {
                            const config = getNotifConfig(notification.notification_type);
                            const Icon = config.icon;
                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            handleNotificationClick(notification);
                                        }
                                    }}
                                    style={{
                                        padding: '1rem 1rem 1rem 1.2rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        display: 'flex',
                                        gap: '0.9rem',
                                        backgroundColor: `${config.bg}66`,
                                        position: 'relative',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: '4px',
                                            background: config.color
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '10px',
                                            background: config.bg,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: config.color,
                                            flexShrink: 0
                                        }}
                                    >
                                        <Icon size={18} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.7rem' }}>
                                            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text-main)', margin: 0 }}>
                                                {notification.title || 'Notification'}
                                            </h4>
                                            <span
                                                style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    color: config.color,
                                                    background: config.bg,
                                                    borderRadius: '999px',
                                                    padding: '0.2rem 0.45rem',
                                                    height: 'fit-content',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.03em'
                                                }}
                                            >
                                                {config.label}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.845rem', color: 'var(--color-text-muted)', margin: '0.35rem 0 0', lineHeight: '1.45' }}>
                                            {notification.message || notification.content}
                                        </p>
                                        <div style={{ marginTop: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={13} />
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleMarkRead(notification.id);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    padding: 0,
                                                    color: config.color,
                                                    fontSize: '0.79rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
