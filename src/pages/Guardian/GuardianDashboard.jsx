import React from 'react';
import './Guardian.css';
import { Bell, Calendar, TrendingUp } from 'lucide-react';

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
            <h1 className="guardian-page-title">Dashboard Overview</h1>

            <div className="guardian-dashboard-grid">
                {/* Children Summary */}
                <div className="guardian-card">
                    <div className="guardian-card-header">
                        <h3>Children Overview</h3>
                        <TrendingUp size={20} color="#4f46e5" />
                    </div>
                    <div className="children-list">
                        {children.map(child => (
                            <div key={child.id} className="child-summary-item">
                                <div className="child-avatar">{child.name.charAt(0)}</div>
                                <div>
                                    <div className="child-name">{child.name}</div>
                                    <div className="child-details">{child.grade} • GPA: {child.gpa}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications */}
                <div className="guardian-card">
                    <div className="guardian-card-header">
                        <h3>Recent Notifications</h3>
                        <Bell size={20} color="#f59e0b" />
                    </div>
                    <div className="notifications-list">
                        {notifications.map(notif => (
                            <div key={notif.id} className={`notification-item ${notif.type}`}>
                                <div className="notification-title">{notif.title}</div>
                                <div className="notification-message">{notif.message}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Important Dates */}
                <div className="guardian-card">
                    <div className="guardian-card-header">
                        <h3>Upcoming Events</h3>
                        <Calendar size={20} color="#3b82f6" />
                    </div>
                    <div className="events-list">
                        {upcomingEvents.map(event => (
                            <div key={event.id} className="event-item">
                                <div className="event-date-box">
                                    <div className="event-month">{event.date.split(' ')[0]}</div>
                                    <div className="event-day">{event.date.split(' ')[1].replace(',', '')}</div>
                                </div>
                                <div>
                                    <div className="event-title">{event.title}</div>
                                    <div className="event-child">For: {event.child}</div>
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
