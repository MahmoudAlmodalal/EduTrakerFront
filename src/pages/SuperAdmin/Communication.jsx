import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Send, Plus, MessageSquare, Search, ChevronLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import styles from './Communication.module.css';
import { api } from '../../utils/api';

const Communication = () => {
    const { t } = useTheme();
    const { showSuccess, showError, showWarning, showInfo } = useToast();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('received');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyBody, setReplyBody] = useState('');
    const { user } = useAuth();

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
        if (!user) return;
        setLoading(true);
        try {
            const [msgsData, notifsData] = await Promise.all([
                api.get('/user-messages/'),
                api.get('/notifications/')
            ]);

            const rawMessages = msgsData.results || msgsData;

            console.log('=== ADMIN: DEBUG Fetched Messages ===');
            console.log('Total messages:', rawMessages.length);
            console.log('First message:', rawMessages[0]);
            console.log('Current user ID:', user?.id);

            // Map read status based on current user's receipt
            const mappedMessages = rawMessages.map(m => {
                const myReceipt = m.receipts?.find(r => r.recipient?.id === user?.id);
                const isSentByMe = m.sender?.id === user?.id;

                console.log(`Message ${m.id}:`, {
                    sender: m.sender,
                    senderName: m.sender?.full_name,
                    receipts: m.receipts,
                    isSentByMe
                });

                return {
                    ...m,
                    type: isSentByMe ? 'sent' : 'received',
                    read: myReceipt ? myReceipt.is_read : true // If I'm sender, treat as read
                };
            });

            setMessages(mappedMessages);
            setNotifications(notifsData.results || notifsData);
        } catch (err) {
            console.error('Error fetching communication data:', err);
            showError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
        fetchData();
    }, [location.state, user]);

    const handleMessageClick = async (msg) => {
        setSelectedMessage(msg);

        // Only mark read if current user is a recipient and it's unread
        const myReceipt = msg.receipts?.find(r => r.recipient?.id === user?.id);

        if (activeTab !== 'notifications' && !msg.read && myReceipt) {
            try {
                await api.post(`/user-messages/${msg.id}/read/`);
                setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m));
            } catch (err) {
                console.error('Error marking message read:', err);
            }
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await api.post(`/notifications/${notif.id}/mark-read/`);
                setNotifications(notifs => notifs.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
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
            const results = response.results || response;
            setRecipientSearchResults(results);

            // Auto-select if exact email match found
            const exactMatch = results.find(user => user.email.toLowerCase() === term.toLowerCase());
            if (exactMatch) {
                handleSelectRecipient(exactMatch);
            }
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

    const handleCloseCompose = () => {
        setIsComposeOpen(false);
        setRecipientSearchTerm('');
        setRecipientSearchResults([]);
        setNewMessage({ recipient_id: null, recipient_name: '', subject: '', body: '' });
    };

    const handleSendNewMessage = async () => {
        console.log('Sending message:', newMessage);
        if (!newMessage.recipient_id) {
            showWarning('Please select a recipient from the search results.');
            return;
        }
        if (!newMessage.body || !newMessage.body.trim()) {
            showWarning('Please enter a message body.');
            return;
        }

        try {
            const payload = {
                recipient_ids: [newMessage.recipient_id],
                subject: newMessage.subject || '',
                body: newMessage.body
            };
            console.log('Payload:', payload);
            await api.post('/user-messages/', payload);

            handleCloseCompose();
            fetchData(); // Refresh list to show sent message if applicable
            showSuccess('Message sent successfully!');
        } catch (err) {
            console.error('Error sending message:', err);
            console.error('Error details:', err.response?.data);

            // Handle different error formats from backend
            let errorMessage = 'Please try again.';
            if (err.response?.data) {
                const errorData = err.response.data;
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.recipient_ids) {
                    errorMessage = `Recipient error: ${Array.isArray(errorData.recipient_ids) ? errorData.recipient_ids[0] : errorData.recipient_ids}`;
                } else if (errorData.body) {
                    errorMessage = `Body error: ${Array.isArray(errorData.body) ? errorData.body[0] : errorData.body}`;
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            showError('Failed to send message. ' + errorMessage);
        }
    };

    const handleSendReply = async () => {
        if (!replyBody.trim()) return;

        console.log('=== ADMIN: DEBUG Reply ===');
        console.log('Selected Message:', selectedMessage);
        console.log('User ID:', user?.id);
        console.log('Sender:', selectedMessage.sender);
        console.log('Receipts:', selectedMessage.receipts);

        try {
            // Re-use current message details for reply
            // If I am the sender, I reply to the first recipient (for simple 1-1)
            // If I am not the sender, I reply to the sender
            let targetRecipientId = null;

            if (selectedMessage.sender?.id === user?.id) {
                // I am the sender, find the recipient from receipts
                const receipts = selectedMessage.receipts || [];
                console.log('Admin is sender, looking at receipts:', receipts);

                if (receipts.length > 0 && receipts[0]?.recipient?.id) {
                    targetRecipientId = receipts[0].recipient.id;
                    console.log('Target recipient from receipts:', targetRecipientId);
                } else {
                    showError('Could not determine recipient. This message has no recipients.');
                    console.error('No recipients found in receipts array');
                    return;
                }
            } else {
                // I am a recipient, reply to the sender
                console.log('Admin is recipient, replying to sender');

                if (selectedMessage.sender?.id) {
                    targetRecipientId = selectedMessage.sender.id;
                    console.log('Target recipient (sender):', targetRecipientId);
                } else {
                    showError('Could not determine sender. Sender information is missing from this message.');
                    console.error('Sender is missing:', selectedMessage.sender);
                    console.error('Full message data:', JSON.stringify(selectedMessage, null, 2));
                    return;
                }
            }

            if (!targetRecipientId) {
                showError('Could not determine recipient for reply.');
                return;
            }

            const payload = {
                recipient_ids: [targetRecipientId],
                subject: `Re: ${selectedMessage.subject}`,
                body: replyBody,
                thread_id: selectedMessage.thread_id,
                parent_message: selectedMessage.id
            };
            console.log('Reply Payload:', payload);
            await api.post('/user-messages/', payload);

            setReplyBody('');
            showSuccess('Reply sent successfully!');
            fetchData();
        } catch (err) {
            console.error('Error sending reply:', err);
            showError('Failed to send reply. ' + (err.response?.data?.detail || 'Please try again.'));
        }
    };

    const filteredItems = activeTab === 'notifications'
        ? notifications
        : messages.filter(m => {
            // Filter by tab type (sent/received)
            const typeMatch = m.type === activeTab;

            // Filter by search query
            const searchLower = searchTerm.toLowerCase();
            const senderMatch = (m.sender?.full_name || m.sender?.email || '').toLowerCase().includes(searchLower);
            const subjectMatch = (m.subject || '').toLowerCase().includes(searchLower);
            const bodyMatch = (m.body || '').toLowerCase().includes(searchLower);

            return typeMatch && (senderMatch || subjectMatch || bodyMatch);
        });

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
                            {['received', 'sent', 'notifications'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSelectedMessage(null); }}
                                    className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
                                >
                                    {t(`communication.${tab}`)}
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
                                    className={`${styles.listItem} ${!notif.is_read ? styles.unread : ''}`}
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
                                        <span className={styles.itemSender}>{msg.sender?.full_name || msg.sender?.email || 'System'}</span>
                                        <span className={styles.itemDate}>{new Date(msg.sent_at || msg.created_at).toLocaleDateString()}</span>
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
                                        {(selectedMessage.sender?.full_name || selectedMessage.sender?.email || '?').charAt(0)}
                                    </div>
                                    <div>
                                        <div className={styles.itemSender}>{selectedMessage.sender?.full_name || selectedMessage.sender?.email}</div>
                                        <div className={styles.itemDate}>
                                            {selectedMessage.type === 'sent'
                                                ? `${t('communication.to')}: ${selectedMessage.receipts?.[0]?.recipient?.full_name || selectedMessage.receipts?.[0]?.recipient?.email || '...'}`
                                                : `${t('communication.from')}: ${selectedMessage.sender?.full_name || selectedMessage.sender?.email}`}
                                            &bull; {new Date(selectedMessage.sent_at || selectedMessage.created_at).toLocaleString()}
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
                                        value={replyBody}
                                        onChange={(e) => setReplyBody(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                    />
                                    <Button variant="primary" icon={Send} onClick={handleSendReply}>{t('communication.send')}</Button>
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
                                <h2>{t('communication.compose')}</h2>
                                <button className={styles.closeBtn} onClick={handleCloseCompose}>&times;</button>
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
                                            <Search size={18} className={styles.searchIcon} />
                                            <input
                                                type="text"
                                                className={styles.searchInput}
                                                placeholder={t('communication.searchPlaceholder')}
                                                value={recipientSearchTerm} // Assuming recipientSearchTerm and handleUserSearch are still used
                                                onChange={(e) => handleUserSearch(e.target.value)} // Assuming recipientSearchTerm and handleUserSearch are still used
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
