import React, { useCallback, useEffect, useState } from 'react';
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
    RefreshCw
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

const StudentDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const {
        dashboardData,
        loading: dashboardLoading,
        error: dashboardError,
        refreshData
    } = useStudentData();
    const [schedule, setSchedule] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [scheduleError, setScheduleError] = useState(null);
    const dashboardErrorText = resolveText(
        t('student.dashboard.error'),
        'student.dashboard.error',
        'Failed to load dashboard data. Please try again.'
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

    useEffect(() => {
        void fetchSchedule();
    }, [fetchSchedule]);

    const handleRetryDashboard = async () => {
        await refreshData();
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

    // Map backend data to UI
    const assignments = grades?.marks?.slice(0, 3).map((m, index) => ({
        id: m.assignment_id || index,
        title: m.title || 'Assignment',
        subject: m.course_name || 'Subject',
        due: m.due_date ? new Date(m.due_date).toLocaleDateString() : 'N/A',
        status: m.score !== null ? 'graded' : 'pending',
        progress: m.percentage || 0
    })) || [];

    const stats = {
        attendance: attendance?.attendance_rate || 0,
        gpa: grades?.overall_average ? (grades.overall_average / 25).toFixed(2) : '0.00',
        completedTasks: grades?.graded_assignments || 0,
        rank: classmates?.rank || `Top ${classmates?.active_classmates || 'N/A'}`
    };

    // Use fetched schedule or empty array
    const todaySchedule = schedule.length > 0 ? schedule : [];

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
            {/* Welcome Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <h1 className="dashboard-title">
                        {t('student.dashboard.welcome') || 'Welcome back'}, <span className="text-gradient">{user?.full_name || 'Student'}!</span>
                    </h1>
                    <p className="dashboard-subtitle">
                        {profile?.current_classroom?.classroom_name || ''} • {profile?.current_grade?.grade_name || ''}
                    </p>
                </div>
                <div className="dashboard-date">
                    <Calendar size={18} />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
            </header>

            {/* Stats Cards */}
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

            {/* Main Grid */}
            <div className="student-dashboard-grid">
                {/* Daily Schedule */}
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

                {/* Side Column */}
                <div className="dashboard-side-column">
                    {/* Attendance Widget */}
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
                                        cx="50" cy="50" r="40"
                                        fill="none"
                                        stroke="#e0f2fe"
                                        strokeWidth="10"
                                    />
                                    <circle
                                        cx="50" cy="50" r="40"
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

                    {/* Assignments */}
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
