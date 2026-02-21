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

const TODAY_ATTENDANCE_STATUS = {
    PRESENT: 'present',
    ABSENT: 'absent',
    NOT_RECORDED: 'not_recorded'
};

const toLocalIsoDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeAttendanceStatus = (status = '') => String(status).trim().toLowerCase();

const resolveTodayAttendanceStatus = (records = []) => {
    if (!Array.isArray(records) || records.length === 0) {
        return TODAY_ATTENDANCE_STATUS.NOT_RECORDED;
    }

    const statuses = records.map((record) => normalizeAttendanceStatus(record?.status));
    if (statuses.includes('absent')) {
        return TODAY_ATTENDANCE_STATUS.ABSENT;
    }

    if (statuses.some((status) => ['present', 'late', 'excused'].includes(status))) {
        return TODAY_ATTENDANCE_STATUS.PRESENT;
    }

    return TODAY_ATTENDANCE_STATUS.NOT_RECORDED;
};

const notifConfig = {
    grade_posted: {
        icon: Award,
        label: 'Grade',
        light: { bg: '#dcfce7', color: '#166534', rowBg: 'rgba(220, 252, 231, 0.65)' },
        dark: { bg: 'rgba(34, 197, 94, 0.2)', color: '#86efac', rowBg: 'rgba(34, 197, 94, 0.14)' }
    },
    assignment_due: {
        icon: Clock,
        label: 'Assessment',
        light: { bg: '#fef3c7', color: '#92400e', rowBg: 'rgba(254, 243, 199, 0.65)' },
        dark: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', rowBg: 'rgba(245, 158, 11, 0.14)' }
    },
    attendance_marked: {
        icon: Calendar,
        label: 'Attendance',
        light: { bg: '#dbeafe', color: '#1e40af', rowBg: 'rgba(219, 234, 254, 0.65)' },
        dark: { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', rowBg: 'rgba(59, 130, 246, 0.14)' }
    },
    announcement: {
        icon: BookOpen,
        label: 'Content',
        light: { bg: '#ede9fe', color: '#6d28d9', rowBg: 'rgba(237, 233, 254, 0.65)' },
        dark: { bg: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', rowBg: 'rgba(139, 92, 246, 0.14)' }
    },
    material_published: {
        icon: FileText,
        label: 'Material',
        light: { bg: '#cffafe', color: '#155e75', rowBg: 'rgba(207, 250, 254, 0.65)' },
        dark: { bg: 'rgba(6, 182, 212, 0.2)', color: '#67e8f9', rowBg: 'rgba(6, 182, 212, 0.14)' }
    },
    message_received: {
        icon: MessageCircle,
        label: 'Message',
        light: { bg: '#fce7f3', color: '#9d174d', rowBg: 'rgba(252, 231, 243, 0.65)' },
        dark: { bg: 'rgba(236, 72, 153, 0.2)', color: '#f9a8d4', rowBg: 'rgba(236, 72, 153, 0.14)' }
    },
    system: {
        icon: Bell,
        label: 'System',
        light: { bg: '#f1f5f9', color: '#475569', rowBg: 'rgba(241, 245, 249, 0.65)' },
        dark: { bg: 'rgba(100, 116, 139, 0.25)', color: '#cbd5e1', rowBg: 'rgba(100, 116, 139, 0.14)' }
    }
};

const getNotifConfig = (type, isDarkTheme = false) => {
    const config = notifConfig[type] || notifConfig.system;
    return {
        icon: config.icon,
        label: config.label,
        ...(isDarkTheme ? config.dark : config.light)
    };
};

const StudentDashboard = () => {
    const { t, theme } = useTheme();
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
    const [todayAttendanceStatus, setTodayAttendanceStatus] = useState(TODAY_ATTENDANCE_STATUS.NOT_RECORDED);
    const [todayAttendanceLoading, setTodayAttendanceLoading] = useState(true);

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
        studentService.getAssignments({ page_size: 200 })
            .then((res) => {
                if (cancelled) return;
                const list = Array.isArray(res?.results) ? res.results
                    : Array.isArray(res) ? res : [];
                const pendingAssignments = list.filter(
                    (assignment) => (assignment?.status || 'not_submitted') === 'not_submitted'
                );
                setAssignmentData(pendingAssignments.slice(0, assignmentPageSize));
                setAssignmentTotal(pendingAssignments.length);
                setAssignmentLoading(false);
            })
            .catch(() => { if (!cancelled) setAssignmentLoading(false); });
        return () => { cancelled = true; };
    }, [user?.id, assignmentPageSize]);

    useEffect(() => {
        let cancelled = false;

        if (!user?.id) {
            setTodayAttendanceStatus(TODAY_ATTENDANCE_STATUS.NOT_RECORDED);
            setTodayAttendanceLoading(false);
            return () => {
                cancelled = true;
            };
        }

        setTodayAttendanceLoading(true);
        const todayIso = toLocalIsoDate();

        studentService.getAttendance(null, {
            params: {
                date_from: todayIso,
                date_to: todayIso,
                page_size: 200
            }
        })
            .then((response) => {
                if (cancelled) {
                    return;
                }
                const records = Array.isArray(response?.results)
                    ? response.results
                    : Array.isArray(response)
                        ? response
                        : [];
                setTodayAttendanceStatus(resolveTodayAttendanceStatus(records));
            })
            .catch((err) => {
                console.error('Failed to fetch today attendance:', err);
                if (!cancelled) {
                    setTodayAttendanceStatus(TODAY_ATTENDANCE_STATUS.NOT_RECORDED);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setTodayAttendanceLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const handleRetryDashboard = async () => {
        await refreshData();
    };

    const openNotifications = () => {
        navigate('/student/communication', { state: { activeTab: 'notifications' } });
    };

    const openAssignmentInSubjects = useCallback((assignment = {}) => {
        const params = new URLSearchParams();
        params.set('tab', 'assignments');

        if (assignment.assignmentId) {
            params.set('assignment', String(assignment.assignmentId));
        }

        if (assignment.courseId) {
            params.set('course', String(assignment.courseId));
        }

        if (assignment.classroomId) {
            params.set('classroom', String(assignment.classroomId));
        }

        navigate(`/student/subjects?${params.toString()}`);
    }, [navigate]);

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

    const { profile } = dashboardData || {};

    const assignments = assignmentData.map((a, index) => {
        const pct = a.grade?.percentage != null
            ? Math.round(parseFloat(a.grade.percentage))
            : null;
        return {
            id: a.id || `pending-${index}`,
            assignmentId: a.id || null,
            title: a.title || 'Assignment',
            subject: a.course_name || 'Subject',
            due: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A',
            status: a.status || 'not_submitted',
            progress: pct,
            courseId: a.course_id || null,
            classroomId: a.classroom_id || null,
        };
    });

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
    const isDarkTheme = theme === 'dark';
    const todayAttendanceUi = todayAttendanceLoading
        ? { label: 'Checking...', tone: 'pending' }
        : todayAttendanceStatus === TODAY_ATTENDANCE_STATUS.ABSENT
            ? { label: 'Absent', tone: 'absent' }
            : todayAttendanceStatus === TODAY_ATTENDANCE_STATUS.PRESENT
                ? { label: 'Present', tone: 'present' }
                : { label: 'Not recorded yet', tone: 'pending' };
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
                        className="dashboard-notification-btn"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="dashboard-notification-badge">
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

            <section className="dashboard-classroom-summary" aria-label="Current classroom details">
                <div className="dashboard-classroom-summary-header">
                    <h2>Classroom Snapshot</h2>
                    <p>Your current class details</p>
                </div>
                <div className="dashboard-classroom-summary-grid">
                    <article className="dashboard-classroom-summary-item">
                        <span className="summary-item-icon classroom">
                            <Building2 size={16} />
                        </span>
                        <div>
                            <h3>Classroom</h3>
                            <p>{classroomName}</p>
                        </div>
                    </article>
                    <article className="dashboard-classroom-summary-item">
                        <span className="summary-item-icon grade">
                            <Award size={16} />
                        </span>
                        <div>
                            <h3>Grade</h3>
                            <p>{gradeName}</p>
                        </div>
                    </article>
                    <article className="dashboard-classroom-summary-item">
                        <span className="summary-item-icon teacher">
                            <User size={16} />
                        </span>
                        <div>
                            <h3>Homeroom Teacher</h3>
                            <p>{profileCard.homeroomTeacher}</p>
                        </div>
                    </article>
                </div>
            </section>

            <div className="student-dashboard-grid dashboard-grid">
                <div className="dashboard-card card-full-width">
                    <div className="card-header">
                        <h2 className="card-title">
                            <BookOpen size={20} />
                            Assignments
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {assignmentTotal !== null && (
                                <span className="card-badge">{assignmentTotal} Pending</span>
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
                            const statusColors = isDarkTheme
                                ? {
                                    submitted: { bg: 'rgba(34, 197, 94, 0.2)', color: '#86efac', label: 'Submitted' },
                                    graded: { bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', label: 'Graded' },
                                    late: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', label: 'Late' },
                                    not_submitted: { bg: 'rgba(100, 116, 139, 0.22)', color: '#cbd5e1', label: 'Pending' },
                                }
                                : {
                                    submitted: { bg: '#dcfce7', color: '#166534', label: 'Submitted' },
                                    graded: { bg: '#dbeafe', color: '#1e40af', label: 'Graded' },
                                    late: { bg: '#fef3c7', color: '#92400e', label: 'Late' },
                                    not_submitted: { bg: '#f1f5f9', color: '#64748b', label: 'Pending' },
                                };
                            const sc = statusColors[assignment.status] || statusColors.not_submitted;
                            return (
                                <div
                                    key={assignment.id}
                                    className="assignment-item assignment-item-clickable"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openAssignmentInSubjects(assignment)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            openAssignmentInSubjects(assignment);
                                        }
                                    }}
                                >
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
                                    <div className="assignment-link-hint">Open in subject</div>
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
                            <div className="empty-state">No pending assignments.</div>
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

                    <div className="student-today-attendance">
                        <span className="student-today-attendance-label">Today Attendance</span>
                        <span className={`student-today-attendance-status ${todayAttendanceUi.tone}`}>
                            <Calendar size={13} />
                            {todayAttendanceUi.label}
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
                            const config = getNotifConfig(notification.notification_type, isDarkTheme);
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
                                        backgroundColor: config.rowBg,
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
