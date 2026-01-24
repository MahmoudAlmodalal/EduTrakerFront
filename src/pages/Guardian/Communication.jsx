import React, { useState, useEffect } from 'react';
import './Guardian.css';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import guardianService from '../../services/guardianService';

const Communication = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('teachers');
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [meetings, setMeetings] = useState([]); // Still mocked

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

            <div className="guardian-dashboard-grid">
                {/* Messages Section */}
                <div className="guardian-card" style={{ gridColumn: 'span 2' }}>
                    <div className="communication-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{t('guardian.communication.messages')}</h3>
                            <button className="btn-primary">
                                <Plus size={16} /> {t('guardian.communication.newMessage')}
                            </button>
                        </div>
                    </div>

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

                    <div className="messages-list">
                        {filteredMessages.map(msg => (
                            <div key={msg.id} className="message-thread">
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

