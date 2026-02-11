import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const resolveText = (value, fallbackKey, fallbackText) => {
    if (!value || value === fallbackKey) {
        return fallbackText;
    }
    return value;
};

const StudentAttendance = () => {
    const { t } = useTheme();
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

    const fetchAttendanceHistory = useCallback(async () => {
        if (!user?.id) {
            setAttendanceHistory([]);
            setHistoryLoading(false);
            setHistoryError(null);
            return;
        }

        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const attendanceRes = await studentService.getAttendance(user.id);
            const records = attendanceRes?.results || attendanceRes || [];
            setAttendanceHistory(records.map((record) => ({
                id: record.id,
                date: record.date,
                subject: record.course_name || 'Subject',
                statusKey: record.status,
                time: record.created_at
                    ? new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A'
            })));
        } catch (err) {
            console.error('Error fetching attendance history:', err);
            setHistoryError('Failed to load attendance records. Please try again.');
        } finally {
            setHistoryLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        void fetchAttendanceHistory();
    }, [fetchAttendanceHistory]);

    const attendanceSummary = dashboardData?.attendance || {};
    const stats = {
        present: attendanceSummary.by_status?.present || 0,
        absent: attendanceSummary.by_status?.absent || 0,
        late: attendanceSummary.by_status?.late || 0,
        excused: attendanceSummary.by_status?.excused || 0,
        totalDays: attendanceSummary.total_records || 0,
        attendanceRate: attendanceSummary.attendance_rate || 0
    };

    const monthlyData = useMemo(() => {
        if (!attendanceHistory.length) return [];

        const months = {};
        attendanceHistory.forEach(record => {
            const date = new Date(record.date);
            const monthName = date.toLocaleDateString('en', { month: 'short' });
            if (!months[monthName]) {
                months[monthName] = { month: monthName, present: 0, total: 0 };
            }
            months[monthName].total++;
            if (record.statusKey === 'present' || record.statusKey === 'late') {
                months[monthName].present++;
            }
        });

        return Object.values(months).reverse().slice(0, 6); // Last 6 months
    }, [attendanceHistory]);

    const dashboardErrorText = resolveText(
        t('student.dashboard.error'),
        'student.dashboard.error',
        'Failed to load dashboard data. Please try again.'
    );

    if (dashboardLoading && !dashboardData) {
        return (
            <div className="dashboard-loading">
                <RefreshCw className="animate-spin" size={40} />
                <p>Loading attendance records...</p>
            </div>
        );
    }

    if (dashboardError && !dashboardData) {
        return (
            <div className="dashboard-error">
                <AlertCircle size={48} color="#ef4444" />
                <p>{dashboardErrorText}</p>
                <button onClick={refreshData} className="retry-btn">
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    const getStatusBadge = (statusKey) => {
        const configs = {
            present: { icon: CheckCircle, bg: '#dcfce7', color: '#16a34a', label: 'Present' },
            absent: { icon: XCircle, bg: '#fef2f2', color: '#dc2626', label: 'Absent' },
            late: { icon: Clock, bg: '#fef3c7', color: '#d97706', label: 'Late' },
            excused: { icon: AlertCircle, bg: '#e0f2fe', color: '#0891b2', label: 'Excused' }
        };
        const config = configs[statusKey] || configs.present;
        const Icon = config.icon;

        return (
            <span
                className="attendance-status-badge"
                style={{ background: config.bg, color: config.color }}
            >
                <Icon size={14} />
                <span>{t(`student.attendance.${statusKey}`) || config.label}</span>
            </span>
        );
    };

    const filterOptions = [
        { key: 'all', label: 'All' },
        { key: 'present', label: 'Present' },
        { key: 'absent', label: 'Absent' },
        { key: 'late', label: 'Late' },
        { key: 'excused', label: 'Excused' }
    ];

    const filteredHistory = filterStatus === 'all'
        ? attendanceHistory
        : attendanceHistory.filter(record => record.statusKey === filterStatus);

    return (
        <div className="student-attendance">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('student.attendance.title') || 'Attendance Record'}</h1>
                    <p className="page-subtitle">{t('student.attendance.subtitle') || 'Track your class attendance and punctuality'}</p>
                </div>
                <div className="header-stats">
                    <div className="header-stat">
                        <CalendarDays size={18} />
                        <span>{stats.totalDays} Total Records</span>
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
                        <h4>{t('student.attendance.attendanceAlert') || 'Attendance Alert'}</h4>
                        <p>
                            {t('student.attendance.lowAttendanceWarning') || 'Your attendance rate is'} <strong>{stats.attendanceRate}%</strong>.
                            {' '}{t('student.attendance.lowAttendanceAction') || 'Please improve your attendance to meet the requirement.'}
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
                                stroke={stats.attendanceRate >= 90 ? '#10b981' : stats.attendanceRate >= 75 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${stats.attendanceRate * 2.51} 251`}
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="ring-value">
                            <span className="ring-percentage">{stats.attendanceRate}%</span>
                            <span className="ring-label">Rate</span>
                        </div>
                    </div>
                    <div className="stat-card-meta">
                        <TrendingUp size={16} />
                        <span>Overview of your presence</span>
                    </div>
                </div>

                <div className="attendance-stat-card present">
                    <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.present}</span>
                        <span className="stat-label">{t('student.attendance.totalPresent') || 'Days Present'}</span>
                    </div>
                </div>

                <div className="attendance-stat-card absent">
                    <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)' }}>
                        <XCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.absent}</span>
                        <span className="stat-label">{t('student.attendance.totalAbsent') || 'Days Absent'}</span>
                    </div>
                </div>

                <div className="attendance-stat-card late">
                    <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.late}</span>
                        <span className="stat-label">{t('student.attendance.late') || 'Late Arrivals'}</span>
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
                                {t('student.attendance.monthlyBreakdown') || 'Monthly Overview'}
                            </h3>
                        </div>
                        <div className="monthly-bars">
                            {monthlyData.map((data, index) => {
                                const rate = Math.round((data.present / data.total) * 100);
                                return (
                                    <div key={index} className="month-bar-item">
                                        <div className="month-bar-container">
                                            <div
                                                className="month-bar-fill"
                                                style={{
                                                    height: `${rate}%`,
                                                    background: rate >= 90
                                                        ? 'linear-gradient(180deg, #10b981, #34d399)'
                                                        : rate >= 80
                                                            ? 'linear-gradient(180deg, #f59e0b, #fbbf24)'
                                                            : 'linear-gradient(180deg, #ef4444, #f87171)'
                                                }}
                                            ></div>
                                        </div>
                                        <span className="month-label">{data.month}</span>
                                        <span className="month-rate">{rate}%</span>
                                    </div>
                                );
                            })}
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
                <div className="attendance-card history-table" style={{ gridColumn: monthlyData.length === 0 ? 'span 2' : 'auto' }}>
                    <div className="card-header-premium">
                        <h3>
                            <Search size={20} />
                            {t('student.attendance.recentHistory') || 'Attendance History'}
                        </h3>
                        <div className="filter-tabs">
                            {filterOptions.map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => setFilterStatus(option.key)}
                                    className={`filter-tab ${filterStatus === option.key ? 'active' : ''}`}
                                >
                                    {t(`student.attendance.${option.key}`) || option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="history-list">
                        {historyLoading && (
                            <div className="empty-history">
                                <RefreshCw className="animate-spin" size={32} />
                                <p>Loading attendance history...</p>
                            </div>
                        )}
                        {!historyLoading && historyError && (
                            <div className="empty-history">
                                <AlertCircle size={32} />
                                <p>{historyError}</p>
                                <button onClick={fetchAttendanceHistory} className="retry-btn" type="button">
                                    <RefreshCw size={14} />
                                    Retry History
                                </button>
                            </div>
                        )}
                        {!historyLoading && !historyError && filteredHistory.length > 0 ? filteredHistory.map((record) => (
                            <div key={record.id} className="history-item">
                                <div className="history-date">
                                    <span className="date-day">{record.date.split('-')[2]}</span>
                                    <span className="date-month">{new Date(record.date).toLocaleDateString('en', { month: 'short' })}</span>
                                </div>
                                <div className="history-details">
                                    <span className="history-subject">{record.subject}</span>
                                    <span className="history-time">
                                        <Clock size={12} />
                                        {record.time}
                                    </span>
                                </div>
                                {getStatusBadge(record.statusKey)}
                            </div>
                        )) : (
                            !historyLoading && !historyError && (
                                <div className="empty-history">
                                    <Filter size={32} />
                                    <p>{t('student.attendance.noRecords') || 'No records found for this filter'}</p>
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
