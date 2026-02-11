import React from 'react';
import './Guardian.css';
import { Bell, Calendar, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import guardianService from '../../services/guardianService';
import notificationService from '../../services/notificationService';

const normalizeList = (value) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (Array.isArray(value?.results)) {
        return value.results;
    }
    return [];
};

const GuardianDashboard = () => {
    const { t } = useTheme();
    const queryClient = useQueryClient();

    const {
        data: dashboardData,
        isLoading: dashboardLoading,
        error: dashboardError,
        refetch: refetchDashboard
    } = useQuery({
        queryKey: ['guardian', 'dashboard'],
        queryFn: ({ signal }) => guardianService.getDashboardStats({ signal })
    });

    const {
        data: notificationsData,
        isLoading: notificationsLoading,
        error: notificationsError,
        refetch: refetchNotifications
    } = useQuery({
        queryKey: ['guardian', 'notifications'],
        queryFn: ({ signal }) => guardianService.getNotifications({ signal })
    });

    const updateNotificationsCache = (updater) => {
        queryClient.setQueryData(['guardian', 'notifications'], (oldData) => {
            const current = normalizeList(oldData);
            if (current.length === 0) {
                return oldData;
            }

            const updated = updater(current);

            if (Array.isArray(oldData)) {
                return updated;
            }

            if (oldData && typeof oldData === 'object') {
                return {
                    ...oldData,
                    results: updated
                };
            }

            return {
                results: updated
            };
        });
    };

    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['guardian', 'notifications'] });
            const previous = queryClient.getQueryData(['guardian', 'notifications']);
            updateNotificationsCache((items) => items.map((item) => ({ ...item, is_read: true })));
            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['guardian', 'notifications'], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['guardian', 'notifications'] });
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: (notificationId) => notificationService.markAsRead(notificationId),
        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: ['guardian', 'notifications'] });
            const previous = queryClient.getQueryData(['guardian', 'notifications']);
            updateNotificationsCache((items) =>
                items.map((item) =>
                    item.id === notificationId ? { ...item, is_read: true } : item
                )
            );
            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['guardian', 'notifications'], context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['guardian', 'notifications'] });
        }
    });

    const stats = dashboardData?.statistics;
    const children = normalizeList(stats?.children);
    const notifications = normalizeList(notificationsData);
    const upcomingEvents = normalizeList(stats?.upcoming_events);
    const loading = dashboardLoading || notificationsLoading;
    const error = dashboardError || notificationsError;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="guardian-dashboard">
                <h1 className="guardian-page-title">{t('guardian.dashboard.title')}</h1>
                <div className="guardian-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-red-500" />
                        <div>{error.message || t('common.somethingWentWrong') || 'Failed to load dashboard data.'}</div>
                    </div>
                    <button className="btn-primary" onClick={() => { refetchDashboard(); refetchNotifications(); }}>
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
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
                        {children.map(child => (
                            <div key={child.id} className="child-summary-item">
                                <div className="child-avatar">{child.name.charAt(0)}</div>
                                <div>
                                    <div className="child-name">{child.name}</div>
                                    <div className="child-details">{child.grade} • {t('guardian.dashboard.gpa')}: {child.gpa}</div>
                                </div>
                            </div>
                        ))}
                        {children.length === 0 && (
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
                                    onClick={() => markAllAsReadMutation.mutate()}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                    disabled={markAllAsReadMutation.isPending}
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
                                onClick={() => {
                                    if (!notif.is_read) {
                                        markAsReadMutation.mutate(notif.id);
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
                                    <div className="event-month">{event.date?.split(' ')?.[0] || '-'}</div>
                                    <div className="event-day">{event.date?.split(' ')?.[1]?.replace(',', '') || '-'}</div>
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
