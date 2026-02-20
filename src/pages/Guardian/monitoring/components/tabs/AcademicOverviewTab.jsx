import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useStudentMarks } from '../../hooks/useStudentMarks';
import { useSubjectStats } from '../../hooks/useSubjectStats';
import SubjectStatRow from '../shared/SubjectStatRow';
import GpaProgressBar from '../shared/GpaProgressBar';
import { formatPercentage, getGpaColor } from '../../utils/monitoringUtils';

const calculateOverallAverage = (marks = []) => {
    if (!Array.isArray(marks) || marks.length === 0) {
        return null;
    }

    const percentages = marks
        .map((entry) => {
            const obtained = Number(entry?.marks_obtained);
            const max = Number(entry?.max_marks);
            if (!Number.isFinite(obtained) || !Number.isFinite(max) || max <= 0) {
                return null;
            }
            return (obtained / max) * 100;
        })
        .filter((value) => Number.isFinite(value));

    if (percentages.length === 0) {
        return null;
    }

    const total = percentages.reduce((sum, value) => sum + value, 0);
    return total / percentages.length;
};

const AcademicOverviewTab = ({ studentId }) => {
    const {
        data: marks = [],
        isLoading,
        error,
        refetch,
    } = useStudentMarks(studentId);

    const subjectStats = useSubjectStats(marks);

    const overallAverage = useMemo(() => calculateOverallAverage(marks), [marks]);
    const averageColor = getGpaColor(overallAverage);

    return (
        <div className="guardian-card academic-overview-tab">
            <div className="academic-header">
                <h3>Academic Overview</h3>
                <p className="academic-header-average">
                    Overall Average: <strong>{formatPercentage(overallAverage)}</strong>
                </p>
            </div>

            <GpaProgressBar value={overallAverage || 0} color={averageColor} showLabel />

            {error && (
                <div className="monitoring-inline-error">
                    <AlertCircle size={16} />
                    <span>{error.message || 'Failed to load marks.'}</span>
                    <button type="button" className="btn-primary btn-sm" onClick={() => refetch()}>
                        Retry
                    </button>
                </div>
            )}

            {!error && isLoading && (
                <div className="monitoring-empty-state">Loading academic performance...</div>
            )}

            {!error && !isLoading && subjectStats.length === 0 && (
                <div className="monitoring-empty-state">No marks recorded for this student yet.</div>
            )}

            {!error && !isLoading && subjectStats.length > 0 && (
                <div className="subject-stats-wrapper">
                    <div className="subject-stats-title">Performance by Subject</div>
                    <table className="guardian-table subject-stats-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Average</th>
                                <th>Best</th>
                                <th>Last</th>
                                <th>Assessments</th>
                                <th>Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjectStats.map((stat) => (
                                <SubjectStatRow key={stat.subject} stat={stat} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AcademicOverviewTab;
