import React from 'react';
import { AlertTriangle, ClipboardList, GraduationCap, UserCheck } from 'lucide-react';
import AcademicOverviewTab from './tabs/AcademicOverviewTab';
import { useStudentAssessments } from '../hooks/useStudentAssessments';
import { useStudentAttendance } from '../hooks/useStudentAttendance';
import { useStudentBehavior } from '../hooks/useStudentBehavior';
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

const formatSubmissionStatusLabel = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (['submitted', 'late', 'graded', 'pending'].includes(normalized)) {
        return 'Submitted';
    }
    if (normalized === 'not_submitted') {
        return 'Not Submitted';
    }
    return '--';
};

const getSubmissionStatusClassName = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (['submitted', 'late', 'graded', 'pending'].includes(normalized)) {
        return 'submitted';
    }
    if (normalized === 'not_submitted') {
        return 'not_submitted';
    }
    return 'pending';
};

const AssessmentsListTab = ({ studentId }) => {
    const {
        data: assessments = [],
        isLoading,
        error,
    } = useStudentAssessments(studentId);

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
                        <th>Assessment</th>
                        <th>Type</th>
                        <th>Due Date</th>
                        <th>Full Mark</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {assessments.map((entry) => {
                        const submissionStatus = entry.student_submission_status || entry.status;
                        return (
                        <tr key={entry.id}>
                            <td>{entry.course_name || '--'}</td>
                            <td>{entry.title || '--'}</td>
                            <td>{entry.exam_type_display || entry.assignment_type || entry.exam_type || '--'}</td>
                            <td>{formatDate(entry.due_date)}</td>
                            <td>
                                <span className="score-badge">{entry.full_mark ?? '--'}</span>
                            </td>
                            <td>
                                <span className={`status-badge ${getSubmissionStatusClassName(submissionStatus)}`}>
                                    {formatSubmissionStatusLabel(submissionStatus)}
                                </span>
                            </td>
                        </tr>
                        );
                    })}
                    {assessments.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center py-4">No published assessments found.</td>
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

const BehaviorTab = ({ studentId }) => {
    const {
        data: behavior = [],
        isLoading,
        isFetching,
        error,
        refetch,
    } = useStudentBehavior(studentId, { autoRefresh: true });

    if (isLoading) {
        return <div className="guardian-card monitoring-empty-state">Loading behavior notes...</div>;
    }

    if (error) {
        return (
            <div className="guardian-card monitoring-empty-state monitoring-empty-state-error">
                {error.message || 'Failed to load behavior notes.'}
            </div>
        );
    }

    if (behavior.length === 0) {
        return (
            <div className="guardian-card monitoring-empty-state">
                No behavior notes found for this student.
            </div>
        );
    }

    return (
        <div className="guardian-card behavior-tab-card">
            <div className="behavior-tab-actions">
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            <div className="behavior-list">
                {behavior.map((entry) => (
                    <div key={entry.id} className="behavior-list-item">
                        <div className="behavior-list-meta">
                            <span>{formatDate(entry.date_recorded || entry.date)}</span>
                            <span className={`status-badge ${entry.type}`}>
                                {entry.type === 'positive' ? 'Positive' : 'Negative'}
                            </span>
                        </div>
                        <p className="behavior-list-comment">{entry.message || entry.comment || '--'}</p>
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
            {activeTab === 'behavior' && <BehaviorTab studentId={studentId} />}
        </>
    );
};

export default MonitoringTabs;
