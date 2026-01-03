import React, { useState } from 'react';
import './Guardian.css';
import { FileText, UserCheck, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ChildrenMonitoring = () => {
    const { t } = useTheme();
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
        { id: 1, date: "2023-10-12", statusKey: "absent", reason: "Sick Request" },
        { id: 2, date: "2023-10-11", statusKey: "present", reason: "-" },
        { id: 3, date: "2023-10-10", statusKey: "present", reason: "-" },
        { id: 4, date: "2023-10-09", statusKey: "late", reason: "Traffic" }
    ];

    const behavior = [
        { id: 1, date: "2023-10-01", typeKey: "positive", comment: "Helped a classmate." },
        { id: 2, date: "2023-09-25", typeKey: "negative", comment: "Talking during class." }
    ];

    return (
        <div className="guardian-monitoring">
            <h1 className="guardian-page-title">{t('guardian.monitoring.title')}</h1>

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
                    <FileText size={18} /> {t('guardian.monitoring.results')}
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                >
                    <UserCheck size={18} /> {t('guardian.monitoring.attendance')}
                </button>
                <button
                    onClick={() => setActiveTab('behavior')}
                    className={`tab-btn ${activeTab === 'behavior' ? 'active' : ''}`}
                >
                    <AlertTriangle size={18} /> {t('guardian.monitoring.behavior')}
                </button>
            </div>

            {/* Tab Content */}
            <div className="guardian-card" style={{ minHeight: '400px' }}>
                {activeTab === 'results' && (
                    <table className="guardian-table">
                        <thead>
                            <tr>
                                <th>{t('guardian.monitoring.subject')}</th>
                                <th>{t('guardian.monitoring.type')}</th>
                                <th>{t('guardian.monitoring.date')}</th>
                                <th>{t('guardian.monitoring.score')}</th>
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
                                <th>{t('guardian.monitoring.date')}</th>
                                <th>{t('guardian.monitoring.status')}</th>
                                <th>{t('guardian.monitoring.reason')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map(att => (
                                <tr key={att.id}>
                                    <td>{att.date}</td>
                                    <td>
                                        <span className={`status-badge ${att.statusKey}`}>
                                            {t(`guardian.monitoring.${att.statusKey}`)}
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
                                <th>{t('guardian.monitoring.date')}</th>
                                <th>{t('guardian.monitoring.type')}</th>
                                <th>{t('guardian.monitoring.comment')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {behavior.map(beh => (
                                <tr key={beh.id}>
                                    <td>{beh.date}</td>
                                    <td>
                                        <span className={`status-badge ${beh.typeKey}`}>
                                            {t(`guardian.monitoring.${beh.typeKey}`)}
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

