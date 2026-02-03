import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Send, Plus, MessageSquare, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import workstreamService from '../../services/workstreamService';
import './Workstream.css';



const WorkstreamCommunication = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('received');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [replyBody, setReplyBody] = useState('');

    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [msgsRes, notifsRes] = await Promise.all([
                workstreamService.getMessages(),
                workstreamService.getNotifications()
            ]);

            // Map backend messages to frontend format
            const mappedMsgs = (msgsRes.results || msgsRes).map(m => {
                const myReceipt = m.receipts?.find(r => r.recipient?.id === user?.id);
                const isSentByMe = m.sender?.id === user?.id;

                return {
                    ...m,
                    id: m.id,
                    type: isSentByMe ? 'sent' : 'received',
                    sender: m.sender?.full_name || m.sender?.email || 'System',
                    subject: m.subject,
                    date: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    preview: (m.body || '').substring(0, 50) + '...',
                    content: m.body,
                    role: m.sender?.role || 'Staff',
                    read: myReceipt ? myReceipt.is_read : true
                };
            });

            setMessages(mappedMsgs);
            setNotifications(notifsRes.results || notifsRes);
        } catch (error) {
            console.error('Failed to fetch communications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleMessageClick = async (msg) => {
        setSelectedMessage(msg);
        if (!msg.read) {
            try {
                await workstreamService.markMessageRead(msg.id);
                setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m));
            } catch (error) {
                console.error('Failed to mark message as read:', error);
            }
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await workstreamService.markNotificationRead(notif.id);
                setNotifications(notifs => notifs.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }
    };

    const handleSendReply = async () => {
        if (!replyBody.trim()) return;

        try {
            let targetRecipientId = null;
            if (selectedMessage.sender?.id === user?.id) {
                targetRecipientId = selectedMessage.receipts?.[0]?.recipient?.id;
            } else {
                targetRecipientId = selectedMessage.sender?.id;
            }

            if (!targetRecipientId) {
                alert('Could not determine recipient for reply.');
                return;
            }

            await workstreamService.sendMessage({
                recipient_ids: [targetRecipientId],
                subject: `Re: ${selectedMessage.subject}`,
                body: replyBody,
                thread_id: selectedMessage.thread_id,
                parent_message: selectedMessage.id
            });

            setReplyBody('');
            alert('Reply sent!');
            fetchData();
        } catch (err) {
            console.error('Error sending reply:', err);
            alert('Failed to send reply. ' + (err.response?.data?.detail || ''));
        }
    };

    const filteredItems = activeTab === 'notifications'
        ? notifications
        : messages.filter(m => m.type === activeTab && (m.sender.toLowerCase().includes(searchTerm.toLowerCase()) || m.subject.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <div className="workstream-dashboard" style={{ height: 'calc(100vh - 60px)', overflow: 'hidden' }}>
            <div className="workstream-header" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="workstream-title">{t('workstream.communication.title')}</h1>
                        <p className="workstream-subtitle">{t('workstream.communication.subtitle')}</p>
                    </div>
                    <Button variant="primary" icon={Plus}>{t('workstream.communication.newMessage')}</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: 'calc(100% - 100px)' }}>
                {/* Sidebar / List */}
                <div className="management-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder={activeTab === 'notifications' ? t('workstream.communication.searchNotifications') : t('workstream.communication.searchMessages')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--color-bg-body)', borderRadius: '0.5rem' }}>
                            {['received', 'sent', 'notifications'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSelectedMessage(null); }}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        fontSize: '0.75rem',
                                        borderRadius: '0.375rem',
                                        background: activeTab === tab ? 'var(--color-bg-surface)' : 'transparent',
                                        color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        border: activeTab === tab ? '1px solid var(--color-border)' : 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    {t(`workstream.communication.${tab}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredItems.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('workstream.communication.noItems')}</div>
                        )}

                        {activeTab === 'notifications' ? (
                            filteredItems.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        background: notif.is_read ? 'transparent' : 'var(--color-bg-body)',
                                        borderLeft: notif.is_read ? 'none' : '4px solid var(--color-primary)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{notif.title}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{notif.message}</div>
                                </div>
                            ))
                        ) : (
                            filteredItems.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleMessageClick(msg)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        background: selectedMessage?.id === msg.id ? 'var(--color-bg-body)' : (msg.read ? 'transparent' : 'var(--color-bg-body)'),
                                        borderLeft: !msg.read ? '4px solid var(--color-primary)' : (selectedMessage?.id === msg.id ? '4px solid var(--color-border)' : 'none')
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: msg.read ? 400 : 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                                            {msg.sender.split('(')[0]}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{msg.date}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                                        {msg.role}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: msg.read ? 400 : 600, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{msg.subject}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {msg.preview}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="management-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                    {activeTab === 'notifications' ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>
                            <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3>{t('workstream.communication.selectNotificationTitle')}</h3>
                            <p>{t('workstream.communication.selectNotification')}</p>
                        </div>
                    ) : selectedMessage ? (
                        <>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                            {selectedMessage.subject}
                                        </h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#64748b', fontSize: '1.2rem' }}>
                                                {selectedMessage.sender.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{selectedMessage.sender}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                    {selectedMessage.type === 'sent'
                                                        ? `${t('communication.to')}: ${selectedMessage.receipts?.[0]?.recipient?.full_name || selectedMessage.receipts?.[0]?.recipient?.email || '...'}`
                                                        : `${t('communication.from')}: ${selectedMessage.sender}`}
                                                    &bull; {selectedMessage.date}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                                <p style={{ color: 'var(--color-text-main)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                                    {selectedMessage.content}
                                </p>
                            </div>

                            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-body)' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder={t('workstream.communication.replyPlaceholder')}
                                        value={replyBody}
                                        onChange={(e) => setReplyBody(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                    <Button variant="primary" icon={Send} onClick={handleSendReply}>{t('workstream.communication.send')}</Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                            <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ fontSize: '1.1rem' }}>{t('workstream.communication.selectMessage')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkstreamCommunication;
