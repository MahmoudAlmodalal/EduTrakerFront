import React from 'react';
import { Search, Bell, Clock } from 'lucide-react';
import styles from './Communication.module.css';
import { useTheme } from '../../../context/ThemeContext';

const resolveText = (value, fallbackKey, fallbackText) => {
    if (!value || value === fallbackKey) {
        return fallbackText;
    }
    return value;
};

const CommunicationList = ({
    items,
    activeTab,
    selectedItemId,
    onItemClick,
    loading,
    searchTerm,
    onSearchChange,
    onMarkAllRead,
    onMarkNotificationRead
}) => {
    const { t } = useTheme();
    const noNotificationsText = resolveText(
        t('communication.noNotifications'),
        'communication.noNotifications',
        'No notifications'
    );
    const markAsReadText = resolveText(
        t('header.markAsRead'),
        'header.markAsRead',
        'Mark as read'
    );

    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
                <div className={styles.searchContainer}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder={activeTab === 'notifications' ? t('communication.searchNotifications') : t('communication.searchMessages')}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {activeTab === 'notifications' && items.some((notification) => !notification.is_read) && (
                    <div className={styles.markAllContainer}>
                        <button onClick={onMarkAllRead} className={styles.markAllBtn}>
                            {t('header.markAllRead')}
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.list}>
                {loading ? (
                    <div className={styles.emptyState}>{t('common.loading')}</div>
                ) : items.length === 0 ? (
                    <div className={styles.emptyState}>
                        {activeTab === 'notifications' && <Bell size={20} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />}
                        {activeTab === 'notifications' ? noNotificationsText : t('communication.noItems')}
                    </div>
                ) : activeTab === 'notifications' ? (
                    items.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => onItemClick(notification)}
                            style={{
                                padding: '1.5rem',
                                borderBottom: '1px solid var(--color-border)',
                                display: 'flex',
                                gap: '1.25rem',
                                backgroundColor: notification.is_read ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.03)',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            {!notification.is_read && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '4px',
                                        background: 'var(--color-primary)'
                                    }}
                                />
                            )}
                            <div
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'var(--color-bg-body)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-primary)'
                                }}
                            >
                                <Bell size={22} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '4px' }}>
                                    <h4
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            color: 'var(--color-text-main)',
                                            margin: 0
                                        }}
                                    >
                                        {notification.title || 'Notification'}
                                    </h4>
                                    <span
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--color-text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Clock size={14} />
                                        {new Date(notification.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p
                                    style={{
                                        fontSize: '0.925rem',
                                        color: 'var(--color-text-muted)',
                                        margin: '0.5rem 0 0',
                                        lineHeight: '1.5'
                                    }}
                                >
                                    {notification.message || notification.content}
                                </p>
                                {!notification.is_read && (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onMarkNotificationRead?.(notification.id);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            color: 'var(--color-primary)',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            marginTop: '0.5rem'
                                        }}
                                    >
                                        {markAsReadText}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    items.map((message) => (
                        <div
                            key={message.id}
                            onClick={() => onItemClick(message)}
                            className={`${styles.listItem} ${selectedItemId === message.id ? styles.active : ''} ${!message.read ? styles.unread : ''}`}
                        >
                            <div className={styles.itemHeader}>
                                <span className={styles.itemSender}>{message.partner?.full_name || message.partner?.email || 'System'}</span>
                                <span className={styles.itemDate}>{new Date(message.sent_at || message.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.itemSubject}>
                                {message.subject}
                                {message.unread_count > 0 && <span className={styles.unreadBadge}>{message.unread_count}</span>}
                            </div>
                            <div className={styles.itemPreview}>{message.body}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommunicationList;
