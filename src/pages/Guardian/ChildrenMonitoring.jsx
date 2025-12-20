import React, { useState } from 'react';
import './Guardian.css';
import { FileText, UserCheck, AlertTriangle } from 'lucide-react';

const ChildrenMonitoring = () => {
    const [selectedChild, setSelectedChild] = useState(1);
    const [activeTab, setActiveTab] = useState('results');

    // Mock Data
    const children = [
        { id: 1, name: "Ahmed" },
        { id: 2, name: "Sara" }
    ];

    const results = [
        { id: 1, subject: "Mathematics", type: "Quiz", score: "18/20", date: "2023-10-10" },
        { id: 2, subject: "Science", type: "Assignment", score: "9/10", date: "2023-10-05" },
        { id: 3, subject: "History", type: "Midterm", score: "42/50", date: "2023-09-28" }
    ];

    const attendance = [
        { id: 1, date: "2023-10-12", status: "Absent", reason: "Sick Request" },
        { id: 2, date: "2023-10-11", status: "Present", reason: "-" },
        { id: 3, date: "2023-10-10", status: "Present", reason: "-" },
        { id: 4, date: "2023-10-09", status: "Late", reason: "Traffic" }
    ];

    const behavior = [
        { id: 1, date: "2023-10-01", type: "Positive", comment: "Helped a classmate." },
        { id: 2, date: "2023-09-25", type: "Negative", comment: "Talking during class." }
    ];

    return (
        <div className="guardian-monitoring">
            <h1 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Children Monitoring</h1>

            {/* Child Selector */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                {children.map(child => (
                    <button
                        key={child.id}
                        onClick={() => setSelectedChild(child.id)}
                        className={`btn-primary`}
                        style={{
                            background: selectedChild === child.id ? '#4f46e5' : 'white',
                            color: selectedChild === child.id ? 'white' : '#64748b',
                            border: '1px solid #e2e8f0',
                            boxShadow: 'none'
                        }}
                    >
                        {child.name}
                    </button>
                ))}
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('results')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'results' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeTab === 'results' ? '#4f46e5' : '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} /> Results
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'attendance' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeTab === 'attendance' ? '#4f46e5' : '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserCheck size={18} /> Attendance
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('behavior')}
                    style={{
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'behavior' ? '2px solid #4f46e5' : '2px solid transparent',
                        color: activeTab === 'behavior' ? '#4f46e5' : '#64748b',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} /> Behavior
                    </div>
                </button>
            </div>

            {/* Tab Content */}
            <div className="guardian-card" style={{ minHeight: '400px' }}>
                {activeTab === 'results' && (
                    <table className="guardian-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(res => (
                                <tr key={res.id}>
                                    <td>{res.subject}</td>
                                    <td>{res.type}</td>
                                    <td>{res.date}</td>
                                    <td><span style={{ fontWeight: 'bold', color: '#1e293b' }}>{res.score}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'attendance' && (
                    <table className="guardian-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Reason/Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map(att => (
                                <tr key={att.id}>
                                    <td>{att.date}</td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            backgroundColor: att.status === 'Present' ? '#dcfce7' : att.status === 'Absent' ? '#fee2e2' : '#fef9c3',
                                            color: att.status === 'Present' ? '#166534' : att.status === 'Absent' ? '#991b1b' : '#854d0e'
                                        }}>
                                            {att.status}
                                        </span>
                                    </td>
                                    <td>{att.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'behavior' && (
                    <table className="guardian-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {behavior.map(beh => (
                                <tr key={beh.id}>
                                    <td>{beh.date}</td>
                                    <td>
                                        <span style={{
                                            color: beh.type === 'Positive' ? '#166534' : '#991b1b',
                                            fontWeight: '600'
                                        }}>
                                            {beh.type}
                                        </span>
                                    </td>
                                    <td>{beh.comment}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ChildrenMonitoring;
