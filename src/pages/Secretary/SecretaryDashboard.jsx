import React, { useState, useEffect } from 'react';
import { Users, FileText, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import './Secretary.css';

const SecretaryDashboard = () => {
    const { t } = useTheme();
    const [stats, setStats] = useState([]);
    const [pendingTasks, setPendingTasks] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const data = await secretaryService.getDashboardStats();

                // Transform backend stats to frontend format
                const transformedStats = [
                    {
                        labelKey: 'secretary.dashboard.totalStudents',
                        value: data.total_students || '0',
                        icon: Users,
                        color: '#4F46E5',
                        bgColor: '#EEF2FF',
                        link: '/secretary/admissions'
                    },
                    {
                        labelKey: 'secretary.dashboard.unreadMessages',
                        value: data.unread_messages || '0',
                        icon: FileText,
                        color: '#F59E0B',
                        bgColor: '#FEF3C7',
                        link: '/secretary/communication'
                    },
                    {
                        labelKey: 'secretary.dashboard.absentToday',
                        value: data.absent_today || '0',
                        icon: Clock,
                        color: '#EF4444',
                        bgColor: '#FEE2E2',
                        link: '/secretary/attendance'
                    },
                ];
                setStats(transformedStats);

                // For now, keep some mock or fetch from other endpoints if available
                setPendingTasks(data.pending_tasks || [
                    { id: 1, title: 'Review Application #1023', time: '2 hours ago', type: 'application' },
                    { id: 2, title: 'Verify Documents', time: '5 hours ago', type: 'doc' },
                ]);

                setEvents(data.upcoming_events || [
                    { id: 1, title: 'Parent-Teacher Meeting', date: 'Dec 15, 2025', time: '10:00 AM' },
                ]);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading dashboard...</div>;
    }

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>{t('secretary.dashboard.title')}</h1>
                <p>{t('secretary.dashboard.welcome')}</p>
            </header>

            {/* Quick Stats Grid */}
            <div className="secretary-stats-grid">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="stat-card cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => window.location.href = stat.link}
                    >
                        <div
                            className="stat-icon-wrapper"
                            style={{ backgroundColor: stat.bgColor, color: stat.color }}
                        >
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <p>{t(stat.labelKey)}</p>
                            <h3>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="secretary-widgets-grid">
                {/* Pending Tasks Widget */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>{t('secretary.dashboard.pendingTasks')}</h2>
                        <button className="view-all-btn">{t('secretary.dashboard.viewAll')}</button>
                    </div>
                    <div className="widget-body">
                        {pendingTasks.map((task) => (
                            <div key={task.id} className="task-item">
                                <div className="task-indicator" style={{
                                    backgroundColor:
                                        task.type === 'application' ? '#fbbf24' :
                                            task.type === 'admin' ? '#60a5fa' : '#9ca3af'
                                }} />
                                <div className="task-content">
                                    <h4>{task.title}</h4>
                                    <p>{task.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Events Calendar Widget */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>{t('secretary.dashboard.upcomingEvents')}</h2>
                        <CalendarIcon size={20} color="#9ca3af" />
                    </div>
                    <div className="widget-body">
                        {events.map((event) => (
                            <div key={event.id} className="event-item">
                                <div className="event-date">
                                    <span className="event-month">{event.date.split(' ')[0]}</span>
                                    <span className="event-day">{event.date.split(' ')[1]?.replace(',', '') || ''}</span>
                                </div>
                                <div className="task-content">
                                    <h4>{event.title}</h4>
                                    <p>{event.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecretaryDashboard;
