import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Clock, Search, TriangleAlert, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import {
    useRecordBulkAttendanceMutation,
    useTeacherAllocations,
    useTeacherAttendance,
    useTeacherStudents
} from '../../hooks/useTeacherQueries';
import teacherService from '../../services/teacherService';
import { toList, todayIsoDate } from '../../utils/helpers';
import './Teacher.css';

const attendanceStatusOptions = [
    { value: 'present', label: 'Present', color: '#16a34a', bg: '#dcfce7', icon: Check },
    { value: 'absent', label: 'Absent', color: '#dc2626', bg: '#fee2e2', icon: TriangleAlert },
    { value: 'late', label: 'Late', color: '#b45309', bg: '#fef3c7', icon: Clock }
];

const ClassManagement = () => {
    const { t } = useTheme();

    const [selectedAllocationId, setSelectedAllocationId] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(todayIsoDate());
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [attendanceOverrides, setAttendanceOverrides] = useState({});
    const [studentCounts, setStudentCounts] = useState({});
    const [loadingCounts, setLoadingCounts] = useState(false);

    const {
        data: allocationsData,
        isLoading: loadingAllocations
    } = useTeacherAllocations();

    const allocations = useMemo(() => toList(allocationsData), [allocationsData]);

    useEffect(() => {
        if (!selectedAllocationId && allocations.length > 0) {
            setSelectedAllocationId(String(allocations[0].id));
        }
    }, [allocations, selectedAllocationId]);

    useEffect(() => {
        let ignore = false;

        const fetchStudentCounts = async () => {
            const classroomIds = [...new Set(
                allocations
                    .map((allocation) => allocation.class_room_id)
                    .filter(Boolean)
            )];

            if (classroomIds.length === 0) {
                setStudentCounts({});
                return;
            }

            setLoadingCounts(true);
            try {
                const countPairs = await Promise.all(
                    classroomIds.map(async (classroomId) => {
                        try {
                            const response = await teacherService.getStudents({
                                classroom_id: classroomId,
                                current_status: 'active',
                                page_size: 200
                            });
                            return [classroomId, toList(response).length];
                        } catch {
                            return [classroomId, 0];
                        }
                    })
                );

                if (!ignore) {
                    setStudentCounts(Object.fromEntries(countPairs));
                }
            } finally {
                if (!ignore) {
                    setLoadingCounts(false);
                }
            }
        };

        fetchStudentCounts();

        return () => {
            ignore = true;
        };
    }, [allocations]);

    const selectedAllocation = useMemo(
        () => allocations.find((allocation) => String(allocation.id) === String(selectedAllocationId)),
        [allocations, selectedAllocationId]
    );

    const studentFilters = useMemo(() => {
        if (!selectedAllocation?.class_room_id) {
            return null;
        }

        return {
            classroom_id: selectedAllocation.class_room_id,
            current_status: 'active',
            page_size: 200
        };
    }, [selectedAllocation?.class_room_id]);

    const {
        data: studentsData,
        isLoading: loadingStudents
    } = useTeacherStudents(studentFilters || {}, {
        enabled: Boolean(studentFilters)
    });

    const {
        data: attendanceData,
        isLoading: loadingAttendance
    } = useTeacherAttendance(selectedAllocationId, attendanceDate, {
        enabled: Boolean(selectedAllocationId && attendanceDate)
    });

    const recordAttendanceMutation = useRecordBulkAttendanceMutation();

    const students = useMemo(() => toList(studentsData), [studentsData]);

    const attendanceByStudentId = useMemo(() => {
        const map = {};
        toList(attendanceData).forEach((record) => {
            map[record.student_id] = (record.status || '').toLowerCase();
        });
        return map;
    }, [attendanceData]);

    const overrideKey = useMemo(
        () => `${selectedAllocationId || 'none'}:${attendanceDate}`,
        [attendanceDate, selectedAllocationId]
    );

    const currentOverrides = useMemo(
        () => attendanceOverrides[overrideKey] || {},
        [attendanceOverrides, overrideKey]
    );

    const mergedStudentRows = useMemo(
        () => students.map((student) => {
            const studentId = student.user_id || student.id;
            return {
                ...student,
                studentId,
                attendanceStatus: currentOverrides[studentId]
                    || attendanceByStudentId[studentId]
                    || ''
            };
        }),
        [attendanceByStudentId, currentOverrides, students]
    );

    const filteredStudents = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return mergedStudentRows.filter((row) => {
            const matchesSearch = !query || (row.full_name || '').toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'all'
                || (statusFilter === 'unmarked' && !row.attendanceStatus)
                || row.attendanceStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [mergedStudentRows, searchText, statusFilter]);

    const handleSetStatus = useCallback((studentId, status) => {
        setAttendanceOverrides((previous) => ({
            ...previous,
            [overrideKey]: {
                ...(previous[overrideKey] || {}),
                [studentId]: status
            }
        }));
    }, [overrideKey]);

    const handleSaveAttendance = useCallback(async () => {
        if (!selectedAllocationId) {
            return;
        }

        const records = mergedStudentRows
            .filter((row) => row.attendanceStatus)
            .map((row) => ({
                student_id: row.studentId,
                course_allocation_id: Number(selectedAllocationId),
                date: attendanceDate,
                status: row.attendanceStatus
            }));

        if (records.length === 0) {
            toast.error('No attendance statuses selected.');
            return;
        }

        try {
            await recordAttendanceMutation.mutateAsync(records);
            setAttendanceOverrides((previous) => ({
                ...previous,
                [overrideKey]: {}
            }));
            toast.success('Attendance saved successfully.');
        } catch (error) {
            toast.error(error?.message || 'Failed to save attendance.');
        }
    }, [attendanceDate, mergedStudentRows, overrideKey, recordAttendanceMutation, selectedAllocationId]);

    return (
        <div className="teacher-page">
            <div className="teacher-header">
                <div>
                    <h1 className="teacher-title">{t('teacher.classes.title') || 'Class Management'}</h1>
                    <p className="teacher-subtitle">
                        View class allocations and record student attendance by class and date.
                    </p>
                </div>
            </div>

            <div className="management-card" style={{ padding: '1rem 1.25rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.85rem', fontSize: '1rem' }}>My Allocated Classes</h3>

                {loadingAllocations ? (
                    <div style={{ color: 'var(--color-text-muted)' }}>Loading classes...</div>
                ) : allocations.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)' }}>No active class allocations found.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.75rem' }}>
                        {allocations.map((allocation) => {
                            const selected = String(allocation.id) === String(selectedAllocationId);
                            const count = studentCounts[allocation.class_room_id];

                            return (
                                <button
                                    key={allocation.id}
                                    type="button"
                                    onClick={() => setSelectedAllocationId(String(allocation.id))}
                                    style={{
                                        border: selected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        borderRadius: '0.85rem',
                                        background: selected ? 'rgba(var(--color-primary-rgb), 0.06)' : '#fff',
                                        padding: '0.85rem 0.95rem',
                                        textAlign: 'left',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                                            {allocation.course_name || allocation.subject || 'Subject'}
                                        </h4>
                                        <span
                                            style={{
                                                fontSize: '0.72rem',
                                                borderRadius: '999px',
                                                padding: '0.2rem 0.5rem',
                                                background: '#e0f2fe',
                                                color: '#075985',
                                                fontWeight: 700,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {loadingCounts ? '...' : `${count ?? 0} students`}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
                                        {allocation.classroom_name || allocation.class || 'Classroom'}
                                    </p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                        Slot: {allocation.time || allocation.time_slot || 'TBD'}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedAllocation && (
                <div className="management-card" style={{ overflow: 'hidden' }}>
                    <div
                        style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.75rem',
                            flexWrap: 'wrap'
                        }}
                    >
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>
                                Attendance Recording
                            </h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                {selectedAllocation.course_name || selectedAllocation.subject} • {selectedAllocation.classroom_name || selectedAllocation.class}
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                            <label style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Date</label>
                            <input
                                type="date"
                                value={attendanceDate}
                                onChange={(event) => setAttendanceDate(event.target.value)}
                                style={{
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0.55rem',
                                    padding: '0.45rem 0.6rem',
                                    fontSize: '0.85rem'
                                }}
                            />

                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleSaveAttendance}
                                disabled={recordAttendanceMutation.isPending}
                                style={{ opacity: recordAttendanceMutation.isPending ? 0.7 : 1 }}
                            >
                                {recordAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
                            <Search
                                size={16}
                                style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-text-muted)'
                                }}
                            />
                            <input
                                type="text"
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search students"
                                style={{
                                    width: '100%',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0.55rem',
                                    padding: '0.5rem 0.65rem 0.5rem 2rem',
                                    fontSize: '0.85rem'
                                }}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: '0.55rem',
                                padding: '0.5rem 0.65rem',
                                fontSize: '0.85rem'
                            }}
                        >
                            <option value="all">All statuses</option>
                            <option value="unmarked">Unmarked</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                    </div>

                    <div style={{ maxHeight: '540px', overflowY: 'auto' }}>
                        {loadingStudents || loadingAttendance ? (
                            <div style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>
                                Loading students...
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div style={{ padding: '2rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                                <Users size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p style={{ margin: 0 }}>No students found for this class/date.</p>
                            </div>
                        ) : (
                            filteredStudents.map((student) => (
                                <div
                                    key={student.studentId}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(180px, 1fr) minmax(220px, 340px)',
                                        alignItems: 'center',
                                        gap: '0.85rem',
                                        padding: '0.75rem 1.25rem',
                                        borderBottom: '1px solid var(--color-border)'
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                                            {student.full_name || 'Student'}
                                        </div>
                                        <div style={{ marginTop: '2px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                            ID: {student.studentId}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        {attendanceStatusOptions.map((option) => {
                                            const active = student.attendanceStatus === option.value;
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleSetStatus(student.studentId, option.value)}
                                                    style={{
                                                        border: active ? `1px solid ${option.color}` : '1px solid var(--color-border)',
                                                        background: active ? option.bg : '#fff',
                                                        color: active ? option.color : 'var(--color-text-muted)',
                                                        borderRadius: '999px',
                                                        padding: '0.3rem 0.65rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Icon size={13} />
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManagement;
