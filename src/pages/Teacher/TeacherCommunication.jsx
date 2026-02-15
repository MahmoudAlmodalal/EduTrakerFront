import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Bell,
    Clock,
    MessageSquare,
    Plus,
    Search,
    Send,
    User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    useMarkAllTeacherNotificationsRead,
    useMarkTeacherMessageReadMutation,
    useMarkTeacherNotificationRead,
    useSearchCommunicationUsers,
    useSendTeacherMessageMutation,
    useTeacherAllocations,
    useTeacherMessageThread,
    useTeacherMessages,
    useTeacherNotifications
} from '../../hooks/useTeacherQueries';
import teacherService from '../../services/teacherService';
import { toList } from '../../utils/helpers';
import './Teacher.css';

const ALLOWED_ROLE_LABELS = {
    teacher: 'Teacher',
    secretary: 'Secretary',
    school_manager: 'School Manager',
    student: 'Student'
};

const normalizeRole = (role) => {
    const current = (role || '').toLowerCase();
    if (current === 'manager_school') {
        return 'school_manager';
    }
    return current;
};

const getInitials = (name = '') =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || 'U';

const getRoleColor = (role) => {
    switch (normalizeRole(role)) {
        case 'teacher':
            return { bg: '#dbeafe', text: '#1d4ed8' };
        case 'secretary':
            return { bg: '#ecfccb', text: '#3f6212' };
        case 'school_manager':
            return { bg: '#ede9fe', text: '#6d28d9' };
        case 'student':
            return { bg: '#fef3c7', text: '#92400e' };
        default:
            return { bg: '#e2e8f0', text: '#334155' };
    }
};

const TeacherCommunication = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('received');
    const [selectedThread, setSelectedThread] = useState(null);
    const [threadSearch, setThreadSearch] = useState('');
    const [replyBody, setReplyBody] = useState('');

    const [showCompose, setShowCompose] = useState(false);
    const [composeSearchText, setComposeSearchText] = useState('');
    const [composeSearch, setComposeSearch] = useState('');
    const [composeRecipient, setComposeRecipient] = useState(null);
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');
    const [ownStudentIds, setOwnStudentIds] = useState([]);
    const [loadingOwnStudents, setLoadingOwnStudents] = useState(false);

    const {
        data: messagesData,
        isLoading: loadingMessages
    } = useTeacherMessages();

    const {
        data: notificationsData,
        isLoading: loadingNotifications
    } = useTeacherNotifications({ page_size: 25 });

    const { data: allocationsData } = useTeacherAllocations(undefined, {
        enabled: showCompose
    });

    const {
        data: threadData,
        isLoading: loadingThread
    } = useTeacherMessageThread(selectedThread?.thread_id, {
        enabled: Boolean(selectedThread?.thread_id && activeTab !== 'notifications')
    });

    const {
        data: searchedRecipients,
        isLoading: loadingRecipientSearch
    } = useSearchCommunicationUsers(composeSearch, {
        enabled: showCompose && composeSearch.length > 0
    });

    const markAllNotificationsRead = useMarkAllTeacherNotificationsRead();
    const markNotificationRead = useMarkTeacherNotificationRead();
    const markMessageRead = useMarkTeacherMessageReadMutation();
    const sendMessage = useSendTeacherMessageMutation();

    useEffect(() => {
        const requestedTab = location.state?.activeTab;
        if (['received', 'sent', 'notifications'].includes(requestedTab)) {
            setActiveTab(requestedTab);
        }
    }, [location.state]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setComposeSearch(composeSearchText.trim());
        }, 240);

        return () => clearTimeout(timeoutId);
    }, [composeSearchText]);

    const allocations = useMemo(() => toList(allocationsData), [allocationsData]);

    useEffect(() => {
        let ignore = false;

        const fetchOwnStudents = async () => {
            if (!showCompose) {
                return;
            }

            const classroomIds = [...new Set(
                allocations
                    .map((allocation) => allocation.class_room_id)
                    .filter(Boolean)
            )];

            if (classroomIds.length === 0) {
                setOwnStudentIds([]);
                return;
            }

            setLoadingOwnStudents(true);
            try {
                const responses = await Promise.all(
                    classroomIds.map((classroomId) => (
                        teacherService.getStudents({
                            classroom_id: classroomId,
                            current_status: 'active',
                            page_size: 200
                        })
                    ))
                );

                if (ignore) {
                    return;
                }

                const studentIds = new Set();
                responses.forEach((response) => {
                    toList(response).forEach((student) => {
                        studentIds.add(student.user_id || student.id);
                    });
                });

                setOwnStudentIds([...studentIds]);
            } catch {
                if (!ignore) {
                    setOwnStudentIds([]);
                }
            } finally {
                if (!ignore) {
                    setLoadingOwnStudents(false);
                }
            }
        };

        fetchOwnStudents();

        return () => {
            ignore = true;
        };
    }, [allocations, showCompose]);

    const messages = useMemo(() => {
        const list = toList(messagesData);
        return list.map((message) => {
            const myReceipt = message.receipts?.find((receipt) => receipt.recipient?.id === user?.id);
            const isSentByMe = message.sender?.id === user?.id;

            return {
                ...message,
                type: isSentByMe ? 'sent' : 'received',
                read: myReceipt ? myReceipt.is_read : true
            };
        });
    }, [messagesData, user?.id]);

    const notifications = useMemo(() => toList(notificationsData), [notificationsData]);
    const threadMessages = useMemo(() => toList(threadData), [threadData]);

    const filteredThreads = useMemo(() => {
        const scoped = messages.filter((message) => message.type === activeTab);
        const query = threadSearch.trim().toLowerCase();

        if (!query) {
            return scoped;
        }

        return scoped.filter((message) => {
            const senderName = (message.sender?.full_name || message.sender?.email || '').toLowerCase();
            const subject = (message.subject || '').toLowerCase();
            const body = (message.body || '').toLowerCase();

            return senderName.includes(query) || subject.includes(query) || body.includes(query);
        });
    }, [activeTab, messages, threadSearch]);

    useEffect(() => {
        if (activeTab === 'notifications') {
            setSelectedThread(null);
            return;
        }

        if (!selectedThread && filteredThreads.length > 0) {
            setSelectedThread(filteredThreads[0]);
            return;
        }

        if (selectedThread && !filteredThreads.some((message) => message.id === selectedThread.id)) {
            setSelectedThread(filteredThreads[0] || null);
        }
    }, [activeTab, filteredThreads, selectedThread]);

    const recipientCandidates = useMemo(() => {
        const users = toList(searchedRecipients)
            .filter((item) => item?.id && item.id !== user?.id)
            .map((item) => {
                const role = normalizeRole(item.role);
                return {
                    ...item,
                    normalizedRole: role
                };
            })
            .filter((item) => ['secretary', 'teacher', 'school_manager', 'student'].includes(item.normalizedRole))
            .filter((item) => (
                item.normalizedRole !== 'student' || ownStudentIds.includes(item.id)
            ));

        return users;
    }, [ownStudentIds, searchedRecipients, user?.id]);

    const unreadNotificationCount = notifications.filter((notification) => !notification.is_read).length;

    const openCompose = useCallback(() => {
        setShowCompose(true);
        setComposeSearchText('');
        setComposeSearch('');
        setComposeRecipient(null);
        setComposeSubject('');
        setComposeBody('');
    }, []);

    const closeCompose = useCallback(() => {
        setShowCompose(false);
    }, []);

    const handleSelectThread = useCallback(async (thread) => {
        setSelectedThread(thread);

        if (!thread.read) {
            try {
                await markMessageRead.mutateAsync(thread.id);
            } catch {
                // Ignore read-state failure in UI; thread remains accessible.
            }
        }
    }, [markMessageRead]);

    const handleSendReply = useCallback(async (event) => {
        event.preventDefault();

        if (!selectedThread || !replyBody.trim()) {
            return;
        }

        let recipientId = null;
        if (selectedThread.sender?.id === user?.id) {
            recipientId = selectedThread.receipts?.[0]?.recipient?.id || null;
        } else {
            recipientId = selectedThread.sender?.id || null;
        }

        if (!recipientId) {
            return;
        }

        const parentMessageId = threadMessages[threadMessages.length - 1]?.id || selectedThread.id;
        const subject = selectedThread.subject?.startsWith('Re:')
            ? selectedThread.subject
            : `Re: ${selectedThread.subject || 'Message'}`;

        try {
            await sendMessage.mutateAsync({
                recipient_ids: [recipientId],
                subject,
                body: replyBody,
                thread_id: selectedThread.thread_id,
                parent_message: parentMessageId
            });
            setReplyBody('');
        } catch {
            // Mutation state is reflected by the disabled button; no-op fallback.
        }
    }, [replyBody, selectedThread, sendMessage, threadMessages, user?.id]);

    const handleSendComposedMessage = useCallback(async (event) => {
        event.preventDefault();

        if (!composeRecipient || !composeSubject.trim() || !composeBody.trim()) {
            return;
        }

        try {
            await sendMessage.mutateAsync({
                recipient_ids: [composeRecipient.id],
                subject: composeSubject.trim(),
                body: composeBody.trim()
            });
            setActiveTab('sent');
            closeCompose();
        } catch {
            // Mutation state is reflected by the disabled button; no-op fallback.
        }
    }, [closeCompose, composeBody, composeRecipient, composeSubject, sendMessage]);

    const handleMarkAllNotificationsRead = useCallback(() => {
        markAllNotificationsRead.mutate();
    }, [markAllNotificationsRead]);

    const handleNotificationClick = useCallback(async (notification) => {
        if (!notification.is_read) {
            await markNotificationRead.mutateAsync(notification.id);
        }

        if (notification.action_url) {
            navigate(notification.action_url);
        }
    }, [markNotificationRead, navigate]);

    const renderThreads = () => (
        <div className="messages-layout">
            <div className="management-card messages-thread-panel">
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)'
                            }}
                        />
                        <input
                            type="text"
                            value={threadSearch}
                            onChange={(event) => setThreadSearch(event.target.value)}
                            placeholder={t('communication.searchMessages') || 'Search messages'}
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loadingMessages ? (
                        <div style={{ padding: '2rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            Loading messages...
                        </div>
                    ) : filteredThreads.length === 0 ? (
                        <div style={{ padding: '2rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                            {t('communication.noItems') || 'No messages found'}
                        </div>
                    ) : (
                        filteredThreads.map((thread) => {
                            const roleColors = getRoleColor(thread.sender?.role);
                            return (
                                <button
                                    key={thread.id}
                                    type="button"
                                    onClick={() => handleSelectThread(thread)}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        textAlign: 'left',
                                        padding: '1rem 1.25rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        background: selectedThread?.id === thread.id
                                            ? 'rgba(var(--color-primary-rgb), 0.06)'
                                            : 'transparent',
                                        borderLeft: selectedThread?.id === thread.id
                                            ? '4px solid var(--color-primary)'
                                            : '4px solid transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: roleColors.bg,
                                                color: roleColors.text,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                flexShrink: 0
                                            }}
                                        >
                                            {getInitials(thread.sender?.full_name || thread.sender?.email || '')}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                <h4
                                                    style={{
                                                        margin: 0,
                                                        fontSize: '0.9rem',
                                                        fontWeight: thread.read ? 600 : 800,
                                                        color: 'var(--color-text-main)',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {thread.sender?.full_name || thread.sender?.email}
                                                </h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {new Date(thread.sent_at || thread.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '0.5rem',
                                                    marginTop: '2px'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--color-primary)',
                                                        fontWeight: thread.read ? 500 : 700,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {thread.subject || '(No subject)'}
                                                </div>
                                                {!thread.read && (
                                                    <span
                                                        style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: 'var(--color-primary)',
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <p
                                                style={{
                                                    margin: '4px 0 0',
                                                    fontSize: '0.82rem',
                                                    color: 'var(--color-text-muted)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {thread.body}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="management-card messages-chat-panel">
                {selectedThread ? (
                    <>
                        <div className="messages-chat-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'var(--color-primary-light)',
                                        color: 'var(--color-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <User size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>
                                        {selectedThread.sender?.full_name || selectedThread.sender?.email}
                                    </h3>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        {selectedThread.subject || '(No subject)'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="messages-chat-body">
                            {loadingThread ? (
                                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                    Loading conversation...
                                </div>
                            ) : threadMessages.length === 0 ? (
                                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                    No messages in this thread yet.
                                </div>
                            ) : (
                                threadMessages.map((message) => {
                                    const mine = message.sender?.id === user?.id;
                                    return (
                                        <div
                                            key={message.id}
                                            className="messages-chat-bubble"
                                            style={{
                                                alignSelf: mine ? 'flex-end' : 'flex-start',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: mine ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '1rem',
                                                    background: mine ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                                    color: mine ? '#fff' : 'var(--color-text-main)',
                                                    borderBottomRightRadius: mine ? '0.2rem' : '1rem',
                                                    borderBottomLeftRadius: mine ? '1rem' : '0.2rem',
                                                    border: mine ? 'none' : '1px solid var(--color-border)'
                                                }}
                                            >
                                                <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: '0.9rem' }}>
                                                    {message.body}
                                                </p>
                                            </div>
                                            <span style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                {(message.sender?.full_name || 'User')} • {new Date(message.sent_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <form className="messages-chat-form" onSubmit={handleSendReply}>
                            <input
                                type="text"
                                value={replyBody}
                                onChange={(event) => setReplyBody(event.target.value)}
                                placeholder={t('communication.typeReply') || 'Type your reply'}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={sendMessage.isPending || !replyBody.trim()}
                                style={{ opacity: sendMessage.isPending ? 0.7 : 1 }}
                            >
                                <Send size={18} />
                                {sendMessage.isPending ? 'Sending...' : (t('communication.send') || 'Send')}
                            </button>
                        </form>
                    </>
                ) : (
                    <div
                        style={{
                            height: '100%',
                            minHeight: '300px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            color: 'var(--color-text-muted)'
                        }}
                    >
                        <MessageSquare size={52} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <p style={{ margin: 0 }}>{t('communication.selectMessage') || 'Select a message to start'}</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="management-card">
            <div
                style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                    {t('communication.notificationCenter') || 'Notification Center'}
                </h3>
                {unreadNotificationCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {markAllNotificationsRead.isPending ? 'Marking...' : (t('header.markAllRead') || 'Mark all read')}
                    </button>
                )}
            </div>

            {loadingNotifications ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Loading notifications...
                </div>
            ) : notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    {t('communication.noItems') || 'No notifications'}
                </div>
            ) : (
                notifications.map((notification) => (
                    <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                            width: '100%',
                            textAlign: 'left',
                            border: 'none',
                            borderBottom: '1px solid var(--color-border)',
                            background: notification.is_read
                                ? 'transparent'
                                : 'rgba(var(--color-primary-rgb), 0.03)',
                            padding: '1.2rem 1.25rem',
                            display: 'flex',
                            gap: '0.9rem',
                            position: 'relative',
                            cursor: 'pointer'
                        }}
                    >
                        {!notification.is_read && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    width: '4px',
                                    background: 'var(--color-primary)'
                                }}
                            />
                        )}

                        <div
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                background: 'var(--color-bg-body)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-primary)',
                                flexShrink: 0
                            }}
                        >
                            <Bell size={20} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem'
                                }}
                            >
                                <h4
                                    style={{
                                        margin: 0,
                                        fontSize: '0.95rem',
                                        fontWeight: notification.is_read ? 600 : 700,
                                        color: 'var(--color-text-main)'
                                    }}
                                >
                                    {notification.title || 'System Notification'}
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={14} />
                                    {new Date(notification.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <p
                                style={{
                                    margin: '0.4rem 0 0',
                                    color: 'var(--color-text-muted)',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.4
                                }}
                            >
                                {notification.message || notification.content}
                            </p>
                        </div>
                    </button>
                ))
            )}
        </div>
    );

    return (
        <div className="teacher-page">
            <div className="teacher-header">
                <div>
                    <h1 className="teacher-title">Teacher Communication</h1>
                    <p className="teacher-subtitle">
                        Manage received messages, sent threads, and system notifications.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={openCompose}
                        style={{ borderRadius: '0.75rem', padding: '0.6rem 1rem' }}
                    >
                        <Plus size={16} />
                        {t('communication.newMessage') || 'New Message'}
                    </button>

                    {[
                        { key: 'received', label: t('communication.received') || 'Received', icon: MessageSquare },
                        { key: 'sent', label: t('communication.sent') || 'Sent', icon: Send },
                        { key: 'notifications', label: t('communication.notifications') || 'Notifications', icon: Bell }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                borderRadius: '0.75rem',
                                padding: '0.55rem 0.9rem',
                                border: '1px solid var(--color-border)',
                                background: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                color: activeTab === tab.key ? '#fff' : 'var(--color-text-muted)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.85rem'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.key === 'notifications' && unreadNotificationCount > 0 && (
                                <span
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        borderRadius: '999px',
                                        padding: '2px 6px',
                                        background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : '#ef4444',
                                        color: '#fff'
                                    }}
                                >
                                    {unreadNotificationCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'notifications' ? renderNotifications() : renderThreads()}

            {showCompose && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        zIndex: 1000
                    }}
                    onClick={closeCompose}
                >
                    <div
                        className="management-card"
                        onClick={(event) => event.stopPropagation()}
                        style={{ width: '680px', maxWidth: '100%', padding: '1.25rem' }}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: '0.9rem' }}>
                            {t('communication.newMessage') || 'New Message'}
                        </h3>

                        <form onSubmit={handleSendComposedMessage} style={{ display: 'grid', gap: '0.8rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                    Recipient
                                </label>

                                <div style={{ position: 'relative' }}>
                                    <Search
                                        size={16}
                                        style={{
                                            position: 'absolute',
                                            left: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'var(--color-text-muted)'
                                        }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email"
                                        value={composeSearchText}
                                        onChange={(event) => setComposeSearchText(event.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.75rem 0.65rem 2.2rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        marginTop: '0.6rem',
                                        maxHeight: '180px',
                                        overflowY: 'auto',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0.6rem'
                                    }}
                                >
                                    {composeSearch.length === 0 ? (
                                        <div style={{ padding: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                            Type to search recipients.
                                        </div>
                                    ) : loadingRecipientSearch || loadingOwnStudents ? (
                                        <div style={{ padding: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                            Searching recipients...
                                        </div>
                                    ) : recipientCandidates.length === 0 ? (
                                        <div style={{ padding: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                            No allowed recipients found.
                                        </div>
                                    ) : (
                                        recipientCandidates.map((recipient) => {
                                            const selected = composeRecipient?.id === recipient.id;
                                            const badgeLabel = ALLOWED_ROLE_LABELS[recipient.normalizedRole] || recipient.normalizedRole;
                                            const roleColor = getRoleColor(recipient.normalizedRole);
                                            return (
                                                <button
                                                    key={recipient.id}
                                                    type="button"
                                                    onClick={() => setComposeRecipient(recipient)}
                                                    style={{
                                                        width: '100%',
                                                        border: 'none',
                                                        borderBottom: '1px solid var(--color-border)',
                                                        background: selected ? 'rgba(var(--color-primary-rgb), 0.06)' : '#fff',
                                                        textAlign: 'left',
                                                        padding: '0.7rem 0.8rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem' }}>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                                                                {recipient.full_name || recipient.email}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    fontSize: '0.78rem',
                                                                    color: 'var(--color-text-muted)',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}
                                                            >
                                                                {recipient.email}
                                                            </div>
                                                        </div>
                                                        <span
                                                            style={{
                                                                fontSize: '0.72rem',
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: '999px',
                                                                background: roleColor.bg,
                                                                color: roleColor.text,
                                                                fontWeight: 700,
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {badgeLabel}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {composeRecipient && (
                                    <div style={{ marginTop: '0.45rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        Selected: <strong style={{ color: 'var(--color-text-main)' }}>
                                            {composeRecipient.full_name || composeRecipient.email}
                                        </strong>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={composeSubject}
                                    onChange={(event) => setComposeSubject(event.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                    Message
                                </label>
                                <textarea
                                    rows={6}
                                    value={composeBody}
                                    onChange={(event) => setComposeBody(event.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                                <button
                                    type="button"
                                    onClick={closeCompose}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        background: '#fff',
                                        borderRadius: '0.6rem',
                                        padding: '0.55rem 0.9rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={sendMessage.isPending || !composeRecipient}
                                    style={{ opacity: sendMessage.isPending || !composeRecipient ? 0.7 : 1 }}
                                >
                                    {sendMessage.isPending ? 'Sending...' : (
                                        <>
                                            <Send size={16} />
                                            {t('communication.send') || 'Send'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherCommunication;
