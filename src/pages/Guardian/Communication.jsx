import React, { useState } from 'react';
import './Guardian.css';
import { Plus, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Communication = () => {
    const { t } = useTheme();
    const [activeTab, setActiveTab] = useState('teachers');

    // Mock Messages
    const teacherMessages = [
        { id: 1, sender: "Mr. Smith (Math)", subject: "Ahmed's progress", date: "Oct 12", preview: "Ahmed has improved significantly in..." },
        { id: 2, sender: "Ms. Doe (Science)", subject: "Upcoming Project", date: "Oct 10", preview: "Please ensure Sara brings the required..." }
    ];

    const adminMessages = [
        { id: 1, sender: "School Admin", subject: "Tuition Fees", date: "Oct 01", preview: "This is a reminder regarding the tuition..." }
    ];

    const meetings = [
        { id: 1, with: "Mrs. Johnson (Principal)", statusKey: "pending", date: "Requested for Nov 05" },
        { id: 2, with: "Mr. Smith", statusKey: "approved", date: "Oct 20 at 10:00 AM" }
    ];

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
                        {(activeTab === 'teachers' ? teacherMessages : adminMessages).map(msg => (
                            <div key={msg.id} className="message-thread">
                                <div className="message-header">
                                    <span className="message-sender">{msg.sender}</span>
                                    <span className="message-date">{msg.date}</span>
                                </div>
                                <div className="message-subject">{msg.subject}</div>
                                <div className="message-preview">
                                    {msg.preview}
                                </div>
                            </div>
                        ))}
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

