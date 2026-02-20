import React, { useMemo } from 'react';
import { AlertTriangle, ClipboardList, GraduationCap, UserCheck } from 'lucide-react';
import AcademicOverviewTab from './tabs/AcademicOverviewTab';
import { useStudentMarks } from '../hooks/useStudentMarks';
import { useStudentAttendance } from '../hooks/useStudentAttendance';
import { formatDate } from '../utils/monitoringUtils';

const TAB_OPTIONS = [
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'assessments', label: 'Assessments', icon: ClipboardList },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'behavior', label: 'Behavior', icon: AlertTriangle },
];

const formatStatusLabel = (status) => {
    if (!status) {
        return '--';
    }

    const normalized = String(status).toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const AssessmentsListTab = ({ studentId }) => {
    const {
        data: marks = [],
        isLoading,
        error,
    } = useStudentMarks(studentId);

    if (isLoading) {
        return <div className="guardian-card monitoring-empty-state">Loading assessments...</div>;
    }

    if (error) {
        return (
            <div className="guardian-card monitoring-empty-state monitoring-empty-state-error">
                {error.message || 'Failed to load assessments.'}
            </div>
        );
    }

    return (
        <div className="guardian-card">
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
                    {marks.map((entry) => (
                        <tr key={entry.id}>
                            <td>{entry.course_name}</td>
                            <td>{entry.assessment_type}</td>
                            <td>{formatDate(entry.date_recorded)}</td>
                            <td>
                                <span className="score-badge">
                                    {entry.marks_obtained}/{entry.max_marks}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {marks.length === 0 && (
                        <tr>
                            <td colSpan="4" className="text-center py-4">No assessment data found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const AttendanceListTab = ({ studentId }) => {
    const {
        data: attendance = [],
        isLoading,
        error,
    } = useStudentAttendance(studentId);

    if (isLoading) {
        return <div className="guardian-card monitoring-empty-state">Loading attendance...</div>;
    }

    if (error) {
        return (
            <div className="guardian-card monitoring-empty-state monitoring-empty-state-error">
                {error.message || 'Failed to load attendance.'}
            </div>
        );
    }

    return (
        <div className="guardian-card">
            <table className="guardian-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {attendance.map((entry) => (
                        <tr key={entry.id}>
                            <td>{formatDate(entry.date)}</td>
                            <td>
                                <span className={`status-badge ${String(entry.status || '').toLowerCase()}`}>
                                    {formatStatusLabel(entry.status)}
                                </span>
                            </td>
                            <td>{entry.remarks || '--'}</td>
                        </tr>
                    ))}
                    {attendance.length === 0 && (
                        <tr>
                            <td colSpan="3" className="text-center py-4">No attendance data found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const BehaviorTab = () => {
    const behavior = useMemo(
        () => [
            { id: 1, date: '2023-10-01', type: 'positive', comment: 'Helped a classmate with their work.' },
            { id: 2, date: '2023-09-25', type: 'negative', comment: 'Talking during class session.' },
        ],
        []
    );

    return (
        <div className="guardian-card behavior-tab-card">
            <div className="behavior-list">
                {behavior.map((entry) => (
                    <div key={entry.id} className="behavior-list-item">
                        <div className="behavior-list-meta">
                            <span>{formatDate(entry.date)}</span>
                            <span className={`status-badge ${entry.type}`}>
                                {entry.type === 'positive' ? 'Positive' : 'Negative'}
                            </span>
                        </div>
                        <p className="behavior-list-comment">{entry.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MonitoringTabs = ({ activeTab, onTabChange, studentId }) => {
    return (
        <>
            <div className="tabs-header monitoring-tabs-header">
                {TAB_OPTIONS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'academic' && <AcademicOverviewTab studentId={studentId} />}
            {activeTab === 'assessments' && <AssessmentsListTab studentId={studentId} />}
            {activeTab === 'attendance' && <AttendanceListTab studentId={studentId} />}
            {activeTab === 'behavior' && <BehaviorTab />}
        </>
    );
};

export default MonitoringTabs;
