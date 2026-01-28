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

    // Compose Modal State
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [recipientSearchTerm, setRecipientSearchTerm] = useState('');
    const [recipientSearchResults, setRecipientSearchResults] = useState([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [newMessage, setNewMessage] = useState({
        recipient_id: null,
        recipient_name: '',
        subject: '',
        body: ''
    });

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

    // New Message Handlers
    const handleComposeClick = () => {
        setIsComposeOpen(true);
        setNewMessage({ recipient_id: null, recipient_name: '', subject: '', body: '' });
        setRecipientSearchTerm('');
        setRecipientSearchResults([]);
    };

    const handleUserSearch = async (term) => {
        setRecipientSearchTerm(term);
        if (term.length < 2) {
            setRecipientSearchResults([]);
            return;
        }

        setIsSearchingUsers(true);
        try {
            // Using the UserListApi endpoint with search param
            const response = await api.get('/users/', { params: { search: term } });
            setRecipientSearchResults(response.results || response);
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setIsSearchingUsers(false);
        }
    };

    const handleSelectRecipient = (user) => {
        setNewMessage(prev => ({ ...prev, recipient_id: user.id, recipient_name: user.full_name || user.email }));
        setRecipientSearchTerm('');
        setRecipientSearchResults([]);
    };

    const handleSendNewMessage = async () => {
        if (!newMessage.recipient_id) {
            alert('Please select a recipient from the search results.');
            return;
        }
        if (!newMessage.subject) {
            alert('Please enter a subject.');
            return;
        }
        if (!newMessage.body) {
            alert('Please enter a message body.');
            return;
        }

        try {
            await api.post('/user-messages/', {
                recipient_ids: [newMessage.recipient_id],
                subject: newMessage.subject,
                body: newMessage.body
            });

            setIsComposeOpen(false);
            fetchData(); // Refresh list to show sent message if applicable
            alert('Message sent successfully!');
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message. Please try again.');
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
                <Button variant="primary" icon={Plus} onClick={handleComposeClick}>{t('communication.newMessage')}</Button>
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

            {/* Compose Modal */}
            {
                isComposeOpen && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2>{t('communication.newMessage')}</h2>
                                <button onClick={() => setIsComposeOpen(false)} className={styles.closeBtn}>×</button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>{t('communication.recipient')}</label>
                                    {newMessage.recipient_name ? (
                                        <div className={styles.selectedRecipient}>
                                            <span>{newMessage.recipient_name}</span>
                                            <button onClick={() => setNewMessage(prev => ({ ...prev, recipient_id: null, recipient_name: '' }))} className={styles.removeRecipientBtn}>×</button>
                                        </div>
                                    ) : (
                                        <div className={styles.searchContainer}>
                                            <input
                                                type="text"
                                                placeholder="Search user by name or email..."
                                                value={recipientSearchTerm}
                                                onChange={(e) => handleUserSearch(e.target.value)}
                                                className={styles.input}
                                            />
                                            {recipientSearchResults.length > 0 && (
                                                <div className={styles.searchResults}>
                                                    {recipientSearchResults.map(user => (
                                                        <div key={user.id} onClick={() => handleSelectRecipient(user)} className={styles.searchResultItem}>
                                                            <div className={styles.resultName}>{user.full_name}</div>
                                                            <div className={styles.resultEmail}>{user.email}</div>
                                                            <div className={styles.resultRole}>{user.role}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{t('communication.subject')}</label>
                                    <input
                                        type="text"
                                        value={newMessage.subject}
                                        onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                                        className={styles.input}
                                        placeholder="Enter subject"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{t('communication.messageBody')}</label>
                                    <textarea
                                        value={newMessage.body}
                                        onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                                        className={styles.textarea}
                                        placeholder="Type your message here..."
                                        rows={6}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <Button variant="secondary" onClick={() => setIsComposeOpen(false)}>{t('common.cancel')}</Button>
                                <Button variant="primary" onClick={handleSendNewMessage} icon={Send}>{t('communication.send')}</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Communication;
