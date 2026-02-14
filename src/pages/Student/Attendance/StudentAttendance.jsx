import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Filter,
    CalendarDays,
    AlertTriangle,
    RefreshCw,
    Search
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useStudentData } from '../../../context/StudentDataContext';
import studentService from '../../../services/studentService';
import '../Student.css';

const ATTENDANCE_STATUS_CONFIGS = {
    present: { icon: CheckCircle, bg: '#dcfce7', color: '#16a34a', label: 'Present' },
    absent: { icon: XCircle, bg: '#fef2f2', color: '#dc2626', label: 'Absent' },
    late: { icon: Clock, bg: '#fef3c7', color: '#d97706', label: 'Late' },
    excused: { icon: AlertCircle, bg: '#e0f2fe', color: '#0891b2', label: 'Excused' }
};

const ATTENDANCE_FILTER_OPTIONS = [
    { key: 'all', translationKey: 'student.attendance.all', fallbackLabel: 'All' },
    { key: 'present', translationKey: 'student.attendance.present', fallbackLabel: 'Present' },
    { key: 'absent', translationKey: 'student.attendance.absent', fallbackLabel: 'Absent' },
    { key: 'late', translationKey: 'student.attendance.late', fallbackLabel: 'Late' },
    { key: 'excused', translationKey: 'student.attendance.excused', fallbackLabel: 'Excused' }
];

const ATTENDANCE_RING_CIRCUMFERENCE = 251;

const resolveText = (value, fallbackKey, fallbackText) => {
    if (!value || value === fallbackKey) {
        return fallbackText;
    }
    return value;
};

const toSafeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseDateValue = (value) => {
    if (!value) {
        return null;
    }
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const normalizeStatus = (status) => {
    if (typeof status !== 'string') {
        return 'present';
    }
    const normalizedStatus = status.toLowerCase();
    return ATTENDANCE_STATUS_CONFIGS[normalizedStatus] ? normalizedStatus : 'present';
};

const normalizeAttendanceRecords = (records) => {
    if (!Array.isArray(records)) {
        return [];
    }

    return records
        .map((record, index) => {
            const attendanceDate = parseDateValue(record?.date) || parseDateValue(record?.created_at);
            const createdAt = parseDateValue(record?.created_at);
            const sortTimestamp = (attendanceDate || createdAt)?.getTime() || 0;

            return {
                id: record?.id ?? `${record?.date || record?.created_at || 'attendance'}-${index}`,
                subject: record?.course_name || 'Subject',
                statusKey: normalizeStatus(record?.status),
                attendanceDate,
                createdAt,
                sortTimestamp
            };
        })
        .sort((left, right) => right.sortTimestamp - left.sortTimestamp);
};

const getMonthBucketKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const StudentAttendance = () => {
    const { t, language } = useTheme();
    const { user } = useAuth();
    const {
        dashboardData,
        loading: dashboardLoading,
        error: dashboardError,
        refreshData
    } = useStudentData();
    const [filterStatus, setFilterStatus] = useState('all');
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const latestFetchId = useRef(0);

    const locale = language === 'ar' ? 'ar' : 'en-US';

    const text = useCallback((translationKey, fallback) => (
        resolveText(t(translationKey), translationKey, fallback)
    ), [t]);

    const fetchAttendanceHistory = useCallback(async () => {
        const fetchId = ++latestFetchId.current;

        if (!user?.id) {
            setAttendanceHistory([]);
            setHistoryLoading(false);
            setHistoryError(null);
            return;
        }

        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const attendanceRes = await studentService.getAttendance();
            if (fetchId !== latestFetchId.current) {
                return;
            }
            const records = Array.isArray(attendanceRes?.results)
                ? attendanceRes.results
                : Array.isArray(attendanceRes)
                    ? attendanceRes
                    : [];
            setAttendanceHistory(normalizeAttendanceRecords(records));
        } catch (err) {
            if (fetchId !== latestFetchId.current) {
                return;
            }
            console.error('Error fetching attendance history:', err);
            setAttendanceHistory([]);
            setHistoryError(text(
                'student.attendance.historyError',
                'Failed to load attendance records. Please try again.'
            ));
        } finally {
            if (fetchId === latestFetchId.current) {
                setHistoryLoading(false);
            }
        }
    }, [text, user?.id]);

    useEffect(() => {
        void fetchAttendanceHistory();
        return () => {
            latestFetchId.current += 1;
        };
    }, [fetchAttendanceHistory]);

    const stats = useMemo(() => {
        const attendanceSummary = dashboardData?.attendance || {};
        const byStatus = attendanceSummary.by_status || {};
        const rawRate = toSafeNumber(attendanceSummary.attendance_rate);

        return {
            present: toSafeNumber(byStatus.present),
            absent: toSafeNumber(byStatus.absent),
            late: toSafeNumber(byStatus.late),
            excused: toSafeNumber(byStatus.excused),
            totalDays: toSafeNumber(attendanceSummary.total_records),
            attendanceRate: clamp(rawRate, 0, 100)
        };
    }, [dashboardData]);

    const monthlyData = useMemo(() => {
        if (!attendanceHistory.length) {
            return [];
        }

        const monthlyBuckets = new Map();

        attendanceHistory.forEach((record) => {
            if (!record.attendanceDate) {
                return;
            }

            const monthKey = getMonthBucketKey(record.attendanceDate);
            const existingBucket = monthlyBuckets.get(monthKey) || {
                key: monthKey,
                month: record.attendanceDate.toLocaleDateString(locale, { month: 'short' }),
                present: 0,
                total: 0
            };

            existingBucket.total += 1;
            if (record.statusKey === 'present' || record.statusKey === 'late') {
                existingBucket.present += 1;
            }

            monthlyBuckets.set(monthKey, existingBucket);
        });

        return Array.from(monthlyBuckets.values())
            .sort((left, right) => left.key.localeCompare(right.key))
            .slice(-6)
            .map((bucket) => ({
                ...bucket,
                rate: bucket.total > 0 ? Math.round((bucket.present / bucket.total) * 100) : 0
            }));
    }, [attendanceHistory, locale]);

    const filteredHistory = useMemo(() => {
        if (filterStatus === 'all') {
            return attendanceHistory;
        }
        return attendanceHistory.filter((record) => record.statusKey === filterStatus);
    }, [attendanceHistory, filterStatus]);

    const dashboardErrorText = text(
        'student.dashboard.error',
        'Failed to load dashboard data. Please try again.'
    );

    const attendanceRingColor = stats.attendanceRate >= 90
        ? '#10b981'
        : stats.attendanceRate >= 75
            ? '#f59e0b'
            : '#ef4444';
    const attendanceRingDasharray = `${(stats.attendanceRate / 100) * ATTENDANCE_RING_CIRCUMFERENCE} ${ATTENDANCE_RING_CIRCUMFERENCE}`;
    const historyCardClassName = `attendance-card history-table${monthlyData.length === 0 ? ' full-width' : ''}`;
    const getStatusBadge = (statusKey) => {
        const config = ATTENDANCE_STATUS_CONFIGS[statusKey] || ATTENDANCE_STATUS_CONFIGS.present;
        const Icon = config.icon;
        const statusTranslationKey = ATTENDANCE_STATUS_CONFIGS[statusKey] ? statusKey : 'present';

        return (
            <span
                className="attendance-status-badge"
                style={{ background: config.bg, color: config.color }}
            >
                <Icon size={14} />
                <span>{text(`student.attendance.${statusTranslationKey}`, config.label)}</span>
            </span>
        );
    };

    if (dashboardLoading && !dashboardData) {
        return (
            <div className="dashboard-loading">
                <RefreshCw className="animate-spin" size={40} />
                <p>{text('student.attendance.loading', 'Loading attendance records...')}</p>
            </div>
        );
    }

    if (dashboardError && !dashboardData) {
        return (
            <div className="dashboard-error">
                <AlertCircle size={48} color="#ef4444" />
                <p>{dashboardErrorText}</p>
                <button type="button" onClick={refreshData} className="retry-btn">
                    <RefreshCw size={18} />
                    {text('student.actions.tryAgain', 'Try Again')}
                </button>
            </div>
        );
    }

    return (
        <div className="student-attendance">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">{text('student.attendance.title', 'Attendance Record')}</h1>
                    <p className="page-subtitle">{text('student.attendance.subtitle', 'Track your class attendance and punctuality')}</p>
                </div>
                <div className="header-stats">
                    <div className="header-stat">
                        <CalendarDays size={18} />
                        <span>{stats.totalDays} {text('student.attendance.totalRecords', 'Total Records')}</span>
                    </div>
                </div>
            </header>

            {/* Warning Banner */}
            {stats.attendanceRate < 90 && stats.totalDays > 0 && (
                <div className="attendance-warning-banner">
                    <div className="warning-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="warning-content">
                        <h4>{text('student.attendance.attendanceAlert', 'Attendance Alert')}</h4>
                        <p>
                            {text('student.attendance.lowAttendanceWarning', 'Your attendance rate is')} <strong>{stats.attendanceRate}%</strong>.
                            {' '}{text('student.attendance.lowAttendanceAction', 'Please improve your attendance to meet the requirement.')}
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="attendance-stats-grid">
                <div className="attendance-stat-card main-rate">
                    <div className="attendance-ring-large">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e0f2fe" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke={attendanceRingColor}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={attendanceRingDasharray}
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="ring-value">
                            <span className="ring-percentage">{stats.attendanceRate}%</span>
                            <span className="ring-label">{text('student.attendance.attendanceRate', 'Rate')}</span>
                        </div>
                    </div>
                    <div className="stat-card-meta">
                        <TrendingUp size={16} />
                        <span>{text('student.attendance.overall', 'Overview')}</span>
                    </div>
                </div>

                <div className="attendance-stat-card present">
                    <div className="stat-icon-wrapper">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.present}</span>
                        <span className="stat-label">{text('student.attendance.totalPresent', 'Days Present')}</span>
                    </div>
                </div>

                <div className="attendance-stat-card absent">
                    <div className="stat-icon-wrapper">
                        <XCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.absent}</span>
                        <span className="stat-label">{text('student.attendance.totalAbsent', 'Days Absent')}</span>
                    </div>
                </div>

                <div className="attendance-stat-card late">
                    <div className="stat-icon-wrapper">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.late}</span>
                        <span className="stat-label">{text('student.attendance.late', 'Late Arrivals')}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="attendance-content-grid">
                {/* Monthly Breakdown */}
                {monthlyData.length > 0 && (
                    <div className="attendance-card monthly-chart">
                        <div className="card-header-premium">
                            <h3>
                                <Calendar size={20} />
                                {text('student.attendance.monthlyBreakdown', 'Monthly Overview')}
                            </h3>
                        </div>
                        <div className="monthly-bars">
                            {monthlyData.map((data) => (
                                <div key={data.key} className="month-bar-item">
                                    <div className="month-bar-container">
                                        <div
                                            className="month-bar-fill"
                                            style={{
                                                height: `${data.rate}%`,
                                                background: data.rate >= 90
                                                    ? 'linear-gradient(180deg, #10b981, #34d399)'
                                                    : data.rate >= 80
                                                        ? 'linear-gradient(180deg, #f59e0b, #fbbf24)'
                                                        : 'linear-gradient(180deg, #ef4444, #f87171)'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="month-label">{data.month}</span>
                                    <span className="month-rate">{data.rate}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item">
                                <span className="legend-dot" style={{ background: '#10b981' }}></span>
                                <span>≥90% Excellent</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                                <span>80-89% Good</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                                <span>&lt;80% Poor</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance History */}
                <div className={historyCardClassName}>
                    <div className="card-header-premium">
                        <h3>
                            <Search size={20} />
                            {text('student.attendance.recentHistory', 'Attendance History')}
                        </h3>
                        <div className="filter-tabs">
                            {ATTENDANCE_FILTER_OPTIONS.map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => setFilterStatus(option.key)}
                                    className={`filter-tab ${filterStatus === option.key ? 'active' : ''}`}
                                >
                                    {text(option.translationKey, option.fallbackLabel)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="history-list">
                        {historyLoading && (
                            <div className="empty-history">
                                <RefreshCw className="animate-spin" size={32} />
                                <p>{text('student.attendance.loadingHistory', 'Loading attendance history...')}</p>
                            </div>
                        )}
                        {!historyLoading && historyError && (
                            <div className="empty-history">
                                <AlertCircle size={32} />
                                <p>{historyError}</p>
                                <button onClick={fetchAttendanceHistory} className="retry-btn" type="button">
                                    <RefreshCw size={14} />
                                    {text('student.attendance.retryHistory', 'Retry History')}
                                </button>
                            </div>
                        )}
                        {!historyLoading && !historyError && filteredHistory.length > 0 ? filteredHistory.map((record) => {
                            const dayLabel = record.attendanceDate
                                ? record.attendanceDate.toLocaleDateString(locale, { day: '2-digit' })
                                : '--';
                            const monthLabel = record.attendanceDate
                                ? record.attendanceDate.toLocaleDateString(locale, { month: 'short' })
                                : '--';
                            const timeLabel = record.createdAt
                                ? record.createdAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                                : 'N/A';

                            return (
                                <div key={record.id} className="history-item">
                                    <div className="history-date">
                                        <span className="date-day">{dayLabel}</span>
                                        <span className="date-month">{monthLabel}</span>
                                    </div>
                                    <div className="history-details">
                                        <span className="history-subject">{record.subject}</span>
                                        <span className="history-time">
                                            <Clock size={12} />
                                            {timeLabel}
                                        </span>
                                    </div>
                                    {getStatusBadge(record.statusKey)}
                                </div>
                            );
                        }) : (
                            !historyLoading && !historyError && (
                                <div className="empty-history">
                                    <Filter size={32} />
                                    <p>{text('student.attendance.noRecords', 'No records found for this filter')}</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendance;
