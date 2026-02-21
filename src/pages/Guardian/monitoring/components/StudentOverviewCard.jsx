import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useStudentAttendance } from '../hooks/useStudentAttendance';
import { todayIsoDate } from '../../../../utils/helpers';

const toText = (value, fallback = 'Not assigned yet') => {
    const normalized = typeof value === 'string' ? value.trim() : value;
    return normalized ? normalized : fallback;
};

const normalizeAttendanceStatus = (status) => String(status || '').toLowerCase().trim();

const resolveTodayAttendance = ({ attendance = [], classroomName = '' }) => {
    const today = todayIsoDate();
    const classroomNormalized = String(classroomName || '').trim().toLowerCase();

    const todayRecords = attendance.filter((entry) => {
        const dateValue = String(entry?.date || '').slice(0, 10);
        return dateValue === today;
    });

    if (todayRecords.length === 0) {
        return { label: 'Not recorded yet', tone: 'pending' };
    }

    const matchingClassroomRecords = classroomNormalized
        ? todayRecords.filter(
            (entry) => String(entry?.classroom_name || '').trim().toLowerCase() === classroomNormalized
        )
        : [];
    const records = matchingClassroomRecords.length > 0 ? matchingClassroomRecords : todayRecords;
    const statuses = records.map((entry) => normalizeAttendanceStatus(entry?.status));

    if (statuses.some((status) => ['present', 'late', 'excused'].includes(status))) {
        return { label: 'Present', tone: 'present' };
    }

    if (statuses.every((status) => status === 'absent')) {
        return { label: 'Absent', tone: 'absent' };
    }

    const primaryStatus = statuses[0];
    if (!primaryStatus) {
        return { label: 'Not recorded yet', tone: 'pending' };
    }

    return {
        label: primaryStatus.charAt(0).toUpperCase() + primaryStatus.slice(1),
        tone: 'pending',
    };
};

const ATTENDANCE_STATUS_COLOR = {
    present: '#16a34a',
    absent: '#dc2626',
    pending: '#64748b',
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
        data: attendance = [],
        isLoading: attendanceLoading,
        error: attendanceError,
    } = useStudentAttendance(studentId);

    const studentName = toText(student?.student_name, 'Student');
    const classroomName = toText(student?.classroom_name);
    const homeroomTeacherName = toText(student?.homeroom_teacher_name);

    const todayAttendance = useMemo(
        () => resolveTodayAttendance({ attendance, classroomName }),
        [attendance, classroomName]
    );
    const hasError = Boolean(attendanceError);

    return (
        <div className="guardian-card student-overview-card">
            <div className="student-overview-header">
                <div>
                    <h2 className="student-overview-name">
                        {studentName}
                    </h2>
                    <p className="student-overview-meta">
                        Student classroom & attendance summary
                    </p>
                </div>
            </div>

            {hasError && (
                <div className="monitoring-inline-error">
                    <AlertCircle size={16} />
                    <span>{attendanceError?.message || 'Failed to load student summary.'}</span>
                </div>
            )}

            <div className="student-overview-stats">
                <StatItem
                    label="Student Name"
                    value={studentName}
                />
                <StatItem
                    label="Classroom"
                    value={classroomName}
                />
                <StatItem
                    label="Homeroom Teacher"
                    value={homeroomTeacherName}
                />
                <StatItem
                    label="Today's Attendance"
                    value={todayAttendance.label}
                    loading={attendanceLoading}
                    accentColor={ATTENDANCE_STATUS_COLOR[todayAttendance.tone]}
                />
            </div>
        </div>
    );
};

export default StudentOverviewCard;
