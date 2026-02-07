import React, { useState, useEffect, useCallback } from 'react';
import './Guardian.css';
import { FileText, UserCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import guardianService from '../../services/guardianService';

const ChildrenMonitoring = () => {
    const { t } = useTheme();
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [activeTab, setActiveTab] = useState('results');
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);

    const [results, setResults] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [behavior, setBehavior] = useState([]); // Still mocked

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                // Get user ID from local storage or decode token
                const user = JSON.parse(localStorage.getItem('user'));
                if (user) {
                    const res = await guardianService.getLinkedStudents(user.id);
                    const childData = res.map(link => ({
                        id: link.student_id,
                        name: link.student_name
                    }));
                    setChildren(childData);
                    if (childData.length > 0) {
                        setSelectedChild(childData[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching children:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChildren();
    }, []);

    const fetchChildData = useCallback(async () => {
        if (!selectedChild) return;
        setDataLoading(true);
        try {
            if (activeTab === 'results') {
                const res = await guardianService.getMarks(selectedChild);
                setResults(res.results || []);
            } else if (activeTab === 'attendance') {
                const res = await guardianService.getAttendance(selectedChild);
                setAttendance(res.results || []);
            } else if (activeTab === 'behavior') {
                // Mock behavior as it's not in backend
                setBehavior([
                    { id: 1, date: "2023-10-01", typeKey: "positive", comment: "Helped a classmate." },
                    { id: 2, date: "2023-09-25", typeKey: "negative", comment: "Talking during class." }
                ]);
            }
        } catch (error) {
            console.error("Error fetching child data:", error);
        } finally {
            setDataLoading(false);
        }
    }, [selectedChild, activeTab]);

    useEffect(() => {
        fetchChildData();
    }, [fetchChildData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

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
            <div className="guardian-card" style={{ minHeight: '400px', position: 'relative' }}>
                {dataLoading && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                )}

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
                                    <td>{res.course_name}</td>
                                    <td>{res.assessment_type}</td>
                                    <td>{res.date_recorded}</td>
                                    <td><span className="score-badge">{res.marks_obtained}/{res.max_marks}</span></td>
                                </tr>
                            ))}
                            {results.length === 0 && (
                                <tr><td colSpan="4" className="text-center py-4">{t('noData')}</td></tr>
                            )}
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
                                        <span className={`status-badge ${att.status}`}>
                                            {t(`guardian.monitoring.${att.status}`)}
                                        </span>
                                    </td>
                                    <td>{att.remarks || '-'}</td>
                                </tr>
                            ))}
                            {attendance.length === 0 && (
                                <tr><td colSpan="3" className="text-center py-4">{t('noData')}</td></tr>
                            )}
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

