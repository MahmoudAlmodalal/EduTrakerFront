import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronRight,
    Clock,
    FileText,
    Hourglass,
    MessageSquare,
    Plus,
    RefreshCw,
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
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const INITIAL_STATS = {
    totalStudents: 0,
    pendingStudents: 0,
    unreadMessages: 0,
    absentToday: 0,
    schoolName: '',
};

const formatDateParamUTC = (value) => {
    const date = new Date(value);
    return date.toISOString().split('T')[0];
};

const getStartOfWeekUTC = (value) => {
    const source = new Date(value);
    const date = new Date(Date.UTC(
        source.getUTCFullYear(),
        source.getUTCMonth(),
        source.getUTCDate()
    ));
    const day = date.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + diffToMonday);
    return date;
};

const getWeekRange = (weekKey = 'current-week') => {
    const startDate = getStartOfWeekUTC(new Date());
    if (weekKey === 'last-week') {
        startDate.setUTCDate(startDate.getUTCDate() - 7);
    }

    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 4);

    return {
        startDate,
        dateFrom: formatDateParamUTC(startDate),
        dateTo: formatDateParamUTC(endDate),
    };
};

const normalizeAttendanceStatus = (status) => {
    return String(status || '').trim().toLowerCase();
};

const toSafeNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
};

const resolveSchoolId = (user) => {
    if (!user) {
        return null;
    }

    const school = user.school;
    const candidate = user.school_id ?? school?.id ?? school;

    if (candidate === null || candidate === undefined || candidate === '') {
        return null;
    }

    if (typeof candidate === 'object') {
        return null;
    }

    const normalized = Number.parseInt(String(candidate).trim(), 10);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
};

const getListCount = (payload) => {
    const countValue = Number(payload?.count);
    if (Number.isFinite(countValue)) {
        return countValue;
    }

    if (Array.isArray(payload?.results)) {
        return payload.results.length;
    }

    if (Array.isArray(payload)) {
        return payload.length;
    }

    return 0;
};

const getFirstListItem = (payload) => {
    if (Array.isArray(payload?.results) && payload.results.length > 0) {
        return payload.results[0];
    }

    if (Array.isArray(payload) && payload.length > 0) {
        return payload[0];
    }

    return null;
};

const getPersonName = (value) => {
    if (!value || typeof value !== 'object') {
        return '';
    }

    const directName = String(
        value.full_name
        || value.student_name
        || value.name
        || ''
    ).trim();

    if (directName) {
        return directName;
    }

    const firstName = String(value.first_name || '').trim();
    const lastName = String(value.last_name || '').trim();
    const merged = `${firstName} ${lastName}`.trim();
    if (merged) {
        return merged;
    }

    return String(value.email || '').trim();
};

const withTimeout = (promise, timeoutMs, timeoutMessage = 'Request timed out.') => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
};

const getDashboardSnapshotKey = (user) => {
    const userId = user?.id ?? user?.user_id ?? user?.email ?? 'anonymous';
    return `secretary_dashboard_snapshot:${String(userId)}`;
};

const readDashboardSnapshot = (user) => {
    if (!user || typeof window === 'undefined') {
        return null;
    }

    try {
        const rawValue = window.sessionStorage.getItem(getDashboardSnapshotKey(user));
        if (!rawValue) {
            return null;
        }
        const parsedValue = JSON.parse(rawValue);
        return parsedValue && typeof parsedValue === 'object' ? parsedValue : null;
    } catch {
        return null;
    }
};

const writeDashboardSnapshot = (user, payload) => {
    if (!user || typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(getDashboardSnapshotKey(user), JSON.stringify(payload));
    } catch {
        // Ignore storage quota/security errors.
    }
};

const SecretaryDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(INITIAL_STATS);
    const [recentApplications, setRecentApplications] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState('current-week');
    const [weeklyAttendanceRecords, setWeeklyAttendanceRecords] = useState([]);
    const [trendLoading, setTrendLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [pendingStudentMeta, setPendingStudentMeta] = useState({
        name: '',
        source: '',
    });
    const isMountedRef = useRef(true);
    const initialFetchDoneRef = useRef(false);
    const hasLoadedStatsRef = useRef(false);

    useEffect(() => {
        // In React StrictMode (dev), effects mount/cleanup/mount once.
        // Reset on setup so the temporary cleanup does not leave this false forever.
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        const snapshot = readDashboardSnapshot(user);
        if (!snapshot) {
            return;
        }

        const snapshotStats = snapshot?.stats;
        if (snapshotStats && typeof snapshotStats === 'object') {
            setStats((previous) => ({ ...previous, ...snapshotStats }));
            setStatsLoading(false);
            hasLoadedStatsRef.current = true;
        }

        if (Array.isArray(snapshot?.recentApplications)) {
            setRecentApplications(snapshot.recentApplications.slice(0, 5));
        }

        if (Array.isArray(snapshot?.academicYears)) {
            setAcademicYears(snapshot.academicYears);
        }

        if (snapshot?.lastUpdated) {
            const parsedDate = new Date(snapshot.lastUpdated);
            if (!Number.isNaN(parsedDate.getTime())) {
                setLastUpdated(parsedDate);
            }
        }

        if (snapshot?.pendingStudentMeta && typeof snapshot.pendingStudentMeta === 'object') {
            setPendingStudentMeta({
                name: String(snapshot.pendingStudentMeta.name || ''),
                source: String(snapshot.pendingStudentMeta.source || ''),
            });
        }
    }, [user?.id, user?.email]);

    const fetchDashboardData = useCallback(async ({ forceRefresh = false } = {}) => {
        if (!user) {
            return;
        }

        setStatsLoading(!hasLoadedStatsRef.current);

        const schoolId = resolveSchoolId(user);

        let snapshotStats = null;
        let snapshotApplications = [];
        let snapshotAcademicYears = [];
        let snapshotPendingStudentMeta = {
            name: '',
            source: '',
        };

        try {
            const statsPromise = withTimeout(
                secretaryService.getSecretaryDashboardStats({ forceRefresh })
                    .catch(() => secretaryService.getDashboardStats()),
                6000,
                'Dashboard statistics request timed out.'
            );

            let normalizedStats = {};
            try {
                const statsPayload = await statsPromise;
                normalizedStats = statsPayload?.statistics || statsPayload || {};
            } catch (error) {
                console.error('Error fetching secretary dashboard stats:', error);
            }

            if (!isMountedRef.current) {
                return;
            }

            const pendingFromStats = (
                normalizedStats.pending_students
                ?? normalizedStats.pending_enrollments
                ?? normalizedStats.pending_applications
            );

            const nextStats = {
                totalStudents: toSafeNumber(normalizedStats.total_students),
                pendingStudents: toSafeNumber(pendingFromStats),
                unreadMessages: toSafeNumber(normalizedStats.unread_messages),
                absentToday: toSafeNumber(normalizedStats.absent_today),
                schoolName: normalizedStats.school_name || 'My School',
            };
            snapshotStats = nextStats;
            setStats(nextStats);
            hasLoadedStatsRef.current = true;
            setStatsLoading(false);
            setPendingStudentMeta({
                name: '',
                source: 'secretary/dashboard-stats endpoint',
            });
            snapshotPendingStudentMeta = {
                name: '',
                source: 'secretary/dashboard-stats endpoint',
            };

            const [applicationsResult, yearsResult] = await Promise.allSettled([
                secretaryService.getApplications({
                    page: 1,
                    status: 'pending',
                    ...(schoolId ? { school_id: schoolId } : {}),
                }),
                secretaryService.getAcademicYears(
                    schoolId ? { school_id: schoolId } : {}
                ),
            ]);

            if (!isMountedRef.current) {
                return;
            }

            if (applicationsResult.status === 'fulfilled') {
                const applicationsPayload = applicationsResult.value || {};
                const pendingApplicationsCount = getListCount(applicationsPayload);
                const applicationList = Array.isArray(applicationsPayload?.results)
                    ? applicationsPayload.results
                    : (Array.isArray(applicationsPayload) ? applicationsPayload : []);
                snapshotApplications = applicationList.slice(0, 5);
                setRecentApplications(snapshotApplications);
                const firstPendingApplication = getFirstListItem(applicationsPayload);
                const pendingApplicationName = getPersonName(firstPendingApplication);

                setStats((previous) => ({
                    ...previous,
                    pendingStudents: toSafeNumber(pendingApplicationsCount),
                }));
                setPendingStudentMeta({
                    name: pendingApplicationName,
                    source: 'secretary/admissions endpoint',
                });

                snapshotPendingStudentMeta = {
                    name: pendingApplicationName,
                    source: 'secretary/admissions endpoint',
                };
                if (snapshotStats) {
                    snapshotStats = {
                        ...snapshotStats,
                        pendingStudents: toSafeNumber(pendingApplicationsCount),
                    };
                }
            } else {
                console.error('Error fetching recent applications:', applicationsResult.reason);
                setRecentApplications([]);
            }

            if (yearsResult.status === 'fulfilled') {
                snapshotAcademicYears = yearsResult.value?.results || yearsResult.value || [];
                setAcademicYears(snapshotAcademicYears);
            } else {
                console.error('Error fetching academic years:', yearsResult.reason);
                setAcademicYears([]);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            if (isMountedRef.current) {
                setStatsLoading(false);
                const updatedAt = new Date();
                setLastUpdated(updatedAt);
                if (snapshotStats) {
                    writeDashboardSnapshot(user, {
                        stats: snapshotStats,
                        recentApplications: snapshotApplications,
                        academicYears: snapshotAcademicYears,
                        pendingStudentMeta: snapshotPendingStudentMeta,
                        lastUpdated: updatedAt.toISOString(),
                    });
                }
            }
        }
    }, [user]);

    useEffect(() => {
        initialFetchDoneRef.current = false;
        hasLoadedStatsRef.current = false;
        setPendingStudentMeta({
            name: '',
            source: '',
        });
    }, [user?.id, user?.email, user?.role]);

    useEffect(() => {
        const forceRefresh = false;
        initialFetchDoneRef.current = true;
        fetchDashboardData({ forceRefresh });
    }, [fetchDashboardData]);

    const weekRange = useMemo(() => getWeekRange(selectedWeek), [selectedWeek]);

    useEffect(() => {
        let isMounted = true;

        const fetchAttendanceTrend = async () => {
            try {
                setTrendLoading(true);
                const attendancePayload = await secretaryService.getAttendance({
                    date_from: weekRange.dateFrom,
                    date_to: weekRange.dateTo,
                    page_size: 200,
                });
                const records = attendancePayload?.results || attendancePayload || [];

                if (!isMounted) {
                    return;
                }

                setWeeklyAttendanceRecords(Array.isArray(records) ? records : []);
            } catch (error) {
                console.error('Error fetching attendance trend:', error);
                if (isMounted) {
                    setWeeklyAttendanceRecords([]);
                }
            } finally {
                if (isMounted) {
                    setTrendLoading(false);
                }
            }
        };

        fetchAttendanceTrend();

        return () => {
            isMounted = false;
        };
    }, [weekRange.dateFrom, weekRange.dateTo]);

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
        const attendanceByDate = new Map();

        weeklyAttendanceRecords.forEach((record) => {
            const dayKey = typeof record?.date === 'string' ? record.date : '';
            if (!dayKey) {
                return;
            }

            const studentKey = String(record.student_id || record.id);
            const status = normalizeAttendanceStatus(record.status);
            if (!status) {
                return;
            }
            const attended = status !== 'absent';

            if (!attendanceByDate.has(dayKey)) {
                attendanceByDate.set(dayKey, new Map());
            }

            const studentsForDay = attendanceByDate.get(dayKey);
            studentsForDay.set(studentKey, (studentsForDay.get(studentKey) || false) || attended);
        });

        return WEEKDAY_LABELS.map((label, index) => {
            const dayDate = new Date(weekRange.startDate);
            dayDate.setUTCDate(dayDate.getUTCDate() + index);
            const dayKey = formatDateParamUTC(dayDate);
            const studentsForDay = attendanceByDate.get(dayKey);
            const count = studentsForDay
                ? Array.from(studentsForDay.values()).filter(Boolean).length
                : 0;

            return { name: label, count };
        });
    }, [weekRange.startDate, weeklyAttendanceRecords]);

    const statCards = useMemo(() => {
        const attendanceRate = stats.totalStudents > 0
            ? Math.round(((stats.totalStudents - stats.absentToday) / stats.totalStudents) * 100)
            : 0;
        const pendingCardDescription = stats.pendingStudents > 0
            ? (
                pendingStudentMeta.name
                    ? `Student: ${pendingStudentMeta.name} | Fetched from: ${pendingStudentMeta.source || 'unknown source'}`
                    : `Fetched from: ${pendingStudentMeta.source || 'unknown source'}`
            )
            : 'No pending students';

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
                title: t('secretary.dashboard.pendingStudents') || 'Pending Students',
                value: stats.pendingStudents.toLocaleString(),
                icon: Hourglass,
                color: 'purple',
                description: pendingCardDescription,
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
    }, [stats.totalStudents, stats.pendingStudents, stats.unreadMessages, stats.absentToday, pendingStudentMeta.name, pendingStudentMeta.source, t]);

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
        const updatedLabel = lastUpdated
            ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : 'N/A';

        return (
            <div className="sec-header-actions">
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => fetchDashboardData({ forceRefresh: true })}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
                <button className="btn-primary" onClick={() => handleNavigate('/secretary/admissions')}>
                    <Plus size={18} />
                    New Admission
                </button>
                <span className="sec-header-updated">Updated {updatedLabel}</span>
            </div>
        );
    }, [fetchDashboardData, handleNavigate, lastUpdated]);

    const firstName = user?.displayName?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Secretary';

    return (
        <div className="secretary-dashboard">
            <PageHeader
                title={`Welcome back, ${firstName}!`}
                subtitle={`${stats.schoolName} - Secretary Control Panel`}
                action={headerAction}
            />

            <section className="sec-stats-grid">
                {statsLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <article key={`sec-stat-skeleton-${index}`} className="stat-card sec-stat-card sec-stat-skeleton">
                            <div className="sec-stat-skeleton-line"></div>
                            <div className="sec-stat-skeleton-value"></div>
                            <div className="sec-stat-skeleton-line short"></div>
                        </article>
                    ))
                ) : (
                    statCards.map((stat) => (
                        <StatCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                            description={stat.description}
                            trend={stat.trend}
                            trendUp={stat.trendUp}
                        />
                    ))
                )}
            </section>

            <section className="secretary-dashboard-main-grid">
                <article className="sec-card sec-chart-card">
                    <div className="sec-chart-header">
                        <div>
                            <h3>Weekly Attendance Trend</h3>
                            <p>
                                Student attendance tracking for the
                                {' '}
                                {selectedWeek === 'last-week' ? 'previous week' : 'current week'}
                            </p>
                        </div>
                        <select
                            className="form-select sec-chart-select"
                            value={selectedWeek}
                            onChange={(event) => setSelectedWeek(event.target.value)}
                        >
                            <option value="current-week">Current Week</option>
                            <option value="last-week">Last Week</option>
                        </select>
                    </div>
                    {trendLoading ? (
                        <LoadingSpinner message="Loading attendance trend..." />
                    ) : (
                        <Suspense fallback={<LoadingSpinner message="Loading chart..." />}>
                            <AttendanceTrendChart trendData={trendData} />
                        </Suspense>
                    )}
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
                                            <AvatarInitial name={application.student_name || application.full_name || 'Student'} color="indigo" />
                                            <div>
                                                <p>{application.student_name || application.full_name || 'Student'}</p>
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
