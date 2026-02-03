import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Plus, MessageSquare, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import secretaryService from '../../services/secretaryService';

const SecretaryCommunication = () => {
    const { t } = useTheme();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('internal');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const fetchData = async () => {
        if (!user) return; // Added user check
        try {
            setLoading(true);
            const [msgsRes, notifsRes] = await Promise.all([ // Changed to Promise.all
                secretaryService.getMessages(),
                secretaryService.getNotifications()
            ]);

            const rawMessages = msgsRes.results || msgsRes;
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
            setNotifications(notifsRes.results || notifsRes);
        } catch (error) {
            console.error('Error fetching communication data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        fetchData();
    }, [user, activeTab]); // Added user to dependencies

    const handleMessageClick = async (msg) => { // Made async
        setSelectedMessage(msg);
        const myReceipt = msg.receipts?.find(r => r.recipient?.id === user?.id);
        if (activeTab !== 'notifications' && !msg.read && myReceipt) {
            try {
                await secretaryService.markMessageRead(msg.id);
                setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m));
            } catch (err) {
                console.error('Error marking message read:', err);
            }
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await secretaryService.markNotificationRead(notif.id);
                setNotifications(notifs => notifs.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (error) {
                console.error('Error marking notification read:', error);
            }
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage || !selectedMessage) return;
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

            await secretaryService.sendMessage({
                recipient_ids: [targetRecipientId], // Changed to recipient_ids array
                body: newMessage, // Changed content to body
                subject: `Re: ${selectedMessage.subject}`,
                thread_id: selectedMessage.thread_id, // Added thread_id
                parent_message: selectedMessage.id // Added parent_message
            });
            setNewMessage('');
            alert('Message sent!');
            fetchData(); // Added fetchData call
        } catch (error) {
            alert('Error sending message: ' + (error.response?.data?.detail || error.message)); // Updated error handling
        }
    };

    const filteredItems = activeTab === 'notifications'
        ? notifications
        : messages.filter(m => {
            const typeMatch = m.type === activeTab;
            const searchLower = searchTerm.toLowerCase();
            const senderName = (m.sender?.full_name || m.sender?.email || '');
            const senderMatch = senderName.toLowerCase().includes(searchLower);
            const subjectMatch = (m.subject || '').toLowerCase().includes(searchLower);

            return typeMatch && (senderMatch || subjectMatch);
        });

    return (
        <div className="secretary-dashboard" style={{ height: 'calc(100vh - 64px)', paddingBottom: 0 }}>
            <header className="secretary-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>{t('secretary.communication.title')}</h1>
                    <p>{t('secretary.communication.subtitle')}</p>
                </div>
                <button className="btn-primary">
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    {t('communication.compose')}
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: 'calc(100% - 120px)' }}>
                {/* Sidebar / List */}
                <div className="message-sidebar" style={{ background: 'var(--sec-surface)', borderRadius: '0.5rem', border: '1px solid var(--sec-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--sec-border)' }}>
                        <div className="search-wrapper" style={{ marginBottom: '1rem', width: '100%', maxWidth: 'none' }}>
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder={activeTab === 'notifications' ? t('communication.searchNotifications') : t('communication.searchMessages')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--sec-border)', borderRadius: '0.5rem' }}>
                            {['received', 'sent', 'notifications'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSelectedMessage(null); }}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        fontSize: '0.75rem',
                                        borderRadius: '0.375rem',
                                        background: activeTab === tab ? 'var(--sec-surface)' : 'transparent',
                                        color: activeTab === tab ? 'var(--sec-primary)' : 'var(--sec-text-muted)',
                                        border: activeTab === tab ? '1px solid var(--sec-border)' : 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    {tab === 'received' ? t('communication.received') :
                                        tab === 'sent' ? t('communication.sent') :
                                            tab === 'notifications' ? t('communication.notifications') : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? <p className="p-4 text-center">Loading...</p> : filteredItems.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('communication.noItems')}</div>
                        )}

                        {activeTab === 'notifications' ? (
                            filteredItems.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--sec-border)',
                                        cursor: 'pointer',
                                        background: notif.is_read ? 'var(--sec-surface)' : 'var(--sec-border)',
                                        borderLeft: notif.is_read ? 'none' : '4px solid var(--sec-primary)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--sec-text-main)' }}>{notif.title}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--sec-text-muted)' }}>{notif.created_at?.split('T')[0]}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--sec-text-muted)' }}>{notif.message}</div>
                                </div>
                            ))
                        ) : (
                            filteredItems.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleMessageClick(msg)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--sec-border)',
                                        cursor: 'pointer',
                                        background: selectedMessage?.id === msg.id ? 'rgba(79, 70, 229, 0.1)' : (msg.read ? 'var(--sec-surface)' : 'var(--sec-border)'),
                                        borderLeft: !msg.read ? '4px solid var(--sec-primary)' : (selectedMessage?.id === msg.id ? '4px solid var(--sec-border)' : 'none')
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: msg.read ? 400 : 700, fontSize: '0.9rem', color: 'var(--sec-text-main)' }}>
                                            {msg.sender?.full_name || msg.sender?.email}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--sec-text-muted)' }}>{new Date(msg.sent_at || msg.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--sec-primary)', marginBottom: '0.25rem' }}>
                                        {msg.sender?.role}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: msg.read ? 400 : 600, color: 'var(--sec-text-main)', marginBottom: '0.25rem' }}>{msg.subject}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--sec-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {msg.body?.substring(0, 50)}...
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="message-content" style={{ background: 'var(--sec-surface)', borderRadius: '0.5rem', border: '1px solid var(--sec-border)', display: 'flex', flexDirection: 'column' }}>
                    {activeTab === 'notifications' ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--sec-text-muted)', marginTop: '3rem' }}>
                            <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5, margin: '0 auto' }} />
                            <h3 style={{ color: 'var(--sec-text-main)' }}>{t('communication.notificationCenter')}</h3>
                            <p>{t('communication.notificationDesc')}</p>
                        </div>
                    ) : selectedMessage ? (
                        <>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sec-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--sec-text-main)', marginBottom: '0.5rem' }}>
                                            {selectedMessage.subject}
                                        </h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--sec-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--sec-text-muted)', fontSize: '1.2rem' }}>
                                                {(selectedMessage.sender?.full_name || 'U').charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--sec-text-main)' }}>
                                                    {selectedMessage.sender?.full_name || selectedMessage.sender?.email}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--sec-text-muted)' }}>
                                                    {selectedMessage.type === 'sent'
                                                        ? `${t('communication.to')}: ${selectedMessage.receipts?.[0]?.recipient?.full_name || selectedMessage.receipts?.[0]?.recipient?.email || '...'}`
                                                        : `${t('communication.from')}: ${selectedMessage.sender?.full_name || selectedMessage.sender?.email}`}
                                                    &bull; {new Date(selectedMessage.sent_at || selectedMessage.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                                <p style={{ color: 'var(--sec-text-main)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                                    {selectedMessage.body}
                                </p>
                            </div>

                            <div style={{ padding: '1rem', borderTop: '1px solid var(--sec-border)', background: 'var(--sec-border)', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder={t('communication.typeReply')}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--sec-border)', background: 'var(--sec-surface)', color: 'var(--sec-text-main)' }}
                                    />
                                    <button className="btn-primary" onClick={handleSendMessage}>
                                        <Send size={18} style={{ marginRight: '8px' }} />
                                        {t('communication.send')}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--sec-text-muted)' }}>
                            <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ fontSize: '1.1rem' }}>{t('communication.selectMessage')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecretaryCommunication;
