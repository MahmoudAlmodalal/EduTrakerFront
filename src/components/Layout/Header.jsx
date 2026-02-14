import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Bell, LogOut, Sun, Moon, Search, User, GraduationCap, X } from 'lucide-react';
import styles from './Header.module.css';
import notificationService from '../../services/notificationService';
import { useCachedApi } from '../../hooks/useCachedApi';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
    const { logout, user } = useAuth();
    const { t, theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const searchInputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Check if we have a valid token
    const hasValidToken = !!user && !!localStorage.getItem('accessToken');

    // Fetch notifications with caching (5 minute TTL)
    const {
        data: notificationsData,
        loading: notificationsLoading,
        refetch: refetchNotifications,
        error: notificationsError
    } = useCachedApi(
        () => notificationService.getNotifications({ page_size: 5 }),
        {
            enabled: hasValidToken,
            cacheKey: `notifications_${user?.id}`,
            ttl: 5 * 60 * 1000, // 5 minutes
            dependencies: [user?.id]
        }
    );

    // Fetch unread count with caching (2 minute TTL)
    const {
        data: unreadData,
        loading: unreadLoading,
        refetch: refetchUnreadCount,
        error: unreadError
    } = useCachedApi(
        () => notificationService.getUnreadCount(),
        {
            enabled: hasValidToken,
            cacheKey: `unread_count_${user?.id}`,
            ttl: 2 * 60 * 1000, // 2 minutes
            dependencies: [user?.id]
        }
    );

    // If we get 401 errors, logout the user
    useEffect(() => {
        if (notificationsError?.includes('401') || unreadError?.includes('401')) {
            logout();
        }
    }, [notificationsError, unreadError, logout]);

    const notifications = notificationsData?.results || notificationsData || [];
    const unreadCount = unreadData?.unread_count || 0;
    const loading = notificationsLoading || unreadLoading;

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            // Refresh both notifications and count
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
                // Refresh both notifications and count
                refetchNotifications();
                refetchUnreadCount();
            } catch (err) {
                console.error('Error marking notification read:', err);
            }
        }

        // Navigate to related object if available
        if (notif.action_url) {
            navigate(notif.action_url);
        } else {
            navigate('/super-admin/communication', { state: { activeTab: 'notifications' } });
        }
        setShowNotifications(false);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            // Implement search navigation or filtering logic here
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                {!isSidebarOpen && (
                    <button onClick={toggleSidebar} className={styles.logoIconToggle} title="Toggle Sidebar" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        <div className="_logoIcon_lgw59_28" style={{
                            width: '44px',
                            height: '44px',
                            background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                            color: 'white',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                            position: 'relative'
                        }}>
                            <GraduationCap size={24} />
                        </div>
                    </button>
                )}

                {/* Search Bar - Functional */}
                <div className={styles.searchContainer}>
                    <Search
                        size={16}
                        style={{ pointerEvents: 'none', color: 'var(--color-text-muted)' }}
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        name="q"
                        className={styles.searchInput}
                        placeholder="Search anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        autoComplete="off"
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-main)',
                            fontSize: 'var(--font-size-sm)',
                            border: 'none',
                            outline: 'none',
                            pointerEvents: 'auto',
                            position: 'relative',
                            zIndex: 100
                        }}
                    />
                    {searchQuery && (
                        <button
                            className={styles.clearBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchQuery('');
                            }}
                            title="Clear search"
                            type="button"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.right}>
                {/* Theme Toggle */}
                <button className={styles.themeToggle} onClick={toggleTheme} title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className={styles.divider}></div>

                <div style={{ position: 'relative' }}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notifications"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className={styles.dropdown} style={{
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
                                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-main)' }}>{t('header.notifications')}</h3>
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
                                {loading ? (
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
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-main)', marginBottom: '0.25rem', fontWeight: !notif.is_read ? 600 : 400 }}>{t(notif.title)}</p>
                                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t(notif.message)}</p>
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
                                        navigate('/super-admin/communication', { state: { activeTab: 'notifications' } });
                                    }}
                                    style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    {t('header.viewAll')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.divider}></div>

                <div className={styles.userSection} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-main)', lineHeight: 1 }}>{user?.displayName || user?.email || 'Admin'}</p>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{user?.role?.replace('_', ' ').toLowerCase() || 'super admin'}</p>
                    </div>
                </div>
            </div>
        </header >
    );
};

export default Header;
