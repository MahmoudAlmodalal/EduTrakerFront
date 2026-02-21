import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, BellRing, Loader2, School, UserRound } from 'lucide-react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import guardianService from '../../services/guardianService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { todayIsoDate } from '../../utils/helpers';
import './Guardian.css';

const ALERT_META_BY_TYPE = {
    grade_posted: {
        label: 'Academic Result',
        tab: 'academic'
    },
    attendance_marked: {
        label: 'Attendance',
        tab: 'attendance'
    },
    behavior_logged: {
        label: 'Behavior',
        tab: 'behavior'
    }
};

const PRESENT_STATUSES = new Set(['present', 'late', 'excused']);

const normalizeList = (value) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (Array.isArray(value?.results)) {
        return value.results;
    }
    return [];
};

const resolveText = (t, key, fallback) => {
    const translated = t(key);
    return !translated || translated === key ? fallback : translated;
};

const toText = (value, fallback = 'Not assigned yet') => {
    const normalized = typeof value === 'string' ? value.trim() : value;
    return normalized ? normalized : fallback;
};

const parseStudentIdFromActionUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    try {
        const parsed = new URL(value, window.location.origin);
        const rawStudentId = parsed.searchParams.get('studentId') || parsed.searchParams.get('student_id');
        const studentId = Number.parseInt(rawStudentId || '', 10);
        return Number.isFinite(studentId) && studentId > 0 ? studentId : null;
    } catch {
        return null;
    }
};

const resolveTodayAttendance = ({ attendance = [], classroomName = '' }) => {
    const today = todayIsoDate();
    const classroomNormalized = String(classroomName || '').trim().toLowerCase();
    const todayRecords = attendance.filter((entry) => String(entry?.date || '').slice(0, 10) === today);

    if (todayRecords.length === 0) {
        return { label: 'Not recorded yet', tone: 'pending' };
    }

    const recordsInClassroom = classroomNormalized
        ? todayRecords.filter(
            (entry) => String(entry?.classroom_name || '').trim().toLowerCase() === classroomNormalized
        )
        : [];
    const records = recordsInClassroom.length > 0 ? recordsInClassroom : todayRecords;
    const statuses = records.map((entry) => String(entry?.status || '').toLowerCase().trim()).filter(Boolean);

    if (statuses.some((status) => PRESENT_STATUSES.has(status))) {
        return { label: 'Present', tone: 'present' };
    }

    if (statuses.length > 0 && statuses.every((status) => status === 'absent')) {
        return { label: 'Absent', tone: 'absent' };
    }

    if (statuses.length === 0) {
        return { label: 'Not recorded yet', tone: 'pending' };
    }

    const firstStatus = statuses[0];
    return {
        label: `${firstStatus.charAt(0).toUpperCase()}${firstStatus.slice(1)}`,
        tone: 'pending'
    };
};

const markNotificationReadInCache = (oldData, notificationId) => {
    const markRead = (item) => (item.id === notificationId ? { ...item, is_read: true } : item);

    if (Array.isArray(oldData)) {
        return oldData.map(markRead);
    }

    if (oldData && typeof oldData === 'object' && Array.isArray(oldData.results)) {
        return {
            ...oldData,
            results: oldData.results.map(markRead)
        };
    }

    return oldData;
};

const buildMonitoringPath = (notification) => {
    const typeMeta = ALERT_META_BY_TYPE[notification?.notification_type] || ALERT_META_BY_TYPE.grade_posted;
    const params = new URLSearchParams();
    params.set('tab', typeMeta.tab);

    const studentId = parseStudentIdFromActionUrl(notification?.action_url);
    if (studentId) {
        params.set('studentId', String(studentId));
    }

    return `/guardian/monitoring?${params.toString()}`;
};

const GuardianDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const guardianUserId = user?.id ?? user?.user_id;

    const childrenQueryKey = ['guardian', 'children', 'dashboard', guardianUserId];
    const notificationsQueryKey = ['guardian', 'notifications', 'dashboard', guardianUserId];

    const {
        data: linkedStudentsData,
        isLoading: childrenLoading,
        error: childrenError,
        refetch: refetchChildren
    } = useQuery({
        queryKey: childrenQueryKey,
        queryFn: ({ signal }) => guardianService.getLinkedStudents(guardianUserId, { signal }),
        enabled: Boolean(guardianUserId),
        staleTime: 0,
        refetchOnMount: 'always'
    });

    const {
        data: notificationsData,
        isLoading: notificationsLoading,
        error: notificationsError,
        refetch: refetchNotifications
    } = useQuery({
        queryKey: notificationsQueryKey,
        queryFn: () => notificationService.getNotifications({ is_read: false, page_size: 20 }),
        enabled: Boolean(guardianUserId),
        staleTime: 0,
        refetchOnMount: 'always'
    });

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId) => notificationService.markAsRead(notificationId),
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
            const previous = queryClient.getQueryData(notificationsQueryKey);
            queryClient.setQueryData(
                notificationsQueryKey,
                (oldData) => markNotificationReadInCache(oldData, notificationId)
            );
            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(notificationsQueryKey, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
        }
    });

    const children = useMemo(() => normalizeList(linkedStudentsData), [linkedStudentsData]);
    const attendanceQueries = useQueries({
        queries: children.map((child) => ({
            queryKey: ['guardian', 'dashboard', 'attendance', child.student_id],
            queryFn: ({ signal }) => guardianService.getStudentAttendance(child.student_id, { signal }),
            enabled: Boolean(child.student_id),
            staleTime: 30_000,
            refetchOnWindowFocus: false
        }))
    });

    const childrenCards = useMemo(() => {
        return children.map((child, index) => {
            const attendanceQuery = attendanceQueries[index];
            const attendance = normalizeList(attendanceQuery?.data);
            const todayAttendance = resolveTodayAttendance({
                attendance,
                classroomName: child.classroom_name
            });

            return {
                ...child,
                todayAttendance,
                attendanceLoading: Boolean(attendanceQuery?.isLoading || attendanceQuery?.isFetching)
            };
        });
    }, [attendanceQueries, children]);

    const childAlerts = useMemo(() => {
        const notifications = normalizeList(notificationsData);
        return notifications.filter(
            (notification) => !notification.is_read && Boolean(ALERT_META_BY_TYPE[notification?.notification_type])
        );
    }, [notificationsData]);

    const loading = childrenLoading || notificationsLoading;
    const error = childrenError || notificationsError;
    const retryText = resolveText(t, 'common.retry', 'Retry');
    const guardianName = user?.full_name || user?.name || resolveText(t, 'auth.role.guardian', 'Guardian');

    const handleOpenAlert = (notification) => {
        if (!notification?.id) {
            return;
        }

        markAsReadMutation.mutate(notification.id);
        navigate(buildMonitoringPath(notification));
    };

    if (loading) {
        return (
            <div className="guardian-dashboard-state">
                <Loader2 className="guardian-dashboard-spinner" size={40} />
                <p>{resolveText(t, 'common.loading', 'Loading dashboard...')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="guardian-dashboard">
                <h1 className="guardian-page-title">Welcome to your guardian dashboard</h1>
                <div className="guardian-card guardian-dashboard-error">
                    <div className="guardian-dashboard-error-text">
                        <AlertCircle size={20} />
                        <p>{error.message || resolveText(t, 'common.somethingWentWrong', 'Failed to load dashboard data.')}</p>
                    </div>
                    <button className="btn-primary" onClick={() => { refetchChildren(); refetchNotifications(); }}>
                        {retryText}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="guardian-dashboard guardian-dashboard-v2">
            <section className="guardian-card guardian-dashboard-simple-header">
                <h1 className="guardian-page-title guardian-dashboard-simple-title">Welcome to your guardian dashboard</h1>
                <p className="guardian-dashboard-simple-subtitle">
                    {`Hello ${guardianName.split(' ')[0]}. Here is today's attendance, classroom, and homeroom teacher for your children.`}
                </p>
            </section>

            <section className="guardian-card guardian-dashboard-student-section">
                <div className="guardian-dashboard-panel-header">
                    <h3>Your Children</h3>
                    <span>{childrenCards.length} linked</span>
                </div>

                <div className="guardian-dashboard-students-grid">
                    {childrenCards.map((child) => (
                        <article key={child.student_id} className="guardian-dashboard-child-card">
                            <div className="guardian-dashboard-child-top">
                                <div>
                                    <p className="guardian-dashboard-child-name">{child.student_name || `Student #${child.student_id}`}</p>
                                    <p className="guardian-dashboard-child-meta">{child.grade_name || 'Grade not assigned yet'}</p>
                                </div>
                                <span className={`guardian-dashboard-attendance-badge ${child.todayAttendance.tone}`}>
                                    {child.attendanceLoading ? 'Loading...' : child.todayAttendance.label}
                                </span>
                            </div>

                            <div className="guardian-dashboard-child-detail-list">
                                <div className="guardian-dashboard-child-detail-item">
                                    <School size={15} />
                                    <span>{toText(child.classroom_name)}</span>
                                </div>
                                <div className="guardian-dashboard-child-detail-item">
                                    <UserRound size={15} />
                                    <span>{toText(child.homeroom_teacher_name)}</span>
                                </div>
                            </div>

                            <div className="guardian-dashboard-child-actions">
                                <button
                                    type="button"
                                    className="guardian-quick-link-btn"
                                    onClick={() => navigate(`/guardian/monitoring?tab=attendance&studentId=${child.student_id}`)}
                                >
                                    <span>Attendance Details</span>
                                    <ArrowRight size={14} />
                                </button>
                                <button
                                    type="button"
                                    className="guardian-quick-link-btn"
                                    onClick={() => navigate(`/guardian/monitoring?tab=academic&studentId=${child.student_id}`)}
                                >
                                    <span>Academic Overview</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </article>
                    ))}

                    {childrenCards.length === 0 && (
                        <div className="guardian-dashboard-empty">{resolveText(t, 'noData', 'No data available.')}</div>
                    )}
                </div>
            </section>

            <section className="guardian-card guardian-dashboard-alert-section">
                <div className="guardian-dashboard-panel-header">
                    <h3>Children Alerts</h3>
                    <span>{childAlerts.length} unread</span>
                </div>

                <div className="guardian-dashboard-alert-list">
                    {childAlerts.map((notification) => {
                        const alertMeta = ALERT_META_BY_TYPE[notification.notification_type];
                        return (
                            <button
                                key={notification.id}
                                type="button"
                                className="guardian-dashboard-alert-item"
                                onClick={() => handleOpenAlert(notification)}
                                disabled={markAsReadMutation.isPending}
                            >
                                <div className="guardian-dashboard-alert-copy">
                                    <p className="guardian-dashboard-alert-title">{notification.title || 'Child update'}</p>
                                    <p className="guardian-dashboard-alert-message">{notification.message || 'Open alert details.'}</p>
                                </div>
                                <div className="guardian-dashboard-alert-side">
                                    <span className="guardian-dashboard-alert-tag">
                                        <BellRing size={12} />
                                        <span>{alertMeta?.label || 'Alert'}</span>
                                    </span>
                                    <ArrowRight size={14} />
                                </div>
                            </button>
                        );
                    })}

                    {childAlerts.length === 0 && (
                        <div className="guardian-dashboard-empty">No unread child alerts right now.</div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default GuardianDashboard;
