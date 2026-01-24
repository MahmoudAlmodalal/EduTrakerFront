import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Send, Plus, MessageSquare, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import './Workstream.css';



const WorkstreamCommunication = () => {
    const { t } = useTheme();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('internal');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [messages, setMessages] = useState([
        { id: 1, type: 'internal', sender: "Admin (Super Admin)", subject: "New Policy Update", date: "10:30 AM", preview: "Please review the new attendance policy...", content: "Dear Manager,\n\nPlease review the new attendance policy attached. Ensure all schools in your workstream are updated by next week.\n\nBest,\nAdmin", role: "Super Admin", read: false },
        { id: 2, type: 'internal', sender: "Principal Skinner (Springfield Elem)", subject: "Budget Request", date: "Yesterday", preview: "We need approval for new science equipment...", content: "We need approval for new science equipment for the upcoming semester.\n\nEstimated cost is $5000.\n\nRegards,\nSkinner", role: "School Manager", read: true },
        { id: 3, type: 'external', sender: "Ministry of Education", subject: "Annual Inspection", date: "Oct 12", preview: "The annual inspection is scheduled for...", content: "The annual inspection is scheduled for next month. Please prepare all reports.", role: "External", read: false },
    ]);

    const [notifications, setNotifications] = useState([
        { id: 101, title: "School Performance Alert", message: "Springfield stats dropped by 5%", time: "2 hours ago", read: false },
        { id: 102, title: "New Manager Assigned", message: "You assigned a new manager to Shelbyville High", time: "5 hours ago", read: true },
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
                            {['internal', 'external', 'notifications'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSelectedMessage(null); setSelectedNotification(null); }}
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
                                        background: selectedNotification?.id === notif.id ? 'var(--color-bg-body)' : (notif.read ? 'transparent' : 'var(--color-bg-body)'),
                                        borderLeft: !notif.read ? '4px solid var(--color-primary)' : (selectedNotification?.id === notif.id ? '4px solid var(--color-border)' : 'none')
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
                        selectedNotification ? (
                            <div style={{ padding: '2rem' }}>
                                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                                        {selectedNotification.title}
                                    </h2>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {selectedNotification.time}
                                    </span>
                                </div>
                                <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--color-text-main)' }}>
                                    {selectedNotification.message}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>
                                <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <h3>{t('workstream.communication.selectNotificationTitle')}</h3>
                                <p>{t('workstream.communication.selectNotification')}</p>
                            </div>
                        )
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
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('workstream.communication.toYou')} &bull; {selectedMessage.date}</div>
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
                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                    />
                                    <Button variant="primary" icon={Send}>{t('workstream.communication.send')}</Button>
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
