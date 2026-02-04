import React from 'react';
import { Search, Bell, MessageSquare } from 'lucide-react';
import styles from './Communication.module.css';
import { useTheme } from '../../../context/ThemeContext';

const CommunicationList = ({
    items,
    activeTab,
    selectedItemId,
    onItemClick,
    loading,
    searchTerm,
    onSearchChange,
    onMarkAllRead
}) => {
    const { t } = useTheme();

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

                {activeTab === 'notifications' && items.some(n => !n.is_read) && (
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
                    <div className={styles.emptyState}>{t('communication.noItems')}</div>
                ) : activeTab === 'notifications' ? (
                    items.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => onItemClick(notif)}
                            className={`${styles.listItem} ${!notif.is_read ? styles.unread : ''}`}
                        >
                            <div className={styles.itemHeader}>
                                <span className={styles.itemSender}>{t((notif.title || notif.notification_type || '').trim())}</span>
                                <span className={styles.itemDate}>{new Date(notif.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.itemPreview}>{t(notif.message)}</div>
                        </div>
                    ))
                ) : (
                    items.map(msg => (
                        <div
                            key={msg.id}
                            onClick={() => onItemClick(msg)}
                            className={`${styles.listItem} ${selectedItemId === msg.id ? styles.active : ''} ${!msg.read ? styles.unread : ''}`}
                        >
                            <div className={styles.itemHeader}>
                                <span className={styles.itemSender}>{msg.partner?.full_name || msg.partner?.email || 'System'}</span>
                                <span className={styles.itemDate}>{new Date(msg.sent_at || msg.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.itemSubject}>
                                {msg.subject}
                                {msg.unread_count > 0 && <span className={styles.unreadBadge}>{msg.unread_count}</span>}
                            </div>
                            <div className={styles.itemPreview}>{msg.body}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommunicationList;
