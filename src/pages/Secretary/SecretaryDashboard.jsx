import React from 'react';
import { Users, FileText, Calendar as CalendarIcon, Clock } from 'lucide-react';
import './Secretary.css';

const SecretaryDashboard = () => {
    // Mock Data for Quick Stats
    const stats = [
        { label: 'Total Students', value: '1,234', icon: Users, color: '#4F46E5', bgColor: '#EEF2FF' },
        { label: 'New Applications', value: '45', icon: FileText, color: '#F59E0B', bgColor: '#FEF3C7' },
        { label: 'Pending Tasks', value: '12', icon: Clock, color: '#EF4444', bgColor: '#FEE2E2' },
    ];

    const pendingTasks = [
        { id: 1, title: 'Review Application #1023 - John Doe', time: '2 hours ago', type: 'application' },
        { id: 2, title: 'Verify Documents for Class 1-A', time: '5 hours ago', type: 'doc' },
        { id: 3, title: 'Print Schedule for Mr. Smith', time: '1 day ago', type: 'admin' },
        { id: 4, title: 'Guardian Linking Request - Sarah Connor', time: '1 day ago', type: 'guardian' },
    ];

    const events = [
        { id: 1, title: 'Parent-Teacher Meeting', date: 'Dec 15, 2025', time: '10:00 AM' },
        { id: 2, title: 'School Assembly', date: 'Dec 16, 2025', time: '08:00 AM' },
        { id: 3, title: 'Staff Meeting', date: 'Dec 18, 2025', time: '02:00 PM' },
    ];

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>Secretary Dashboard</h1>
                <p>Welcome back! Here's what's happening today.</p>
            </header>

            {/* Quick Stats Grid */}
            <div className="secretary-stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div
                            className="stat-icon-wrapper"
                            style={{ backgroundColor: stat.bgColor, color: stat.color }}
                        >
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <p>{stat.label}</p>
                            <h3>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="secretary-widgets-grid">
                {/* Pending Tasks Widget */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Pending Tasks</h2>
                        <button className="view-all-btn">View All</button>
                    </div>
                    <div className="widget-body">
                        {pendingTasks.map((task) => (
                            <div key={task.id} className="task-item">
                                <div className="task-indicator" style={{
                                    backgroundColor:
                                        task.type === 'application' ? '#fbbf24' :
                                            task.type === 'admin' ? '#60a5fa' : '#9ca3af'
                                }} />
                                <div className="task-content">
                                    <h4>{task.title}</h4>
                                    <p>{task.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Events Calendar Widget */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Upcoming Events</h2>
                        <CalendarIcon size={20} color="#9ca3af" />
                    </div>
                    <div className="widget-body">
                        {events.map((event) => (
                            <div key={event.id} className="event-item">
                                <div className="event-date">
                                    <span className="event-month">{event.date.split(' ')[0]}</span>
                                    <span className="event-day">{event.date.split(' ')[1].replace(',', '')}</span>
                                </div>
                                <div className="task-content">
                                    <h4>{event.title}</h4>
                                    <p>{event.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecretaryDashboard;
