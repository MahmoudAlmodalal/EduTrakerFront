import React, { useState } from 'react';
import {
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Filter,
    CalendarDays,
    AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import '../Student.css';

const StudentAttendance = () => {
    const { t } = useTheme();
    const [filterStatus, setFilterStatus] = useState('all');

    // Mock Data
    const attendanceStats = {
        present: 45,
        absent: 3,
        late: 2,
        excused: 1,
        totalDays: 51,
        attendanceRate: 88.2
    };

    const monthlyData = [
        { month: 'Sep', present: 20, absent: 1, late: 0, total: 21 },
        { month: 'Oct', present: 18, absent: 2, late: 1, total: 21 },
        { month: 'Nov', present: 21, absent: 0, late: 1, total: 22 },
        { month: 'Dec', present: 8, absent: 0, late: 0, total: 8 },
    ];

    const attendanceHistory = [
        { id: 1, date: '2024-12-10', subject: 'Mathematics', statusKey: 'present', time: '08:00 AM' },
        { id: 2, date: '2024-12-10', subject: 'Physics', statusKey: 'present', time: '10:00 AM' },
        { id: 3, date: '2024-12-09', subject: 'Chemistry', statusKey: 'late', time: '08:15 AM' },
        { id: 4, date: '2024-12-08', subject: 'English', statusKey: 'absent', time: '09:00 AM' },
        { id: 5, date: '2024-12-08', subject: 'History', statusKey: 'present', time: '11:00 AM' },
        { id: 6, date: '2024-12-07', subject: 'Biology', statusKey: 'excused', time: '08:00 AM' },
        { id: 7, date: '2024-12-06', subject: 'Mathematics', statusKey: 'present', time: '08:00 AM' },
        { id: 8, date: '2024-12-05', subject: 'Physics', statusKey: 'present', time: '10:00 AM' },
    ];

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
        { key: 'late', label: 'Late' }
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
                        <span>{attendanceStats.totalDays} School Days</span>
                    </div>
                </div>
            </header>

            {/* Warning Banner */}
            {attendanceStats.attendanceRate < 90 && (
                <div className="attendance-warning-banner">
                    <div className="warning-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="warning-content">
                        <h4>{t('student.attendance.attendanceAlert') || 'Attendance Alert'}</h4>
                        <p>
                            {t('student.attendance.lowAttendanceWarning') || 'Your attendance rate is'} <strong>{attendanceStats.attendanceRate}%</strong>.
                            {' '}{t('student.attendance.lowAttendanceAction') || 'Please improve your attendance to meet the 90% requirement.'}
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
                                stroke={attendanceStats.attendanceRate >= 90 ? '#10b981' : '#f59e0b'}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${attendanceStats.attendanceRate * 2.51} 251`}
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="ring-value">
                            <span className="ring-percentage">{attendanceStats.attendanceRate}%</span>
                            <span className="ring-label">Rate</span>
                        </div>
                    </div>
                    <div className="stat-card-meta">
                        <TrendingUp size={16} />
                        <span>+2.5% from last month</span>
                    </div>
                </div>

                <div className="attendance-stat-card present">
                    <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{attendanceStats.present}</span>
                        <span className="stat-label">{t('student.attendance.totalPresent') || 'Days Present'}</span>
                    </div>
                </div>

                <div className="attendance-stat-card absent">
                    <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)' }}>
                        <XCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{attendanceStats.absent}</span>
                        <span className="stat-label">{t('student.attendance.totalAbsent') || 'Days Absent'}</span>
                    </div>
                </div>

                <div className="attendance-stat-card late">
                    <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{attendanceStats.late}</span>
                        <span className="stat-label">{t('student.attendance.late') || 'Late Arrivals'}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="attendance-content-grid">
                {/* Monthly Breakdown */}
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
                            <span>&lt;80% Needs Improvement</span>
                        </div>
                    </div>
                </div>

                {/* Attendance History */}
                <div className="attendance-card history-table">
                    <div className="card-header-premium">
                        <h3>
                            <CalendarDays size={20} />
                            {t('student.attendance.recentHistory') || 'Recent Attendance'}
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
                    color: #10b981;
                    background: #dcfce7;
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
                [data-theme="dark"] .attendance-card {
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
            `}</style>
        </div>
    );
};

export default StudentAttendance;
