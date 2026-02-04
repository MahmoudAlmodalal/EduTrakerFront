import React, { useState, useEffect } from 'react';
import './Guardian.css';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import guardianService from '../../services/guardianService';
import { useAuth } from '../../context/AuthContext';

const Communication = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('teachers');
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [meetings, setMeetings] = useState([]);

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [threadMessages, setThreadMessages] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await guardianService.getMessages();
                setMessages(res.results || []);

                // Mock meetings for now
                setMeetings([
                    { id: 1, with: "Mrs. Johnson (Principal)", statusKey: "pending", date: "Requested for Nov 05" },
                    { id: 2, with: "Mr. Smith", statusKey: "approved", date: "Oct 20 at 10:00 AM" }
                ]);
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, []);

    const handleMessageClick = async (msg) => {
        setSelectedMessage(msg);
        setLoadingThread(true);
        setThreadMessages([]);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/user-messages/threads/${msg.thread_id}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            setThreadMessages(data.results || data);

            // Mark as read if possible
            if (!msg.is_read) {
                await guardianService.markMessageRead(msg.id);
            }
        } catch (error) {
            console.error('Error fetching thread:', error);
            setThreadMessages([{
                id: msg.id,
                sender: { full_name: msg.sender_name || 'Teacher', id: msg.sender_id },
                body: msg.body,
                sent_at: msg.created_at
            }]);
        } finally {
            setLoadingThread(false);
        }
    };

    const handleSendReply = async (e) => {
        if (e) e.preventDefault();
        if (!replyText.trim() || !selectedMessage) return;

        try {
            const targetRecipientId = selectedMessage.sender_id || 1;

            await guardianService.sendMessage({
                recipient_ids: [targetRecipientId],
                body: replyText,
                subject: `Re: ${selectedMessage.subject}`,
                thread_id: selectedMessage.thread_id,
                parent_message: selectedMessage.id
            });
            setReplyText('');

            // Refresh thread
            const threadResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/user-messages/threads/${selectedMessage.thread_id}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const threadData = await threadResponse.json();
            setThreadMessages(threadData.results || threadData);
        } catch (error) {
            console.error('Error sending reply:', error);
        }
    };

    const filteredMessages = messages.filter(msg => {
        if (activeTab === 'teachers') {
            return msg.sender_role === 'teacher';
        } else {
            return msg.sender_role !== 'teacher';
        }
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="guardian-communication">
            <h1 className="guardian-page-title">{t('guardian.communication.title')}</h1>

            <div className="guardian-dashboard-grid" style={{ gridTemplateColumns: 'minmax(400px, 1fr) 350px' }}>
                {/* Messages Section */}
                <div className="guardian-card">
                    <div className="communication-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{t('guardian.communication.messages')} {selectedMessage && <button onClick={() => setSelectedMessage(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem' }}>&lsaquo; Back to List</button>}</h3>
                            {!selectedMessage && (
                                <button className="btn-primary">
                                    <Plus size={16} /> {t('guardian.communication.newMessage')}
                                </button>
                            )}
                        </div>
                    </div>

                    {!selectedMessage ? (
                        <>
                            <div className="tabs-header">
                                <button
                                    onClick={() => setActiveTab('teachers')}
                                    className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
                                >
                                    {t('guardian.communication.teachers')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('admin')}
                                    className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                                >
                                    {t('guardian.communication.administration')}
                                </button>
                            </div>

                            <div className="messages-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {filteredMessages.map(msg => (
                                    <div key={msg.id} className="message-thread" onClick={() => handleMessageClick(msg)}>
                                        <div className="message-header">
                                            <span className="message-sender">{msg.sender_name} ({msg.sender_role})</span>
                                            <span className="message-date">{new Date(msg.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="message-subject">{msg.subject}</div>
                                        <div className="message-preview">
                                            {msg.body}
                                        </div>
                                    </div>
                                ))}
                                {filteredMessages.length === 0 && (
                                    <div className="text-muted text-center py-4">{t('common.noMessages')}</div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>{selectedMessage.subject}</h4>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    From: {selectedMessage.sender_name} ({selectedMessage.sender_role})
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-bg-body)', borderRadius: '0.5rem' }}>
                                {loadingThread ? (
                                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading conversation...</div>
                                ) : (
                                    threadMessages.map(m => (
                                        <div
                                            key={m.id}
                                            style={{
                                                alignSelf: m.sender?.id === user?.id ? 'flex-end' : 'flex-start',
                                                maxWidth: '85%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: m.sender?.id === user?.id ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <div style={{
                                                padding: '0.75rem 1rem',
                                                borderRadius: '1rem',
                                                background: m.sender?.id === user?.id ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                                                color: m.sender?.id === user?.id ? 'white' : 'var(--color-text-main)',
                                                borderBottomRightRadius: m.sender?.id === user?.id ? '0' : '1.25rem',
                                                borderBottomLeftRadius: m.sender?.id === user?.id ? '1.25rem' : '0',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                border: m.sender?.id === user?.id ? 'none' : '1px solid var(--color-border)'
                                            }}>
                                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{m.body}</p>
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                                {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSendReply} style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..."
                                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }}
                                />
                                <button type="submit" className="btn-primary" disabled={!replyText.trim()}>Send</button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Meeting Requests Section */}
                <div className="guardian-card">
                    <div className="guardian-card-header">
                        <h3>{t('guardian.communication.meetingRequests')}</h3>
                        <Calendar size={20} color="#4f46e5" />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 className="section-subtitle">{t('guardian.communication.yourRequests')}</h4>
                        {meetings.map(meeting => (
                            <div key={meeting.id} className="meeting-request-item">
                                <div className="meeting-with">{meeting.with}</div>
                                <div className="meeting-details">
                                    <span className="meeting-date">{meeting.date}</span>
                                    <span className={`status-badge ${meeting.statusKey}`}>
                                        {t(`guardian.communication.${meeting.statusKey}`)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn-primary btn-full" style={{ width: '100%' }}>{t('guardian.communication.requestNewMeeting')}</button>
                </div>
            </div>
        </div>
    );
};

export default Communication;
