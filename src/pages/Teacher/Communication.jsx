import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Search, Send, User, Bell, X, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Communication = () => {
    const { t } = useTheme();
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState('messages');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isComposing, setIsComposing] = useState(false);
    const [replyText, setReplyText] = useState('');

    const [messages, setMessages] = useState([]);

    // Load Messages
    useEffect(() => {
        const storedMessages = JSON.parse(localStorage.getItem('teacher_messages') || '[]');
        if (storedMessages.length === 0) {
            const seeds = [
                {
                    id: 1,
                    sender: 'Parent: Mr. Ahmed',
                    subject: 'Regarding Ahmed\'s grades',
                    preview: 'I would like to discuss the recent math test results...',
                    date: '10:30 AM',
                    unread: true,
                    thread: [
                        { id: 101, from: 'Parent: Mr. Ahmed', text: 'Dear Mr. Teacher, I would like to discuss the recent math test results. Can we meet?', time: '10:30 AM' }
                    ]
                },
                {
                    id: 2,
                    sender: 'Admin: Principal Office',
                    subject: 'Staff Meeting Reminder',
                    preview: 'Please remember that we have a staff meeting today at...',
                    date: 'Yesterday',
                    unread: false,
                    thread: [
                        { id: 201, from: 'Admin: Principal Office', text: 'Please remember that we have a staff meeting today at 2 PM in the main hall.', time: 'Yesterday 9:00 AM' }
                    ]
                },
                {
                    id: 3,
                    sender: 'Student: Sara Khan',
                    subject: 'Question about Homework',
                    preview: 'Can you please explain the last question in the worksheet?',
                    date: 'Dec 12',
                    unread: false,
                    thread: [
                        { id: 301, from: 'Student: Sara Khan', text: 'Can you please explain the last question in the worksheet? I am stuck.', time: 'Dec 12 4:00 PM' }
                    ]
                },
            ];
            setMessages(seeds);
            localStorage.setItem('teacher_messages', JSON.stringify(seeds));
        } else {
            setMessages(storedMessages);
        }
    }, []);

    const [newMessage, setNewMessage] = useState({ to: '', subject: '', body: '' });

    const handleSendMessage = (e) => {
        e.preventDefault();
        const newMsg = {
            id: Date.now(),
            sender: newMessage.to || 'Unknown', // Storing the recipient as 'sender' for the inbox view if typical logic, but for Sent items usually different. Keeping simple for now as 'thread'
            // Actually, if I send a message, it should probably be in a "Sent" tab or appear in the thread. 
            // For this simple UI, we'll treat it as a new conversation thread where 'Me' is the starter.
            subject: newMessage.subject,
            preview: newMessage.body,
            date: 'Just now',
            unread: false,
            thread: [
                { id: Date.now(), from: 'Me', text: newMessage.body, time: 'Just now' }
            ]
        };
        const updatedMessages = [newMsg, ...messages];
        setMessages(updatedMessages);
        localStorage.setItem('teacher_messages', JSON.stringify(updatedMessages));
        setIsComposing(false);
        setNewMessage({ to: '', subject: '', body: '' });
        alert('Message sent successfully!');
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;

        const updatedMessages = messages.map(msg => {
            if (msg.id === selectedMessage.id) {
                const newThread = [
                    ...msg.thread,
                    { id: Date.now(), from: 'Me', text: replyText, time: 'Just now' }
                ];
                const updatedMsg = { ...msg, thread: newThread, unread: false }; // Mark read on reply
                setSelectedMessage(updatedMsg);
                return updatedMsg;
            }
            return msg;
        });

        setMessages(updatedMessages);
        localStorage.setItem('teacher_messages', JSON.stringify(updatedMessages));
        setReplyText('');
    };

    const handleLogout = () => {
        // Clear teacher session if needed, or just redirect
        // localStorage.removeItem('user_token'); // Example
        navigate('/login');
    };

    return (
        <div className="space-y-6 animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header className="page-header" style={{ marginBottom: '1rem', flexShrink: 0 }}>
                <div>
                    <h1 className="page-title">{t('teacher.communication.title')}</h1>
                    <p className="page-subtitle">{t('teacher.communication.subtitle')}</p>
                </div>
                <div className="action-group">
                    <button
                        onClick={() => setIsComposing(true)}
                        className="btn-primary"
                    >
                        <Send size={18} /> {t('teacher.communication.composeNew')}
                    </button>
                </div>
            </header>

            {isComposing && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', position: 'relative' }}>
                        <button
                            onClick={() => setIsComposing(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teacher-text-muted)' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-slate-800 mb-6">{t('teacher.communication.newMessage')}</h2>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.communication.to')}</label>
                                <select
                                    required
                                    value={newMessage.to}
                                    onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                                    className="teacher-select w-full"
                                >
                                    <option value="">{t('teacher.communication.selectRecipient')}</option>
                                    <option value="Parent: Mr. Ahmed">Parent: Mr. Ahmed</option>
                                    <option value="Student: Sara Khan">Student: Sara Khan</option>
                                    <option value="Admin: Principal Office">Admin: Principal Office</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.communication.subject')}</label>
                                <input
                                    type="text"
                                    required
                                    value={newMessage.subject}
                                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                                    className="teacher-input w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">{t('teacher.communication.message')}</label>
                                <textarea
                                    required
                                    rows="5"
                                    value={newMessage.body}
                                    onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                                    className="teacher-input w-full"
                                ></textarea>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="btn-primary">
                                    <Send size={18} /> {t('teacher.communication.sendMessage')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-panel" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0 }}>
                {/* Sidebar List */}
                <div style={{ width: '35%', minWidth: '300px', borderRight: '1px solid var(--teacher-border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--teacher-border)' }}>
                        <div className="search-wrapper" style={{ marginBottom: '1rem' }}>
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder={t('teacher.communication.searchMessages')}
                                className="teacher-input has-icon w-full"
                            />
                        </div>
                        <div style={{ display: 'flex', padding: '0.25rem', backgroundColor: 'var(--teacher-bg)', borderRadius: '0.5rem' }}>
                            <button
                                onClick={() => setSelectedTab('messages')}
                                style={{
                                    flex: 1,
                                    padding: '0.375rem',
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: selectedTab === 'messages' ? 'var(--teacher-surface)' : 'transparent',
                                    color: selectedTab === 'messages' ? 'var(--teacher-primary)' : 'var(--teacher-text-muted)',
                                    boxShadow: selectedTab === 'messages' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {t('teacher.communication.messages')}
                            </button>
                            <button
                                onClick={() => setSelectedTab('notifications')}
                                style={{
                                    flex: 1,
                                    padding: '0.375rem',
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: selectedTab === 'notifications' ? 'var(--teacher-surface)' : 'transparent',
                                    color: selectedTab === 'notifications' ? 'var(--teacher-primary)' : 'var(--teacher-text-muted)',
                                    boxShadow: selectedTab === 'notifications' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {t('teacher.dashboard.notifications')}
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                onClick={() => setSelectedMessage(msg)}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--teacher-border)',
                                    cursor: 'pointer',
                                    backgroundColor: selectedMessage?.id === msg.id ? 'var(--teacher-bg)' : 'transparent',
                                    borderLeft: selectedMessage?.id === msg.id ? '4px solid var(--teacher-primary)' : '4px solid transparent',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: msg.unread ? '700' : '600', color: msg.unread ? 'var(--teacher-text-main)' : 'var(--teacher-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {msg.sender}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--teacher-text-muted)' }}>{msg.date}</span>
                                </div>
                                <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: msg.unread ? '500' : '400', color: 'var(--teacher-text-main)' }}>
                                    {msg.subject}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--teacher-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.preview}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Detail View */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--teacher-bg)' }}>
                    {selectedMessage ? (
                        <>
                            <div style={{ padding: '1.5rem', backgroundColor: 'var(--teacher-surface)', borderBottom: '1px solid var(--teacher-border)' }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">{selectedMessage.subject}</h2>
                                            <p className="text-sm text-slate-600">{t('teacher.communication.from')}: <span className="font-medium">{selectedMessage.sender}</span></p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">{selectedMessage.date}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {selectedMessage.thread && selectedMessage.thread.map(msg => (
                                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'Me' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '80%',
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            backgroundColor: msg.from === 'Me' ? 'var(--teacher-primary)' : 'var(--teacher-surface)',
                                            color: msg.from === 'Me' ? 'white' : 'var(--teacher-text-main)',
                                            borderTopRightRadius: msg.from === 'Me' ? '0' : '0.75rem',
                                            borderTopLeftRadius: msg.from === 'Me' ? '0.75rem' : '0',
                                            boxShadow: msg.from !== 'Me' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                        }}>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                        <span className="text-xs text-slate-400 mt-1">{msg.time}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--teacher-surface)', borderTop: '1px solid var(--teacher-border)' }}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                        placeholder={t('teacher.communication.typeReply')}
                                        className="teacher-input"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        className="btn-primary"
                                    >
                                        {t('teacher.communication.send')}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--teacher-text-muted)' }}>
                            <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p className="text-lg font-medium">{t('teacher.communication.selectToView')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Communication;
