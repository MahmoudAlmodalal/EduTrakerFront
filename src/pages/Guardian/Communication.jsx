import React, { useState } from 'react';
import './Guardian.css';
import { Send, Plus, Calendar } from 'lucide-react';

const Communication = () => {
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
        { id: 1, with: "Mrs. Johnson (Principal)", status: "Pending", date: "Requested for Nov 05" },
        { id: 2, with: "Mr. Smith", status: "Approved", date: "Oct 20 at 10:00 AM" }
    ];

    return (
        <div className="guardian-communication">
            <h1 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Communication Center</h1>

            <div className="guardian-dashboard-grid">
                {/* Messages Section */}
                <div className="guardian-card" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Messages</h3>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                            <Plus size={16} /> New Message
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setActiveTab('teachers')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'teachers' ? '2px solid #4f46e5' : '2px solid transparent',
                                color: activeTab === 'teachers' ? '#4f46e5' : '#64748b',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Teachers
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'admin' ? '2px solid #4f46e5' : '2px solid transparent',
                                color: activeTab === 'admin' ? '#4f46e5' : '#64748b',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Administration
                        </button>
                    </div>

                    <div className="messages-list">
                        {(activeTab === 'teachers' ? teacherMessages : adminMessages).map(msg => (
                            <div key={msg.id} className="message-thread" style={{ cursor: 'pointer', hover: { background: '#f8fafc' } }}>
                                <div className="message-header">
                                    <span style={{ fontWeight: '600', color: '#334155' }}>{msg.sender}</span>
                                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{msg.date}</span>
                                </div>
                                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{msg.subject}</div>
                                <div style={{ fontSize: '0.9rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {msg.preview}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Meeting Requests Section */}
                <div className="guardian-card">
                    <h3>
                        <span>Meeting Requests</span>
                        <Calendar size={20} color="#4f46e5" />
                    </h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Requests</h4>
                        {meetings.map(meeting => (
                            <div key={meeting.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>{meeting.with}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{meeting.date}</span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '999px',
                                        background: meeting.status === 'Approved' ? '#dcfce7' : '#fef9c3',
                                        color: meeting.status === 'Approved' ? '#166534' : '#854d0e',
                                        fontWeight: '600'
                                    }}>
                                        {meeting.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="btn-primary" style={{ width: '100%' }}>Request New Meeting</button>
                </div>
            </div>
        </div>
    );
};

export default Communication;
