import React, { useState, useEffect, useRef } from 'react';
import { Plus, MessageSquare, ChevronLeft } from 'lucide-react';
import Button from '../../ui/Button';
import styles from './Communication.module.css';
import CommunicationList from './CommunicationList';
import CommunicationForm from './CommunicationForm';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../ui/Toast';
import { api } from '../../../utils/api';
import notificationService from '../../../services/notificationService';

const CommunicationView = ({ role = 'user' }) => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();

    const [activeTab, setActiveTab] = useState('messages');
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [threadMessages, setThreadMessages] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const threadEndRef = useRef(null);

    const scrollToBottom = () => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (threadMessages.length > 0) {
            scrollToBottom();
        }
    }, [threadMessages]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [msgsData, notifsData] = await Promise.all([
                api.get('/user-messages/'),
                notificationService.getNotifications()
            ]);

            const rawMessages = msgsData.results || msgsData;

            // Group messages by partner for the sidebar
            const conversationsMap = {};
            rawMessages.forEach(m => {
                const isSentByMe = m.sender?.id === user?.id;
                const partner = isSentByMe
                    ? (m.receipts?.[0]?.recipient || { id: 'unknown', full_name: 'Unknown' })
                    : m.sender;

                if (!partner || !partner.id) return; // Skip if partner is undefined or has no ID

                // Initialize conversation if it doesn't exist or if this message is newer
                if (!conversationsMap[partner.id]) {
                    conversationsMap[partner.id] = {
                        ...m,
                        partner,
                        unread_count: 0, // Initialize unread count
                        read: true // Default to read, will be updated below
                    };
                }

                // Update unread count and read status for the conversation
                const myReceipt = m.receipts?.find(r => r.recipient?.id === user?.id);
                if (!isSentByMe && myReceipt && !myReceipt.is_read) {
                    conversationsMap[partner.id].unread_count = (conversationsMap[partner.id].unread_count || 0) + 1;
                    conversationsMap[partner.id].read = false;
                }

                // Always keep the latest message as the conversation summary
                if (new Date(m.sent_at) > new Date(conversationsMap[partner.id].sent_at)) {
                    conversationsMap[partner.id] = {
                        ...conversationsMap[partner.id], // Keep existing unread_count
                        ...m, // Overwrite with latest message details
                        partner,
                    };
                }
            });

            setMessages(Object.values(conversationsMap).sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)));
            setNotifications(notifsData?.results || (Array.isArray(notifsData) ? notifsData : []));
        } catch (err) {
            console.error('Error fetching communication data:', err);
            showError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (partnerId) => {
        setLoadingThread(true);
        try {
            const response = await api.get('/user-messages/', { params: { peer_id: partnerId } });
            const history = response.results || response;
            setThreadMessages(history);

            // Mark unread messages in this conversation as read
            const unreadMsgs = history.filter(m => {
                const myReceipt = m.receipts?.find(r => r.recipient?.id === user?.id);
                return m.sender?.id !== user?.id && myReceipt && !myReceipt.is_read;
            });

            if (unreadMsgs.length > 0) {
                await Promise.all(unreadMsgs.map(m => api.post(`/user-messages/${m.id}/read/`)));
                // Update local status
                setMessages(prev => prev.map(conv =>
                    conv.partner.id === partnerId ? { ...conv, read: true, unread_count: 0 } : conv
                ));
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingThread(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleItemClick = async (item) => {
        if (activeTab === 'notifications') {
            setSelectedItem(item);
            if (!item.is_read) {
                try {
                    await notificationService.markAsRead(item.id);
                    setNotifications(notifs => notifs.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                } catch (err) {
                    console.error('Error marking notification read:', err);
                }
            }
        } else {
            setSelectedItem(item);
            setThreadMessages([]);
            fetchHistory(item.partner.id);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifs => notifs.map(n => ({ ...n, is_read: true })));
            showSuccess('All notifications marked as read');
        } catch (err) {
            showError('Failed to mark notifications as read');
        }
    };

    const handleBackToList = () => {
        setSelectedItem(null);
    };

    const filteredItems = activeTab === 'notifications'
        ? notifications.filter(n =>
            (n.title || n.notification_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (n.message || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        : messages.filter(m =>
            (m.partner?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.partner?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.body || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('communication.title')}</h1>
                    <p className={styles.subtitle}>{t('communication.subtitle')}</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={() => setIsComposeOpen(true)}>
                    {t('communication.newMessage')}
                </Button>
            </div>

            <div className={styles.layout}>
                <div className={styles.sidebarWrapper}>
                    <div className={styles.tabs}>
                        {['messages', 'notifications'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSelectedItem(null); }}
                                className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
                            >
                                {t(`communication.${tab}`)}
                            </button>
                        ))}
                    </div>
                    <CommunicationList
                        items={filteredItems}
                        activeTab={activeTab}
                        selectedItemId={selectedItem?.id}
                        onItemClick={handleItemClick}
                        loading={loading}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onMarkAllRead={handleMarkAllNotificationsRead}
                    />
                </div>

                <div className={`${styles.contentArea} ${selectedItem ? styles.contentActive : ''}`}>
                    {selectedItem ? (
                        <>
                            <div className={styles.contentHeader}>
                                <button className={styles.backBtn} onClick={handleBackToList}>
                                    <ChevronLeft size={20} />
                                </button>
                                <h2 className={styles.subjectLine}>{selectedItem.partner?.full_name || selectedItem.partner?.email}</h2>
                                {activeTab !== 'notifications' && (
                                    <div className={styles.senderProfile}>
                                        <div className={styles.senderAvatar}>
                                            {(selectedItem.partner?.full_name || selectedItem.partner?.email || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <div className={styles.itemSender}>{selectedItem.partner?.full_name || selectedItem.partner?.email}</div>
                                            <div className={styles.itemDate}>
                                                {new Date(selectedItem.sent_at || selectedItem.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.body}>
                                {activeTab === 'notifications' ? (
                                    <div className={styles.notificationContent}>
                                        <p>{t(selectedItem.message)}</p>
                                    </div>
                                ) : loadingThread ? (
                                    <div className={styles.threadLoading}>{t('common.loading')}</div>
                                ) : (
                                    <>
                                        {threadMessages.map(m => (
                                            <div
                                                key={m.id}
                                                className={`${styles.messageBubble} ${m.sender?.id === user?.id ? styles.sentMessage : styles.receivedMessage}`}
                                            >
                                                <div className={styles.messageBody}>{m.body}</div>
                                                <div className={styles.messageMeta}>
                                                    <span>{m.sender?.full_name || m.sender?.email}</span>
                                                    <span>{new Date(m.sent_at).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={threadEndRef} />
                                    </>
                                )}
                            </div>

                            {activeTab !== 'notifications' && (
                                <div className={styles.footer}>
                                    <CommunicationForm
                                        isReply={true}
                                        parentMessage={selectedItem}
                                        onSuccess={() => {
                                            fetchData();
                                            fetchHistory(selectedItem.partner.id);
                                            showSuccess(t('communication.replySent'));
                                        }}
                                        initialRecipient={selectedItem.partner}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <MessageSquare size={80} className={styles.emptyIcon} />
                            <p>{t('communication.selectMessage')}</p>
                        </div>
                    )}
                </div>
            </div>

            {isComposeOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{t('communication.compose')}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsComposeOpen(false)}>&times;</button>
                        </div>
                        <CommunicationForm
                            onSuccess={() => { setIsComposeOpen(false); fetchData(); }}
                            onCancel={() => setIsComposeOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunicationView;
