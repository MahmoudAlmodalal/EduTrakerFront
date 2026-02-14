import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    Bell,
    Send,
    Search,
    User,
    Check,
    MoreVertical,
    Plus,
    Filter,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import managerService from '../../services/managerService';
import notificationService from '../../services/notificationService';
import { api } from '../../utils/api';
import './SchoolManager.css';

import { useAuth } from '../../context/AuthContext';

const SchoolCommunication = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('received');
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [selectedThread, setSelectedThread] = useState(null);

    // Compose new message
    const [showCompose, setShowCompose] = useState(false);
    const [recipients, setRecipients] = useState([]);
    const [composeRecipientId, setComposeRecipientId] = useState('');
    const [composeSubject, setComposeSubject] = useState('');
    const [composeBody, setComposeBody] = useState('');

    useEffect(() => {
        fetchData();
    }, [user, activeTab]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [msgsData, notifsData] = await Promise.all([
                api.get('/user-messages/'),
                notificationService.getNotifications()
            ]);

            const rawMessages = msgsData.results || msgsData;
            const mappedMsgs = rawMessages.map(m => {
                const myReceipt = m.receipts?.find(r => r.recipient?.id === user?.id);
                const isSentByMe = m.sender?.id === user?.id;

                return {
                    ...m,
                    type: isSentByMe ? 'sent' : 'received',
                    read: myReceipt ? myReceipt.is_read : true
                };
            });

            setMessages(mappedMsgs);
            setNotifications(notifsData.results || notifsData);

            // Re-select current thread if it still exists
            if (mappedMsgs.length > 0) {
                if (selectedThread) {
                    const updated = mappedMsgs.find(m => m.id === selectedThread.id);
                    if (updated) setSelectedThread(updated);
                    else setSelectedThread(mappedMsgs[0]);
                } else {
                    setSelectedThread(mappedMsgs[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch communication data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipients = async () => {
        try {
            // Backend scopes this list based on the authenticated user (school manager),
            // so we can safely request "active" users and filter client-side.
            const usersRes = await api.get('/users/', { params: { is_active: true } });
            const list = Array.isArray(usersRes?.results) ? usersRes.results : (Array.isArray(usersRes) ? usersRes : []);
            const cleaned = list
                .filter(u => u?.id && u.id !== user?.id)
                .map(u => ({
                    id: u.id,
                    label: `${u.full_name || u.email} (${u.role})`,
                }));
            setRecipients(cleaned);
        } catch (e) {
            console.error('Failed to fetch recipients:', e);
            setRecipients([]);
        }
    };

    const openCompose = async () => {
        setShowCompose(true);
        setComposeRecipientId('');
        setComposeSubject('');
        setComposeBody('');
        await fetchRecipients();
    };

    const handleSendNewMessage = async (e) => {
        if (e) e.preventDefault();
        if (!composeRecipientId || !composeSubject.trim() || !composeBody.trim()) return;
        try {
            await managerService.sendMessage({
                recipient_ids: [parseInt(composeRecipientId, 10)],
                subject: composeSubject,
                body: composeBody,
            });
            setShowCompose(false);
            setActiveTab('sent');
            await fetchData();
        } catch (error) {
            console.error('Failed to send new message:', error);
            alert('Error: ' + (error.data?.detail || error.message));
        }
    };

    const [threadMessages, setThreadMessages] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);

    const handleMessageClick = async (thread) => {
        setSelectedThread(thread);
        setLoadingThread(true);
        setThreadMessages([]);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/user-messages/threads/${thread.thread_id}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            setThreadMessages(data.results || data);

            // Mark as read if needed
            const myReceipt = thread.receipts?.find(r => r.recipient?.id === user?.id);
            if (!thread.read && myReceipt) {
                await managerService.markMessageRead(thread.id);
                setMessages(msgs => msgs.map(m => m.id === thread.id ? { ...m, read: true } : m));
            }
        } catch (error) {
            console.error('Failed to fetch thread:', error);
            setThreadMessages([thread]);
        } finally {
            setLoadingThread(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !selectedThread) return;
        try {
            let targetRecipientId = null;
            if (selectedThread.sender?.id === user?.id) {
                targetRecipientId = selectedThread.receipts?.[0]?.recipient?.id;
            } else {
                targetRecipientId = selectedThread.sender?.id;
            }

            if (!targetRecipientId) {
                alert('Could not determine recipient for reply.');
                return;
            }

            await managerService.sendMessage({
                recipient_ids: [targetRecipientId],
                body: newMessage,
                subject: `Re: ${selectedThread.subject}`,
                thread_id: selectedThread.thread_id,
                parent_message: selectedThread.id
            });
            setNewMessage('');

            // Refresh thread
            const threadResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/user-messages/threads/${selectedThread.thread_id}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const threadData = await threadResponse.json();
            setThreadMessages(threadData.results || threadData);

            fetchData();
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const threadList = messages.filter(m => m.type === activeTab);

    const renderMessages = () => (
        <div className="messages-layout">
            {/* Sidebar Threads */}
            <div className="management-card messages-thread-panel">
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder={t('communication.searchMessages')}
                            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
                        />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {threadList.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('communication.noItems')}</div>
                    )}
                    {threadList.map((thread) => (
                        <div
                            key={thread.id}
                            onClick={() => handleMessageClick(thread)}
                            style={{
                                padding: '1.25rem',
                                borderBottom: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                backgroundColor: selectedThread?.id === thread.id ? 'var(--color-bg-body)' : 'transparent',
                                borderLeft: selectedThread?.id === thread.id ? '4px solid var(--color-primary)' : '4px solid transparent',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} style={{ color: 'var(--color-primary)' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <h4 style={{ fontSize: '0.925rem', fontWeight: '600', color: 'var(--color-text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {thread.sender?.full_name || thread.sender?.email}
                                        </h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {new Date(thread.sent_at || thread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginBottom: '2px' }}>{thread.subject}</div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {thread.body}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Content */}
            <div className="management-card messages-chat-panel">
                {selectedThread ? (
                    <>
                        <div className="messages-chat-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} style={{ color: 'var(--color-primary)' }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: 'var(--color-text-main)' }}>
                                        {selectedThread.sender?.full_name || selectedThread.sender?.email}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {selectedThread.type === 'sent'
                                                ? `${t('communication.to')}: ${selectedThread.receipts?.[0]?.recipient?.full_name || selectedThread.receipts?.[0]?.recipient?.email || '...'}`
                                                : `${t('communication.from')}: ${selectedThread.sender?.full_name || selectedThread.sender?.email}`}
                                            &bull; {new Date(selectedThread.sent_at || selectedThread.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="messages-chat-body">
                            {loadingThread ? (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Loading conversation...</div>
                            ) : (
                                threadMessages.map(m => (
                                    <div
                                        key={m.id}
                                        className="messages-chat-bubble"
                                        style={{
                                            alignSelf: m.sender?.id === user?.id ? 'flex-end' : 'flex-start',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: m.sender?.id === user?.id ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '1rem',
                                            background: m.sender?.id === user?.id ? 'var(--color-primary)' : 'var(--color-bg-body)',
                                            color: m.sender?.id === user?.id ? 'white' : 'var(--color-text-main)',
                                            borderBottomRightRadius: m.sender?.id === user?.id ? '0' : '1rem',
                                            borderBottomLeftRadius: m.sender?.id === user?.id ? '1rem' : '0',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            border: m.sender?.id === user?.id ? 'none' : '1px solid var(--color-border)'
                                        }}>
                                            <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{m.body}</p>
                                        </div>
                                        <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--color-text-muted)', display: 'flex', gap: '8px' }}>
                                            <span>{m.sender?.full_name || 'User'}</span>
                                            <span>{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="messages-chat-form">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={t('communication.typeReply')}
                                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', outline: 'none', fontSize: '0.925rem' }}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0.75rem' }}>
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        <MessageSquare size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>{t('communication.selectMessage')}</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="management-card">
            <div className="table-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="chart-title" style={{ margin: 0 }}>{t('communication.notificationCenter')}</h3>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllRead}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                        {t('header.markAllRead')}
                    </button>
                )}
            </div>
            <div style={{ padding: '0' }}>
                {notifications.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('communication.noItems')}</div>
                )}
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            gap: '1.25rem',
                            backgroundColor: notif.is_read ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.03)',
                            position: 'relative',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {!notif.is_read && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--color-primary)' }}></div>}
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--color-bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                            <Bell size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-main)', margin: 0 }}>{notif.title || 'System Notification'}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={14} />
                                    {new Date(notif.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p style={{ fontSize: '0.925rem', color: 'var(--color-text-muted)', margin: '0.5rem 0', lineHeight: '1.5' }}>
                                {notif.message || notif.content}
                            </p>
                            {!notif.is_read && (
                                <button
                                    onClick={() => handleMarkRead(notif.id)}
                                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    Mark as read
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="school-communication-page">
            <div className="school-manager-header">
                <div>
                    <h1 className="school-manager-title">{t('school.communication.title')}</h1>
                    <p className="school-manager-subtitle">{t('communication.subtitle')}</p>
                </div>
                <div className="school-communication-tabs">
                    <button
                        className="btn-primary"
                        onClick={openCompose}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.1rem', borderRadius: '0.75rem' }}
                    >
                        <Plus size={18} />
                        {t('communication.newMessage') || 'New message'}
                    </button>
                    <button className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`} onClick={() => setActiveTab('received')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', background: activeTab === 'received' ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: activeTab === 'received' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                        <MessageSquare size={18} />
                        {t('communication.received')}
                    </button>
                    <button className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', background: activeTab === 'sent' ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: activeTab === 'sent' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                        <Send size={18} />
                        {t('communication.sent')}
                    </button>
                    <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', background: activeTab === 'notifications' ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: activeTab === 'notifications' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                        <Bell size={18} />
                        {t('communication.notifications')}
                        {notifications.filter(n => !n.is_read).length > 0 && (
                            <span style={{ fontSize: '10px', background: 'var(--color-error)', color: '#fff', padding: '2px 6px', borderRadius: '999px', marginLeft: '4px' }}>
                                {notifications.filter(n => !n.is_read).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {showCompose && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                    }}
                    onClick={() => setShowCompose(false)}
                >
                    <div
                        className="management-card"
                        style={{ width: '640px', maxWidth: '100%', padding: '1.5rem' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="chart-title" style={{ marginTop: 0, marginBottom: '1rem' }}>
                            {t('communication.newMessage') || 'New message'}
                        </h3>

                        <form onSubmit={handleSendNewMessage} style={{ display: 'grid', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {t('communication.to') || 'To'}
                                </label>
                                <select
                                    value={composeRecipientId}
                                    onChange={(e) => setComposeRecipientId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                    }}
                                    required
                                >
                                    <option value="">{t('communication.selectRecipient') || 'Select recipient'}</option>
                                    {recipients.map(r => (
                                        <option key={r.id} value={r.id}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {t('communication.subject') || 'Subject'}
                                </label>
                                <input
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {t('communication.message') || 'Message'}
                                </label>
                                <textarea
                                    value={composeBody}
                                    onChange={(e) => setComposeBody(e.target.value)}
                                    rows={6}
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--color-border)',
                                        resize: 'vertical',
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCompose(false)}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--color-border)',
                                        background: 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1rem', borderRadius: '0.75rem' }}>
                                    <Send size={18} />
                                    {t('communication.send') || 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Loading...</div>
            ) : (
                <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                    {activeTab === 'notifications' ? renderNotifications() : renderMessages()}
                </div>
            )}
        </div>
    );
};

export default SchoolCommunication;
