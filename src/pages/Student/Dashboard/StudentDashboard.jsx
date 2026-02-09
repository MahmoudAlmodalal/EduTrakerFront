import React, { useState, useEffect } from 'react';
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
import studentService from '../../../services/studentService';
import '../Student.css';

const StudentDashboard = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [schedule, setSchedule] = useState([]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await studentService.getDashboardStats();
            // The data structure can be { status: 'success', statistics: { ... } } or just { statistics: { ... } }
            const stats = data?.statistics || data;
            setDashboardData(stats);

            // Fetch Schedule
            if (user?.id) {
                try {
                    const scheduleData = await studentService.getSchedule(user.id);
                    setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
                } catch (schedError) {
                    console.error("Error fetching schedule:", schedError);
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(t('student.dashboard.error') || 'Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner">
                    <RefreshCw className="animate-spin" size={40} />
                </div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <AlertCircle size={48} color="#ef4444" />
                <h2>Oops! Something went wrong</h2>
                <p>{error}</p>
                <button onClick={fetchDashboardData} className="retry-btn">
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    const { profile, courses, grades, attendance, classmates } = dashboardData || {};

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
                        <span className="card-badge">{todaySchedule.length} Classes</span>
                    </div>
                    <div className="schedule-list">
                        {todaySchedule.map((item) => (
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

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .dashboard-title {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                    margin: 0 0 0.5rem;
                }
                
                .text-gradient {
                    background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .dashboard-subtitle {
                    color: var(--color-text-muted, #64748b);
                    font-size: 1rem;
                    margin: 0;
                }
                
                .dashboard-date {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    background: white;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--color-text-main, #334155);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }
                
                .card-badge {
                    padding: 0.375rem 0.75rem;
                    background: #e0f2fe;
                    color: #0891b2;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                
                .card-badge.urgent {
                    background: #fef2f2;
                    color: #dc2626;
                }
                
                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                }
                
                .status-done {
                    background: #dcfce7;
                    color: #16a34a;
                }
                
                .status-now {
                    background: linear-gradient(135deg, rgba(8, 145, 178, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
                    color: #0891b2;
                    animation: pulse 2s infinite;
                }
                
                .status-upcoming {
                    background: #f1f5f9;
                    color: #64748b;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                .schedule-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .dashboard-side-column {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                
                .attendance-ring-container {
                    display: flex;
                    justify-content: center;
                    padding: 1rem 0;
                }
                
                .attendance-ring {
                    position: relative;
                    width: 140px;
                    height: 140px;
                }
                
                .attendance-ring svg {
                    width: 100%;
                    height: 100%;
                }
                
                .attendance-ring-value {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                }
                
                .attendance-percentage {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--color-text-main, #0f172a);
                }
                
                .attendance-label {
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                }
                
                .attendance-stats {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    padding-top: 0.5rem;
                }
                
                .attendance-stat {
                    text-align: center;
                }
                
                .attendance-stat-value {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                
                .attendance-stat-value.text-success { color: #16a34a; }
                .attendance-stat-value.text-danger { color: #dc2626; }
                
                .attendance-stat-label {
                    font-size: 0.6875rem;
                    color: var(--color-text-muted, #64748b);
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                }
                
                .assignment-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .assignment-item {
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                }
                
                .assignment-item:hover {
                    border-color: #0891b2;
                    background: #f0f9ff;
                }
                
                .assignment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                
                .assignment-title {
                    font-weight: 600;
                    font-size: 0.9375rem;
                    color: var(--color-text-main, #1e293b);
                }
                
                .assignment-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                    margin-bottom: 0.75rem;
                }
                
                .assignment-progress {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .assignment-progress .progress-bar {
                    flex: 1;
                    height: 6px;
                }
                
                .progress-text {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--color-text-muted, #64748b);
                    min-width: 32px;
                }

                .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: var(--color-text-muted, #94a3b8);
                    font-size: 0.875rem;
                }
                
                [data-theme="dark"] .dashboard-date,
                [data-theme="dark"] .dashboard-loading,
                [data-theme="dark"] .dashboard-error {
                    background: #1e293b;
                }
                
                [data-theme="dark"] .assignment-item {
                    background: rgba(30, 41, 59, 0.6);
                }
                
                [data-theme="dark"] .dashboard-title,
                [data-theme="dark"] .attendance-percentage {
                    color: #f1f5f9;
                }
            `}</style>
        </div>
    );
};

export default StudentDashboard;
