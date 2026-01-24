import React, { useState } from 'react';
import {
    Mail,
    MessageSquare,
    Search,
    Send,
    User,
    Bell,
    X,
    Paperclip,
    MoreVertical,
    Star,
    Archive,
    ChevronRight
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import studentService from '../../../services/studentService';
import '../Student.css';

const StudentCommunication = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [selectedTab, setSelectedTab] = useState('messages');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isComposing, setIsComposing] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);

    React.useEffect(() => {
        const fetchMessages = async () => {
            try {
                const data = await studentService.getMessages();
                const msgs = (data.results || data || []).map(m => ({
                    id: m.id,
                    sender: m.sender_name || 'System',
                    senderRole: m.sender_role || 'Staff',
                    avatar: m.sender_name?.charAt(0) || 'S',
                    subject: m.subject || '(No Subject)',
                    preview: m.body?.substring(0, 60) + '...',
                    date: new Date(m.created_at).toLocaleDateString(),
                    unread: !m.is_read,
                    starred: false,
                    thread_id: m.thread_id,
                    body: m.body
                }));
                setMessages(msgs);
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, []);

    const notifications = [
        { id: 1, type: 'grade', title: 'New Grade Posted', message: 'Mathematics Quiz 3 - Score: 92%', time: '2 hours ago' },
        { id: 2, type: 'assignment', title: 'Assignment Due Soon', message: 'Physics Lab Report due tomorrow', time: '5 hours ago' },
        { id: 3, type: 'announcement', title: 'School Announcement', message: 'Holiday break starts December 20th', time: 'Yesterday' },
    ];

    const [newMessage, setNewMessage] = useState({ to: '', subject: '', body: '' });

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            const data = await studentService.sendMessage({
                recipient_id: newMessage.to,
                subject: newMessage.subject,
                body: newMessage.body
            });

            const newMsg = {
                id: data.id,
                sender: 'Me',
                senderRole: 'Student',
                avatar: 'ME',
                subject: data.subject,
                preview: data.body.substring(0, 60) + '...',
                date: 'Just now',
                unread: false,
                starred: false,
                body: data.body
            };
            setMessages([newMsg, ...messages]);
            setIsComposing(false);
            setNewMessage({ to: '', subject: '', body: '' });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleSendReply = () => {
        if (!replyText.trim()) return;

        const updatedMessages = messages.map(msg => {
            if (msg.id === selectedMessage.id) {
                const newThread = [
                    ...msg.thread,
                    { id: Date.now(), from: 'Me', text: replyText, time: 'Just now' }
                ];
                const updatedMsg = { ...msg, thread: newThread };
                setSelectedMessage(updatedMsg);
                return updatedMsg;
            }
            return msg;
        });

        setMessages(updatedMessages);
        setReplyText('');
    };

    const toggleStar = (id, e) => {
        e.stopPropagation();
        setMessages(messages.map(msg =>
            msg.id === id ? { ...msg, starred: !msg.starred } : msg
        ));
    };

    const filteredMessages = messages.filter(msg =>
        msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="student-communication">
            {/* Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('student.communication.title') || 'Messages'}</h1>
                    <p className="page-subtitle">{t('student.communication.subtitle') || 'Communicate with teachers and staff'}</p>
                </div>
                <button className="compose-btn" onClick={() => setIsComposing(true)}>
                    <Send size={18} />
                    <span>New Message</span>
                </button>
            </header>

            {/* Compose Modal */}
            {isComposing && (
                <div className="modal-overlay">
                    <div className="compose-modal">
                        <div className="modal-header">
                            <h2>New Message</h2>
                            <button className="close-btn" onClick={() => setIsComposing(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSendMessage}>
                            <div className="form-group">
                                <label>To</label>
                                <select
                                    required
                                    value={newMessage.to}
                                    onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="">Select recipient...</option>
                                    <option value="Dr. Smith">Dr. Smith (Mathematics)</option>
                                    <option value="Prof. Johnson">Prof. Johnson (Physics)</option>
                                    <option value="Ms. Davis">Ms. Davis (English)</option>
                                    <option value="School Admin">School Administration</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter subject..."
                                    value={newMessage.subject}
                                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    required
                                    rows="6"
                                    placeholder="Write your message..."
                                    value={newMessage.body}
                                    onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                                    className="form-textarea"
                                ></textarea>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setIsComposing(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    <Send size={16} /> Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="communication-container">
                {/* Sidebar */}
                <div className="message-sidebar">
                    {/* Search */}
                    <div className="sidebar-header">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="sidebar-tabs">
                        <button
                            className={`tab-btn ${selectedTab === 'messages' ? 'active' : ''}`}
                            onClick={() => setSelectedTab('messages')}
                        >
                            <Mail size={16} />
                            Messages
                            {messages.filter(m => m.unread).length > 0 && (
                                <span className="badge">{messages.filter(m => m.unread).length}</span>
                            )}
                        </button>
                        <button
                            className={`tab-btn ${selectedTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => setSelectedTab('notifications')}
                        >
                            <Bell size={16} />
                            Notifications
                        </button>
                    </div>

                    {/* Message List */}
                    <div className="message-list">
                        {selectedTab === 'messages' ? (
                            filteredMessages.length > 0 ? (
                                filteredMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message-item ${selectedMessage?.id === msg.id ? 'active' : ''} ${msg.unread ? 'unread' : ''}`}
                                        onClick={() => setSelectedMessage(msg)}
                                    >
                                        <div className="message-avatar" style={{ background: msg.unread ? 'var(--student-gradient)' : '#e0f2fe' }}>
                                            <span style={{ color: msg.unread ? 'white' : 'var(--student-primary)' }}>{msg.avatar}</span>
                                        </div>
                                        <div className="message-content">
                                            <div className="message-header">
                                                <span className="sender-name">{msg.sender}</span>
                                                <span className="message-date">{msg.date}</span>
                                            </div>
                                            <div className="message-subject">{msg.subject}</div>
                                            <div className="message-preview">{msg.preview}</div>
                                        </div>
                                        <button
                                            className={`star-btn ${msg.starred ? 'starred' : ''}`}
                                            onClick={(e) => toggleStar(msg.id, e)}
                                        >
                                            <Star size={16} fill={msg.starred ? 'currentColor' : 'none'} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-list">
                                    <Mail size={32} />
                                    <p>No messages found</p>
                                </div>
                            )
                        ) : (
                            notifications.map((notif) => (
                                <div key={notif.id} className="notification-item">
                                    <div className="notif-icon">
                                        <Bell size={16} />
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-title">{notif.title}</div>
                                        <div className="notif-message">{notif.message}</div>
                                        <div className="notif-time">{notif.time}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Message Detail */}
                <div className="message-detail">
                    {selectedMessage ? (
                        <>
                            <div className="detail-header">
                                <div className="header-info">
                                    <div className="detail-avatar">
                                        {selectedMessage.avatar}
                                    </div>
                                    <div>
                                        <h2>{selectedMessage.subject}</h2>
                                        <p>
                                            <span className="sender">{selectedMessage.sender}</span>
                                            <span className="role">{selectedMessage.senderRole}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="header-actions">
                                    <button className="action-btn"><Star size={18} /></button>
                                    <button className="action-btn"><Archive size={18} /></button>
                                    <button className="action-btn"><MoreVertical size={18} /></button>
                                </div>
                            </div>

                            <div className="message-thread">
                                {selectedMessage.thread.map(msg => (
                                    <div key={msg.id} className={`thread-message ${msg.from === 'Me' ? 'sent' : 'received'}`}>
                                        <div className="bubble">
                                            <p>{msg.text}</p>
                                        </div>
                                        <span className="time">{msg.time}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="reply-box">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                    placeholder="Type your reply..."
                                />
                                <button className="attach-btn">
                                    <Paperclip size={18} />
                                </button>
                                <button className="send-btn" onClick={handleSendReply}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="empty-detail">
                            <MessageSquare size={48} />
                            <h3>Select a message</h3>
                            <p>Choose a conversation from the list to view details</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .student-communication {
                    height: calc(100vh - 140px);
                    display: flex;
                    flex-direction: column;
                }
                
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                
                .compose-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.25);
                    transition: all 0.2s ease;
                }
                
                .compose-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(8, 145, 178, 0.35);
                }
                
                .communication-container {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 380px 1fr;
                    gap: 1.5rem;
                    min-height: 0;
                }
                
                @media (max-width: 1024px) {
                    .communication-container {
                        grid-template-columns: 1fr;
                    }
                    .message-detail {
                        display: none;
                    }
                }
                
                .message-sidebar {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .sidebar-header {
                    padding: 1rem;
                    border-bottom: 1px solid rgba(8, 145, 178, 0.08);
                }
                
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: #f8fafc;
                    border-radius: 10px;
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                }
                
                .search-box:focus-within {
                    background: white;
                    border-color: var(--student-primary, #0891b2);
                    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
                }
                
                .search-box svg {
                    color: var(--color-text-muted, #94a3b8);
                }
                
                .search-box input {
                    flex: 1;
                    border: none;
                    background: none;
                    font-size: 0.875rem;
                    color: var(--color-text-main, #1e293b);
                    outline: none;
                }
                
                .sidebar-tabs {
                    display: flex;
                    padding: 0.5rem;
                    gap: 0.25rem;
                    border-bottom: 1px solid rgba(8, 145, 178, 0.08);
                }
                
                .tab-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.625rem;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: var(--color-text-muted, #64748b);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .tab-btn:hover {
                    background: #f0f9ff;
                }
                
                .tab-btn.active {
                    background: var(--student-primary-light, rgba(8, 145, 178, 0.1));
                    color: var(--student-primary, #0891b2);
                }
                
                .tab-btn .badge {
                    background: #ef4444;
                    color: white;
                    font-size: 0.625rem;
                    padding: 0.125rem 0.375rem;
                    border-radius: 10px;
                    font-weight: 600;
                }
                
                .message-list {
                    flex: 1;
                    overflow-y: auto;
                }
                
                .message-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-bottom: 1px solid rgba(8, 145, 178, 0.05);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                
                .message-item:hover {
                    background: #f8fafc;
                }
                
                .message-item.active {
                    background: #f0f9ff;
                    border-left: 3px solid var(--student-primary, #0891b2);
                }
                
                .message-item.unread .sender-name,
                .message-item.unread .message-subject {
                    font-weight: 600;
                }
                
                .message-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.875rem;
                    font-weight: 600;
                    flex-shrink: 0;
                }
                
                .message-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .message-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.25rem;
                }
                
                .sender-name {
                    font-size: 0.875rem;
                    color: var(--color-text-main, #1e293b);
                }
                
                .message-date {
                    font-size: 0.6875rem;
                    color: var(--color-text-muted, #94a3b8);
                }
                
                .message-subject {
                    font-size: 0.8125rem;
                    color: var(--color-text-main, #334155);
                    margin-bottom: 0.25rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .message-preview {
                    font-size: 0.75rem;
                    color: var(--color-text-muted, #64748b);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .star-btn {
                    background: none;
                    border: none;
                    color: var(--color-text-muted, #cbd5e1);
                    cursor: pointer;
                    padding: 0.25rem;
                    transition: all 0.2s ease;
                }
                
                .star-btn:hover, .star-btn.starred {
                    color: #f59e0b;
                }
                
                .notification-item {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-bottom: 1px solid rgba(8, 145, 178, 0.05);
                }
                
                .notif-icon {
                    width: 36px;
                    height: 36px;
                    background: var(--student-primary-light, rgba(8, 145, 178, 0.1));
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--student-primary, #0891b2);
                }
                
                .notif-content {
                    flex: 1;
                }
                
                .notif-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--color-text-main, #1e293b);
                    margin-bottom: 0.25rem;
                }
                
                .notif-message {
                    font-size: 0.8125rem;
                    color: var(--color-text-muted, #64748b);
                    margin-bottom: 0.25rem;
                }
                
                .notif-time {
                    font-size: 0.6875rem;
                    color: var(--color-text-muted, #94a3b8);
                }
                
                .message-detail {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(8, 145, 178, 0.06);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .detail-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid rgba(8, 145, 178, 0.08);
                }
                
                .header-info {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .detail-avatar {
                    width: 48px;
                    height: 48px;
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                }
                
                .header-info h2 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--color-text-main, #0f172a);
                    margin: 0 0 0.25rem;
                }
                
                .header-info p {
                    margin: 0;
                    font-size: 0.8125rem;
                }
                
                .header-info .sender {
                    color: var(--color-text-main, #334155);
                    font-weight: 500;
                }
                
                .header-info .role {
                    color: var(--color-text-muted, #64748b);
                    margin-left: 0.5rem;
                }
                
                .header-info .role::before {
                    content: '•';
                    margin-right: 0.5rem;
                }
                
                .header-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .action-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    border: none;
                    border-radius: 8px;
                    color: var(--color-text-muted, #64748b);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .action-btn:hover {
                    background: var(--student-primary-light, rgba(8, 145, 178, 0.1));
                    color: var(--student-primary, #0891b2);
                }
                
                .message-thread {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    background: #f8fafc;
                }
                
                .thread-message {
                    display: flex;
                    flex-direction: column;
                    max-width: 75%;
                }
                
                .thread-message.received {
                    align-self: flex-start;
                }
                
                .thread-message.sent {
                    align-self: flex-end;
                }
                
                .bubble {
                    padding: 1rem 1.25rem;
                    border-radius: 16px;
                }
                
                .thread-message.received .bubble {
                    background: white;
                    border-top-left-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                }
                
                .thread-message.sent .bubble {
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    color: white;
                    border-top-right-radius: 4px;
                }
                
                .bubble p {
                    margin: 0;
                    font-size: 0.9375rem;
                    line-height: 1.5;
                }
                
                .thread-message .time {
                    font-size: 0.6875rem;
                    color: var(--color-text-muted, #94a3b8);
                    margin-top: 0.375rem;
                    padding: 0 0.25rem;
                }
                
                .reply-box {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid rgba(8, 145, 178, 0.08);
                    align-items: center;
                }
                
                .reply-box input {
                    flex: 1;
                    padding: 0.875rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 0.9375rem;
                    background: #f8fafc;
                    transition: all 0.2s ease;
                }
                
                .reply-box input:focus {
                    outline: none;
                    border-color: var(--student-primary, #0891b2);
                    background: white;
                }
                
                .attach-btn, .send-btn {
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .attach-btn {
                    background: #f8fafc;
                    color: var(--color-text-muted, #64748b);
                }
                
                .attach-btn:hover {
                    background: #e0f2fe;
                    color: var(--student-primary, #0891b2);
                }
                
                .send-btn {
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    color: white;
                    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.25);
                }
                
                .send-btn:hover {
                    transform: scale(1.05);
                }
                
                .empty-detail {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-text-muted, #94a3b8);
                }
                
                .empty-detail svg {
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }
                
                .empty-detail h3 {
                    font-size: 1.125rem;
                    color: var(--color-text-main, #334155);
                    margin: 0 0 0.5rem;
                }
                
                .empty-detail p {
                    font-size: 0.875rem;
                    margin: 0;
                }
                
                .empty-list {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    color: var(--color-text-muted, #94a3b8);
                }
                
                .empty-list svg {
                    margin-bottom: 0.75rem;
                    opacity: 0.5;
                }
                
                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    z-index: 1000;
                }
                
                .compose-modal {
                    background: white;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid rgba(8, 145, 178, 0.08);
                }
                
                .modal-header h2 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: var(--color-text-main, #0f172a);
                    margin: 0;
                }
                
                .close-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    border: none;
                    border-radius: 8px;
                    color: var(--color-text-muted, #64748b);
                    cursor: pointer;
                }
                
                .compose-modal form {
                    padding: 1.5rem;
                }
                
                .compose-modal .form-group {
                    margin-bottom: 1.25rem;
                }
                
                .compose-modal label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--color-text-main, #334155);
                    margin-bottom: 0.5rem;
                }
                
                .form-select, .form-input, .form-textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 0.9375rem;
                    color: var(--color-text-main, #1e293b);
                    background: #f8fafc;
                    transition: all 0.2s ease;
                }
                
                .form-select:focus, .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: var(--student-primary, #0891b2);
                    background: white;
                    box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
                }
                
                .form-textarea {
                    resize: vertical;
                    min-height: 120px;
                }
                
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding-top: 0.5rem;
                }
                
                .btn-primary, .btn-secondary {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .btn-primary {
                    background: var(--student-gradient, linear-gradient(135deg, #0891b2, #06b6d4));
                    color: white;
                    border: none;
                }
                
                .btn-secondary {
                    background: #f1f5f9;
                    color: var(--color-text-main, #334155);
                    border: none;
                }
                
                /* Dark Mode */
                [data-theme="dark"] .message-sidebar,
                [data-theme="dark"] .message-detail,
                [data-theme="dark"] .compose-modal {
                    background: #1e293b;
                }
                
                [data-theme="dark"] .search-box,
                [data-theme="dark"] .message-thread {
                    background: rgba(30, 41, 59, 0.8);
                }
                
                [data-theme="dark"] .message-item:hover,
                [data-theme="dark"] .message-item.active {
                    background: rgba(8, 145, 178, 0.1);
                }
                
                [data-theme="dark"] .thread-message.received .bubble {
                    background: #334155;
                }
                
                [data-theme="dark"] .reply-box input,
                [data-theme="dark"] .form-select,
                [data-theme="dark"] .form-input,
                [data-theme="dark"] .form-textarea {
                    background: #334155;
                    border-color: #475569;
                    color: #f1f5f9;
                }
            `}</style>
        </div>
    );
};

export default StudentCommunication;
