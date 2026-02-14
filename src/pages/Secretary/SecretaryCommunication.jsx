import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, MessageSquare, Plus, Send, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/ui/Toast';
import notificationService from '../../services/notificationService';
import secretaryService from '../../services/secretaryService';
import { AvatarInitial, EmptyState, LoadingSpinner, PageHeader } from './components';
import './Secretary.css';

const SecretaryCommunication = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('received');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingThread, setLoadingThread] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [threadMessages, setThreadMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (location.state?.activeTab) {
            const targetTab = location.state.activeTab === 'internal' ? 'received' : location.state.activeTab;
            setActiveTab(targetTab);
        }
    }, [location.state]);

    const fetchData = useCallback(async () => {
        if (!user) {
            return;
        }

        try {
            setLoading(true);

            const [messagesRes, notificationsRes] = await Promise.all([
                secretaryService.getMessages(),
                notificationService.getNotifications(),
            ]);

            const rawMessages = messagesRes.results || messagesRes || [];
            const mappedMessages = rawMessages.map((message) => {
                const myReceipt = message.receipts?.find((receipt) => receipt.recipient?.id === user.id);
                const isSentByMe = message.sender?.id === user.id;

                return {
                    ...message,
                    type: isSentByMe ? 'sent' : 'received',
                    read: myReceipt ? myReceipt.is_read : true,
                };
            });

            setMessages(mappedMessages);
            setNotifications(notificationsRes.results || notificationsRes || []);
        } catch (error) {
            console.error('Error fetching communication data:', error);
            showError('Failed to load communication data.');
        } finally {
            setLoading(false);
        }
    }, [showError, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData, activeTab]);

    const handleMessageClick = useCallback(async (message) => {
        setSelectedMessage(message);
        setLoadingThread(true);
        setThreadMessages([]);
        setIsDrawerOpen(false);

        try {
            const data = await secretaryService.getMessageThread(message.thread_id);
            setThreadMessages(data.results || data || []);

            const myReceipt = message.receipts?.find((receipt) => receipt.recipient?.id === user?.id);
            if (activeTab !== 'notifications' && !message.read && myReceipt) {
                await secretaryService.markMessageRead(message.id);
                setMessages((previous) => previous.map((item) => (
                    item.id === message.id ? { ...item, read: true } : item
                )));
            }
        } catch (error) {
            console.error('Error fetching thread:', error);
            setThreadMessages([message]);
        } finally {
            setLoadingThread(false);
        }
    }, [activeTab, user?.id]);

    const handleNotificationClick = useCallback(async (notification) => {
        if (!notification.is_read) {
            try {
                await notificationService.markAsRead(notification.id);
                setNotifications((previous) => previous.map((item) => (
                    item.id === notification.id ? { ...item, is_read: true } : item
                )));
            } catch (error) {
                console.error('Error marking notification read:', error);
                showError('Failed to mark notification as read.');
            }
        }
    }, [showError]);

    const handleMarkAllRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((previous) => previous.map((item) => ({ ...item, is_read: true })));
            showSuccess('All notifications marked as read.');
        } catch (error) {
            console.error('Error marking all notifications read:', error);
            showError('Failed to mark notifications as read.');
        }
    }, [showError, showSuccess]);

    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || !selectedMessage || !user) {
            return;
        }

        try {
            let recipientId = null;

            if (selectedMessage.sender?.id === user.id) {
                const receipts = selectedMessage.receipts || [];
                recipientId = receipts[0]?.recipient?.id || null;
            } else {
                recipientId = selectedMessage.sender?.id || null;
            }

            if (!recipientId) {
                showError('Could not determine recipient for reply.');
                return;
            }

            await secretaryService.sendMessage({
                recipient_ids: [recipientId],
                body: newMessage,
                subject: `Re: ${selectedMessage.subject}`,
                thread_id: selectedMessage.thread_id,
                parent_message: selectedMessage.id,
            });

            setNewMessage('');
            showSuccess('Message sent successfully.');

            const threadData = await secretaryService.getMessageThread(selectedMessage.thread_id);
            setThreadMessages(threadData.results || threadData || []);
            await fetchData();
        } catch (error) {
            console.error('Error sending message:', error);
            showError(`Error sending message: ${error.response?.data?.detail || error.message}`);
        }
    }, [fetchData, newMessage, selectedMessage, showError, showSuccess, user]);

    const filteredItems = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (activeTab === 'notifications') {
            return notifications.filter((notification) => {
                if (!search) {
                    return true;
                }

                const title = (notification.title || '').toLowerCase();
                const message = (notification.message || '').toLowerCase();
                return title.includes(search) || message.includes(search);
            });
        }

        return messages.filter((message) => {
            const matchesType = message.type === activeTab;
            if (!matchesType) {
                return false;
            }

            if (!search) {
                return true;
            }

            const senderName = (message.sender?.full_name || message.sender?.email || '').toLowerCase();
            const subject = (message.subject || '').toLowerCase();
            const body = (message.body || '').toLowerCase();

            return senderName.includes(search) || subject.includes(search) || body.includes(search);
        });
    }, [activeTab, messages, notifications, searchTerm]);

    const tabOptions = useMemo(() => {
        return [
            { value: 'received', label: t('communication.received') || 'Received' },
            { value: 'sent', label: t('communication.sent') || 'Sent' },
            { value: 'notifications', label: t('communication.notifications') || 'Notifications' },
        ];
    }, [t]);

    return (
        <div className="secretary-dashboard sec-communication-page">
            <PageHeader
                title={t('secretary.communication.title') || 'Communication'}
                subtitle={t('secretary.communication.subtitle') || 'Internal messages and notifications'}
                action={(
                    <div className="sec-comm-header-actions">
                        <button
                            type="button"
                            className="btn-secondary sec-mobile-drawer-toggle"
                            onClick={() => setIsDrawerOpen((previous) => !previous)}
                        >
                            <Menu size={18} />
                            Inbox
                        </button>
                        <button type="button" className="btn-primary">
                            <Plus size={18} />
                            {t('communication.compose') || 'Compose'}
                        </button>
                    </div>
                )}
            />

            <div className="sec-communication-grid">
                <button
                    type="button"
                    className={`sec-drawer-backdrop ${isDrawerOpen ? 'is-visible' : ''}`}
                    onClick={() => setIsDrawerOpen(false)}
                    aria-label="Close message drawer"
                />

                <aside className={`message-sidebar sec-comm-sidebar ${isDrawerOpen ? 'is-open' : ''}`}>
                    <div className="sec-comm-sidebar-head">
                        <div className="search-wrapper sec-search-wrapper sec-search-full">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder={activeTab === 'notifications'
                                    ? (t('communication.searchNotifications') || 'Search notifications')
                                    : (t('communication.searchMessages') || 'Search messages')}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>

                        <div className="sec-comm-tabs">
                            {tabOptions.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    className={`sec-comm-tab ${activeTab === tab.value ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab(tab.value);
                                        setSelectedMessage(null);
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'notifications' && notifications.some((notification) => !notification.is_read) ? (
                            <button type="button" className="view-all-btn" onClick={handleMarkAllRead}>
                                {t('header.markAllRead') || 'Mark all read'}
                            </button>
                        ) : null}
                    </div>

                    <div className="sec-comm-list">
                        {loading ? (
                            <LoadingSpinner message="Loading communication items..." />
                        ) : filteredItems.length === 0 ? (
                            <EmptyState message={t('communication.noItems') || 'No messages available.'} />
                        ) : activeTab === 'notifications' ? (
                            filteredItems.map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    className={`sec-comm-item ${notification.is_read ? '' : 'is-unread'}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="sec-comm-item-top">
                                        <strong>{notification.title}</strong>
                                        <span>{notification.created_at?.split('T')[0]}</span>
                                    </div>
                                    <p>{notification.message}</p>
                                </button>
                            ))
                        ) : (
                            filteredItems.map((message) => (
                                <button
                                    key={message.id}
                                    type="button"
                                    className={`sec-comm-item ${selectedMessage?.id === message.id ? 'is-selected' : ''} ${message.read ? '' : 'is-unread'}`}
                                    onClick={() => handleMessageClick(message)}
                                >
                                    <div className="sec-comm-item-top">
                                        <strong>{message.sender?.full_name || message.sender?.email || 'Unknown'}</strong>
                                        <span>{new Date(message.sent_at || message.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="sec-comm-role">{message.sender?.role || ''}</p>
                                    <p className="sec-comm-subject">{message.subject}</p>
                                    <p className="sec-comm-preview">{message.body?.substring(0, 64)}...</p>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                <section className="message-content sec-comm-content">
                    {activeTab === 'notifications' ? (
                        <EmptyState
                            icon={MessageSquare}
                            message={t('communication.notificationDesc') || 'Select a notification on the left to view it.'}
                        />
                    ) : selectedMessage ? (
                        <>
                            <div className="sec-comm-thread-head">
                                <h2>{selectedMessage.subject}</h2>
                                <div className="sec-comm-thread-meta">
                                    <AvatarInitial name={selectedMessage.sender?.full_name || 'User'} color="indigo" />
                                    <div>
                                        <p>{selectedMessage.sender?.full_name || selectedMessage.sender?.email || 'Unknown'}</p>
                                        <span>
                                            {selectedMessage.type === 'sent'
                                                ? `${t('communication.to') || 'To'}: ${selectedMessage.receipts?.[0]?.recipient?.full_name || selectedMessage.receipts?.[0]?.recipient?.email || '...'}`
                                                : `${t('communication.from') || 'From'}: ${selectedMessage.sender?.full_name || selectedMessage.sender?.email || '...'}`}
                                            {' • '}
                                            {new Date(selectedMessage.sent_at || selectedMessage.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="sec-comm-thread-body">
                                {loadingThread ? (
                                    <LoadingSpinner message="Loading conversation..." />
                                ) : (
                                    <div className="sec-thread-list">
                                        {threadMessages.map((message) => {
                                            const mine = message.sender?.id === user?.id;

                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`sec-thread-message ${mine ? 'mine' : 'theirs'}`}
                                                >
                                                    <div className="sec-thread-bubble">
                                                        <p>{message.body}</p>
                                                    </div>
                                                    <span>
                                                        {message.sender?.full_name || 'User'}
                                                        {' • '}
                                                        {new Date(message.sent_at).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="sec-comm-reply">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={t('communication.typeReply') || 'Type your reply...'}
                                    value={newMessage}
                                    onChange={(event) => setNewMessage(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button type="button" className="btn-primary" onClick={handleSendMessage}>
                                    <Send size={18} />
                                    {t('communication.send') || 'Send'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <EmptyState
                            icon={MessageSquare}
                            message={t('communication.selectMessage') || 'Select a message to view details.'}
                        />
                    )}
                </section>
            </div>
        </div>
    );
};

export default SecretaryCommunication;
