import React, { useMemo, useState } from 'react';
import './Guardian.css';
import { FileText, UserCheck, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import guardianService from '../../services/guardianService';

const normalizeList = (value) => {
    if (Array.isArray(value)) {
        return value;
    }
    if (Array.isArray(value?.results)) {
        return value.results;
    }
    return [];
};

const ChildrenMonitoring = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [selectedChild, setSelectedChild] = useState(null);
    const [activeTab, setActiveTab] = useState('results');
    const behavior = useMemo(
        () => [
            { id: 1, date: '2023-10-01', typeKey: 'positive', comment: 'Helped a classmate.' },
            { id: 2, date: '2023-09-25', typeKey: 'negative', comment: 'Talking during class.' }
        ],
        []
    );

    const {
        data: linkedStudents = [],
        isLoading: childrenLoading,
        error: childrenError,
        refetch: refetchChildren
    } = useQuery({
        queryKey: ['guardian', 'children', user?.id],
        queryFn: ({ signal }) => guardianService.getLinkedStudents(user.id, { signal }),
        enabled: Boolean(user?.id)
    });

    const children = useMemo(() => {
        return normalizeList(linkedStudents).map((link) => ({
            id: link.student_id,
            name: link.student_name
        }));
    }, [linkedStudents]);

    const effectiveSelectedChild = selectedChild || children[0]?.id || null;

    const {
        data: marksData,
        isFetching: marksLoading,
        error: marksError,
        refetch: refetchMarks
    } = useQuery({
        queryKey: ['guardian', 'marks', effectiveSelectedChild],
        queryFn: ({ signal }) => guardianService.getMarks(effectiveSelectedChild, { signal }),
        enabled: Boolean(effectiveSelectedChild) && activeTab === 'results'
    });

    const {
        data: attendanceData,
        isFetching: attendanceLoading,
        error: attendanceError,
        refetch: refetchAttendance
    } = useQuery({
        queryKey: ['guardian', 'attendance', effectiveSelectedChild],
        queryFn: ({ signal }) => guardianService.getAttendance(effectiveSelectedChild, { signal }),
        enabled: Boolean(effectiveSelectedChild) && activeTab === 'attendance'
    });

    const results = normalizeList(marksData);
    const attendance = normalizeList(attendanceData);
    const loading = childrenLoading;
    const dataLoading = marksLoading || attendanceLoading;
    const error = childrenError || marksError || attendanceError;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="guardian-monitoring">
                <h1 className="guardian-page-title">{t('guardian.monitoring.title')}</h1>
                <div className="guardian-card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-red-500" />
                        <div>{error.message || t('common.somethingWentWrong') || 'Failed to load monitoring data.'}</div>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            refetchChildren();
                            if (activeTab === 'results') {
                                refetchMarks();
                            } else if (activeTab === 'attendance') {
                                refetchAttendance();
                            }
                        }}
                    >
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
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
                        className={`child-selector-btn ${effectiveSelectedChild === child.id ? 'active' : ''}`}
                    >
                        {child.name}
                    </button>
                ))}
                {children.length === 0 && (
                    <div className="text-muted">{t('noData')}</div>
                )}
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
                            {behavior.length === 0 && (
                                <tr><td colSpan="3" className="text-center py-4">{t('noData')}</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ChildrenMonitoring;
