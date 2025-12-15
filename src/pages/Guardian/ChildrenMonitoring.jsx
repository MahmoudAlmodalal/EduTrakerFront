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
            <h1 className="guardian-page-title">Children Monitoring</h1>

            {/* Child Selector */}
            <div className="child-selector">
                {children.map(child => (
                    <button
                        key={child.id}
                        onClick={() => setSelectedChild(child.id)}
                        className={`child-selector-btn ${selectedChild === child.id ? 'active' : ''}`}
                    >
                        {child.name}
                    </button>
                ))}
            </div>

            {/* Tabs */}
            <div className="tabs-header">
                <button
                    onClick={() => setActiveTab('results')}
                    className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                >
                    <FileText size={18} /> Results
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                >
                    <UserCheck size={18} /> Attendance
                </button>
                <button
                    onClick={() => setActiveTab('behavior')}
                    className={`tab-btn ${activeTab === 'behavior' ? 'active' : ''}`}
                >
                    <AlertTriangle size={18} /> Behavior
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
                                    <td><span className="score-badge">{res.score}</span></td>
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
                                        <span className={`status-badge ${att.status.toLowerCase()}`}>
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
                                        <span className={`status-badge ${beh.type.toLowerCase()}`}>
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
