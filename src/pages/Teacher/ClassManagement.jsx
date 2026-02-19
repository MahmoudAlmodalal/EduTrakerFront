import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Home, Lock, Search, TriangleAlert, Users, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import {
    useRecordBulkAttendanceMutation,
    useTeacherAllocations,
    useTeacherAttendance,
    useTeacherStudents,
} from '../../hooks/useTeacherQueries';
import { toList, todayIsoDate } from '../../utils/helpers';
import './Teacher.css';

/* ─── constants ────────────────────────────────────────── */
const STATUS_OPTIONS = [
    { value: 'present', label: 'Present', color: '#16a34a', bg: '#dcfce7', icon: Check },
    { value: 'absent',  label: 'Absent',  color: '#dc2626', bg: '#fee2e2', icon: TriangleAlert },
    { value: 'late',    label: 'Late',    color: '#b45309', bg: '#fef3c7', icon: null },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]));

/* ─── Avatar initials ──────────────────────────────────── */
const Initials = ({ name }) => {
    const parts = (name || '').split(' ').filter(Boolean);
    const text = parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`
        : (parts[0]?.[0] || '?');
    return (
        <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--color-primary-light)', color: 'var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.82rem', flexShrink: 0,
        }}>
            {text.toUpperCase()}
        </div>
    );
};

/* ─── Main ─────────────────────────────────────────────── */
const ClassManagement = () => {
    const { t } = useTheme();

    const [selectedClassroomId, setSelectedClassroomId] = useState(null);
    const [attendanceDate, setAttendanceDate] = useState(todayIsoDate());
    const [searchText, setSearchText]         = useState('');
    const [statusFilter, setStatusFilter]     = useState('all');
    const [overrides, setOverrides]           = useState({});

    /* ── fetch all allocations ──────────────────────────── */
    const { data: allocationsData, isLoading: loadingAllocations } = useTeacherAllocations();
    const allAllocations = useMemo(() => toList(allocationsData), [allocationsData]);

    /* ── Deduplicate by classroom ─────────────────────────
       One card per unique classroom. Each classroom entry
       lists every subject the teacher teaches there.        */
    const classrooms = useMemo(() => {
        const map = new Map();
        allAllocations.forEach((alloc) => {
            const cid = alloc.class_room_id;
            if (!cid) return;
            if (!map.has(cid)) {
                map.set(cid, {
                    class_room_id:  cid,
                    classroom_name: alloc.classroom_name || alloc.class || '—',
                    grade_level:    alloc.grade_level || null,
                    is_homeroom:    alloc.is_homeroom === true,
                    subjects:       [],
                });
            }
            const entry = map.get(cid);
            if (alloc.is_homeroom) {
                entry.is_homeroom = true;
            }
            entry.subjects.push(alloc.course_name || alloc.subject || 'Course');
        });
        return Array.from(map.values());
    }, [allAllocations]);

    /* auto-select homeroom first, then first classroom */
    useEffect(() => {
        if (classrooms.length === 0) return;
        if (selectedClassroomId) return;               // already chosen
        const homeroom = classrooms.find((c) => c.is_homeroom);
        setSelectedClassroomId((homeroom || classrooms[0]).class_room_id);
    }, [classrooms, selectedClassroomId]);

    const selectedClassroom = useMemo(
        () => classrooms.find((c) => c.class_room_id === selectedClassroomId) || null,
        [classrooms, selectedClassroomId],
    );

    const isHomeroomSelected = selectedClassroom?.is_homeroom === true;

    /* ── fetch students for selected classroom ──────────── */
    const studentFilters = useMemo(() => {
        if (!selectedClassroomId) return null;
        return { classroom_id: selectedClassroomId, current_status: 'active', page_size: 300 };
    }, [selectedClassroomId]);

    const { data: studentsData, isLoading: loadingStudents } =
        useTeacherStudents(studentFilters || {}, { enabled: Boolean(studentFilters) });
    const students = useMemo(() => toList(studentsData), [studentsData]);

    /* ── fetch existing attendance for homeroom classroom ── */
    const { data: attendanceData, isLoading: loadingAttendance } =
        useTeacherAttendance(selectedClassroomId, attendanceDate, {
            enabled: Boolean(isHomeroomSelected && selectedClassroomId && attendanceDate),
        });

    const savedAttendance = useMemo(() => {
        const map = {};
        toList(attendanceData).forEach((rec) => {
            map[rec.student_id] = (rec.status || '').toLowerCase();
        });
        return map;
    }, [attendanceData]);

    /* ── draft overrides key ────────────────────────────── */
    const overrideKey  = `${selectedClassroomId}:${attendanceDate}`;
    const currentDraft = overrides[overrideKey] || {};

    /* merged rows */
    const mergedRows = useMemo(
        () => students.map((s) => {
            const sid = s.user_id ?? s.id;
            return { ...s, sid, status: currentDraft[sid] ?? savedAttendance[sid] ?? '' };
        }),
        [students, currentDraft, savedAttendance],
    );

    /* search + status filter */
    const filteredRows = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        return mergedRows.filter((row) => {
            const nameMatch = !q
                || (row.full_name || '').toLowerCase().startsWith(q)
                || (row.full_name || '').toLowerCase().includes(q);
            const statusMatch =
                statusFilter === 'all' ||
                (statusFilter === 'unmarked' && !row.status) ||
                row.status === statusFilter;
            return nameMatch && statusMatch;
        });
    }, [mergedRows, searchText, statusFilter]);

    /* summary */
    const summary = useMemo(() => {
        const c = { present: 0, absent: 0, late: 0, unmarked: 0 };
        mergedRows.forEach((r) => {
            if (r.status === 'present') c.present++;
            else if (r.status === 'absent') c.absent++;
            else if (r.status === 'late')   c.late++;
            else c.unmarked++;
        });
        return c;
    }, [mergedRows]);

    /* ── actions ─────────────────────────────────────────── */
    const handleSetStatus = useCallback((sid, status) => {
        setOverrides((prev) => ({
            ...prev,
            [overrideKey]: { ...(prev[overrideKey] || {}), [sid]: status },
        }));
    }, [overrideKey]);

    const handleClearStatus = useCallback((sid) => {
        setOverrides((prev) => {
            const draft = { ...(prev[overrideKey] || {}) };
            delete draft[sid];
            return { ...prev, [overrideKey]: draft };
        });
    }, [overrideKey]);

    const handleMarkAll = useCallback((status) => {
        const patch = {};
        filteredRows.forEach((r) => { patch[r.sid] = status; });
        setOverrides((prev) => ({
            ...prev,
            [overrideKey]: { ...(prev[overrideKey] || {}), ...patch },
        }));
    }, [filteredRows, overrideKey]);

    const recordMutation = useRecordBulkAttendanceMutation();

    const handleSave = useCallback(async () => {
        if (!selectedClassroomId) return;

        const records = mergedRows
            .filter((r) => r.status)
            .map((r) => ({
                student_id: r.sid,
                class_room_id: Number(selectedClassroomId),
                date: attendanceDate,
                status: r.status,
            }));

        if (records.length === 0) {
            toast.error('No attendance marked yet.');
            return;
        }

        try {
            await recordMutation.mutateAsync(records);
            setOverrides((prev) => ({ ...prev, [overrideKey]: {} }));
            toast.success(`Saved attendance for ${records.length} student(s).`);
        } catch (err) {
            toast.error(err?.message || 'Failed to save attendance.');
        }
    }, [selectedClassroomId, attendanceDate, mergedRows, overrideKey, recordMutation]);

    /* ── render ──────────────────────────────────────────── */
    const loading = loadingStudents || loadingAttendance;

    return (
        <div className="teacher-page">
            {/* Header */}
            <div className="teacher-header">
                <div>
                    <h1 className="teacher-title">
                        {t('teacher.classes.title') || 'Class Management'}
                    </h1>
                    <p className="teacher-subtitle">
                        View all your classes below. Attendance can only be recorded for your homeroom class.
                    </p>
                </div>
            </div>

            {/* ── Class cards (one per unique classroom) ────── */}
            <div className="management-card" style={{ padding: '1.1rem 1.25rem', marginBottom: '1rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <BookOpen size={17} style={{ color: 'var(--color-primary)' }} />
                    My Allocated Classes
                </h3>

                {loadingAllocations ? (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Loading classes…</div>
                ) : classrooms.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No active class allocations found.</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.7rem' }}>
                        {classrooms.map((cls) => {
                            const active = cls.class_room_id === selectedClassroomId;
                            return (
                                <button
                                    key={cls.class_room_id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedClassroomId(cls.class_room_id);
                                        setSearchText('');
                                        setStatusFilter('all');
                                    }}
                                    style={{
                                        border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        borderRadius: '0.85rem',
                                        background: active
                                            ? 'rgba(var(--color-primary-rgb, 79 70 229), 0.08)'
                                            : 'var(--color-bg-surface)',
                                        padding: '0.85rem 1rem',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'border-color .15s, background .15s',
                                        position: 'relative',
                                    }}
                                >
                                    {/* Homeroom badge */}
                                    {cls.is_homeroom && (
                                        <span style={{
                                            position: 'absolute', top: 8, right: 8,
                                            display: 'inline-flex', alignItems: 'center', gap: 3,
                                            fontSize: '0.68rem', fontWeight: 700,
                                            color: '#0f766e', background: '#ccfbf1',
                                            borderRadius: '999px', padding: '0.1rem 0.5rem',
                                        }}>
                                            <Home size={10} /> Homeroom
                                        </span>
                                    )}

                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)', marginBottom: '0.3rem', paddingRight: cls.is_homeroom ? '5rem' : 0 }}>
                                        {cls.classroom_name}
                                    </div>

                                    {cls.grade_level && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                                            {cls.grade_level}
                                        </div>
                                    )}

                                    {/* Subjects list */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem' }}>
                                        {cls.subjects.map((subj) => (
                                            <span key={subj} style={{
                                                fontSize: '0.72rem', fontWeight: 600,
                                                background: 'var(--color-bg-body)',
                                                color: 'var(--color-text-muted)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '0.4rem', padding: '0.1rem 0.4rem',
                                            }}>
                                                {subj}
                                            </span>
                                        ))}
                                    </div>

                                    {active && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.72rem', fontWeight: 700,
                                                color: 'var(--color-primary)',
                                                background: 'rgba(var(--color-primary-rgb, 79 70 229), 0.1)',
                                                borderRadius: '999px', padding: '0.15rem 0.6rem',
                                            }}>
                                                Selected
                                            </span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Attendance panel ───────────────────────────── */}
            {selectedClassroom && (
                isHomeroomSelected ? (
                    /* ── HOMEROOM → full attendance UI ──────────── */
                    <div className="management-card" style={{ overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Home size={16} style={{ color: '#0f766e' }} />
                                    Homeroom Attendance — {selectedClassroom.classroom_name}
                                </h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                    {selectedClassroom.grade_level} · {students.length} students enrolled
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                                <label style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Date</label>
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    style={{
                                        border: '1px solid var(--color-border)', borderRadius: '0.55rem',
                                        padding: '0.42rem 0.6rem', fontSize: '0.85rem',
                                        background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
                                    }}
                                />
                                <button
                                    type="button" className="btn-primary"
                                    onClick={handleSave}
                                    disabled={recordMutation.isPending}
                                    style={{ opacity: recordMutation.isPending ? 0.7 : 1 }}
                                >
                                    {recordMutation.isPending ? 'Saving…' : 'Save Attendance'}
                                </button>
                            </div>
                        </div>

                        {/* Summary chips */}
                        <div style={{
                            padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--color-border)',
                            display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center',
                        }}>
                            {[
                                { label: 'Present',  count: summary.present,  color: '#16a34a', bg: '#dcfce7' },
                                { label: 'Absent',   count: summary.absent,   color: '#dc2626', bg: '#fee2e2' },
                                { label: 'Late',     count: summary.late,     color: '#b45309', bg: '#fef3c7' },
                                { label: 'Unmarked', count: summary.unmarked, color: '#64748b', bg: 'var(--color-bg-body)' },
                            ].map(({ label, count, color, bg }) => (
                                <span key={label} style={{
                                    fontSize: '0.78rem', fontWeight: 700, color,
                                    background: bg, border: `1px solid ${color}33`,
                                    borderRadius: '999px', padding: '0.2rem 0.65rem',
                                }}>
                                    {count} {label}
                                </span>
                            ))}
                            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                {students.length} total
                            </span>
                        </div>

                        {/* Toolbar */}
                        <div style={{
                            padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--color-border)',
                            display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center',
                        }}>
                            {/* Search */}
                            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
                                <Search size={15} style={{
                                    position: 'absolute', left: 10, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
                                }} />
                                <input
                                    type="text" value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder="Search by name…"
                                    style={{
                                        width: '100%', border: '1px solid var(--color-border)',
                                        borderRadius: '0.55rem', padding: '0.45rem 0.65rem 0.45rem 2rem',
                                        fontSize: '0.85rem', background: 'var(--color-bg-surface)',
                                        color: 'var(--color-text-main)', outline: 'none',
                                    }}
                                />
                            </div>

                            {/* Status filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    border: '1px solid var(--color-border)', borderRadius: '0.55rem',
                                    padding: '0.45rem 0.65rem', fontSize: '0.85rem',
                                    background: 'var(--color-bg-surface)', color: 'var(--color-text-main)',
                                }}
                            >
                                <option value="all">All statuses</option>
                                <option value="unmarked">Unmarked</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                            </select>

                            {/* Mark-all shortcuts */}
                            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                                {[
                                    { label: 'All Present', status: 'present', color: '#16a34a', bg: '#dcfce7' },
                                    { label: 'All Absent',  status: 'absent',  color: '#dc2626', bg: '#fee2e2' },
                                ].map(({ label, status, color, bg }) => (
                                    <button key={status} type="button"
                                        onClick={() => handleMarkAll(status)}
                                        style={{
                                            fontSize: '0.78rem', fontWeight: 600,
                                            padding: '0.35rem 0.75rem', borderRadius: '0.5rem',
                                            border: `1px solid ${color}`, background: bg,
                                            color, cursor: 'pointer',
                                        }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Student rows */}
                        <div style={{ maxHeight: '560px', overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ padding: '1.5rem 1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    Loading students…
                                </div>
                            ) : filteredRows.length === 0 ? (
                                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <Users size={30} style={{ opacity: 0.25, marginBottom: '0.5rem' }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No students match your search.</p>
                                </div>
                            ) : (
                                filteredRows.map((row, idx) => {
                                    const opted = STATUS_MAP[row.status];
                                    return (
                                        <div key={row.sid} style={{
                                            display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.65rem 1.25rem',
                                            borderBottom: idx < filteredRows.length - 1 ? '1px solid var(--color-border)' : 'none',
                                            gap: '0.75rem',
                                            background: opted ? `${opted.color}08` : 'transparent',
                                            transition: 'background .12s',
                                        }}>
                                            {/* Avatar + name */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                                                <Initials name={row.full_name} />
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{
                                                        fontWeight: 600, fontSize: '0.9rem',
                                                        color: 'var(--color-text-main)',
                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    }}>
                                                        {row.full_name || 'Student'}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        ID: {row.student_id || row.sid}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status buttons */}
                                            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0, alignItems: 'center' }}>
                                                {STATUS_OPTIONS.map((opt) => {
                                                    const isActive = row.status === opt.value;
                                                    const Icon = opt.icon;
                                                    return (
                                                        <button key={opt.value} type="button"
                                                            onClick={() => handleSetStatus(row.sid, opt.value)}
                                                            style={{
                                                                border: isActive ? `1.5px solid ${opt.color}` : '1.5px solid var(--color-border)',
                                                                background: isActive ? opt.bg : 'var(--color-bg-surface)',
                                                                color: isActive ? opt.color : 'var(--color-text-muted)',
                                                                borderRadius: '0.55rem',
                                                                padding: '0.35rem 0.75rem',
                                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                                                transition: 'all .12s', minWidth: 70, justifyContent: 'center',
                                                            }}>
                                                            {Icon && <Icon size={13} />}
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}

                                                {row.status && (
                                                    <button type="button" onClick={() => handleClearStatus(row.sid)}
                                                        title="Clear"
                                                        style={{
                                                            border: '1.5px solid var(--color-border)',
                                                            background: 'var(--color-bg-surface)',
                                                            color: 'var(--color-text-muted)',
                                                            borderRadius: '0.55rem', padding: '0.35rem 0.4rem',
                                                            display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
                                                        }}>
                                                        <X size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    /* ── NOT homeroom → locked info panel ───────── */
                    <div className="management-card" style={{
                        padding: '2.5rem 1.5rem',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        textAlign: 'center', gap: '0.75rem',
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'var(--color-bg-body)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-muted)',
                        }}>
                            <Lock size={24} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                                Attendance not available here
                            </p>
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.87rem', color: 'var(--color-text-muted)', maxWidth: 380 }}>
                                You can only record attendance for your <strong>homeroom class</strong>.
                                Please select the class marked&nbsp;
                                <span style={{ color: '#0f766e', fontWeight: 700 }}>Homeroom</span> above.
                            </p>
                        </div>

                        {/* Show students of the selected class as read-only info */}
                        {students.length > 0 && (
                            <div style={{
                                marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)',
                                background: 'var(--color-bg-body)', borderRadius: '0.65rem',
                                padding: '0.65rem 1rem', border: '1px solid var(--color-border)',
                            }}>
                                <strong>{students.length}</strong> students enrolled in {selectedClassroom.classroom_name}
                            </div>
                        )}
                    </div>
                )
            )}
        </div>
    );
};

export default ClassManagement;
