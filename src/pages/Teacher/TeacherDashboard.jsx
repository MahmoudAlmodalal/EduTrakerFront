import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Calendar, AlertCircle, CheckCircle, Bell, Plus, FileText, UserCheck, Search, ChevronRight, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import teacherService from '../../services/teacherService';
import secretaryService from '../../services/secretaryService';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({
        avgAttendance: '0%',
        pendingAssignments: 0,
        totalToGrade: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // In a real scenario, we might have a specific dashboard endpoint
                // but here we'll fetch notifications and some basic stats
                const [notifData, marksData, attendanceData] = await Promise.all([
                    secretaryService.getNotifications(),
                    teacherService.getMarks({ include_inactive: false }),
                    teacherService.getAttendance({ date: new Date().toISOString().split('T')[0] })
                ]);

                setNotifications(notifData.slice(0, 5));

                // Calculate some stats from marks if possible, or use defaults
                if (marksData) {
                    setStats(prev => ({
                        ...prev,
                        totalToGrade: marksData.count || marksData.length || 0
                    }));
                }

                // Mock schedule for now as there's no direct "schedule" endpoint found in urls.py
                // unless it's handled via lessons/classes
                setSchedule([
                    { id: 1, day: 'Today', time: '08:00 - 09:30', subject: 'Mathematics', class: 'Grade 10-A', room: 'Room 101', status: 'current' },
                    { id: 2, day: 'Today', time: '10:00 - 11:30', subject: 'Physics', class: 'Grade 11-B', room: 'Lab 2', status: 'upcoming' },
                ]);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-teacher-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-header-title">
                        {t('teacher.dashboard.title')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('teacher.dashboard.welcome')}</p>
                </div>

                <div className="glass-panel dashboard-date-widget">
                    <div style={{ paddingRight: '1rem', borderRight: '1px solid var(--teacher-border)', marginRight: '1rem' }}>
                        <p className="font-bold text-slate-800">Monday, Dec 15</p>
                        <p className="text-xs text-slate-500">2025</p>
                    </div>

                    <div style={{ position: 'relative', cursor: 'pointer' }}>
                        <Bell size={24} className="text-slate-500" />
                        <span style={{
                            position: 'absolute', top: 0, right: 0,
                            height: '10px', width: '10px',
                            backgroundColor: 'red', borderRadius: '50%',
                            border: '2px solid white'
                        }}></span>
                    </div>
                </div>
            </header>

            <div className="dashboard-grid">
                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Schedule Section */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontWeight: '700', color: 'var(--teacher-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                                <span style={{ padding: '0.5rem', backgroundColor: 'var(--teacher-primary-light)', borderRadius: '0.5rem', color: 'var(--teacher-primary)', display: 'flex' }}>
                                    <Calendar size={20} />
                                </span>
                                {t('teacher.dashboard.mySchedule')}
                            </h2>
                            <button
                                onClick={() => alert('Opening full timetable view...')}
                                style={{ color: 'var(--teacher-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {t('teacher.dashboard.viewTimetable')} <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {schedule.map((slot) => (
                                <div
                                    key={slot.id}
                                    className={`schedule-item ${slot.status === 'current' ? 'current' : ''}`}
                                >
                                    <div className="schedule-time-box">
                                        {slot.time.split(' ')[0]}
                                    </div>

                                    <div className="flex-1">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                            <h3 style={{ fontWeight: '700', color: 'var(--teacher-text-main)', fontSize: '1.125rem' }}>{slot.subject}</h3>
                                            {slot.status === 'current' && (
                                                <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '0.75rem', fontWeight: '700', borderRadius: '999px' }}>
                                                    {t('teacher.dashboard.now')}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--teacher-text-muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <UserCheck size={16} />
                                                {slot.class}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                {slot.room}
                                            </span>
                                        </div>
                                    </div>

                                    {slot.status === 'current' && (
                                        <div style={{ marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--teacher-primary-light)' }}>
                                            <button
                                                onClick={() => alert(`Starting class: ${slot.subject} - ${slot.class}`)}
                                                style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--teacher-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: '500', cursor: 'pointer' }}
                                            >
                                                {t('teacher.dashboard.start')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats / Overview Panels */}
                    <div className="stat-card">
                        <div className="glass-panel card-hover" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--teacher-success)', borderRadius: '0.75rem' }}>
                                    <UserCheck size={24} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--teacher-success)', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.25rem 0.5rem', borderRadius: '999px' }}>+0%</span>
                            </div>
                            <h3 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--teacher-text-main)', marginBottom: '0.25rem' }}>{stats.avgAttendance}</h3>
                            <p style={{ color: 'var(--teacher-text-muted)', fontSize: '0.875rem' }}>{t('teacher.dashboard.avgAttendance')}</p>
                        </div>

                        <div className="glass-panel card-hover" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(234, 88, 12, 0.2)', color: 'var(--teacher-warning)', borderRadius: '0.75rem' }}>
                                    <FileText size={24} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--teacher-warning)', backgroundColor: 'rgba(234, 88, 12, 0.15)', padding: '0.25rem 0.5rem', borderRadius: '999px' }}>{stats.pendingAssignments} {t('teacher.dashboard.pending')}</span>
                            </div>
                            <h3 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--teacher-text-main)', marginBottom: '0.25rem' }}>{stats.totalToGrade}</h3>
                            <p style={{ color: 'var(--teacher-text-muted)', fontSize: '0.875rem' }}>{t('teacher.dashboard.assignmentsToGrade')}</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Area */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h2 style={{ fontWeight: '700', color: 'var(--teacher-text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '4px', height: '1.5rem', backgroundColor: 'var(--teacher-primary)', borderRadius: '999px' }}></span>
                            {t('teacher.dashboard.quickActions')}
                        </h2>
                        <div className="space-y-4">
                            <button className="action-btn" onClick={() => navigate('/teacher/assessments')}>
                                <div style={{ padding: '0.5rem', backgroundColor: 'var(--teacher-primary-light)', color: 'var(--teacher-primary)', borderRadius: '0.5rem' }}>
                                    <Plus size={18} />
                                </div>
                                <span>{t('teacher.dashboard.createAssessment')}</span>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/classes')}>
                                <div style={{ padding: '0.5rem', backgroundColor: '#F3E8FF', color: '#9333EA', borderRadius: '0.5rem' }}>
                                    <UserCheck size={18} />
                                </div>
                                <span>{t('teacher.dashboard.recordAttendance')}</span>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/classes')}>
                                <div style={{ padding: '0.5rem', backgroundColor: '#DBEAFE', color: '#2563EB', borderRadius: '0.5rem' }}>
                                    <Search size={18} />
                                </div>
                                <span>{t('teacher.dashboard.findStudent')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontWeight: '700', color: 'var(--teacher-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '4px', height: '1.5rem', backgroundColor: 'var(--teacher-warning)', borderRadius: '999px' }}></span>
                                {t('teacher.dashboard.notifications')}
                            </h2>
                            <button
                                onClick={() => alert('All notifications marked as read!')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', color: 'var(--teacher-text-muted)' }}
                            >
                                {t('teacher.dashboard.markAllRead')}
                            </button>
                        </div>

                        <div className="space-y-6">
                            {notifications.map((notif) => (
                                <div key={notif.id} className="notification-item">
                                    <div style={{
                                        width: '2rem', height: '2rem', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: notif.type === 'alert' ? 'rgba(239, 68, 68, 0.4)' : notif.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)',
                                        color: notif.type === 'alert' ? 'var(--teacher-danger)' : notif.type === 'success' ? 'var(--teacher-success)' : 'var(--teacher-secondary)',
                                        zIndex: 10,
                                        boxShadow: '0 0 0 2px var(--teacher-surface)'
                                    }}>
                                        {notif.type === 'alert' ? <AlertCircle size={14} /> :
                                            notif.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--teacher-text-main)', fontWeight: '700', marginBottom: '0.25rem' }}>{notif.message}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--teacher-text-muted)' }}>{notif.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => alert('Opening all notifications...')}
                            style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--teacher-text-muted)', backgroundColor: 'var(--teacher-bg)', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                        >
                            {t('teacher.dashboard.viewAllNotifications')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
