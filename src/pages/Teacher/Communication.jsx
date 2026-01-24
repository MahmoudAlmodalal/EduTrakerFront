import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Search, Send, User, Bell, X, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';

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
                    secretaryService.getMessages(),
                    secretaryService.getNotifications()
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
                recipient_id: newMessage.to,
                subject: newMessage.subject,
                content: newMessage.body
            };
            const sent = await secretaryService.sendMessage(payload);
            setMessages([sent, ...messages]);
            setIsComposing(false);
            setNewMessage({ to: '', subject: '', body: '' });
            alert('Message sent successfully!');
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;

        const updatedMessages = messages.map(msg => {
            if (msg.id === selectedMessage.id) {
                const newThread = [
                    ...msg.thread,
                    { id: Date.now(), from: 'Me', text: replyText, time: 'Just now' }
                ];
                const updatedMsg = { ...msg, thread: newThread };
                setSelectedMessage(updatedMsg);
                return updatedMsg;
            }
            return msg;
        });

        setMessages(updatedMessages);
        setReplyText('');
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
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {itemsToDisplay.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedMessage(item)}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--teacher-border)',
                                    cursor: 'pointer',
                                    backgroundColor: selectedMessage?.id === item.id ? 'var(--teacher-bg)' : 'transparent',
                                    borderLeft: selectedMessage?.id === item.id ? '4px solid var(--teacher-primary)' : '4px solid transparent',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: !item.is_read ? '700' : '600', color: !item.is_read ? 'var(--teacher-text-main)' : 'var(--teacher-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {selectedTab === 'messages' ? (item.sender_name || `User ${item.sender}`) : 'System'}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--teacher-text-muted)' }}>{new Date(item.created_at || item.timestamp).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: !item.is_read ? '500' : '400', color: 'var(--teacher-text-main)' }}>
                                    {item.subject || item.title || 'No Subject'}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--teacher-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.content || item.message}</p>
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
                            </div>
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
