import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Send, Plus, MessageSquare, Search, ChevronLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import styles from './Communication.module.css';
import { api } from '../../utils/api';

const Communication = () => {
    const { t } = useTheme();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('internal');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [msgsData, notifsData] = await Promise.all([
                api.get('/user-messages/'),
                api.get('/notifications/')
            ]);
            setMessages(msgsData.results || msgsData);
            setNotifications(notifsData.results || notifsData);
        } catch (err) {
            console.error('Error fetching communication data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
        fetchData();
    }, [location.state]);

    const handleMessageClick = async (msg) => {
        setSelectedMessage(msg);
        if (!msg.read) {
            try {
                await api.post(`/user-messages/${msg.id}/read/`);
                setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m));
            } catch (err) {
                console.error('Error marking message read:', err);
            }
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            try {
                await api.post(`/notifications/${notif.id}/mark-read/`);
                setNotifications(notifs => notifs.map(n => n.id === notif.id ? { ...n, read: true } : n));
            } catch (err) {
                console.error('Error marking notification read:', err);
            }
        }
    };

    const filteredItems = activeTab === 'notifications'
        ? notifications
        : messages.filter(m => (m.type === activeTab || !m.type) && (
            (m.sender_name || m.sender_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
        ));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('communication.title')}</h1>
                    <p className={styles.subtitle}>{t('communication.subtitle')}</p>
                </div>
                <Button variant="primary" icon={Plus}>{t('communication.newMessage')}</Button>
            </div>

            <div className={styles.layout}>
                {/* Sidebar / List */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.searchWrapper}>
                            <Search size={18} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder={activeTab === 'notifications' ? t('communication.searchNotifications') : t('communication.searchMessages')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <div className={styles.tabs}>
                            {['internal', 'external', 'notifications'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSelectedMessage(null); }}
                                    className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
                                >
                                    {t(`communication.tabs.${tab}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.list}>
                        {loading ? (
                            <div className={styles.emptyState}>Loading...</div>
                        ) : filteredItems.length === 0 ? (
                            <div className={styles.emptyState}>{t('communication.noItems')}</div>
                        ) : activeTab === 'notifications' ? (
                            filteredItems.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`${styles.listItem} ${!notif.read ? styles.unread : ''}`}
                                >
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemSender}>{notif.title || notif.notification_type}</span>
                                        <span className={styles.itemDate}>{new Date(notif.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.itemPreview}>{notif.message}</div>
                                </div>
                            ))
                        ) : (
                            filteredItems.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleMessageClick(msg)}
                                    className={`${styles.listItem} ${selectedMessage?.id === msg.id ? styles.active : ''} ${!msg.read ? styles.unread : ''}`}
                                >
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemSender}>{msg.sender_name || msg.sender_email}</span>
                                        <span className={styles.itemDate}>{new Date(msg.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.itemSubject}>{msg.subject}</div>
                                    <div className={styles.itemPreview}>{msg.body}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className={styles.contentArea}>
                    {activeTab === 'notifications' ? (
                        <div className={styles.emptyState}>
                            <MessageSquare size={64} className={styles.emptyIcon} />
                            <h3>{t('communication.notificationCenter')}</h3>
                            <p>{t('communication.notificationHint')}</p>
                        </div>
                    ) : selectedMessage ? (
                        <>
                            <div className={styles.contentHeader}>
                                <h2 className={styles.subjectLine}>{selectedMessage.subject}</h2>
                                <div className={styles.senderProfile}>
                                    <div className={styles.senderAvatar}>
                                        {(selectedMessage.sender_name || selectedMessage.sender_email || '?').charAt(0)}
                                    </div>
                                    <div>
                                        <div className={styles.itemSender}>{selectedMessage.sender_name || selectedMessage.sender_email}</div>
                                        <div className={styles.itemDate}>
                                            {t('communication.to')} Super Admin &bull; {new Date(selectedMessage.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.body}>
                                {selectedMessage.body}
                            </div>

                            <div className={styles.footer}>
                                <div className={styles.replyField}>
                                    <input
                                        type="text"
                                        placeholder={t('communication.typeReply')}
                                        className={styles.replyInput}
                                    />
                                    <Button variant="primary" icon={Send}>{t('communication.send')}</Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <MessageSquare size={80} className={styles.emptyIcon} />
                            <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('communication.selectMessage')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Communication;
