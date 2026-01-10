import React, { useState, useEffect } from 'react';
import './Guardian.css';
import { FileText, UserCheck, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ChildrenMonitoring = () => {
    const { t } = useTheme();
    const [children, setChildren] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [activeTab, setActiveTab] = useState('results');

    // Stats State
    const [results, setResults] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [behavior, setBehavior] = useState([]);

    // 1. Load Children
    useEffect(() => {
        const storedChildren = JSON.parse(localStorage.getItem('sec_students') || '[]');
        setChildren(storedChildren);
        if (storedChildren.length > 0) {
            setSelectedChildId(storedChildren[0].id);
        }
    }, []);

    // 2. Load Data when specific child is selected
    useEffect(() => {
        if (!selectedChildId || children.length === 0) return;

        const child = children.find(c => c.id === selectedChildId);
        // Safety: If child not found (ids changed?), default to first
        if (!child && children.length > 0) {
            setSelectedChildId(children[0].id);
            return;
        }
        
        // A. Attendance
        // Use real data if available, otherwise generate consistent mock based on Seed
        const rawAttendance = JSON.parse(localStorage.getItem('sec_attendance') || '[]'); 
        
        let childAttendance = [];
        if (child) {
            try {
               childAttendance = rawAttendance.filter(r => 
                    (r.studentId && r.studentId.toString() === selectedChildId.toString()) || 
                    (r.studentName && r.studentName === child.name)
               );
            } catch (e) { console.error("Error filtering attendance", e); }
        }
        
        // If empty, use seeded mock so each child looks different
        if (childAttendance.length === 0) {
            const seed = selectedChildId % 3;
            if (seed === 0) {
                childAttendance = [
                    { id: 1, date: "2023-10-12", status: "Absent", reason: "Sick" },
                    { id: 2, date: "2023-10-11", status: "Present", reason: "-" },
                ];
            } else if (seed === 1) {
                childAttendance = [
                    { id: 1, date: "2023-10-10", status: "Present", reason: "-" },
                    { id: 2, date: "2023-10-09", status: "Late", reason: "Traffic" },
                ];
            } else {
                 childAttendance = [
                    { id: 1, date: "2023-10-05", status: "Present", reason: "-" }, // Perfect attendance
                    { id: 2, date: "2023-10-04", status: "Present", reason: "-" },
                ];
            }
        }
        setAttendance(childAttendance);


        // B. Results (Mocked but dynamic based on ID to show change)
        // Simple consistent hash-like generation
        const seed = selectedChildId % 3; 
        
        const mockResults = [];
        if (seed === 0) {
            mockResults.push({ id: 1, subject: "Mathematics", type: "Quiz", score: "18/20", date: "2023-10-10" });
            mockResults.push({ id: 2, subject: "Science", type: "Assignment", score: "9/10", date: "2023-10-05" });
        } else if (seed === 1) {
             mockResults.push({ id: 1, subject: "History", type: "Midterm", score: "88/100", date: "2023-10-10" });
             mockResults.push({ id: 2, subject: "English", type: "Essay", score: "A-", date: "2023-09-28" });
        } else {
             mockResults.push({ id: 1, subject: "Physics", type: "Lab", score: "10/10", date: "2023-10-11" });
             mockResults.push({ id: 2, subject: "Biology", type: "Exam", score: "75/100", date: "2023-10-02" });
        }
        setResults(mockResults);

        // C. Behavior
        const mockBehavior = [];
        if (seed === 0 || seed === 2) {
             mockBehavior.push({ id: 1, date: "2023-10-01", type: "Positive", comment: "Helped teacher with equipment." });
        } else {
             mockBehavior.push({ id: 1, date: "2023-09-25", type: "Negative", comment: "Late to class twice." });
        }
        setBehavior(mockBehavior);

    }, [selectedChildId, children]);

    if (!children || children.length === 0) {
        return (
            <div className="guardian-monitoring">
                 <h1 className="guardian-page-title">{t('guardian.monitoring.title') || 'Children Monitoring'}</h1>
                 <div className="p-8 text-center text-gray-500" style={{background: 'white', borderRadius: '8px', padding: '2rem'}}>
                    <p>No children registered under your profile.</p>
                    <small>Please contact the school administration to link your children.</small>
                 </div>
            </div>
        );
    }

    return (
        <div className="guardian-monitoring">
            <h1 className="guardian-page-title">{t('guardian.monitoring.title') || 'Children Monitoring'}</h1>

            {/* Child Selector */}
            <div className="child-selector">
                {children.map(child => (
                    <button
                        key={child.id}
                        onClick={() => setSelectedChildId(child.id)}
                        className={`child-selector-btn ${selectedChildId === child.id ? 'active' : ''}`}
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
                    <FileText size={18} /> {t('guardian.monitoring.results') || 'Results'}
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                >
                    <UserCheck size={18} /> {t('guardian.monitoring.attendance') || 'Attendance'}
                </button>
                <button
                    onClick={() => setActiveTab('behavior')}
                    className={`tab-btn ${activeTab === 'behavior' ? 'active' : ''}`}
                >
                    <AlertTriangle size={18} /> {t('guardian.monitoring.behavior') || 'Behavior'}
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
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map(att => (
                                <tr key={att.id}>
                                    <td>{att.date}</td>
                                    <td>
                                        <span className={`status-badge ${att.status === 'Absent' ? 'status-inactive' : 'status-active'}`} style={{
                                            background: att.status === 'Absent' ? '#fee2e2' : '#dcfce7',
                                            color: att.status === 'Absent' ? '#991b1b' : '#166534',
                                            padding: '2px 8px', borderRadius: '4px'
                                        }}>
                                            {att.status}
                                        </span>
                                    </td>
                                    <td>{att.reason || '-'}</td>
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
                                            fontWeight: 'bold',
                                            color: beh.type === 'Positive' ? 'green' : beh.type === 'Negative' ? 'red' : 'gray'
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
