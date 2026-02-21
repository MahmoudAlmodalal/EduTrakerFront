import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCachedApi } from '../../hooks/useCachedApi';
import notificationService from '../../services/notificationService';
import headerStyles from '../Layout/Header.module.css';

const NotificationDropdown = ({ communicationPath, allowedRoutePrefixes }) => {
    const { t } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    const hasValidToken = !!user && !!sessionStorage.getItem('accessToken');

    const {
        data: unreadData,
        error: unreadError,
        refetch: refetchUnreadCount
    } = useCachedApi(
        () => notificationService.getUnreadCount(),
        {
            enabled: hasValidToken,
            cacheKey: `unread_count_${user?.id}`,
            ttl: 2 * 60 * 1000,
            dependencies: [user?.id]
        }
    );

    const {
        data: notificationsData,
        loading: notificationsLoading,
        refetch: refetchNotifications,
        error: notificationsError
    } = useCachedApi(
        () => notificationService.getNotifications({ page_size: 5 }),
        {
            enabled: hasValidToken,
            cacheKey: `notifications_${user?.id}_${communicationPath}`,
            ttl: 5 * 60 * 1000,
            dependencies: [user?.id]
        }
    );

    React.useEffect(() => {
        if (unreadError?.includes('401') || notificationsError?.includes('401')) {
            logout();
            navigate('/login');
        }
    }, [unreadError, notificationsError, logout, navigate]);

    const notifications = notificationsData?.results || notificationsData || [];
    const unreadCount = unreadData?.unread_count || 0;

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            refetchNotifications();
            refetchUnreadCount();
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await notificationService.markAsRead(notif.id);
                refetchNotifications();
                refetchUnreadCount();
            } catch (err) {
                console.error('Error marking notification read:', err);
            }
        }

        const actionUrl = typeof notif.action_url === 'string' ? notif.action_url.trim() : '';
        const isAllowedRoute = actionUrl && allowedRoutePrefixes.some(prefix => actionUrl.startsWith(prefix));
        navigate(isAllowedRoute ? actionUrl : communicationPath, isAllowedRoute ? undefined : { state: { activeTab: 'notifications' } });
        setShowNotifications(false);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                className={headerStyles.iconBtn}
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && <span className={headerStyles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {showNotifications && (
                <div style={{
                    position: 'absolute',
                    top: '120%',
                    insetInlineEnd: 0,
                    width: '320px',
                    backgroundColor: 'var(--color-bg-surface)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--color-border)',
                    zIndex: 100,
                    overflow: 'hidden',
                    animation: 'scaleIn var(--transition-normal)'
                }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {t('header.notifications')}
                        </h3>
                        {unreadCount > 0 && (
                            <span
                                onClick={handleMarkAllRead}
                                style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {t('header.markAllRead')}
                            </span>
                        )}
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {notificationsLoading ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: 'var(--font-size-sm)' }}>{t('header.noNotifications')}</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: '1px solid var(--color-border-subtle)',
                                        backgroundColor: !notif.is_read ? 'var(--color-primary-light)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-main)', marginBottom: '0.25rem', fontWeight: !notif.is_read ? 600 : 400 }}>
                                        {t(notif.title)}
                                    </p>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {t(notif.message)}
                                    </p>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                        {new Date(notif.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                setShowNotifications(false);
                                navigate(communicationPath, { state: { activeTab: 'notifications' } });
                            }}
                            style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            {t('header.viewAll')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
