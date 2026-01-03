import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Send, Plus, MessageSquare, Users, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import styles from './Dashboard.module.css';

const Communication = () => {
    const { t } = useTheme();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('internal');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyText, setReplyText] = useState('');

    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [newMessage, setNewMessage] = useState({ recipient: '', subject: '', content: '' });

    const handleSendReply = () => {
        if (!replyText.trim() || !selectedMessage) return;
        
        const replyMsg = {
            id: Date.now(),
            type: 'internal',
            sender: 'Super Admin', // Current User
            subject: `Re: ${selectedMessage.subject}`,
            date: 'Just now',
            preview: `Reply: ${replyText.substring(0, 50)}...`,
            content: replyText,
            role: 'Admin',
            read: true
        };

        const updatedMessages = [replyMsg, ...messages];
        setMessages(updatedMessages);
        setReplyText('');
        alert(t('Message sent successfully'));
    };

    const handleCompose = (e) => {
        e.preventDefault();
        const msg = {
            id: Date.now(),
            type: 'internal',
            sender: 'Super Admin',
            subject: newMessage.subject,
            date: 'Just now',
            preview: newMessage.content.substring(0, 50) + '...',
            content: newMessage.content,
            role: 'Admin',
            read: true
        };
        setMessages([msg, ...messages]);
        setIsComposeOpen(false);
        setNewMessage({ recipient: '', subject: '', content: '' });
    };

    const [messages, setMessages] = useState(() => {
        const savedMessages = localStorage.getItem('edutraker_messages');
        return savedMessages ? JSON.parse(savedMessages) : [
            { id: 1, type: 'internal', sender: "Ahmed (Gaza North Manager)", subject: "Weekly Report", date: "10:30 AM", preview: "Here is the weekly report for the northern district schools...", content: "Dear Admin,\n\nHere is the weekly report for the northern district schools. We have successfully completed the renovation of 3 schools and distributed the new textbooks.\n\nAttendance rates are up by 5% compared to last week.\n\nBest regards,\nAhmed", role: "Workstream Manager", read: false },
            { id: 2, type: 'internal', sender: "Sarah (System Admin)", subject: "Database Maintenance", date: "Yesterday", preview: "Scheduled maintenance will happen on Friday at...", content: "Scheduled maintenance will happen on Friday at 2:00 AM UTC. Please ensure all backups are completed.", role: "Admin", read: true },
            { id: 3, type: 'external', sender: "Mohammed Al-Masri (Parent)", subject: "Login Inquiry", date: "Oct 12", preview: "I was unable to login to the portal using...", content: "Hello,\n\nI was unable to login to the portal using my provided credentials. It says 'Invalid Password' even though I just reset it.\n\nCan you please check my account status?\n\nThanks,\nMohammed", role: "Guardian", read: false },
            { id: 4, type: 'external', sender: "Fatima Khalil (Parent)", subject: "Transport Request", date: "Oct 11", preview: "Is there a bus route available for...", content: "Is there a bus route available for the new residential area in Khan Younis?", role: "Guardian", read: true }
        ];
    });

    useEffect(() => {
        localStorage.setItem('edutraker_messages', JSON.stringify(messages));
    }, [messages]);

    const [notifications, setNotifications] = useState([
        { id: 101, title: "New School Registered", message: "Al-Amal School has completed registration.", time: "2 hours ago", read: false },
        { id: 102, title: "System Alert", message: "High server load detected.", time: "5 hours ago", read: true },
        { id: 103, title: "User Report", message: "50 new users added today.", time: "1 day ago", read: true }
    ]);

    const handleMessageClick = (msg) => {
        setSelectedMessage(msg);
        // Mark as read
        setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m));
    };

    const handleNotificationClick = (notif) => {
        // Mark notification as read
        setNotifications(notifs => notifs.map(n => n.id === notif.id ? { ...n, read: true } : n));
    };

    const filteredItems = activeTab === 'notifications'
        ? notifications
        : messages.filter(m => m.type === activeTab && (m.sender.toLowerCase().includes(searchTerm.toLowerCase()) || m.subject.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>{t('communication.title')}</h1>
                    <p className={styles.subtitle}>{t('communication.subtitle')}</p>
                </div>

                <Button variant="primary" icon={Plus} onClick={() => setIsComposeOpen(true)}>{t('communication.newMessage')}</Button>
            </div>

            {isComposeOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className={styles.card} style={{ width: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 className={styles.cardTitle} style={{ marginBottom: '1.5rem' }}>{t('communication.newMessage')}</h3>
                        <form onSubmit={handleCompose} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>To</label>
                                <select 
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                    value={newMessage.recipient}
                                    onChange={e => setNewMessage({...newMessage, recipient: e.target.value})}
                                >
                                    <option value="">Select Recipient</option>
                                    <option value="All Workstream Managers">All Workstream Managers</option>
                                    <option value="All School Managers">All School Managers</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Subject</label>
                                <input 
                                    type="text" 
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                    value={newMessage.subject}
                                    onChange={e => setNewMessage({...newMessage, subject: e.target.value})}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Message</label>
                                <textarea 
                                    required
                                    rows={5}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)' }}
                                    value={newMessage.content}
                                    onChange={e => setNewMessage({...newMessage, content: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="outline" type="button" onClick={() => setIsComposeOpen(false)}>{t('common.cancel')}</Button>
                                <Button variant="primary" type="submit">{t('communication.send')}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '1.5rem', height: 'calc(100vh - 200px)' }}>
                {/* Sidebar / List */}
                <div style={{ background: 'var(--color-bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={16} style={{ position: 'absolute', insetInlineStart: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder={activeTab === 'notifications' ? t('communication.searchNotifications') : t('communication.searchMessages')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.5rem 0.5rem 2.25rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.875rem',
                                    background: 'var(--color-bg-body)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--color-bg-body)', borderRadius: '0.5rem' }}>
                            {['internal', 'external', 'notifications'].map(tab => (
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
                                    {t(`communication.tabs.${tab}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredItems.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{t('communication.noItems')}</div>
                        )}

                        {activeTab === 'notifications' ? (
                            // Notifications List
                            filteredItems.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        background: notif.read ? 'var(--color-bg-surface)' : 'var(--color-bg-body)',
                                        borderLeft: notif.read ? 'none' : '4px solid var(--color-primary)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{notif.title}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{notif.time}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{notif.message}</div>
                                </div>
                            ))
                        ) : (
                            // Messages List
                            filteredItems.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleMessageClick(msg)}
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        background: selectedMessage?.id === msg.id ? 'var(--color-bg-body)' : (msg.read ? 'var(--color-bg-surface)' : 'var(--color-bg-body)'),
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
                                        {msg.role === 'Workstream Manager' ? t('auth.role.workstreamManager') :
                                            msg.role === 'Admin' ? t('auth.role.superAdmin') :
                                                msg.role === 'Guardian' ? t('auth.role.guardian') :
                                                    msg.role}
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
                <div style={{ background: 'var(--color-bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                    {activeTab === 'notifications' ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>
                            <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3>{t('communication.notificationCenter')}</h3>
                            <p>{t('communication.notificationHint')}</p>
                            <p>{t('communication.notificationDesc')}</p>
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
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('communication.to')} Super Admin &bull; {selectedMessage.date}</div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Removed Archive and Forward buttons as requested */}
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
                                        placeholder={t('communication.typeReply')}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                    <Button variant="primary" icon={Send} onClick={handleSendReply}>{t('communication.send')}</Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                            <MessageSquare size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p style={{ fontSize: '1.1rem' }}>{t('communication.selectMessage')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Communication;
