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

const SchoolCommunication = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('messages');
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [selectedThread, setSelectedThread] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [msgsData, notifsData] = await Promise.all([
                managerService.getMessages(),
                managerService.getNotifications()
            ]);
            setMessages(msgsData.results || msgsData);
            setNotifications(notifsData.results || notifsData);
            if (msgsData.results?.length > 0 || msgsData.length > 0) {
                setSelectedThread(msgsData.results?.[0] || msgsData[0]);
            }
        } catch (error) {
            console.error('Failed to fetch communication data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedThread) return;
        try {
            const data = {
                receiver_id: selectedThread.receiver_id || selectedThread.sender_id, // Simple logic for demo
                content: newMessage
            };
            await managerService.sendMessage(data);
            setNewMessage('');
            // Refetch or optimistic update could go here
            fetchData();
        } catch (error) {
            console.error('Failed to send message:', error);
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

    const renderMessages = () => (
        <div className="messages-layout" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: 'calc(100vh - 250px)' }}>
            {/* Sidebar Threads */}
            <div className="management-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
                        />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {messages.map((thread) => (
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
                                            {thread.sender_name || 'Admin Subject'}
                                        </h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>10:24 AM</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {thread.content}
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
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: 'var(--color-text-main)' }}>{selectedThread.sender_name || 'Admin Subject'}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Online</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="icon-btn" style={{ padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                    <MoreVertical size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ alignSelf: 'flex-start', maxWidth: '70%', backgroundColor: 'var(--color-bg-body)', padding: '1rem', borderRadius: '0 1rem 1rem 1rem', border: '1px solid var(--color-border)' }}>
                                <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: '1.5' }}>{selectedThread.content}</p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'block' }}>10:24 AM</span>
                            </div>
                            <div style={{ alignSelf: 'flex-end', maxWidth: '70%', backgroundColor: 'var(--color-primary)', color: '#fff', padding: '1rem', borderRadius: '1rem 1rem 0 1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.925rem', lineHeight: '1.5' }}>Thanks! I will review that this afternoon.</p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>10:30 AM</span>
                                    <Check size={12} />
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem' }}>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
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
                        <p>Select a message thread to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Recent Notifications</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary">
                        <CheckCircle2 size={16} />
                        Mark All as Read
                    </button>
                </div>
            </div>
            <div style={{ padding: '0' }}>
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
                    <h1 className="school-manager-title">{t('school.communication.title') || 'Communication Center'}</h1>
                    <p className="school-manager-subtitle">Manage internal messages and system notifications.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', background: activeTab === 'messages' ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: activeTab === 'messages' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                        <MessageSquare size={18} />
                        Messages
                    </button>
                    <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', background: activeTab === 'notifications' ? 'var(--color-primary)' : 'var(--color-bg-surface)', color: activeTab === 'notifications' ? '#fff' : 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                        <Bell size={18} />
                        Notifications
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
                    {activeTab === 'messages' ? renderMessages() : renderNotifications()}
                </div>
            )}
        </div>
    );
};

export default SchoolCommunication;
