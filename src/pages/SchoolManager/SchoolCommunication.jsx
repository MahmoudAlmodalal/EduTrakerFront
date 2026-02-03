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

    useEffect(() => {
        fetchData();
    }, [user, activeTab]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [msgsData, notifsData] = await Promise.all([
                managerService.getMessages(),
                managerService.getNotifications()
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
            fetchData();
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await managerService.markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const threadList = messages.filter(m => m.type === activeTab);

    const renderMessages = () => (
        <div className="messages-layout" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: 'calc(100vh - 250px)' }}>
            {/* Sidebar Threads */}
            <div className="management-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                            onClick={() => setSelectedThread(thread)}
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
            <div className="management-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {selectedThread ? (
                    <>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ alignSelf: 'flex-start', maxWidth: '80%', backgroundColor: 'var(--color-bg-body)', padding: '1rem', borderRadius: '0 1rem 1rem 1rem', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '4px' }}>{selectedThread.subject}</div>
                                <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{selectedThread.body}</p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'block' }}>
                                    {new Date(selectedThread.sent_at || selectedThread.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem' }}>
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
            <div className="table-header-actions">
                <h3 className="chart-title">{t('communication.notificationCenter')}</h3>
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
            <div className="school-manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="school-manager-title">{t('school.communication.title')}</h1>
                    <p className="school-manager-subtitle">{t('communication.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
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
