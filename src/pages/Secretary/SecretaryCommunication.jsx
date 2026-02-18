import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, MessageSquare, Plus, Send, Search } from 'lucide-react';
import Modal from '../../components/ui/Modal';
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
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [composeSearch, setComposeSearch] = useState('');
    const [composeRecipientId, setComposeRecipientId] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [composeRecipients, setComposeRecipients] = useState([]);
    const [composeLoadingRecipients, setComposeLoadingRecipients] = useState(false);
    const [composeSubmitting, setComposeSubmitting] = useState(false);
    const composeSearchRequestRef = useRef(0);

    useEffect(() => {
        if (location.state?.activeTab) {
            const targetTab = location.state.activeTab === 'internal' ? 'received' : location.state.activeTab;
            setActiveTab(targetTab);
        }
    }, [location.state]);

    const normalizeListResponse = useCallback((payload) => {
        if (Array.isArray(payload?.results)) {
            return payload.results;
        }
        if (Array.isArray(payload)) {
            return payload;
        }
        return [];
    }, []);

    const closeComposeModal = useCallback(() => {
        composeSearchRequestRef.current += 1;
        setIsComposeModalOpen(false);
        setComposeSearch('');
        setComposeRecipientId('');
        setComposeSubject('');
        setComposeBody('');
        setComposeRecipients([]);
        setComposeLoadingRecipients(false);
        setComposeSubmitting(false);
    }, []);

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

            const rawMessages = normalizeListResponse(messagesRes);
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
            setNotifications(normalizeListResponse(notificationsRes));
        } catch (error) {
            console.error('Error fetching communication data:', error);
            showError('Failed to load communication data.');
        } finally {
            setLoading(false);
        }
    }, [normalizeListResponse, showError, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData, activeTab]);

    useEffect(() => {
        if (!isComposeModalOpen) {
            return;
        }

        const query = composeSearch.trim();
        if (query.length < 2) {
            composeSearchRequestRef.current += 1;
            setComposeRecipients([]);
            setComposeLoadingRecipients(false);
            return;
        }

        const requestId = composeSearchRequestRef.current + 1;
        composeSearchRequestRef.current = requestId;

        const timeoutId = setTimeout(async () => {
            try {
                setComposeLoadingRecipients(true);
                const data = await secretaryService.searchMessageRecipients({ search: query });
                if (composeSearchRequestRef.current !== requestId) {
                    return;
                }
                const recipients = normalizeListResponse(data)
                    .filter((recipient) => recipient?.id && recipient.id !== user?.id);
                setComposeRecipients(recipients);
            } catch (error) {
                if (composeSearchRequestRef.current !== requestId) {
                    return;
                }
                console.error('Error searching communication recipients:', error);
                setComposeRecipients([]);
            } finally {
                if (composeSearchRequestRef.current === requestId) {
                    setComposeLoadingRecipients(false);
                }
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [composeSearch, isComposeModalOpen, normalizeListResponse, user?.id]);

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

    const handleComposeMessage = useCallback(async (event) => {
        event.preventDefault();

        const recipientId = Number.parseInt(composeRecipientId, 10);
        const subject = composeSubject.trim();
        const body = composeBody.trim();

        if (!Number.isInteger(recipientId) || recipientId <= 0) {
            showError('Please select a valid recipient.');
            return;
        }
        if (!subject) {
            showError('Please enter a subject.');
            return;
        }
        if (!body) {
            showError('Please enter a message body.');
            return;
        }

        try {
            setComposeSubmitting(true);
            await secretaryService.sendMessage({
                recipient_ids: [recipientId],
                subject,
                body,
            });

            showSuccess('Message sent successfully.');
            closeComposeModal();
            setActiveTab('sent');
            await fetchData();
        } catch (error) {
            console.error('Error composing new message:', error);
            const message = error?.response?.data?.detail || error?.message || 'Failed to send message.';
            showError(message);
        } finally {
            setComposeSubmitting(false);
        }
    }, [
        closeComposeModal,
        composeBody,
        composeRecipientId,
        composeSubject,
        fetchData,
        showError,
        showSuccess,
    ]);

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
                        <button type="button" className="btn-primary" onClick={() => setIsComposeModalOpen(true)}>
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

            <Modal
                isOpen={isComposeModalOpen}
                onClose={closeComposeModal}
                title={t('communication.compose') || 'Compose Message'}
            >
                <form className="sec-modal-form" onSubmit={handleComposeMessage}>
                    <div className="form-group">
                        <label className="form-label">Find Recipient *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name or email..."
                            value={composeSearch}
                            onChange={(event) => {
                                setComposeSearch(event.target.value);
                                setComposeRecipientId('');
                            }}
                            autoComplete="off"
                        />
                        {composeLoadingRecipients ? (
                            <p className="sec-subtle-text">Searching recipients...</p>
                        ) : null}
                        {!composeLoadingRecipients && composeSearch.trim().length >= 2 && composeRecipients.length === 0 ? (
                            <p className="sec-subtle-text">No recipients found.</p>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Recipient *</label>
                        <select
                            className="form-select"
                            value={composeRecipientId}
                            onChange={(event) => setComposeRecipientId(event.target.value)}
                            required
                            disabled={composeRecipients.length === 0}
                        >
                            <option value="">Select recipient...</option>
                            {composeRecipients.map((recipient) => (
                                <option key={recipient.id} value={recipient.id}>
                                    {recipient.full_name || recipient.email} ({recipient.role || 'user'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Subject *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={composeSubject}
                            onChange={(event) => setComposeSubject(event.target.value)}
                            placeholder="Enter message subject"
                            maxLength={255}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Message *</label>
                        <textarea
                            className="form-input"
                            value={composeBody}
                            onChange={(event) => setComposeBody(event.target.value)}
                            placeholder="Write your message..."
                            rows={5}
                            required
                        />
                    </div>

                    <div className="sec-modal-actions">
                        <button type="button" className="btn-secondary" onClick={closeComposeModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={composeSubmitting}>
                            {composeSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SecretaryCommunication;
