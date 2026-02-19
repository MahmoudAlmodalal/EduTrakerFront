import React, { useMemo, useState, useRef } from 'react';
import { ClipboardList, FileSpreadsheet, FileText, ChevronDown, Users, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTeacherAllocations, useTeacherGradebook } from '../../hooks/useTeacherQueries';
import { toList } from '../../utils/helpers';
import './Teacher.css';

const getCellColor = (percentage) => {
    if (percentage == null) return undefined;
    if (percentage >= 80) return 'var(--color-success, #22c55e)';
    if (percentage >= 60) return 'var(--color-warning, #eab308)';
    return 'var(--color-danger, #ef4444)';
};

const getCellBg = (percentage) => {
    if (percentage == null) return undefined;
    if (percentage >= 80) return 'rgba(34,197,94,0.06)';
    if (percentage >= 60) return 'rgba(234,179,8,0.06)';
    return 'rgba(239,68,68,0.06)';
};

const typeBadgeColors = {
    homework: '#8b5cf6',
    quiz: '#3b82f6',
    midterm: '#f59e0b',
    final: '#ef4444',
    project: '#10b981',
    participation: '#6366f1',
    assignment: '#64748b',
};

const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-bg-surface)',
    color: 'var(--color-text-main)',
    fontSize: 14,
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s',
};

const Gradebook = () => {
    const { data: rawAllocations, isLoading: allocLoading } = useTeacherAllocations();
    const allocations = useMemo(() => toList(rawAllocations), [rawAllocations]);

    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const tableRef = useRef(null);

    // Build subject -> allocations map
    const subjectMap = useMemo(() => {
        const map = new Map();
        for (const a of allocations) {
            const name = a.course_name || a.course?.name || `Course ${a.course_id || a.course}`;
            if (!map.has(name)) map.set(name, []);
            map.get(name).push(a);
        }
        return map;
    }, [allocations]);

    const subjectNames = useMemo(() => [...subjectMap.keys()].sort(), [subjectMap]);

    // Classrooms for selected subject
    const classroomsForSubject = useMemo(() => {
        if (!selectedSubject || !subjectMap.has(selectedSubject)) return [];
        return subjectMap.get(selectedSubject);
    }, [selectedSubject, subjectMap]);

    // Determine which allocation IDs to fetch
    const allocationIds = useMemo(() => {
        if (!selectedSubject || !selectedClassroom) return [];
        if (selectedClassroom === 'all') {
            return classroomsForSubject.map((a) => a.id);
        }
        const id = Number(selectedClassroom);
        return id ? [id] : [];
    }, [selectedSubject, selectedClassroom, classroomsForSubject]);

    // Auto-select when subject has only one classroom
    const handleSubjectChange = (e) => {
        const value = e.target.value;
        setSelectedSubject(value);
        setSelectedClassroom('');
        if (value && subjectMap.has(value)) {
            const classrooms = subjectMap.get(value);
            if (classrooms.length === 1) {
                setSelectedClassroom(String(classrooms[0].id));
            }
        }
    };

    const handleClassroomChange = (e) => {
        setSelectedClassroom(e.target.value);
    };

    const { data: gradebookData, isLoading: gbLoading, isError } = useTeacherGradebook(allocationIds);

    const assignments = useMemo(() => toList(gradebookData?.assignments), [gradebookData]);
    const students = useMemo(() => toList(gradebookData?.students), [gradebookData]);

    // Compute class averages per assignment
    const averages = useMemo(() => {
        const avgs = {};
        for (const a of assignments) {
            let total = 0;
            let count = 0;
            for (const s of students) {
                const mark = s.marks?.[String(a.id)];
                if (mark) {
                    total += mark.score;
                    count += 1;
                }
            }
            avgs[a.id] = count > 0 ? (total / count).toFixed(1) : '-';
        }
        return avgs;
    }, [assignments, students]);

    // ------- Export helpers -------
    const buildExportData = () => {
        const headers = ['Student', 'Classroom', ...assignments.map((a) => `${a.title} (${a.full_mark})`)];
        const rows = students.map((s) => {
            const row = [s.student_name, s.classroom_name];
            for (const a of assignments) {
                const mark = s.marks?.[String(a.id)];
                row.push(mark ? `${mark.score}/${mark.max_score}` : '-');
            }
            return row;
        });
        const avgRow = ['Class Average', '', ...assignments.map((a) => {
            const val = averages[a.id];
            return val !== '-' ? `${val}/${a.full_mark}` : '-';
        })];
        rows.push(avgRow);
        return { headers, rows };
    };

    const exportCSV = () => {
        try {
            const { headers, rows } = buildExportData();
            const escape = (val) => {
                const str = String(val ?? '');
                return str.includes(',') || str.includes('"') || str.includes('\n')
                    ? `"${str.replace(/"/g, '""')}"` : str;
            };
            const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gradebook_${selectedSubject.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success('CSV exported successfully');
        } catch {
            toast.error('Failed to export CSV');
        }
    };

    const exportPDF = () => {
        try {
            const { headers, rows } = buildExportData();
            const classroomLabel = selectedClassroom === 'all' ? 'All Classrooms' : (
                classroomsForSubject.find((a) => String(a.id) === selectedClassroom)?.classroom_name || ''
            );
            const title = `Gradebook - ${selectedSubject}${classroomLabel ? ` (${classroomLabel})` : ''}`;
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast.error('Please allow popups to export PDF');
                return;
            }
            const tableHtml = `
                <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:11px;font-family:Arial,sans-serif;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            ${headers.map((h) => `<th style="text-align:left;white-space:nowrap;padding:8px 10px;">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((row, i) => {
                            const isAvg = i === rows.length - 1;
                            return `<tr style="${isAvg ? 'font-weight:bold;background:#f8fafc;' : ''}">
                                ${row.map((cell) => `<td style="padding:6px 10px;white-space:nowrap;">${cell}</td>`).join('')}
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>`;
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { font-size: 18px; margin-bottom: 4px; }
                        p { color: #64748b; font-size: 12px; margin-bottom: 16px; }
                        @media print {
                            body { margin: 10px; }
                            @page { size: landscape; margin: 10mm; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <p>Exported on ${new Date().toLocaleDateString()} &bull; ${students.length} students &bull; ${assignments.length} assignments</p>
                    ${tableHtml}
                    <script>window.onload = function(){ window.print(); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
            toast.success('PDF export ready - use the print dialog to save');
        } catch {
            toast.error('Failed to export PDF');
        }
    };

    const showTable = allocationIds.length > 0 && !gbLoading && !isError && students.length > 0;
    const showEmpty = allocationIds.length > 0 && !gbLoading && !isError && students.length === 0 && gradebookData;
    const hasMultipleClassrooms = classroomsForSubject.length > 1;

    return (
        <div className="teacher-page">
            {/* Header */}
            <div className="teacher-header" style={{ marginBottom: 24 }}>
                <div>
                    <h1 className="teacher-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ClipboardList size={26} style={{ color: 'var(--color-primary)' }} />
                        Gradebook
                    </h1>
                    <p className="teacher-subtitle">View all student marks for a subject at a glance</p>
                </div>
                {showTable && (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={exportCSV}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '9px 16px', borderRadius: 9,
                                border: '1.5px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
                        >
                            <FileSpreadsheet size={15} />
                            CSV
                        </button>
                        <button
                            onClick={exportPDF}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '9px 16px', borderRadius: 9,
                                border: '1.5px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
                        >
                            <FileText size={15} />
                            PDF
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="management-card" style={{ marginBottom: 24, padding: '20px 24px' }}>
                <div style={{
                    display: 'flex', gap: 20, alignItems: 'end',
                    flexWrap: 'wrap',
                }}>
                    {/* Subject select */}
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            marginBottom: 8, fontSize: 12, fontWeight: 600,
                            color: 'var(--color-text-muted)', textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}>
                            <BookOpen size={13} />
                            Subject
                        </label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedSubject}
                                onChange={handleSubjectChange}
                                style={selectStyle}
                            >
                                <option value="">Choose a subject...</option>
                                {subjectNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} style={{
                                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)', pointerEvents: 'none',
                            }} />
                        </div>
                    </div>

                    {/* Classroom select — only show when subject has multiple classrooms */}
                    {selectedSubject && hasMultipleClassrooms && (
                        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                            <label style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                marginBottom: 8, fontSize: 12, fontWeight: 600,
                                color: 'var(--color-text-muted)', textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                            }}>
                                <Users size={13} />
                                Classroom
                            </label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedClassroom}
                                    onChange={handleClassroomChange}
                                    style={selectStyle}
                                >
                                    <option value="">Choose a classroom...</option>
                                    <option value="all">All Classrooms ({classroomsForSubject.length})</option>
                                    {classroomsForSubject.map((a) => {
                                        const classroomName = a.classroom_name || a.class_room?.classroom_name || `Classroom ${a.class_room_id || a.class_room}`;
                                        return (
                                            <option key={a.id} value={a.id}>{classroomName}</option>
                                        );
                                    })}
                                </select>
                                <ChevronDown size={16} style={{
                                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                    color: 'var(--color-text-muted)', pointerEvents: 'none',
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Summary chips */}
                    {showTable && (
                        <div style={{
                            display: 'flex', gap: 10, alignItems: 'center',
                            padding: '8px 0', flexShrink: 0,
                        }}>
                            <span style={{
                                fontSize: 12, padding: '5px 12px', borderRadius: 20,
                                background: 'var(--color-primary)', color: '#fff',
                                fontWeight: 500, whiteSpace: 'nowrap',
                            }}>
                                {students.length} student{students.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{
                                fontSize: 12, padding: '5px 12px', borderRadius: 20,
                                background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)',
                                fontWeight: 500, whiteSpace: 'nowrap',
                            }}>
                                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading state */}
            {(allocLoading || gbLoading) && (
                <div className="management-card" style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--color-text-muted)' }}>
                    <div style={{
                        width: 32, height: 32, border: '3px solid var(--color-border)',
                        borderTopColor: 'var(--color-primary)', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 14px',
                    }} />
                    Loading gradebook...
                </div>
            )}

            {/* Error state */}
            {isError && (
                <div className="management-card" style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--color-danger, #ef4444)' }}>
                    Failed to load gradebook data. Please try again.
                </div>
            )}

            {/* Empty state */}
            {showEmpty && (
                <div className="management-card" style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--color-text-muted)' }}>
                    No students or assignments found for this selection.
                </div>
            )}

            {/* No selection prompt */}
            {!allocLoading && !gbLoading && allocationIds.length === 0 && (
                <div className="management-card" style={{
                    textAlign: 'center', padding: '60px 40px',
                    color: 'var(--color-text-muted)',
                }}>
                    <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 15, margin: 0 }}>
                        {!selectedSubject
                            ? 'Select a subject to view the gradebook.'
                            : 'Select a classroom to view marks.'}
                    </p>
                </div>
            )}

            {/* Gradebook table */}
            {showTable && (
                <div className="management-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div ref={tableRef} style={{ overflowX: 'auto' }}>
                        <table className="teacher-table" style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        position: 'sticky', left: 0, zIndex: 2,
                                        background: 'var(--color-bg-surface)', minWidth: 180,
                                        borderRight: '2px solid var(--color-border)',
                                        padding: '12px 16px', textAlign: 'left',
                                        fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
                                        color: 'var(--color-text-muted)', fontWeight: 600,
                                    }}>
                                        Student
                                    </th>
                                    {selectedClassroom === 'all' && (
                                        <th style={{
                                            position: 'sticky', left: 180, zIndex: 2,
                                            background: 'var(--color-bg-surface)', minWidth: 100,
                                            borderRight: '2px solid var(--color-border)',
                                            padding: '12px 16px', textAlign: 'left',
                                            fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em',
                                            color: 'var(--color-text-muted)', fontWeight: 600,
                                        }}>
                                            Class
                                        </th>
                                    )}
                                    {assignments.map((a) => (
                                        <th key={a.id} style={{
                                            padding: '12px 14px', textAlign: 'center',
                                            whiteSpace: 'nowrap', minWidth: 110,
                                            verticalAlign: 'bottom',
                                        }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)' }}>{a.title}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 5 }}>
                                                <span style={{
                                                    fontSize: 10, padding: '2px 7px', borderRadius: 4,
                                                    background: typeBadgeColors[a.assignment_type] || '#64748b',
                                                    color: '#fff', fontWeight: 500, textTransform: 'capitalize',
                                                    lineHeight: '16px',
                                                }}>
                                                    {a.assignment_type}
                                                </span>
                                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>/ {a.full_mark}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, idx) => (
                                    <tr key={s.student_id} style={{
                                        background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                                    }}>
                                        <td style={{
                                            position: 'sticky', left: 0, zIndex: 1,
                                            background: idx % 2 === 0 ? 'var(--color-bg-surface)' : 'var(--color-bg-surface)',
                                            borderRight: '2px solid var(--color-border)',
                                            padding: '10px 16px', fontWeight: 500, fontSize: 13,
                                            whiteSpace: 'nowrap', color: 'var(--color-text-main)',
                                        }}>
                                            {s.student_name}
                                        </td>
                                        {selectedClassroom === 'all' && (
                                            <td style={{
                                                position: 'sticky', left: 180, zIndex: 1,
                                                background: 'var(--color-bg-surface)',
                                                borderRight: '2px solid var(--color-border)',
                                                padding: '10px 16px', fontSize: 12,
                                                color: 'var(--color-text-muted)', whiteSpace: 'nowrap',
                                            }}>
                                                {s.classroom_name}
                                            </td>
                                        )}
                                        {assignments.map((a) => {
                                            const mark = s.marks?.[String(a.id)];
                                            const pct = mark?.percentage ?? (mark ? (mark.score / mark.max_score) * 100 : null);
                                            return (
                                                <td key={a.id} style={{
                                                    padding: '10px 14px', textAlign: 'center', fontSize: 13,
                                                    fontWeight: mark ? 600 : 400,
                                                    color: mark ? getCellColor(pct) : 'var(--color-text-muted)',
                                                    background: getCellBg(pct),
                                                    whiteSpace: 'nowrap',
                                                    borderBottom: '1px solid var(--color-border)',
                                                }}>
                                                    {mark ? `${mark.score}/${mark.max_score}` : '-'}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                {/* Average row */}
                                <tr>
                                    <td style={{
                                        position: 'sticky', left: 0, zIndex: 1,
                                        background: 'var(--color-bg-surface)',
                                        borderRight: '2px solid var(--color-border)',
                                        borderTop: '2px solid var(--color-border)',
                                        padding: '12px 16px', fontWeight: 700, fontSize: 13,
                                        color: 'var(--color-text-main)',
                                    }}>
                                        Class Average
                                    </td>
                                    {selectedClassroom === 'all' && (
                                        <td style={{
                                            position: 'sticky', left: 180, zIndex: 1,
                                            background: 'var(--color-bg-surface)',
                                            borderRight: '2px solid var(--color-border)',
                                            borderTop: '2px solid var(--color-border)',
                                            padding: '12px 16px',
                                        }} />
                                    )}
                                    {assignments.map((a) => {
                                        const avg = averages[a.id];
                                        const pct = avg !== '-' ? (parseFloat(avg) / a.full_mark) * 100 : null;
                                        return (
                                            <td key={a.id} style={{
                                                padding: '12px 14px', textAlign: 'center', fontSize: 13,
                                                fontWeight: 700,
                                                color: avg !== '-' ? getCellColor(pct) : 'var(--color-text-muted)',
                                                background: getCellBg(pct),
                                                borderTop: '2px solid var(--color-border)',
                                            }}>
                                                {avg !== '-' ? `${avg}/${a.full_mark}` : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gradebook;
