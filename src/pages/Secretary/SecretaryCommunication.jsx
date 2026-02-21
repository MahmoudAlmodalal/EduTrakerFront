import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Plus, MessageSquare, Search, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import secretaryService from '../../services/secretaryService';
import notificationService from '../../services/notificationService';
import { api } from '../../utils/api';

const SecretaryCommunication = () => {
    const { t } = useTheme();
    const { showSuccess, showError, showWarning, showInfo } = useToast();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('internal');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const fetchData = async () => {
        if (!user) return; // Added user check
        try {
            setLoading(true);
            const [msgsRes, notifsRes] = await Promise.all([
                api.get('/user-messages/'),
                notificationService.getNotifications()
            ]);

            const rawMessages = msgsRes.results || msgsRes;
            console.log('=== DEBUG: Fetched Messages ===');
            console.log('Raw messages:', rawMessages);
            console.log('First message sample:', rawMessages[0]);

            const mappedMsgs = rawMessages.map(m => {
                const myReceipt = m.receipts?.find(r => r.recipient?.id === user?.id);
                const isSentByMe = m.sender?.id === user?.id;

                console.log(`Message ${m.id}: sender=${m.sender?.id}, isSentByMe=${isSentByMe}`);

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

    const [threadMessages, setThreadMessages] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);

    const handleMessageClick = async (msg) => {
        setSelectedMessage(msg);
        setLoadingThread(true);
        setThreadMessages([]);
        try {
            // Use shared API client so auth headers & base URL are consistent
            const data = await api.get(`/user-messages/threads/${msg.thread_id}/`);
            setThreadMessages(data.results || data);

            const myReceipt = msg.receipts?.find(r => r.recipient?.id === user?.id);
            if (activeTab !== 'notifications' && !msg.read && myReceipt) {
                await secretaryService.markMessageRead(msg.id);
                setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m));
            }
        } catch (err) {
            console.error('Error fetching thread:', err);
            setThreadMessages([msg]);
        } finally {
            setLoadingThread(false);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await notificationService.markAsRead(notif.id);
                setNotifications(notifs => notifs.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
            } catch (error) {
                console.error('Error marking notification read:', error);
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifs => notifs.map(n => ({ ...n, is_read: true })));
            showSuccess('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all notifications read:', error);
            showError('Failed to mark notifications as read');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage || !selectedMessage) return;

        console.log('=== DEBUG: Sending Reply ===');
        console.log('Selected Message:', selectedMessage);
        console.log('User ID:', user?.id);
        console.log('Sender ID:', selectedMessage.sender?.id);
        console.log('Receipts:', selectedMessage.receipts);

        try {
            let targetRecipientId = null;

            // Determine recipient based on message direction
            if (selectedMessage.sender?.id === user?.id) {
                // User is the sender - reply to the first recipient
                const receipts = selectedMessage.receipts || [];
                console.log('User is sender, receipts array:', receipts);

                if (receipts.length > 0 && receipts[0]?.recipient?.id) {
                    targetRecipientId = receipts[0].recipient.id;
                    console.log('Target recipient ID from receipts:', targetRecipientId);
                } else {
                    showError('Could not determine recipient for reply. This message has no recipients.');
                    console.error('FAILED: No recipients found in receipts array');
                    console.error('Receipts data:', JSON.stringify(selectedMessage.receipts, null, 2));
                    return;
                }
            } else {
                // User is the recipient - reply to the sender
                console.log('User is recipient, replying to sender');
                if (selectedMessage.sender?.id) {
                    targetRecipientId = selectedMessage.sender.id;
                    console.log('Target recipient ID (sender):', targetRecipientId);
                } else {
                    showError('Could not determine sender for reply. Sender information is missing.');
                    console.error('FAILED: No sender found');
                    console.error('Sender data:', JSON.stringify(selectedMessage.sender, null, 2));
                    return;
                }
            }

            console.log('Sending message to recipient:', targetRecipientId);
            const response = await secretaryService.sendMessage({
                recipient_ids: [targetRecipientId],
                body: newMessage,
                subject: `Re: ${selectedMessage.subject}`,
                thread_id: selectedMessage.thread_id,
                parent_message: selectedMessage.id
            });

            console.log('Message sent successfully, response:', response);
            setNewMessage('');
            showSuccess('Message sent successfully!');

            // Refresh thread
            const threadData = await api.get(`/user-messages/threads/${selectedMessage.thread_id}/`);
            setThreadMessages(threadData.results || threadData);

            await fetchData();
        } catch (error) {
            console.error('=== ERROR Sending Message ===');
            console.error('Error object:', error);
            console.error('Error response:', error.response);
            console.error('Error response data:', error.response?.data);
            showError('Error sending message: ' + (error.response?.data?.detail || error.message));
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
            <header className="secretary-header">
                <div>
                    <h1>{t('secretary.communication.title')}</h1>
                    <p>{t('secretary.communication.subtitle')}</p>
                </div>
                <div className="sec-comm-header-actions" style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn-secondary sec-mobile-drawer-toggle"
                        onClick={() => setIsSidebarOpen(true)}
                        title="Open Sidebar"
                    >
                        <Menu size={18} />
                    </button>
                    <button className="btn-primary">
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        {t('communication.compose')}
                    </button>
                </div>
            </header>

            <div className="sec-communication-grid">
                {/* Mobile Drawer Backdrop */}
                <div
                    className={`sec-drawer-backdrop ${isSidebarOpen ? 'is-visible' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar / List */}
                <div className={`sec-comm-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
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
                        {activeTab === 'notifications' && notifications.some(n => !n.is_read) && (
                            <div style={{ padding: '0.5rem 1rem', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--sec-border)' }}>
                                <button
                                    onClick={handleMarkAllRead}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sec-primary)' }}
                                >
                                    {t('header.markAllRead')}
                                </button>
                            </div>
                        )}
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
                <div className="sec-comm-content">
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
                                {loadingThread ? (
                                    <div style={{ textAlign: 'center', color: 'var(--sec-text-muted)', fontStyle: 'italic' }}>Loading conversation...</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {threadMessages.map(m => (
                                            <div
                                                key={m.id}
                                                style={{
                                                    alignSelf: m.sender?.id === user?.id ? 'flex-end' : 'flex-start',
                                                    maxWidth: '80%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: m.sender?.id === user?.id ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                <div style={{
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '1rem',
                                                    background: m.sender?.id === user?.id ? 'var(--sec-primary)' : 'var(--sec-border)',
                                                    color: m.sender?.id === user?.id ? 'white' : 'var(--sec-text-main)',
                                                    borderBottomRightRadius: m.sender?.id === user?.id ? '0' : '1rem',
                                                    borderBottomLeftRadius: m.sender?.id === user?.id ? '1rem' : '0',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                    <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{m.body}</p>
                                                </div>
                                                <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--sec-text-muted)', display: 'flex', gap: '8px' }}>
                                                    <span>{m.sender?.full_name || 'User'}</span>
                                                    <span>{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
