import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Plus, MessageSquare, Search, User, Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Guardian.css';

const Communication = () => {
    const { t } = useTheme();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('internal');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    // Mock Data for Guardian
    const [messages, setMessages] = useState([
        { id: 1, type: 'internal', sender: "Mr. Smith (Math)", subject: "Homework Progress", date: "10:30 AM", preview: "Your son is showing great progress...", content: "Hello,\n\nI wanted to let you know that John is showing great progress in Mathematics. His recent scores are well above the class average.\n\nBest regards,\nMr. Smith", role: "Teacher", read: false },
        { id: 2, type: 'internal', sender: "Ms. Johnson (English)", subject: "Missing Assignment", date: "Yesterday", preview: "Please remind John about the essay...", content: "Dear Guardian,\n\nJohn hasn't submitted his English essay which was due last Friday. Please remind him to submit it as soon as possible.\n\nThanks,\nMs. Johnson", role: "Teacher", read: true },
        { id: 3, type: 'external', sender: "School Admin", subject: "Parent-Teacher Meeting", date: "Dec  school", preview: "Invitation for the annual meeting...", content: "Dear Parents,\n\nYou are cordially invited to the annual Parent-Teacher Meeting scheduled for next Thursday at 4:30 PM in the Main Hall.\n\nRegards,\nSchool Administration", role: "Admin", read: true },
    ]);

    const [notifications, setNotifications] = useState([
        { id: 101, title: "Report Card Ready", message: "Mid-term report cards are now available in the Monitoring tab.", time: "2 hours ago", read: false },
        { id: 102, title: "Absence Alert", message: "John was marked absent for the first period today.", time: "5 hours ago", read: true },
        { id: 103, title: "School Early Closure", message: "School will close at 12:00 PM tomorrow due to weather conditions.", time: "1 day ago", read: true },
    ]);

    const handleMessageClick = (msg) => {
        setSelectedMessage(msg);
        setSelectedNotification(null);
        setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, read: true } : m));
    };

    const handleNotificationClick = (notif) => {
        setSelectedNotification(notif);
        setSelectedMessage(null);
        setNotifications(notifs => notifs.map(n => n.id === notif.id ? { ...n, read: true } : n));
    };

    const filteredItems = activeTab === 'notifications'
        ? notifications
        : messages.filter(m => m.type === activeTab && (m.sender.toLowerCase().includes(searchTerm.toLowerCase()) || m.subject.toLowerCase().includes(searchTerm.toLowerCase())));

    return (
        <div className="guardian-communication-page" style={{ height: 'calc(100vh - 120px)', paddingBottom: 0 }}>
            <header className="guardian-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="guardian-page-title" style={{ margin: 0 }}>{t('guardian.communication.title')}</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{t('guardian.communication.subtitle')}</p>
                </div>
                <button className="btn-primary">
                    <Plus size={18} />
                    {t('guardian.communication.compose')}
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '1.5rem', height: 'calc(100% - 80px)' }}>
                {/* Sidebar */}
                <div className="guardian-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                placeholder={t('guardian.communication.search')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.625rem 0.625rem 2.5rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-body)',
                                    color: 'var(--color-text-main)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--color-bg-body)', borderRadius: '10px' }}>
                            {['internal', 'external', 'notifications'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSelectedMessage(null); setSelectedNotification(null); }}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        fontSize: '0.75rem',
                                        borderRadius: '8px',
                                        background: activeTab === tab ? 'var(--color-bg-surface)' : 'transparent',
                                        color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                        border: activeTab === tab ? '1px solid var(--color-border)' : 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab === 'internal' ? t('guardian.communication.internal') :
                                        tab === 'external' ? t('guardian.communication.external') :
                                            t('guardian.communication.notifications')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredItems.length === 0 && (
                            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                <p>{t('guardian.communication.empty')}</p>
                            </div>
                        )}

                        {activeTab === 'notifications' ? (
                            filteredItems.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: '1.25rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        background: selectedNotification?.id === notif.id ? 'var(--color-primary-light)' : (notif.read ? 'transparent' : 'rgba(79, 70, 229, 0.05)'),
                                        borderLeft: !notif.read ? '4px solid var(--color-primary)' : (selectedNotification?.id === notif.id ? '4px solid transparent' : 'none'),
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{notif.title}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{notif.time}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {notif.message}
                                    </div>
                                </div>
                            ))
                        ) : (
                            filteredItems.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleMessageClick(msg)}
                                    style={{
                                        padding: '1.25rem',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        background: selectedMessage?.id === msg.id ? 'var(--color-primary-light)' : (msg.read ? 'transparent' : 'rgba(79, 70, 229, 0.05)'),
                                        borderLeft: !msg.read ? '4px solid var(--color-primary)' : (selectedMessage?.id === msg.id ? '4px solid transparent' : 'none'),
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: msg.read ? 600 : 800, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                                            {msg.sender}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{msg.date}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        {msg.role}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: msg.read ? 500 : 700, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{msg.subject}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {msg.preview}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="guardian-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                    {activeTab === 'notifications' ? (
                        selectedNotification ? (
                            <div style={{ padding: '2.5rem' }}>
                                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '0.75rem' }}>
                                        {selectedNotification.title}
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className="status-badge warning" style={{ fontSize: '0.7rem' }}>SCHOOL ALERT</span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                            {selectedNotification.time}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--color-text-main)', background: 'var(--color-bg-body)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                    {selectedNotification.message}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    <Bell size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Notification Center</h3>
                                <p style={{ color: 'var(--color-text-muted)', maxWidth: '300px' }}>Select an alert to view official school updates.</p>
                            </div>
                        )
                    ) : selectedMessage ? (
                        <>
                            <div style={{ padding: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '1rem' }}>
                                    {selectedMessage.subject}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                                        {selectedMessage.sender.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{selectedMessage.sender}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{selectedMessage.date}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>{selectedMessage.role}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                                <div style={{ color: 'var(--color-text-main)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                                    {selectedMessage.content}
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-body)' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder={t('guardian.communication.typeReply')}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-bg-surface)',
                                            color: 'var(--color-text-main)'
                                        }}
                                    />
                                    <button className="btn-primary">
                                        <Send size={18} />
                                        {t('guardian.communication.send')}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <MessageSquare size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{t('guardian.communication.welcome')}</h3>
                            <p style={{ color: 'var(--color-text-muted)', maxWidth: '300px' }}>{t('guardian.communication.desc')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Communication;
