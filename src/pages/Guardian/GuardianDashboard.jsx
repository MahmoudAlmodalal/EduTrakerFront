import React, { useState, useEffect } from 'react';
import './Guardian.css';
import { Bell, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import guardianService from '../../services/guardianService';
import notificationService from '../../services/notificationService';

const GuardianDashboard = () => {
    const { t } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]); // Still mocked as no backend yet

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, notificationsRes] = await Promise.all([
                    guardianService.getDashboardStats(),
                    guardianService.getNotifications()
                ]);
                setStats(statsRes.statistics);
                setNotifications(notificationsRes.results || []);

                // Mock events for now as they don't exist in backend
                setUpcomingEvents([
                    { id: 1, title: "Math Midterm", date: "Oct 20, 2025", child: "Ahmed" },
                    { id: 2, title: "Science Fair", date: "Oct 25, 2025", child: "Sara" }
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
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="guardian-dashboard">
            <h1 className="guardian-page-title">{t('guardian.dashboard.title')}</h1>

            <div className="guardian-dashboard-grid">
                {/* Children Summary */}
                <div className="guardian-card">
                    <div className="guardian-card-header">
                        <h3>{t('guardian.dashboard.childrenOverview')}</h3>
                        <TrendingUp size={20} color="#4f46e5" />
                    </div>
                    <div className="children-list">
                        {stats?.children?.map(child => (
                            <div key={child.id} className="child-summary-item">
                                <div className="child-avatar">{child.name.charAt(0)}</div>
                                <div>
                                    <div className="child-name">{child.name}</div>
                                    <div className="child-details">{child.grade} • {t('guardian.dashboard.gpa')}: {child.gpa}</div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.children || stats.children.length === 0) && (
                            <div className="text-muted text-center py-4">{t('noData')}</div>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                <div className="guardian-card">
                    <div className="guardian-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>{t('guardian.dashboard.recentNotifications')}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {notifications.some(n => !n.is_read) && (
                                <button
                                    onClick={async () => {
                                        await notificationService.markAllAsRead();
                                        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    {t('header.markAllRead')}
                                </button>
                            )}
                            <Bell size={20} color="#f59e0b" />
                        </div>
                    </div>
                    <div className="notifications-list">
                        {notifications.slice(0, 5).map(notif => (
                            <div
                                key={notif.id}
                                className={`notification-item ${notif.is_read ? '' : 'unread'}`}
                                onClick={async () => {
                                    if (!notif.is_read) {
                                        await notificationService.markAsRead(notif.id);
                                        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="notification-title" style={{ fontWeight: !notif.is_read ? 600 : 500 }}>{notif.title}</div>
                                <div className="notification-message">{notif.message || notif.content}</div>
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <div className="text-muted text-center py-4">{t('common.noNotifications')}</div>
                        )}
                    </div>
                </div>

                {/* Important Dates */}
                <div className="guardian-card">
                    <div className="guardian-card-header">
                        <h3>{t('guardian.dashboard.upcomingEvents')}</h3>
                        <Calendar size={20} color="#3b82f6" />
                    </div>
                    <div className="events-list">
                        {upcomingEvents.map(event => (
                            <div key={event.id} className="event-item">
                                <div className="event-date-box">
                                    <div className="event-month">{event.date.split(' ')[0]}</div>
                                    <div className="event-day">{event.date.split(' ')[1].replace(',', '')}</div>
                                </div>
                                <div>
                                    <div className="event-title">{event.title}</div>
                                    <div className="event-child">{t('guardian.dashboard.for')}: {event.child}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuardianDashboard;

