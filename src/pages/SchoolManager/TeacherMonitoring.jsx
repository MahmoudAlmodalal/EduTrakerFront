import React, { useState } from 'react';
import {
    Users,
    Star,
    Award,
    Activity,
    Clock,
    Search,
    Plus,
    MoreVertical
} from 'lucide-react';
import './SchoolManager.css';

const TeacherMonitoring = () => {
    const [activeTab, setActiveTab] = useState('directory');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'directory':
                return <TeacherDirectory />;
            case 'performance':
                return <PerformanceEvaluation />;
            case 'activity':
                return <ActivityLogs />;
            default:
                return <TeacherDirectory />;
        }
    };

    return (
        <div className="teacher-monitoring-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">Teacher Monitoring</h1>
                <p className="school-manager-subtitle">Manage staff, evaluate performance, and track activity.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 w-full" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', gap: '2rem' }}>
                <button
                    className={`pb-2 px-1 ${activeTab === 'directory' ? 'active-tab' : 'inactive-tab'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        borderBottom: activeTab === 'directory' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'directory' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('directory')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} />
                        Teacher Directory
                    </div>
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'performance' ? 'active-tab' : 'inactive-tab'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        borderBottom: activeTab === 'performance' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'performance' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('performance')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Star size={18} />
                        Performance Evaluation
                    </div>
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'activity' ? 'active-tab' : 'inactive-tab'}`}
                    style={{
                        paddingBottom: '0.5rem',
                        borderBottom: activeTab === 'activity' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        color: activeTab === 'activity' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('activity')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={18} />
                        Activity Logs
                    </div>
                </button>
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

// Sub-components
const TeacherDirectory = () => {
    const teachers = [
        { id: 1, name: 'John Smith', subject: 'Mathematics', role: 'Teacher', status: 'Active' },
        { id: 2, name: 'Sarah Johnson', subject: 'Science', role: 'Head of Dept', status: 'Active' },
        { id: 3, name: 'Michael Brown', subject: 'English', role: 'Teacher', status: 'On Leave' },
        { id: 4, name: 'Emily Davis', subject: 'History', role: 'Teacher', status: 'Active' },
    ];

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--color-border)'
                        }}
                    />
                </div>
                <button className="btn-primary">
                    <Plus size={18} />
                    Add Teacher
                </button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Subject</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.map((teacher) => (
                        <tr key={teacher.id}>
                            <td className="font-medium text-gray-900">{teacher.name}</td>
                            <td>{teacher.subject}</td>
                            <td>{teacher.role}</td>
                            <td>
                                <span className={`status-badge ${teacher.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                                    {teacher.status}
                                </span>
                            </td>
                            <td>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                                    <MoreVertical size={18} color="var(--color-text-muted)" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PerformanceEvaluation = () => {
    const evaluations = [
        { id: 1, name: 'John Smith', rating: 4.8, comments: 'Excellent engagement with students.', date: '2023-11-15' },
        { id: 2, name: 'Sarah Johnson', rating: 4.9, comments: 'Consistently high teaching standards.', date: '2023-11-10' },
        { id: 3, name: 'Michael Brown', rating: 4.2, comments: 'Good, but attendance could improve.', date: '2023-10-25' },
    ];

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Latest Evaluations</h3>
                <button className="btn-primary" style={{ background: 'white', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                    Start New Evaluation
                </button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Rating (out of 5)</th>
                        <th>Comments</th>
                        <th>Last Evaluated</th>
                    </tr>
                </thead>
                <tbody>
                    {evaluations.map((evalItem) => (
                        <tr key={evalItem.id}>
                            <td className="font-medium text-gray-900">{evalItem.name}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Star size={16} fill="gold" stroke="gold" />
                                    <span style={{ fontWeight: 'bold' }}>{evalItem.rating}</span>
                                </div>
                            </td>
                            <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {evalItem.comments}
                            </td>
                            <td>{evalItem.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const ActivityLogs = () => {
    const activity = [
        { id: 1, name: 'John Smith', action: 'Graded Assignment: Math Homework', time: '2 hours ago', speed: 'Fast' },
        { id: 2, name: 'Sarah Johnson', action: 'Uploaded Lesson Plan: Photosynthesis', time: '4 hours ago', speed: 'Normal' },
        { id: 3, name: 'Emily Davis', action: 'Logged in', time: '5 hours ago', speed: '-' },
        { id: 4, name: 'Michael Brown', action: 'Graded Quiz: Vocab', time: '1 day ago', speed: 'Slow' },
    ];

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Implementation Monitoring</h3>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Last Action</th>
                        <th>Time</th>
                        <th>Grading Speed</th>
                    </tr>
                </thead>
                <tbody>
                    {activity.map((log) => (
                        <tr key={log.id}>
                            <td className="font-medium text-gray-900">{log.name}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={16} className="text-gray-400" />
                                    {log.action}
                                </div>
                            </td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} className="text-gray-400" />
                                    {log.time}
                                </div>
                            </td>
                            <td>
                                <span className={`status-badge ${log.speed === 'Fast' ? 'status-active' :
                                        log.speed === 'Slow' ? 'status-inactive' : // Reusing inactive for warning-ish look or defined another
                                            ''
                                    }`}
                                    style={{
                                        backgroundColor: log.speed === 'Fast' ? '#dcfce7' : log.speed === 'Slow' ? '#fee2e2' : '#f1f5f9',
                                        color: log.speed === 'Fast' ? '#166534' : log.speed === 'Slow' ? '#991b1b' : '#475569'
                                    }}>
                                    {log.speed}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherMonitoring;
