import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Plus, MessageSquare, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';

const SecretaryCommunication = () => {
    const { t } = useTheme();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('internal');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'notifications') {
                const data = await secretaryService.getNotifications();
                setNotifications(data.results || data);
            } else {
                const data = await secretaryService.getMessages();
                // Filter messages based on internal/external if backend doesn't
                const allMessages = data.results || data;
                setMessages(allMessages);
            }
        } catch (error) {
            console.error('Error fetching communication data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMessageClick = (msg) => {
        setSelectedMessage(msg);
        // Mark as read if needed
    };

    const handleNotificationClick = async (notif) => {
        try {
            await secretaryService.markNotificationRead(notif.id);
            fetchData();
        } catch (error) {
            console.error('Error marking notification read:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage || !selectedMessage) return;
        try {
            await secretaryService.sendMessage({
                recipient_id: selectedMessage.sender_id || selectedMessage.user?.id,
                content: newMessage,
                subject: `Re: ${selectedMessage.subject}`
            });
            setNewMessage('');
            alert('Message sent!');
        } catch (error) {
            alert('Error sending message: ' + error.message);
        }
    };

    const filteredItems = activeTab === 'notifications'
        ? notifications
        : messages.filter(m => {
            // Internal vs External logic here if applicable
            const isInternal = m.sender_role !== 'Guardian';
            const matchesTab = activeTab === 'internal' ? isInternal : !isInternal;
            return matchesTab && (
                (m.sender_name || m.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
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
                    {t('secretary.communication.compose')}
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
                                placeholder={activeTab === 'notifications' ? t('secretary.communication.searchMessages') : t('secretary.communication.searchMessages')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--sec-border)', borderRadius: '0.5rem' }}>
                            {['internal', 'external', 'notifications'].map(tab => (
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
                                    {tab === 'internal' ? t('secretary.communication.messages') :
                                        tab === 'notifications' ? t('secretary.communication.notifications') : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? <p className="p-4 text-center">Loading...</p> : filteredItems.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No items found</div>
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
                                        background: selectedMessage?.id === msg.id ? 'rgba(79, 70, 229, 0.1)' : (msg.is_read ? 'var(--sec-surface)' : 'var(--sec-border)'),
                                        borderLeft: !msg.is_read ? '4px solid var(--sec-primary)' : (selectedMessage?.id === msg.id ? '4px solid var(--sec-border)' : 'none')
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: msg.is_read ? 400 : 700, fontSize: '0.9rem', color: 'var(--sec-text-main)' }}>
                                            {msg.sender_name || msg.user?.full_name}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--sec-text-muted)' }}>{msg.created_at?.split('T')[0]}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--sec-primary)', marginBottom: '0.25rem' }}>
                                        {msg.sender_role}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: msg.is_read ? 400 : 600, color: 'var(--sec-text-main)', marginBottom: '0.25rem' }}>{msg.subject}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--sec-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {msg.content}
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
                            <h3 style={{ color: 'var(--sec-text-main)' }}>Notification Center</h3>
                            <p>Here you can view all your system alerts and notifications.</p>
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
                                                {(selectedMessage.sender_name || selectedMessage.user?.full_name || 'U').charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--sec-text-main)' }}>{selectedMessage.sender_name || selectedMessage.user?.full_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--sec-text-muted)' }}>to me &bull; {selectedMessage.created_at}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                                <p style={{ color: 'var(--sec-text-main)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                                    {selectedMessage.content}
                                </p>
                            </div>

                            <div style={{ padding: '1rem', borderTop: '1px solid var(--sec-border)', background: 'var(--sec-border)', borderBottomLeftRadius: '0.5rem', borderBottomRightRadius: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder={t('secretary.communication.typeMessage')}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--sec-border)', background: 'var(--sec-surface)', color: 'var(--sec-text-main)' }}
                                    />
                                    <button className="btn-primary" onClick={handleSendMessage}>
                                        <Send size={18} style={{ marginRight: '8px' }} />
                                        {t('secretary.communication.sendMessage')}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--sec-text-muted)' }}>
                            <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ fontSize: '1.1rem' }}>Select a message to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecretaryCommunication;
