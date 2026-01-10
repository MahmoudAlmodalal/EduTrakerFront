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
    Zap
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import '../Student.css';

const StudentDashboard = () => {
    const { t } = useTheme();

    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState({
        attendance: 0,
        gpa: 0,
        completedTasks: 0,
        rank: 'N/A'
    });
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const safeJSONParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    useEffect(() => {
        try {
            // 1. Identify Current Student (Simulate Login)
            const students = safeJSONParse('sec_students', []);
            // Default to first student or create a dummy one if none exist
            const user = students.length > 0 ? students[0] : {
                id: 999,
                firstName: 'Student',
                lastName: 'Demo',
                assignedClass: 'Grade 10-A',
                gender: 'Male'
            };
            setCurrentUser(user);

            const studentName = `${user.firstName} ${user.lastName}`;
            const studentClass = user.assignedClass;

            // 2. Calculate Attendance
            const attendanceRecords = safeJSONParse('sec_attendance', []);
            // Filter attendance for this student
            const myAttendance = attendanceRecords.filter(r =>
                (r.studentId === user.id) || (r.studentName === studentName)
            );

            const totalDays = myAttendance.length || 1; // Avoid division by zero
            const presentDays = myAttendance.filter(r => r.status === 'Present').length;
            const attendancePct = Math.round((presentDays / totalDays) * 100) || 100; // Default to 100 if no records

            // 3. Calculate GPA & Tasks Done
            const allGrades = safeJSONParse('teacher_grades', []);
            const myGrades = allGrades.filter(g => g.name === studentName || g.studentId === user.id);

            let totalScore = 0;
            let gradedCount = 0;
            myGrades.forEach(g => {
                const score = parseFloat(g.grade);
                if (!isNaN(score)) {
                    totalScore += score;
                    gradedCount++;
                }
            });

            // Rough GPA calculation (assuming 100 scale -> 4.0 scale)
            // >=90: 4.0, >=80: 3.0, >=70: 2.0, >=60: 1.0
            const averageScore = gradedCount > 0 ? totalScore / gradedCount : 0;
            let gpa = 0.0;
            if (averageScore >= 90) gpa = 4.0;
            else if (averageScore >= 80) gpa = 3.0;
            else if (averageScore >= 70) gpa = 2.0;
            else if (averageScore >= 60) gpa = 1.0;

            // Tasks Done = Graded Assignments
            const tasksDone = gradedCount;

            // 4. Calculate Rank
            // This is complex without processing all students. 
            // Simplified: If avg > 90 -> Top 10%, > 80 -> Top 20%
            let rank = 'Top 50%';
            if (averageScore >= 95) rank = 'Top 5%';
            else if (averageScore >= 90) rank = 'Top 10%';
            else if (averageScore >= 80) rank = 'Top 25%';

            setStats({
                attendance: attendancePct,
                gpa: gpa.toFixed(1),
                completedTasks: tasksDone,
                rank: rank
            });

            // 5. Daily Schedule (From Lesson Plans for Today)
            const lessonPlans = safeJSONParse('teacher_lesson_plans', []);
            const todayStr = new Date().toISOString().split('T')[0];

            // Find plans for this student's class for TODAY
            const todaysPlans = lessonPlans.filter(p =>
                p.date === todayStr && p.class === studentClass
            );

            if (todaysPlans.length > 0) {
                setTodaySchedule(todaysPlans.map((p, index) => ({
                    id: p.id,
                    time: '08:00 AM', // Mock time as Plans don't have time yet
                    subject: p.title, // Use Title as Subject proxy
                    room: 'Room 101',
                    teacher: 'Mr. Teacher',
                    status: 'upcoming'
                })));
            } else {
                // Fallback if no specific plans today
                setTodaySchedule([
                    { id: 1, time: '08:00', subject: 'Mathematics', room: 'Room 101', teacher: 'Mrs. Huda', status: 'upcoming' },
                    { id: 2, time: '09:45', subject: 'English', room: 'Room 203', teacher: 'Mr. Waleed', status: 'upcoming' },
                    { id: 3, time: '11:45', subject: 'Science', room: 'Lab 1', teacher: 'Ms. Layla', status: 'upcoming' }
                ]);
            }

            // 6. Assignments (From Teacher Assessments)
            const allAssessments = safeJSONParse('teacher_assessments', []);
            // Filter for student's grade/class
            // Assuming assessments are for 'Grade 10', 'Grade 11' etc. match part of the class name
            const myAssessments = allAssessments.filter(a =>
                studentClass.includes(a.gradeLevel) || a.gradeLevel === 'All' || !a.gradeLevel
            );

            const processedAssignments = myAssessments.map(a => {
                // Check if submitted/graded
                const myGrade = allGrades.find(g => g.assessmentId === a.id && (g.studentId === user.id || g.name === studentName));
                let status = 'pending';
                let progress = 0;

                if (myGrade) {
                    if (myGrade.grade) {
                        status = 'done';
                        progress = 100;
                    } else {
                        status = 'submitted'; // Or simulate in progress
                        progress = 50;
                    }
                } else {
                    // Check due date
                    const dueDate = new Date(a.date);
                    const now = new Date();
                    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 1 && diffDays >= 0) status = 'urgent';
                }

                return {
                    id: a.id,
                    title: a.title,
                    subject: a.type, // Use Type as Subject proxy or generic
                    due: a.date,
                    status: status,
                    progress: progress
                };
            }).slice(0, 5); // Show top 5

            setAssignments(processedAssignments);
            setLoading(false);

        } catch (error) {
            console.error("Error loading dashboard data:", error);
            setLoading(false);
        }
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'done':
                return <span className="status-badge status-done"><CheckCircle size={12} /> Completed</span>;
            case 'now':
                return <span className="status-badge status-now"><Zap size={12} /> In Progress</span>;
            case 'upcoming':
                return <span className="status-badge status-upcoming"><Clock size={12} /> Upcoming</span>;
            case 'urgent':
                return <span className="status-badge status-urgent" style={{ background: '#fef2f2', color: '#dc2626' }}><AlertCircle size={12} /> Urgent</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading your dashboard...</div>;
    }

    return (
        <div className="student-dashboard animate-fade-in">
            {/* Welcome Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <h1 className="dashboard-title">
                        {t('student.dashboard.welcome') || 'Welcome back'}, <span className="text-gradient">{currentUser?.firstName || 'Student'}!</span>
                    </h1>
                    <p className="dashboard-subtitle">
                        {t('student.dashboard.subtitle') || "Here's what's happening with your studies today."}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Class: {currentUser?.assignedClass || 'Not Assigned'}</p>
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
                        {todaySchedule.length > 0 ? todaySchedule.map((item) => (
                            <div key={item.id} className={`schedule-item ${item.status === 'now' ? 'current' : ''}`}>
                                <div className="schedule-time">
                                    <span className="schedule-time-text">{item.time}</span>
                                </div>
                                <div className="schedule-details">
                                    <div className="schedule-subject">{item.subject}</div>
                                    <div className="schedule-meta">
                                        {item.teacher} • {item.room}
                                    </div>
                                </div>
                                {getStatusBadge(item.status)}
                            </div>
                        )) : (
                            <p className="text-center text-slate-500 py-4">No classes scheduled for today.</p>
                        )}
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
                                        strokeDasharray={`${(stats.attendance || 100) * 2.51} 251`}
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
                                <span className="attendance-stat-value text-success">Good</span>
                                <span className="attendance-stat-label">Status</span>
                            </div>
                        </div>
                    </div>

                    {/* Assignments */}
                    <div className="dashboard-card">
                        <div className="card-header">
                            <h2 className="card-title">
                                <BookOpen size={20} />
                                {t('student.dashboard.assignments') || 'Pending Tasks'}
                            </h2>
                            <span className="card-badge urgent">{assignments.filter(a => a.status === 'urgent').length} Urgent</span>
                        </div>
                        <div className="assignment-list">
                            {assignments.length > 0 ? assignments.map((assignment) => (
                                <div key={assignment.id} className={`assignment-item ${assignment.status === 'urgent' ? 'urgent' : ''}`}>
                                    <div className="assignment-header">
                                        <div className="assignment-title">{assignment.title}</div>
                                        {assignment.status === 'urgent' && <AlertCircle size={16} className="text-danger" />}
                                    </div>
                                    <div className="assignment-meta">
                                        <span>{assignment.subject}</span>
                                        <span className={`assignment-due ${assignment.status === 'urgent' ? 'urgent' : ''}`}>
                                            Due: {assignment.due}
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
                                <p className="text-center text-slate-500 py-4">No pending assignments.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Styles for Dashboard-specific components */}
            <style>{`
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
                
                .assignment-item.urgent {
                    border-left: 3px solid #dc2626;
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
                
                .assignment-due.urgent {
                    color: #dc2626;
                    font-weight: 600;
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
                
                .text-danger { color: #dc2626; }
                
                [data-theme="dark"] .dashboard-date {
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
