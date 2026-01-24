import React, { useState, useEffect } from 'react';
import {
    Mail,
    Search,
    Send,
    User,
    Bell,
    X,
    Star,
    MessageSquare,
    Paperclip,
    Archive,
    MoreVertical,
    Clock
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import '../Student.css';

const StudentCommunication = () => {
    const { t } = useTheme() || {};
    const [selectedTab, setSelectedTab] = useState('messages');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isComposing, setIsComposing] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    const safeJSONParse = (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            if (!item || item === 'null' || item === 'undefined') return fallback;
            return JSON.parse(item) || fallback;
        } catch (e) {
            return fallback;
        }
    };

    useEffect(() => {
        const students = safeJSONParse('sec_students', []);
        const user = students.length > 0 ? students[0] : { id: 999, firstName: 'Student', lastName: 'Demo' };
        setCurrentUser(user);

        let allMessages = safeJSONParse('teacher_messages', []);
        if (allMessages.length === 0) {
            const seeds = [
                {
                    id: 1,
                    sender: 'Dr. Smith',
                    senderRole: 'Math Teacher',
                    subject: 'Exam Feedback',
                    preview: 'Excellent progress on calculus!',
                    date: '10:30 AM',
                    unread: true,
                    starred: false,
                    avatar: 'DS',
                    thread: [{ id: 101, from: 'Dr. Smith', text: 'Excellent progress on calculus!', time: '10:30 AM' }]
                },
                {
                    id: 2,
                    sender: 'Ms. Wilson',
                    senderRole: 'History Teacher',
                    subject: 'Project Deadline',
                    preview: 'The historical research project is due Friday.',
                    date: 'Yesterday',
                    unread: false,
                    starred: true,
                    avatar: 'MW',
                    thread: [{ id: 201, from: 'Ms. Wilson', text: 'The historical research project is due Friday.', time: 'Yesterday' }]
                }
            ];
            allMessages = seeds;
            localStorage.setItem('teacher_messages', JSON.stringify(seeds));
        }

        const userFullName = `${user.firstName} ${user.lastName}`;
        const myMessages = allMessages.filter(msg =>
            msg.sender === userFullName ||
            msg.recipient === userFullName ||
            msg.recipient === 'Student' ||
            msg.sender === 'Student'
        );

        setMessages(myMessages.length > 0 ? myMessages : allMessages);
    }, []);

    const handleSendReply = () => {
        if (!replyText.trim() || !selectedMessage) return;
        const allMessages = safeJSONParse('teacher_messages', []);
        const msgIndex = allMessages.findIndex(m => m.id === selectedMessage.id);

        if (msgIndex !== -1) {
            const newReply = { id: Date.now(), from: 'Me', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            allMessages[msgIndex].thread.push(newReply);
            allMessages[msgIndex].unread = false;
            localStorage.setItem('teacher_messages', JSON.stringify(allMessages));
            setMessages(prev => prev.map(m => m.id === selectedMessage.id ? allMessages[msgIndex] : m));
            setSelectedMessage(allMessages[msgIndex]);
        }
        setReplyText('');
    };

    const toggleStar = (id, e) => {
        e.stopPropagation();
        const allMessages = safeJSONParse('teacher_messages', []);
        const idx = allMessages.findIndex(m => m.id === id);
        if (idx !== -1) {
            allMessages[idx].starred = !allMessages[idx].starred;
            localStorage.setItem('teacher_messages', JSON.stringify(allMessages));
            setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="comm-page-container">
            <header className="comm-header">
                <div className="header-text">
                    <h1>{t('student.communication.title') || 'Communications'}</h1>
                    <p>{t('student.communication.subtitle') || 'Stay connected with your teachers'}</p>
                </div>
                <button className="new-msg-btn" onClick={() => setIsComposing(true)}>
                    <Send size={18} />
                    <span>New Message</span>
                </button>
            </header>

            <div className="comm-layout">
                {/* Sidebar */}
                <aside className="comm-sidebar glass-panel">
                    <div className="search-container">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="sidebar-tabs">
                        <button
                            className={`tab-item ${selectedTab === 'messages' ? 'active' : ''}`}
                            onClick={() => setSelectedTab('messages')}
                        >
                            <MessageSquare size={16} />
                            <span>Messages</span>
                        </button>
                        <button
                            className={`tab-item ${selectedTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => setSelectedTab('notifications')}
                        >
                            <Bell size={16} />
                            <span>Notifications</span>
                        </button>
                    </div>

                    <div className="conversation-list">
                        {filteredMessages.map(msg => (
                            <div
                                key={msg.id}
                                className={`conv-item ${selectedMessage?.id === msg.id ? 'active' : ''} ${msg.unread ? 'unread' : ''}`}
                                onClick={() => setSelectedMessage(msg)}
                            >
                                <div className="conv-avatar" style={{ background: msg.unread ? 'var(--student-gradient)' : '#e2e8f0' }}>
                                    <span style={{ color: msg.unread ? 'white' : '#64748b' }}>{msg.avatar || msg.sender[0]}</span>
                                </div>
                                <div className="conv-details">
                                    <div className="conv-header">
                                        <span className="name">{msg.sender}</span>
                                        <span className="time">{msg.date}</span>
                                    </div>
                                    <p className="subject">{msg.subject}</p>
                                    <p className="preview">{msg.preview}</p>
                                </div>
                                <button className={`star-icon ${msg.starred ? 'starred' : ''}`} onClick={(e) => toggleStar(msg.id, e)}>
                                    <Star size={14} fill={msg.starred ? 'currentColor' : 'none'} />
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Chat Panel */}
                <main className="chat-panel glass-panel">
                    {selectedMessage ? (
                        <>
                            <div className="chat-header">
                                <div className="sender-info">
                                    <div className="header-avatar">{selectedMessage.avatar || selectedMessage.sender[0]}</div>
                                    <div>
                                        <h2>{selectedMessage.subject}</h2>
                                        <div className="sender-meta">
                                            <span className="name">{selectedMessage.sender}</span>
                                            <span className="role">{selectedMessage.senderRole}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="header-actions">
                                    <button className="action-btn"><Archive size={18} /></button>
                                    <button className="action-btn"><Star size={18} /></button>
                                    <button className="action-btn"><MoreVertical size={18} /></button>
                                </div>
                            </div>

                            <div className="chat-thread">
                                {selectedMessage.thread.map(item => (
                                    <div key={item.id} className={`message-bubble ${item.from === 'Me' ? 'sent' : 'received'}`}>
                                        <div className="bubble-content">
                                            <p>{item.text}</p>
                                            <span className="timestamp">{item.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="chat-input-area">
                                <button className="attach-btn"><Paperclip size={20} /></button>
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                />
                                <button className="send-action-btn" onClick={handleSendReply}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <div className="empty-state-icon">
                                <MessageSquare size={48} />
                            </div>
                            <h3>Select a conversation</h3>
                            <p>Choose a message from the sidebar to start communicating.</p>
                        </div>
                    )}
                </main>
            </div>

            <style>{`
                .comm-page-container {
                    height: calc(100vh - 120px);
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .comm-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-text h1 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                }

                .header-text p {
                    color: #64748b;
                    margin: 0.25rem 0 0;
                }

                .new-msg-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--student-gradient);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.2);
                    transition: all 0.2s ease;
                }

                .new-msg-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(8, 145, 178, 0.3);
                }

                .comm-layout {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 360px 1fr;
                    gap: 1.5rem;
                    min-height: 0;
                }

                .glass-panel {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(8, 145, 178, 0.05);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .search-container {
                    padding: 1.25rem;
                    position: relative;
                }

                .search-icon {
                    position: absolute;
                    left: 2.25rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                }

                .search-container input {
                    width: 100%;
                    padding: 0.75rem 1rem 0.75rem 3rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    outline: none;
                    transition: all 0.2s;
                }

                .search-container input:focus {
                    border-color: var(--student-primary);
                    background: white;
                    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
                }

                .sidebar-tabs {
                    display: flex;
                    padding: 0 1.25rem 1rem;
                    gap: 0.5rem;
                }

                .tab-item {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.625rem;
                    border-radius: 10px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab-item.active {
                    background: #e0f2fe;
                    color: var(--student-primary);
                }

                .conversation-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 0.75rem 1rem;
                }

                .conv-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.875rem;
                    padding: 1rem;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                    margin-bottom: 0.25rem;
                }

                .conv-item:hover {
                    background: rgba(8, 145, 178, 0.05);
                }

                .conv-item.active {
                    background: #f0f9ff;
                }

                .conv-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .conv-details {
                    flex: 1;
                    min-width: 0;
                }

                .conv-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.25rem;
                }

                .name {
                    font-size: 0.9375rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .time {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .subject {
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: #334155;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin: 0;
                }

                .preview {
                    font-size: 0.75rem;
                    color: #64748b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin: 0.125rem 0 0;
                }

                .star-icon {
                    position: absolute;
                    top: 1rem;
                    right: 0.5rem;
                    background: none;
                    border: none;
                    color: #cbd5e1;
                    cursor: pointer;
                    opacity: 0;
                    transition: all 0.2s;
                }

                .conv-item:hover .star-icon, .star-icon.starred {
                    opacity: 1;
                }

                .star-icon.starred {
                    color: #f59e0b;
                }

                .chat-header {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                }

                .sender-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .header-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: var(--student-gradient);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.25rem;
                }

                .chat-header h2 {
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin: 0 0 0.125rem;
                }

                .sender-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                }

                .sender-meta .name { font-weight: 600; color: #475569; }
                .sender-meta .role { color: #94a3b8; }

                .header-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: none;
                    background: #f8fafc;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: #e0f2fe;
                    color: var(--student-primary);
                }

                .chat-thread {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    background: #f8fafc;
                }

                .message-bubble {
                    display: flex;
                    flex-direction: column;
                    max-width: 70%;
                }

                .message-bubble.sent { align-self: flex-end; }
                .message-bubble.received { align-self: flex-start; }

                .bubble-content {
                    padding: 1rem 1.25rem;
                    border-radius: 20px;
                    position: relative;
                }

                .sent .bubble-content {
                    background: var(--student-gradient);
                    color: white;
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.2);
                }

                .received .bubble-content {
                    background: white;
                    color: #1e293b;
                    border-bottom-left-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }

                .bubble-content p { margin: 0; line-height: 1.5; font-size: 0.9375rem; }
                .timestamp { font-size: 0.6875rem; margin-top: 0.5rem; display: block; opacity: 0.7; }

                .chat-input-area {
                    padding: 1.25rem 1.5rem;
                    background: white;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-top: 1px solid rgba(0,0,0,0.05);
                }

                .attach-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    border: none;
                    background: #f8fafc;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .chat-input-area input {
                    flex: 1;
                    padding: 0.875rem 1.25rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    outline: none;
                }

                .send-action-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: var(--student-gradient);
                    color: white;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .no-chat-selected {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    text-align: center;
                    padding: 2rem;
                }

                .empty-state-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 24px;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                }

                .no-chat-selected h3 {
                    font-size: 1.25rem;
                    color: #334155;
                    margin: 0 0 0.5rem;
                }

                .no-chat-selected p {
                    font-size: 0.875rem;
                    margin: 0;
                }

                /* Dark Mode Support */
                [data-theme="dark"] .glass-panel { background: rgba(30, 41, 59, 0.7); border-color: rgba(255,255,255,0.05); }
                [data-theme="dark"] .chat-header, [data-theme="dark"] .chat-input-area { background: #1e293b; color: white; }
                [data-theme="dark"] .chat-thread { background: #0f172a; }
                [data-theme="dark"] .received .bubble-content { background: #334155; color: white; }
                [data-theme="dark"] input { background: #334155; border-color: #475569; color: white; }
                [data-theme="dark"] .name { color: #f1f5f9; }
                [data-theme="dark"] .header-text h1 { color: #f1f5f9; }
                [data-theme="dark"] .tab-item.active { background: rgba(8, 145, 178, 0.2); }
            `}</style>
        </div>
    );
};

export default StudentCommunication;
