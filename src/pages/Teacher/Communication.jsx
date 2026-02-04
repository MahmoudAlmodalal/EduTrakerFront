import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Search, Send, User, Bell, X, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';
import notificationService from '../../services/notificationService';
import { api } from '../../utils/api';

const Communication = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('messages');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isComposing, setIsComposing] = useState(false);
    const [replyText, setReplyText] = useState('');

    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [msgsData, notifsData] = await Promise.all([
                    api.get('/user-messages/'),
                    notificationService.getNotifications()
                ]);
                setMessages(msgsData.results || msgsData || []);
                setNotifications(notifsData.results || notifsData || []);
            } catch (error) {
                console.error("Error fetching communication data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const [newMessage, setNewMessage] = useState({ to: '', subject: '', body: '' });

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                recipient_ids: [parseInt(newMessage.to)],
                subject: newMessage.subject,
                body: newMessage.body
            };
            const sent = await api.post('/user-messages/', payload);
            setMessages([sent, ...messages]);
            setIsComposing(false);
            setNewMessage({ to: '', subject: '', body: '' });
            alert('Message sent successfully!');
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message: " + (error.response?.data?.detail || error.message));
        }
    };

    const [threadMessages, setThreadMessages] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Error marking all read:", error);
        }
    };

    const handleMessageClick = async (msg) => {
        setSelectedMessage(msg);
        setLoadingThread(true);
        setThreadMessages([]);
        try {
            const response = await api.get(`/user-messages/threads/${msg.thread_id}/`);
            setThreadMessages(response.results || response);

            // Mark as read if needed
            const myReceipt = msg.receipts?.find(r => r.recipient?.id === user?.id);
            if (!msg.is_read && myReceipt) {
                await api.post(`/user-messages/${msg.id}/read/`);
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
            }
        } catch (error) {
            console.error("Error fetching thread:", error);
            setThreadMessages([msg]);
        } finally {
            setLoadingThread(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedMessage) return;

        try {
            let targetRecipientId = null;
            if (selectedMessage.sender?.id === user?.id) {
                targetRecipientId = selectedMessage.receipts?.[0]?.recipient?.id;
            } else {
                targetRecipientId = selectedMessage.sender?.id;
            }

            if (!targetRecipientId) {
                alert('Could not determine recipient');
                return;
            }

            const payload = {
                recipient_ids: [targetRecipientId],
                subject: `Re: ${selectedMessage.subject}`,
                body: replyText,
                thread_id: selectedMessage.thread_id,
                parent_message: selectedMessage.id
            };

            await api.post('/user-messages/', payload);
            setReplyText('');

            // Refresh thread
            const threadResponse = await api.get(`/user-messages/threads/${selectedMessage.thread_id}/`);
            setThreadMessages(threadResponse.results || threadResponse);
        } catch (error) {
            console.error("Error sending reply:", error);
            alert("Failed to send reply");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-teacher-primary" size={48} />
            </div>
        );
    }

    const itemsToDisplay = selectedTab === 'messages' ? messages : notifications;

    return (
        <div className="space-y-6 animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header className="page-header" style={{ marginBottom: '1rem', flexShrink: 0 }}>
                <div>
                    <h1 className="page-title">{t('teacher.communication.title')}</h1>
                    <p className="page-subtitle">{t('teacher.communication.subtitle')}</p>
                </div>
                <div className="action-group">
                    <button
                        onClick={() => setIsComposing(true)}
                        className="btn-primary"
                    >
                        <Send size={18} /> {t('teacher.communication.composeNew')}
                    </button>
                </div>
            </header>

            {isComposing && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', position: 'relative' }}>
                        <button
                            onClick={() => setIsComposing(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teacher-text-muted)' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800 mb-6">{t('teacher.communication.newMessage')}</h2>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.communication.to')}</label>
                                <input
                                    type="text"
                                    required
                                    value={newMessage.to}
                                    onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                                    placeholder="Recipient User ID"
                                    className="teacher-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.communication.subject')}</label>
                                <input
                                    type="text"
                                    required
                                    value={newMessage.subject}
                                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                                    className="teacher-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.communication.message')}</label>
                                <textarea
                                    required
                                    rows="5"
                                    value={newMessage.body}
                                    onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                                    className="teacher-input w-full"
                                ></textarea>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="btn-primary">
                                    <Send size={18} /> {t('teacher.communication.sendMessage')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-panel" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0 }}>
                {/* Sidebar List */}
                <div style={{ width: '35%', minWidth: '300px', borderRight: '1px solid var(--teacher-border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--teacher-border)' }}>
                        <div className="search-wrapper" style={{ marginBottom: '1rem' }}>
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder={t('teacher.communication.searchMessages')}
                                className="teacher-input has-icon w-full"
                            />
                        </div>
                        <div style={{ display: 'flex', padding: '0.25rem', backgroundColor: 'var(--teacher-bg)', borderRadius: '0.5rem' }}>
                            <button
                                onClick={() => setSelectedTab('messages')}
                                style={{
                                    flex: 1,
                                    padding: '0.375rem',
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: selectedTab === 'messages' ? 'var(--teacher-surface)' : 'transparent',
                                    color: selectedTab === 'messages' ? 'var(--teacher-primary)' : 'var(--teacher-text-muted)',
                                    boxShadow: selectedTab === 'messages' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {t('teacher.communication.messages')}
                            </button>
                            <button
                                onClick={() => setSelectedTab('notifications')}
                                style={{
                                    flex: 1,
                                    padding: '0.375rem',
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: selectedTab === 'notifications' ? 'var(--teacher-surface)' : 'transparent',
                                    color: selectedTab === 'notifications' ? 'var(--teacher-primary)' : 'var(--teacher-text-muted)',
                                    boxShadow: selectedTab === 'notifications' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {t('teacher.dashboard.notifications')}
                            </button>
                        </div>
                        {selectedTab === 'notifications' && notifications.some(n => !n.is_read) && (
                            <div style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--teacher-border)' }}>
                                <button
                                    onClick={handleMarkAllRead}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--teacher-primary)' }}
                                >
                                    {t('header.markAllRead')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {itemsToDisplay.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => selectedTab === 'messages' ? handleMessageClick(item) : setSelectedMessage(item)}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--teacher-border)',
                                    cursor: 'pointer',
                                    backgroundColor: selectedMessage?.id === item.id ? 'var(--teacher-bg)' : 'transparent',
                                    borderLeft: selectedMessage?.id === item.id ? '4px solid var(--teacher-primary)' : '4px solid transparent',
                                    transition: 'background-color 0.2s',
                                    opacity: selectedTab === 'notifications' && item.is_read ? 0.6 : 1
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: (selectedTab === 'messages' ? !item.is_read : !item.is_read) ? '700' : '600', color: (selectedTab === 'messages' ? !item.is_read : !item.is_read) ? 'var(--teacher-text-main)' : 'var(--teacher-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {selectedTab === 'messages' ? (item.sender?.full_name || item.sender?.email || `User ${item.sender?.id}`) : (item.title || 'System')}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--teacher-text-muted)' }}>{new Date(item.sent_at || item.created_at).toLocaleDateString()}</span>
                                </div>
                                {selectedTab === 'messages' && <p style={{ fontSize: '0.75rem', color: 'var(--teacher-primary)', marginBottom: '2px' }}>{item.subject}</p>}
                                <p style={{ fontSize: '0.75rem', color: 'var(--teacher-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.body || item.message}</p>
                                {selectedTab === 'notifications' && !item.is_read && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await notificationService.markAsRead(item.id);
                                            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--teacher-primary)', fontSize: '0.7rem', padding: 0, marginTop: '4px', cursor: 'pointer' }}
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Detail View */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--teacher-bg)' }}>
                    {selectedMessage ? (
                        <>
                            <div style={{ padding: '1.5rem', backgroundColor: 'var(--teacher-surface)', borderBottom: '1px solid var(--teacher-border)' }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">{selectedMessage.subject || selectedMessage.title || 'No Subject'}</h2>
                                            <p className="text-sm text-slate-600">{t('teacher.communication.from')}: <span className="font-medium">{selectedMessage.sender_name || selectedMessage.sender || 'System'}</span></p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">{new Date(selectedMessage.created_at || selectedMessage.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {loadingThread ? (
                                    <div className="flex items-center justify-center h-full text-slate-400 italic">
                                        Loading conversation...
                                    </div>
                                ) : (
                                    threadMessages.length > 0 ? (
                                        threadMessages.map(m => (
                                            <div
                                                key={m.id}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: m.sender?.id === user?.id ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                <div style={{
                                                    maxWidth: '80%',
                                                    padding: '1rem',
                                                    borderRadius: '1rem',
                                                    backgroundColor: m.sender?.id === user?.id ? 'var(--teacher-primary)' : 'var(--teacher-surface)',
                                                    color: m.sender?.id === user?.id ? 'white' : 'var(--teacher-text-main)',
                                                    borderBottomRightRadius: m.sender?.id === user?.id ? '0' : '1rem',
                                                    borderBottomLeftRadius: m.sender?.id === user?.id ? '1rem' : '0',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                    <p className="text-sm" style={{ whiteSpace: 'pre-line' }}>{m.body}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                    <span className="text-[10px] text-slate-400">{m.sender?.full_name || 'System'}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <div style={{
                                                maxWidth: '80%',
                                                padding: '1rem',
                                                borderRadius: '0.75rem',
                                                backgroundColor: 'var(--teacher-surface)',
                                                color: 'var(--teacher-text-main)',
                                                borderTopLeftRadius: '0',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                <p className="text-sm">{selectedMessage.content || selectedMessage.message}</p>
                                            </div>
                                            <span className="text-xs text-slate-400 mt-1">{new Date(selectedMessage.created_at || selectedMessage.timestamp).toLocaleString()}</span>
                                        </div>
                                    )
                                )}
                            </div>

                            {selectedTab === 'messages' && (
                                <div style={{ padding: '1rem', borderTop: '1px solid var(--teacher-border)', backgroundColor: 'var(--teacher-surface)' }}>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                            placeholder="Type your reply..."
                                            className="teacher-input flex-1"
                                        />
                                        <button
                                            onClick={handleSendReply}
                                            className="btn-primary"
                                            disabled={!replyText.trim()}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--teacher-text-muted)' }}>
                            <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p className="text-lg font-medium">{t('teacher.communication.selectToView')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Communication;
