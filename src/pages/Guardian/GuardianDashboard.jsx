import React from 'react';
import './Guardian.css';
import { Bell, Calendar, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';

const GuardianDashboard = () => {
    // Mock Data
    const children = [
        { id: 1, name: "Ahmed", grade: "5th Grade", gpa: "3.8" },
        { id: 2, name: "Sara", grade: "3rd Grade", gpa: "3.9" }
    ];

    const notifications = [
        { id: 1, type: 'warning', message: "Ahmed was absent on Oct 12 without excuse.", title: "Absence Alert" },
        { id: 2, type: 'danger', message: "Sara scored below average in Math Quiz.", title: "Low Grade Alert" },
        { id: 3, type: 'info', message: "Parent-Teacher meeting scheduled for next week.", title: "Event Reminder" }
    ];

    const upcomingEvents = [
        { id: 1, title: "Math Midterm", date: "Oct 20, 2025", child: "Ahmed" },
        { id: 2, title: "Science Fair", date: "Oct 25, 2025", child: "Sara" },
        { id: 3, title: "School Trip", date: "Nov 01, 2025", child: "All" }
    ];

    return (
        <div className="guardian-dashboard">
            <h1 style={{ marginBottom: '2rem', color: '#1e293b' }}>Dashboard Overview</h1>

            <div className="guardian-dashboard-grid">
                {/* Children Summary */}
                <div className="guardian-card">
                    <h3>
                        <span>Children Overview</span>
                        <TrendingUp size={20} color="#4f46e5" />
                    </h3>
                    <div className="children-list">
                        {children.map(child => (
                            <div key={child.id} className="child-summary-item">
                                <div className="child-avatar">{child.name.charAt(0)}</div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{child.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{child.grade} • GPA: {child.gpa}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications */}
                <div className="guardian-card">
                    <h3>
                        <span>Recent Notifications</span>
                        <Bell size={20} color="#f59e0b" />
                    </h3>
                    <div className="notifications-list">
                        {notifications.map(notif => (
                            <div key={notif.id} className={`notification-item ${notif.type}`}>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{notif.title}</div>
                                <div style={{ fontSize: '0.85rem', color: '#475569' }}>{notif.message}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Important Dates */}
                <div className="guardian-card">
                    <h3>
                        <span>Upcoming Events</span>
                        <Calendar size={20} color="#3b82f6" />
                    </h3>
                    <div className="events-list">
                        {upcomingEvents.map(event => (
                            <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: '0.5rem', color: '#3b82f6', textAlign: 'center', minWidth: '50px' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{event.date.split(' ')[0]}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{event.date.split(' ')[1].replace(',', '')}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#334155' }}>{event.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>For: {event.child}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuardianDashboard;
