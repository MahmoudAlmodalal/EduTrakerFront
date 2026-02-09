import React, { useState, useEffect, useMemo } from 'react';
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
import studentService from '../../../services/studentService';
import '../Student.css';

const StudentAttendance = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        totalDays: 0,
        attendanceRate: 0
    });

    const fetchAttendanceData = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch both dashboard stats for summary and full attendance for history
            const [dashboardRes, attendanceRes] = await Promise.all([
                studentService.getDashboardStats(),
                studentService.getAttendance(user.id)
            ]);

            // Process Dashboard Stats for summary cards
            const statsData = dashboardRes?.statistics || dashboardRes;
            const attendanceSummary = statsData?.attendance;
            if (attendanceSummary) {
                setStats({
                    present: attendanceSummary.by_status?.present || 0,
                    absent: attendanceSummary.by_status?.absent || 0,
                    late: attendanceSummary.by_status?.late || 0,
                    excused: attendanceSummary.by_status?.excused || 0,
                    totalDays: attendanceSummary.total_records || 0,
                    attendanceRate: attendanceSummary.attendance_rate || 0
                });
            }

            // Process Attendance History
            const records = attendanceRes.results || attendanceRes || [];
            setAttendanceHistory(records.map(r => ({
                id: r.id,
                date: r.date,
                subject: r.course_name || 'Subject',
                statusKey: r.status,
                time: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
            })));

        } catch (error) {
            console.error('Error fetching attendance:', error);
            setError('Failed to load attendance records. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [user?.id]);

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

    if (loading) {
        return (
            <div className="dashboard-loading">
                <RefreshCw className="animate-spin" size={40} />
                <p>Loading attendance records...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <AlertCircle size={48} color="#ef4444" />
                <p>{error}</p>
                <button onClick={fetchAttendanceData} className="retry-btn">
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
                        {filteredHistory.length > 0 ? filteredHistory.map((record) => (
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
                            <div className="empty-history">
                                <Filter size={32} />
                                <p>{t('student.attendance.noRecords') || 'No records found for this filter'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-loading, .dashboard-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    text-align: center;
                    gap: 1rem;
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                    color: var(--student-primary, #0891b2);
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .retry-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .retry-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
                }

                .attendance-warning-banner {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1.25rem;
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    border: 1px solid #fecaca;
                    border-radius: 16px;
                    margin-bottom: 1.5rem;
                }
                
                .warning-icon {
                    width: 48px;
                    height: 48px;
                    background: #fecaca;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #dc2626;
                    flex-shrink: 0;
                }
                
                .warning-content h4 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #b91c1c;
                    margin: 0 0 0.25rem;
                }
                
                .warning-content p {
                    font-size: 0.875rem;
                    color: #dc2626;
                    margin: 0;
                }
                
                .attendance-stats-grid {
                    display: grid;
                    grid-template-columns: 1.5fr repeat(3, 1fr);
                    gap: 1.25rem;
                    margin-bottom: 1.5rem;
                }
                
                @media (max-width: 1024px) {
                    .attendance-stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                
                @media (max-width: 640px) {
                    .attendance-stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .attendance-stat-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    transition: all 0.3s ease;
                }
                
                .attendance-stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 30px rgba(8, 145, 178, 0.1);
                }
                
                .attendance-stat-card.main-rate {
                    grid-row: span 1;
                }
                
                .attendance-ring-large {
                    width: 120px;
                    height: 120px;
                    position: relative;
                }
                
                .attendance-ring-large svg {
                    width: 100%;
                    height: 100%;
                }
                
                .ring-value {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }
                
                .ring-percentage {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                }
                
                .ring-label {
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                }
                
                .stat-card-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                    background: #f1f5f9;
                    padding: 0.375rem 0.75rem;
                    border-radius: 20px;
                }
                
                .stat-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                
                .stat-info {
                    text-align: center;
                }
                
                .stat-value {
                    display: block;
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                }
                
                .stat-label {
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                
                .attendance-content-grid {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 1.5rem;
                }
                
                @media (max-width: 1024px) {
                    .attendance-content-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .attendance-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                }
                
                .card-header-premium {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .card-header-premium h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--color-text-main, #0f172a);
                    margin: 0;
                }
                
                .card-header-premium h3 svg {
                    color: var(--student-primary, #0891b2);
                }
                
                .monthly-bars {
                    display: flex;
                    justify-content: space-around;
                    align-items: flex-end;
                    height: 160px;
                    padding: 0 0.5rem;
                    margin-bottom: 1rem;
                }
                
                .month-bar-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .month-bar-container {
                    width: 32px;
                    height: 120px;
                    background: #f1f5f9;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                }
                
                .month-bar-fill {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    border-radius: 8px;
                    transition: height 0.5s ease;
                }
                
                .month-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--color-text-muted, #64748b);
                }
                
                .month-rate {
                    font-size: 0.6875rem;
                    color: var(--color-text-muted, #94a3b8);
                }
                
                .chart-legend {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                    padding-top: 0.5rem;
                    border-top: 1px solid rgba(8, 145, 178, 0.08);
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.6875rem;
                    color: var(--color-text-muted, #64748b);
                }
                
                .legend-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                
                .filter-tabs {
                    display: flex;
                    background: #f1f5f9;
                    padding: 0.25rem;
                    border-radius: 10px;
                }
                
                .filter-tab {
                    padding: 0.5rem 0.875rem;
                    border: none;
                    background: transparent;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--color-text-muted, #64748b);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .filter-tab:hover {
                    color: var(--color-text-main, #334155);
                }
                
                .filter-tab.active {
                    background: white;
                    color: var(--student-primary, #0891b2);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }
                
                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .history-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }
                
                .history-item:hover {
                    background: #f0f9ff;
                    border-color: var(--student-primary, #0891b2);
                }
                
                .history-date {
                    width: 48px;
                    height: 48px;
                    background: white;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    flex-shrink: 0;
                }
                
                .date-day {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                    line-height: 1;
                }
                
                .date-month {
                    font-size: 0.625rem;
                    color: var(--color-text-muted, #64748b);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
                
                .history-details {
                    flex: 1;
                }
                
                .history-subject {
                    display: block;
                    font-weight: 600;
                    font-size: 0.9375rem;
                    color: var(--color-text-main, #1e293b);
                    margin-bottom: 0.25rem;
                }
                
                .history-time {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                }
                
                .attendance-status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                
                .empty-history {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: var(--color-text-muted, #94a3b8);
                }
                
                .empty-history svg {
                    margin-bottom: 0.75rem;
                    opacity: 0.5;
                }
                
                .empty-history p {
                    margin: 0;
                    font-size: 0.875rem;
                }
                
                [data-theme="dark"] .attendance-stat-card,
                [data-theme="dark"] .attendance-card,
                [data-theme="dark"] .dashboard-loading,
                [data-theme="dark"] .dashboard-error {
                    background: #1e293b;
                }
                
                [data-theme="dark"] .ring-percentage,
                [data-theme="dark"] .stat-value,
                [data-theme="dark"] .history-subject,
                [data-theme="dark"] .date-day,
                [data-theme="dark"] .card-header-premium h3 {
                    color: #f1f5f9;
                }
                
                [data-theme="dark"] .history-item,
                [data-theme="dark"] .history-date,
                [data-theme="dark"] .month-bar-container {
                    background: rgba(30, 41, 59, 0.8);
                }
                
                [data-theme="dark"] .filter-tabs {
                    background: rgba(30, 41, 59, 0.8);
                }
                
                [data-theme="dark"] .filter-tab.active {
                    background: #334155;
                }
                
                [data-theme="dark"] .attendance-warning-banner {
                    background: linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%);
                    border-color: #b91c1c;
                }
                
                [data-theme="dark"] .warning-content h4,
                [data-theme="dark"] .warning-content p {
                    color: #fca5a5;
                }
            `}</style>
        </div>
    );
};

export default StudentAttendance;
