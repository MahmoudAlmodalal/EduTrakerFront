import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    ClipboardCheck,
    GraduationCap,
    Plus,
    Users
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
    useMarkAllTeacherNotificationsRead,
    useMarkTeacherNotificationRead,
    useTeacherDashboardStats,
    useTeacherNotifications,
    useTeacherSchedule,
    useHomeroomAttendanceSummary
} from '../../hooks/useTeacherQueries';
import { toList, todayIsoDate } from '../../utils/helpers';
import './Teacher.css';

const cardPalette = [
    { bgColor: '#dbeafe', iconColor: '#2563eb' },
    { bgColor: '#dcfce7', iconColor: '#16a34a' },
    { bgColor: '#ffedd5', iconColor: '#ea580c' },
    { bgColor: '#ede9fe', iconColor: '#7c3aed' },
    { bgColor: '#ccfbf1', iconColor: '#0f766e' }
];

const SkeletonBlock = ({ height = '80px' }) => (
    <div
        style={{
            width: '100%',
            height,
            borderRadius: '0.75rem',
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%)',
            backgroundSize: '400% 100%',
            animation: 'shimmer 1.2s ease infinite'
        }}
    />
);

const QuickAction = ({ icon, title, subtitle, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="teacher-quick-action"
    >
        <div className="teacher-quick-action-icon">
            {React.createElement(icon, { size: 18 })}
        </div>
        <div className="teacher-quick-action-copy">
            <div className="teacher-quick-action-title">{title}</div>
            <div className="teacher-quick-action-subtitle">{subtitle}</div>
        </div>
    </button>
);

const TeacherDashboard = () => {
    const { t } = useTheme();
    const navigate = useNavigate();
    const date = todayIsoDate();

    const {
        data: statsData,
        isLoading: loadingStats,
        isError: hasStatsError,
        refetch: refetchStats
    } = useTeacherDashboardStats();

    const {
        data: scheduleData,
        isLoading: loadingSchedule,
        isError: hasScheduleError,
        refetch: refetchSchedule
    } = useTeacherSchedule(date);

    const {
        data: notificationsData,
        isLoading: loadingNotifications,
        isError: hasNotificationsError,
        refetch: refetchNotifications
    } = useTeacherNotifications({ page_size: 5 });

    const {
        data: homeroomData,
        isLoading: loadingHomeroom
    } = useHomeroomAttendanceSummary(date);

    const markAllReadMutation = useMarkAllTeacherNotificationsRead();
    const markNotificationReadMutation = useMarkTeacherNotificationRead();

    const stats = useMemo(() => statsData?.statistics || {}, [statsData]);
    const schedule = useMemo(() => toList(scheduleData), [scheduleData]);
    const notifications = useMemo(() => toList(notificationsData), [notificationsData]);
    const homeroom = useMemo(() => homeroomData || null, [homeroomData]);

    const homeroomStudentCount = stats.homeroom_classroom?.total_students ?? stats.total_students ?? 0;
    const homeroomClassroomName = stats.homeroom_classroom?.name ?? null;

    const dashboardCards = useMemo(() => ([
        {
            label: homeroomClassroomName ? `Homeroom: ${homeroomClassroomName}` : 'Total Students',
            value: homeroomStudentCount,
            icon: Users
        },
        {
            label: 'Active Classes Today',
            value: schedule.length,
            icon: GraduationCap
        },
        {
            label: 'Pending Assignments',
            value: stats.pending_assignments_count ?? 0,
            icon: ClipboardCheck
        },
        {
            label: 'Average Attendance %',
            value: `${Math.round(Number(stats.average_attendance || 0))}%`,
            icon: CheckCircle2
        },
        {
            label: 'Lesson Plans (This Week)',
            value: stats.lesson_plans_this_week
                ?? stats.weekly_lesson_plans
                ?? stats.lesson_plan_count
                ?? 0,
            icon: BookOpen
        }
    ]), [schedule.length, stats, homeroomStudentCount, homeroomClassroomName]);

    const hasAnyError = hasStatsError || hasScheduleError || hasNotificationsError;

    const unreadCount = notifications.filter((notification) => !notification.is_read).length;

    const handleRetry = useCallback(() => {
        refetchStats();
        refetchSchedule();
        refetchNotifications();
    }, [refetchNotifications, refetchSchedule, refetchStats]);

    const handleMarkAllNotificationsRead = useCallback(() => {
        markAllReadMutation.mutate();
    }, [markAllReadMutation]);

    const handleNotificationClick = useCallback(async (notification) => {
        if (!notification.is_read) {
            await markNotificationReadMutation.mutateAsync(notification.id);
        }

        if (notification.action_url) {
            navigate(notification.action_url);
        }
    }, [markNotificationReadMutation, navigate]);

    return (
        <div className="teacher-page">
            <style>
                {`@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }`}
            </style>

            <div className="teacher-header">
                <div>
                    <h1 className="teacher-title">{t('teacher.dashboard.title') || 'Teacher Dashboard'}</h1>
                    <p className="teacher-subtitle">
                        {t('teacher.dashboard.subtitle') || 'Daily overview of classes, assignments, attendance, and notifications.'}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => navigate('/teacher/assessments?tab=create')}
                        style={{ borderRadius: '0.75rem' }}
                    >
                        <Plus size={16} />
                        Create Assignment
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/teacher/communication', { state: { activeTab: 'notifications' } })}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-surface)',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        aria-label="Open notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    minWidth: '16px',
                                    height: '16px',
                                    borderRadius: '999px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 4px'
                                }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {hasAnyError && (
                <div className="management-card" style={{ padding: '1rem', border: '1px solid #fecaca', background: '#fef2f2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, color: '#991b1b', fontWeight: 600 }}>
                            Failed to load some dashboard data.
                        </p>
                        <button type="button" className="btn-primary" onClick={handleRetry}>
                            Retry
                        </button>
                    </div>
                </div>
            )}

            <div className="teacher-stats-grid">
                {(loadingStats ? Array.from({ length: 5 }) : dashboardCards).map((card, index) => {
                    if (loadingStats) {
                        return (
                            <div key={`skeleton-${index}`} className="management-card" style={{ padding: '1rem' }}>
                                <SkeletonBlock height="120px" />
                            </div>
                        );
                    }

                    const Icon = card.icon;
                    const palette = cardPalette[index % cardPalette.length];

                    return (
                        <div key={card.label} className="management-card" style={{ padding: '1.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div
                                    style={{
                                        width: '46px',
                                        height: '46px',
                                        borderRadius: '12px',
                                        background: palette.bgColor,
                                        color: palette.iconColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Icon size={22} />
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                                    {card.value}
                                </div>
                                <div style={{ marginTop: '0.25rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                                    {card.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Homeroom Attendance Summary */}
            {(loadingHomeroom || homeroom) && (
                <div className="management-card" style={{ marginBottom: '1rem' }}>
                    <div
                        style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Users size={18} style={{ color: 'var(--color-primary)' }} />
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>
                            Homeroom Attendance Today
                            {homeroom?.classroom && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.82rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                                    — {homeroom.classroom.name}
                                </span>
                            )}
                        </h3>
                    </div>
                    <div style={{ padding: '1rem 1.25rem' }}>
                        {loadingHomeroom ? (
                            <SkeletonBlock height="64px" />
                        ) : homeroom?.summary ? (
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {[
                                    { label: 'Present', key: 'present', color: '#16a34a', bg: '#dcfce7' },
                                    { label: 'Absent', key: 'absent', color: '#dc2626', bg: '#fee2e2' },
                                    { label: 'Late', key: 'late', color: '#d97706', bg: '#fef3c7' },
                                    { label: 'Excused', key: 'excused', color: '#7c3aed', bg: '#ede9fe' },
                                    { label: 'Not Recorded', key: 'not_recorded', color: '#64748b', bg: '#f1f5f9' },
                                ].map(({ label, key, color, bg }) => (
                                    homeroom.summary[key] > 0 && (
                                        <div
                                            key={key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.45rem',
                                                padding: '0.4rem 0.85rem',
                                                borderRadius: '999px',
                                                background: bg,
                                                color,
                                                fontWeight: 700,
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.05rem' }}>{homeroom.summary[key]}</span>
                                            <span style={{ fontWeight: 500 }}>{label}</span>
                                        </div>
                                    )
                                ))}
                                <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                    {homeroom.summary.recorded} / {homeroom.summary.total} recorded
                                </span>
                            </div>
                        ) : (
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                No homeroom classroom assigned.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="teacher-split-grid">
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div className="management-card">
                        <div
                            style={{
                                padding: '1rem 1.25rem',
                                borderBottom: '1px solid var(--color-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.75rem',
                                flexWrap: 'wrap'
                            }}
                        >
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                <Clock size={18} style={{ color: 'var(--color-primary)' }} />
                                Today's Schedule
                            </h3>
                            <button
                                type="button"
                                onClick={() => navigate('/teacher/classes')}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--color-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                View classes
                            </button>
                        </div>

                        <div style={{ padding: '1rem 1.25rem' }}>
                            {loadingSchedule ? (
                                <div style={{ display: 'grid', gap: '0.7rem' }}>
                                    <SkeletonBlock height="76px" />
                                    <SkeletonBlock height="76px" />
                                    <SkeletonBlock height="76px" />
                                </div>
                            ) : schedule.length === 0 ? (
                                <div
                                    style={{
                                        minHeight: '180px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        color: 'var(--color-text-muted)',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Calendar size={38} style={{ opacity: 0.25, marginBottom: '0.5rem' }} />
                                    <p style={{ margin: 0 }}>No classes scheduled for today.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.7rem' }}>
                                    {schedule.map((slot) => (
                                        <div
                                            key={slot.id}
                                            style={{
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '0.85rem',
                                                padding: '0.85rem 0.95rem',
                                                display: 'grid',
                                                gridTemplateColumns: '110px 1fr',
                                                gap: '0.85rem',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    borderRadius: '0.65rem',
                                                    background: 'var(--color-bg-body)',
                                                    border: '1px solid var(--color-border)',
                                                    padding: '0.45rem 0.55rem',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                                                    {slot.time || slot.time_slot || 'TBD'}
                                                </div>
                                            </div>

                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                                                    {slot.course_name || slot.subject || 'Class'}
                                                </div>
                                                <div style={{ marginTop: '2px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                    Room: {slot.room || slot.classroom_name || slot.class || 'TBD'}
                                                </div>
                                                <div style={{ marginTop: '2px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                                    Grade: {slot.grade_level || slot.grade || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="management-card" style={{ padding: '1rem 1.25rem' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '0.85rem', fontSize: '1rem' }}>Quick Actions</h3>
                        <div style={{ display: 'grid', gap: '0.65rem' }}>
                            <QuickAction
                                icon={Plus}
                                title={t('teacher.dashboard.createAssessment') || 'Create Assessment'}
                                subtitle="Add a new assignment or quiz"
                                onClick={() => navigate('/teacher/assessments?tab=create')}
                            />
                            <QuickAction
                                icon={ClipboardCheck}
                                title={t('teacher.dashboard.recordAttendance') || 'Record Attendance'}
                                subtitle="Open class attendance panel"
                                onClick={() => navigate('/teacher/classes')}
                            />
                            <QuickAction
                                icon={Bell}
                                title={t('teacher.dashboard.notifications') || 'Message Center'}
                                subtitle="Open communication and notifications"
                                onClick={() => navigate('/teacher/communication')}
                            />
                        </div>
                    </div>
                </div>

                <div className="management-card">
                    <div
                        style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Bell size={18} style={{ color: 'var(--color-primary)' }} />
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllNotificationsRead}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--color-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {markAllReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                            </button>
                        )}
                    </div>

                    <div>
                        {loadingNotifications ? (
                            <div style={{ padding: '1rem', display: 'grid', gap: '0.7rem' }}>
                                <SkeletonBlock height="72px" />
                                <SkeletonBlock height="72px" />
                                <SkeletonBlock height="72px" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No new notifications.
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() => handleNotificationClick(notification)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        border: 'none',
                                        borderBottom: '1px solid var(--color-border)',
                                        background: notification.is_read
                                            ? 'transparent'
                                            : 'rgba(var(--color-primary-rgb), 0.03)',
                                        padding: '1rem 1.1rem',
                                        display: 'flex',
                                        gap: '0.8rem',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {!notification.is_read && (
                                        <span
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
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'var(--color-bg-body)',
                                            display: 'grid',
                                            placeItems: 'center',
                                            color: 'var(--color-primary)',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Bell size={19} />
                                    </div>

                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: notification.is_read ? 600 : 700 }}>
                                                {notification.title || 'System Notification'}
                                            </h4>
                                        </div>
                                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                            {notification.message || notification.content}
                                        </p>
                                        <span style={{ marginTop: '4px', fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
