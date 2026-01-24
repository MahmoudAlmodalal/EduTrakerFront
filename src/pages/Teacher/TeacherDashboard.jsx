import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    Calendar,
    AlertCircle,
    CheckCircle,
    Bell,
    Plus,
    FileText,
    UserCheck,
    Search,
    ChevronRight,
    X,
    Info,
    TrendingUp,
    Users,
    Activity
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import './Teacher.css';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTheme();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedule, setSchedule] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({ avgAttendance: '0%', toGrade: 0, performance: '84%' });
    const [error, setError] = useState(null);

    // Modals State
    const [selectedScheduleItem, setSelectedScheduleItem] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const [showFullSchedule, setShowFullSchedule] = useState(false);

    // Mock Chart Data
    const attendanceTrendData = [
        { day: 'Mon', rate: 92 },
        { day: 'Tue', rate: 88 },
        { day: 'Wed', rate: 95 },
        { day: 'Thu', rate: 91 },
        { day: 'Fri', rate: 94 },
    ];

    const performanceData = [
        { class: 'Grade 10-A', score: 82 },
        { class: 'Grade 11-B', score: 75 },
        { class: 'Grade 12-C', score: 88 },
        { class: 'Grade 9-D', score: 79 },
    ];

    // Safe Persistence Helper
    const safeJSONParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            if (!item || item === 'undefined' || item === 'null') return fallback;
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    // Load Dashboard Data
    useEffect(() => {
        try {
            const interval = setInterval(() => setCurrentDate(new Date()), 60000);

            // Schedule Construction
            const classes = safeJSONParse('school_classes', []);
            const lessonPlans = safeJSONParse('teacher_lesson_plans', []);
            const todayStr = new Date().toISOString().split('T')[0];
            const timeSlots = ['08:00 - 09:30', '10:00 - 11:30', '12:00 - 01:30', '02:00 - 03:30'];
            const rooms = ['Room 101', 'Lab A', 'Room 102', 'Hall B'];

            const builtSchedule = Array.isArray(classes) ? classes.map((cls, index) => {
                const todayPlan = Array.isArray(lessonPlans) ? lessonPlans.find(p => p.date === todayStr && p.class === cls.name) : null;
                return {
                    id: index,
                    time: timeSlots[index % timeSlots.length] || 'TBD',
                    subject: todayPlan ? todayPlan.title : `General Session`,
                    topic: todayPlan ? todayPlan.objectives : 'Regular curriculum activities',
                    class: cls.name,
                    room: rooms[index % rooms.length],
                    status: index === 0 ? 'current' : 'upcoming',
                    studentsCount: 25
                };
            }).slice(0, 4) : [];
            setSchedule(builtSchedule);

            // Stats Calculation
            const students = safeJSONParse('sec_students', []);
            const attendanceData = safeJSONParse('sec_attendance', []);
            const assessments = safeJSONParse('teacher_assessments', []);
            const allGrades = safeJSONParse('teacher_grades', {});

            let avgAtt = 0;
            if (Array.isArray(attendanceData) && attendanceData.length > 0) {
                const presentCount = attendanceData.filter(r => r && r.status === 'Present').length;
                avgAtt = Math.round((presentCount / attendanceData.length) * 100);
            }

            let pendingCount = 0;
            if (Array.isArray(assessments)) {
                assessments.forEach(assessment => {
                    if (assessment && assessment.class && assessment.id) {
                        const classStudents = Array.isArray(students) ? students.filter(s => s.class === assessment.class) : [];
                        const gradedCount = Object.keys(allGrades[assessment.id] || {}).length;
                        const needed = Math.max(0, classStudents.length - gradedCount);
                        pendingCount += needed;
                    }
                });
            }

            setStats({
                avgAttendance: Array.isArray(attendanceData) && attendanceData.length ? `${avgAtt}%` : '94%',
                toGrade: pendingCount,
                performance: '84.2%'
            });

            // Notifications
            const newNotifs = [
                { id: 'grading', type: 'info', message: `Pending: ${pendingCount} assignments to grade.`, details: 'Grade before weekend.', time: 'Today', read: false },
                { id: 'att', type: 'alert', message: 'High absence in Grade 11-B.', details: '4 students missing today.', time: '2h ago', read: false },
                { id: 'sys', type: 'success', message: 'Term plans approved.', details: 'Your curriculum has been verified.', time: 'Yesterday', read: true }
            ];
            setNotifications(newNotifs);

            return () => clearInterval(interval);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    if (error) {
        return <div className="p-4 text-red-500 bg-red-50 border border-red-200 rounded m-4">Dashboard Error: {error}</div>;
    }

    return (
        <div className="teacher-dashboard-container animate-fade-in">
            {/* Top Bar / Header */}
            <header className="dashboard-header-premium">
                <div className="welcome-section">
                    <h1>{t('teacher.dashboard.title')}</h1>
                    <p>{t('teacher.dashboard.welcome')}</p>
                </div>
                <div className="header-actions">
                    <div className="date-display-glass">
                        <Calendar size={18} />
                        <span>{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="teacher-stats-grid">
                <div className="premium-stat-card" onClick={() => navigate('/teacher/classes')}>
                    <div className="stat-icon-blob" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--teacher-primary)' }}>
                        <UserCheck size={24} />
                    </div>
                    <div className="stat-info">
                        <p>{t('teacher.dashboard.avgAttendance')}</p>
                        <h3>{stats.avgAttendance}</h3>
                        <span className="trend positive">+2.4% vs last week</span>
                    </div>
                </div>

                <div className="premium-stat-card" onClick={() => navigate('/teacher/assessments')}>
                    <div className="stat-icon-blob" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--teacher-warning)' }}>
                        <FileText size={24} />
                    </div>
                    <div className="stat-info">
                        <p>{t('teacher.dashboard.assignmentsToGrade')}</p>
                        <h3>{stats.toGrade}</h3>
                        <span className="trend warning">Due by Friday</span>
                    </div>
                </div>

                <div className="premium-stat-card">
                    <div className="stat-icon-blob" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--teacher-success)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <p>Class Performance</p>
                        <h3>{stats.performance}</h3>
                        <span className="trend positive">Excellent progress</span>
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="teacher-analytics-layout">
                <div className="analytics-main-column">
                    {/* Charts Grid */}
                    <div className="charts-grid-two">
                        <div className="glass-widget-card">
                            <div className="widget-header">
                                <h3>Attendance Trend</h3>
                                <TrendingUp size={18} />
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={attendanceTrendData}>
                                        <defs>
                                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--teacher-primary)" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="var(--teacher-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--teacher-border)" opacity={0.5} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--teacher-text-muted)', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--teacher-text-muted)', fontSize: 12 }} domain={[80, 100]} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--teacher-border)', background: 'var(--teacher-surface)' }} />
                                        <Area type="monotone" dataKey="rate" stroke="var(--teacher-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-widget-card">
                            <div className="widget-header">
                                <h3>Performance by Class</h3>
                                <Activity size={18} />
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--teacher-border)" opacity={0.5} />
                                        <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fill: 'var(--teacher-text-muted)', fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--teacher-text-muted)', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '12px', border: '1px solid var(--teacher-border)', background: 'var(--teacher-surface)' }} />
                                        <Bar dataKey="score" fill="var(--teacher-primary)" radius={[4, 4, 0, 0]} barSize={25} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Section */}
                    <div className="glass-widget-card schedule-widget">
                        <div className="widget-header">
                            <div className="header-title">
                                <Calendar size={20} className="primary-icon" />
                                <h3>{t('teacher.dashboard.mySchedule')}</h3>
                            </div>
                            <button className="text-btn" onClick={() => setShowFullSchedule(true)}>
                                {t('teacher.dashboard.viewTimetable')} <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="schedule-list-horizontal">
                            {schedule.map((slot) => (
                                <div
                                    key={slot.id}
                                    className={`schedule-card-compact ${slot.status === 'current' ? 'active' : ''}`}
                                    onClick={() => setSelectedScheduleItem(slot)}
                                >
                                    <div className="time-indicator">{slot.time.split(' ')[0]}</div>
                                    <div className="class-name">{slot.class}</div>
                                    <div className="subject-name">{slot.subject}</div>
                                    <div className="room-info">{slot.room}</div>
                                    {slot.status === 'current' && <span className="now-badge">LIVE</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="analytics-side-column">
                    {/* Quick Actions */}
                    <div className="glass-widget-card">
                        <h3>Quick Actions</h3>
                        <div className="quick-actions-grid">
                            <button className="action-tile" onClick={() => navigate('/teacher/assessments')}>
                                <Plus size={20} />
                                <span>{t('teacher.dashboard.createAssessment')}</span>
                            </button>
                            <button className="action-tile" onClick={() => navigate('/teacher/classes')}>
                                <UserCheck size={20} />
                                <span>Attendance</span>
                            </button>
                            <button className="action-tile" onClick={() => navigate('/teacher/communication')}>
                                <Bell size={20} />
                                <span>Announce</span>
                            </button>
                        </div>
                    </div>

                    {/* Notifications / Activity */}
                    <div className="glass-widget-card activity-feed">
                        <div className="widget-header">
                            <h3>Updates</h3>
                            <button onClick={markAllRead} className="read-all-btn">Mark Read</button>
                        </div>
                        <div className="activity-list">
                            {notifications.map((notif) => (
                                <div key={notif.id} className={`activity-item ${notif.read ? 'read' : 'unread'}`} onClick={() => setSelectedNotification(notif)}>
                                    <div className={`activity-icon-shell ${notif.type}`}>
                                        {notif.type === 'alert' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                                    </div>
                                    <div className="activity-text">
                                        <p>{notif.message}</p>
                                        <span>{notif.time}</span>
                                    </div>
                                    {!notif.read && <div className="unread-dot" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals preserved from original */}
            {selectedScheduleItem && (
                <div className="modal-overlay" onClick={() => setSelectedScheduleItem(null)}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedScheduleItem(null)}><X size={20} /></button>
                        <div className="modal-header-accent" />
                        <h2>{selectedScheduleItem.subject}</h2>
                        <div className="modal-body-details">
                            <div className="detail-row"><span>Time:</span> {selectedScheduleItem.time}</div>
                            <div className="detail-row"><span>Class:</span> {selectedScheduleItem.class}</div>
                            <div className="detail-row"><span>Room:</span> {selectedScheduleItem.room}</div>
                            <div className="detail-row"><span>Topic:</span> {selectedScheduleItem.topic}</div>
                            <button className="btn-primary-large" onClick={() => { setSelectedScheduleItem(null); navigate('/teacher/classes'); }}>Start Session</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedNotification && (
                <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedNotification(null)}><X size={20} /></button>
                        <h2 className="modal-title-with-icon"><Info size={20} /> Details</h2>
                        <div className="modal-body-simple">
                            <p className="main-msg">{selectedNotification.message}</p>
                            <p className="sub-msg">{selectedNotification.details}</p>
                            <p className="timestamp">{selectedNotification.time}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
