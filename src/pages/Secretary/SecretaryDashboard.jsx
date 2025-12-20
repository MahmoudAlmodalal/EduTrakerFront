import React from 'react';
import { Users, FileText, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Secretary.css';

const SecretaryDashboard = () => {
    const navigate = useNavigate();

    // Get data from localStorage
    const getLocalData = (key, defaultVal) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultVal;
    };

    const students = getLocalData('secretary_students', []);
    const applications = getLocalData('secretary_applications', [
        { id: 101, name: 'Alice Johnson', status: 'Pending' },
        { id: 102, name: 'Bob Smith', status: 'Under Review' },
        { id: 103, name: 'Charlie Brown', status: 'Pending' }
    ]);
    const guardians = getLocalData('secretary_guardians', []);
    const eventsData = getLocalData('secretary_events', [
        { id: 1, title: 'Parent-Teacher Meeting', date: 'Dec 15, 2025', time: '10:00 AM' },
        { id: 101, title: 'School Assembly', date: 'Dec 16, 2025', time: '08:00 AM' },
        { id: 102, title: 'Staff Meeting', date: 'Dec 18, 2025', time: '02:00 PM' },
    ]);

    const pendingApps = applications.filter(app => app.status === 'Pending');
    const unlinkedGuardians = guardians.filter(g => g.status === 'Unlinked');

    // Stats
    const totalPendingTasks = pendingApps.length + unlinkedGuardians.length;
    
    const stats = [
        { 
            label: 'Total Students', 
            value: students.length.toLocaleString(), 
            icon: Users, 
            color: '#4F46E5', 
            bgColor: '#EEF2FF',
            path: '/secretary/admissions?tab=view-students'
        },
        { 
            label: 'New Applications', 
            value: pendingApps.length.toString(), 
            icon: FileText, 
            color: '#F59E0B', 
            bgColor: '#FEF3C7',
            path: '/secretary/admissions?tab=applications'
        },
        { 
            label: 'Pending Tasks', 
            value: totalPendingTasks.toString(), 
            icon: Clock, 
            color: '#EF4444', 
            bgColor: '#FEE2E2',
            path: '/secretary/admissions?tab=applications'
        },
    ];

    // Dynamic Pending Tasks
    const applicationTasks = pendingApps.map(app => ({
        id: `app-${app.id}`,
        title: `Review Application - ${app.name}`,
        time: 'Pending Review',
        type: 'application',
        link: '/secretary/admissions'
    }));

    const guardianTasks = unlinkedGuardians.map(g => ({
        id: `g-${g.id}`,
        title: `Link Guardian - ${g.name}`,
        time: 'Action Required',
        type: 'guardian',
        link: '/secretary/guardians'
    }));
    
    // Merge and sort (mock sort by adding guardians first as high priority)
    const pendingTasks = [...guardianTasks, ...applicationTasks].slice(0, 10); 

    return (
        <div className="secretary-dashboard">
            <header className="secretary-header">
                <h1>Secretary Dashboard</h1>
                <p>Welcome back! Here's what's happening today.</p>
            </header>

            {/* Quick Stats Grid */}
            <div className="secretary-stats-grid">
                {stats.map((stat, index) => (
                    <div 
                        key={index} 
                        className="stat-card" 
                        onClick={() => navigate(stat.path)}
                        style={{ cursor: 'pointer' }}
                    >
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
                        <span className="badge-count">{pendingTasks.length}</span>
                    </div>
                    <div className="widget-body">
                        {pendingTasks.length > 0 ? (
                            pendingTasks.map((task) => (
                                <div key={task.id} className="task-item">
                                    <div className="task-indicator" style={{
                                        backgroundColor:
                                            task.type === 'application' ? '#fbbf24' : // Amber
                                            task.type === 'guardian' ? '#ef4444' :   // Red
                                            '#9ca3af'
                                    }} />
                                    <div className="task-content">
                                        <h4>{task.title}</h4>
                                        <p>{task.time}</p>
                                    </div>
                                    {/* Optional: Add a small link arrow or button here */}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">No pending tasks.</p>
                        )}
                    </div>
                </div>

                {/* Events Calendar Widget */}
                <div className="widget-card">
                    <div className="widget-header">
                        <h2>Upcoming Events</h2>
                        <CalendarIcon size={20} color="#9ca3af" />
                    </div>
                    <div className="widget-body">
                        {eventsData.map((event) => (
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
