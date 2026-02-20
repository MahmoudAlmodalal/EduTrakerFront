import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useStudentMarks } from '../hooks/useStudentMarks';
import { useStudentAttendance } from '../hooks/useStudentAttendance';
import { useAttendanceStats } from '../hooks/useAttendanceStats';
import { formatDate, formatPercentage, getGpaColor } from '../utils/monitoringUtils';
import GpaProgressBar from './shared/GpaProgressBar';

const calculateOverallGpa = (marks = []) => {
    if (!Array.isArray(marks) || marks.length === 0) {
        return null;
    }

    const percentages = marks
        .map((mark) => {
            const obtained = Number(mark?.marks_obtained);
            const max = Number(mark?.max_marks);
            if (!Number.isFinite(obtained) || !Number.isFinite(max) || max <= 0) {
                return null;
            }
            return (obtained / max) * 100;
        })
        .filter((value) => Number.isFinite(value));

    if (percentages.length === 0) {
        return null;
    }

    const sum = percentages.reduce((total, value) => total + value, 0);
    return sum / percentages.length;
};

const StatItem = ({ label, value, loading = false, accentColor }) => {
    return (
        <div className="overview-stat-card">
            {loading ? (
                <div className="overview-stat-skeleton" />
            ) : (
                <>
                    <div className="overview-stat-value" style={accentColor ? { color: accentColor } : undefined}>
                        {value}
                    </div>
                    <div className="overview-stat-label">{label}</div>
                </>
            )}
        </div>
    );
};

const StudentOverviewCard = ({ studentId, student }) => {
    const {
        data: marks = [],
        isLoading: marksLoading,
        error: marksError,
    } = useStudentMarks(studentId);

    const {
        data: attendance = [],
        isLoading: attendanceLoading,
        error: attendanceError,
    } = useStudentAttendance(studentId);

    const attendanceStats = useAttendanceStats(attendance);

    const overallGpa = useMemo(() => calculateOverallGpa(marks), [marks]);

    const latestDate = useMemo(() => {
        const allDates = [
            ...marks.map((entry) => entry?.date_recorded).filter(Boolean),
            ...attendance.map((entry) => entry?.date).filter(Boolean),
        ];

        if (allDates.length === 0) {
            return null;
        }

        const latestTimestamp = allDates.reduce((max, value) => {
            const currentTime = new Date(value).getTime();
            if (Number.isNaN(currentTime)) {
                return max;
            }
            return Math.max(max, currentTime);
        }, 0);

        return latestTimestamp > 0 ? latestTimestamp : null;
    }, [attendance, marks]);

    const gpaColor = getGpaColor(overallGpa);
    const hasError = Boolean(marksError || attendanceError);

    return (
        <div className="guardian-card student-overview-card">
            <div className="student-overview-header">
                <div>
                    <h2 className="student-overview-name">
                        {student?.student_name || 'Student Overview'}
                    </h2>
                    <p className="student-overview-meta">
                        {student?.grade || student?.grade_name || student?.class_name || student?.classroom_name || 'Academic snapshot'}
                    </p>
                </div>
                {latestDate && (
                    <div className="student-overview-updated">
                        Last updated: {formatDate(latestDate)}
                    </div>
                )}
            </div>

            {hasError && (
                <div className="monitoring-inline-error">
                    <AlertCircle size={16} />
                    <span>{(marksError || attendanceError)?.message || 'Failed to load student summary.'}</span>
                </div>
            )}

            <div className="student-overview-stats">
                <StatItem
                    label="Overall GPA"
                    value={formatPercentage(overallGpa)}
                    loading={marksLoading}
                    accentColor={gpaColor}
                />
                <StatItem
                    label="Attendance Rate"
                    value={formatPercentage(attendanceStats.rate)}
                    loading={attendanceLoading}
                />
                <StatItem
                    label="Absent Days"
                    value={attendanceStats.absent}
                    loading={attendanceLoading}
                />
                <StatItem
                    label="Assessments"
                    value={marks.length}
                    loading={marksLoading}
                />
            </div>

            <GpaProgressBar value={overallGpa || 0} color={gpaColor} showLabel />
        </div>
    );
};

export default StudentOverviewCard;
