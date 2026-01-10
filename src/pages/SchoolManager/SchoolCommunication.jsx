import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Plus, MessageSquare, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './SchoolManager.css';

const SchoolCommunication = () => {
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

    // Mock Data adapted for School Manager
    const [messages, setMessages] = useState([
        { id: 1, type: 'internal', sender: "Admin System", subject: "Monthly Resource Quota", date: "09:00 AM", preview: "Your school has been allocated extra seats...", content: "Dear School Manager,\n\nFollowing the recent review, your school has been allocated 50 additional student seats for the upcoming semester.\n\nBest regards,\nEduTraker Admin", role: "Super Admin", read: false },
        { id: 2, type: 'internal', sender: "John Doe (Secretary)", subject: "Attendance Issues 1-A", date: "Yesterday", preview: "Multiple students absent today...", content: "Hi,\n\nI wanted to bring to your attention that 15% of students in Grade 1-A were absent today without prior notice.\n\nThanks,\nJohn", role: "Secretary", read: true },
        { id: 3, type: 'external', sender: "Ministry of Education", subject: "New Curriculum Guidelines", date: "Dec 10", preview: "Please review the updated guidelines...", content: "Attention,\n\nPlease find the attached guidelines regarding the new Mathematics curriculum implementation.\n\nMinistry Office", role: "External", read: true },
    ]);

    const [notifications, setNotifications] = useState([
        { id: 101, title: "Budget Approved", message: "Your school maintenance budget for Q1 has been approved.", time: "1 hour ago", read: false },
        { id: 102, title: "New Teacher Hire", message: "A new teacher profile has been assigned to your school.", time: "4 hours ago", read: true },
        { id: 103, title: "System Maintenance", message: "Server maintenance scheduled for Saturday 2:00 AM.", time: "1 day ago", read: true },
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
        <div className="school-communication-page" style={{ height: 'calc(100vh - 100px)', paddingBottom: 0 }}>
            <header className="sm-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="sm-page-title">{t('school.communication.title') || 'Communication Center'}</h1>
                    <p className="sm-page-subtitle">{t('school.communication.subtitle') || 'Stay connected with staff and administration.'}</p>
                </div>
                <button className="btn-primary">
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    {t('school.communication.compose') || 'Compose'}
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '1.5rem', height: 'calc(100% - 100px)' }}>
                {/* Sidebar / List */}
                <div className="management-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--sm-border)' }}>
                        <div className="search-wrapper" style={{ marginBottom: '1rem', width: '100%', position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sm-text-muted)' }} />
                            <input
                                type="text"
                                placeholder={t('school.communication.search') || 'Search...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.625rem 0.625rem 2.5rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--sm-border)',
                                    background: 'var(--sm-bg-main)',
                                    color: 'var(--sm-text-main)',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--sm-bg-main)', borderRadius: '10px', border: '1px solid var(--sm-border)' }}>
                            {['internal', 'external', 'notifications'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setSelectedMessage(null); setSelectedNotification(null); }}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        fontSize: '0.75rem',
                                        borderRadius: '8px',
                                        background: activeTab === tab ? 'var(--sm-bg-surface)' : 'transparent',
                                        color: activeTab === tab ? 'var(--sm-primary)' : 'var(--sm-text-muted)',
                                        border: activeTab === tab ? '1px solid var(--sm-border)' : 'none',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        textTransform: 'capitalize',
                                        boxShadow: activeTab === tab ? 'var(--sm-shadow-soft)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {tab === 'internal' ? (t('school.communication.internal') || 'Internal') :
                                        tab === 'external' ? (t('school.communication.external') || 'External') :
                                            (t('school.communication.notifications') || 'Alerts')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredItems.length === 0 && (
                            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--sm-text-muted)' }}>
                                <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                <p>{t('school.communication.empty') || 'No messages found'}</p>
                            </div>
                        )}

                        {activeTab === 'notifications' ? (
                            filteredItems.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: '1.25rem',
                                        borderBottom: '1px solid var(--sm-border)',
                                        cursor: 'pointer',
                                        background: selectedNotification?.id === notif.id ? 'var(--sm-primary-light)' : (notif.read ? 'transparent' : 'rgba(79, 70, 229, 0.03)'),
                                        borderLeft: !notif.read ? '4px solid var(--sm-primary)' : (selectedNotification?.id === notif.id ? '4px solid transparent' : 'none'),
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--sm-text-main)' }}>{notif.title}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--sm-text-muted)' }}>{notif.time}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--sm-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                                        borderBottom: '1px solid var(--sm-border)',
                                        cursor: 'pointer',
                                        background: selectedMessage?.id === msg.id ? 'var(--sm-primary-light)' : (msg.read ? 'transparent' : 'rgba(79, 70, 229, 0.03)'),
                                        borderLeft: !msg.read ? '4px solid var(--sm-primary)' : (selectedMessage?.id === msg.id ? '4px solid transparent' : 'none'),
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: msg.read ? 600 : 800, fontSize: '0.9375rem', color: 'var(--sm-text-main)' }}>
                                            {msg.sender}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--sm-text-muted)' }}>{msg.date}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--sm-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                                        {msg.role}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: msg.read ? 500 : 700, color: 'var(--sm-text-main)', marginBottom: '0.25rem' }}>{msg.subject}</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--sm-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {msg.preview}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="management-card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--sm-bg-surface)', padding: 0 }}>
                    {activeTab === 'notifications' ? (
                        selectedNotification ? (
                            <div style={{ padding: '2.5rem' }}>
                                <div style={{ borderBottom: '1px solid var(--sm-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sm-text-main)', marginBottom: '0.75rem' }}>
                                        {selectedNotification.title}
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ padding: '4px 12px', background: 'var(--sm-primary-light)', color: 'var(--sm-primary)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>SYSTEM ALERT</span>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--sm-text-muted)' }}>
                                            {selectedNotification.time}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.125rem', lineHeight: '1.7', color: 'var(--sm-text-main)', background: 'var(--sm-bg-main)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--sm-border)' }}>
                                    {selectedNotification.message}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--sm-primary-light)', color: 'var(--sm-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    <MessageSquare size={40} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sm-text-main)', marginBottom: '0.75rem' }}>School Notification Hub</h3>
                                <p style={{ color: 'var(--sm-text-muted)', maxWidth: '400px' }}>Select an alert from the sidebar to view important system updates and school notifications.</p>
                            </div>
                        )
                    ) : selectedMessage ? (
                        <>
                            <div style={{ padding: '2rem', borderBottom: '1px solid var(--sm-border)', background: 'linear-gradient(to right, var(--sm-bg-surface), transparent)' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sm-text-main)', marginBottom: '1.25rem' }}>
                                    {selectedMessage.subject}
                                </h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--sm-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.25rem', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                                        {selectedMessage.sender.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--sm-text-main)' }}>{selectedMessage.sender}</span>
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--sm-text-muted)' }}>{selectedMessage.date}</span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--sm-primary)', fontWeight: 600 }}>{selectedMessage.role}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '2.5rem', flex: 1, overflowY: 'auto' }}>
                                <div style={{ color: 'var(--sm-text-main)', fontSize: '1.0625rem', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                                    {selectedMessage.content}
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--sm-border)', background: 'var(--sm-bg-main)' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder={t('school.communication.typeReply') || 'Type your reply...'}
                                        style={{
                                            flex: 1,
                                            padding: '0.875rem 1.25rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--sm-border)',
                                            background: 'var(--sm-bg-surface)',
                                            color: 'var(--sm-text-main)',
                                            fontSize: '0.9375rem',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                    />
                                    <button className="btn-primary" style={{ padding: '0.875rem 1.5rem' }}>
                                        <Send size={18} />
                                        {t('school.communication.send') || 'Send Reply'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--sm-primary-light)', color: 'var(--sm-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <MessageSquare size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sm-text-main)', marginBottom: '0.75rem' }}>Message Center</h3>
                            <p style={{ color: 'var(--sm-text-muted)', maxWidth: '400px' }}>Secure communication with your workstream managers, secretaries, and external entities.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchoolCommunication;
