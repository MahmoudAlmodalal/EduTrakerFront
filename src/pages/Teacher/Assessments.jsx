import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronRight,
    Check,
    FileUp,
    Pencil,
    Plus,
    Save,
    Search,
    Trash2,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import {
    useBulkImportTeacherMarksMutation,
    useCreateTeacherAssignmentMutation,
    useDeactivateTeacherAssignmentMutation,
    useRecordTeacherMarkMutation,
    useTeacherAllocations,
    useTeacherAssignments,
    useTeacherMarks,
    useTeacherStudents,
    useUpdateTeacherAssignmentMutation
} from '../../hooks/useTeacherQueries';
import teacherService from '../../services/teacherService';
import { toList } from '../../utils/helpers';
import './Teacher.css';

const emptyForm = {
    title: '',
    description: '',
    allocationId: '',
    dueDate: '',
    maxMarks: '',
    type: 'assignment',
    attachmentFile: null,
    existingAttachmentUrl: null
};

const assessmentTypes = [
    'homework',
    'quiz',
    'midterm',
    'final',
    'project',
    'participation',
    'assignment'
];

const toDateTimeLocal = (value) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (num) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoFromLocal = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
};

const getAssignmentStatus = (assignment) => {
    if (assignment?.is_active === false) {
        return 'inactive';
    }

    if (assignment?.due_date) {
        const dueDate = new Date(assignment.due_date);
        if (!Number.isNaN(dueDate.getTime()) && dueDate < new Date()) {
            return 'overdue';
        }
    }

    return 'active';
};

const statusBadgeStyles = {
    active: { background: '#dcfce7', color: '#166534', label: 'Active' },
    overdue: { background: '#fee2e2', color: '#991b1b', label: 'Overdue' },
    inactive: { background: '#e2e8f0', color: '#334155', label: 'Inactive' }
};

const Assessments = () => {
    const { t } = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [allocationFilter, setAllocationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchText, setSearchText] = useState('');

    const [assignmentDetails, setAssignmentDetails] = useState({});
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [assignmentForm, setAssignmentForm] = useState(emptyForm);
    const [allocationSearch, setAllocationSearch] = useState('');

    const [markingAssignment, setMarkingAssignment] = useState(null);
    const [markDrafts, setMarkDrafts] = useState({});
    const [bulkFile, setBulkFile] = useState(null);
    const [savingMarkStudentId, setSavingMarkStudentId] = useState(null);

    const {
        data: allocationsData,
        isLoading: loadingAllocations
    } = useTeacherAllocations();

    const {
        data: assignmentsData,
        isLoading: loadingAssignments
    } = useTeacherAssignments({ include_inactive: true, page, page_size: pageSize });

    const allocations = useMemo(() => toList(allocationsData), [allocationsData]);
    const assignments = useMemo(() => toList(assignmentsData), [assignmentsData]);
    const totalAssignmentsCount = Number(assignmentsData?.count || assignments.length || 0);
    const totalPages = Math.max(1, Math.ceil(totalAssignmentsCount / pageSize));

    const createAssignmentMutation = useCreateTeacherAssignmentMutation();
    const updateAssignmentMutation = useUpdateTeacherAssignmentMutation();
    const deactivateAssignmentMutation = useDeactivateTeacherAssignmentMutation();

    const recordMarkMutation = useRecordTeacherMarkMutation();
    const bulkImportMarksMutation = useBulkImportTeacherMarksMutation();

    useEffect(() => {
        const requestedTab = searchParams.get('tab');
        if (requestedTab === 'create') {
            setShowAssignmentModal(true);
            setEditingAssignment(null);
            setAssignmentForm(emptyForm);
        }
    }, [searchParams]);

    useEffect(() => {
        let ignore = false;

        const hydrateMissingAssignmentDetails = async () => {
            const missingIds = assignments
                .filter((assignment) => {
                    const hasAllocation = assignment?.course_allocation || assignment?.course_allocation_id;
                    return !hasAllocation && !assignmentDetails[assignment.id];
                })
                .map((assignment) => assignment.id);

            if (missingIds.length === 0) {
                return;
            }

            const detailPairs = await Promise.all(
                missingIds.map(async (assignmentId) => {
                    try {
                        const detail = await teacherService.getAssignmentDetail(assignmentId);
                        return [assignmentId, detail];
                    } catch {
                        return [assignmentId, null];
                    }
                })
            );

            if (!ignore) {
                setAssignmentDetails((previous) => ({
                    ...previous,
                    ...Object.fromEntries(detailPairs)
                }));
            }
        };

        hydrateMissingAssignmentDetails();

        return () => {
            ignore = true;
        };
    }, [assignmentDetails, assignments]);

    const getAllocationId = useCallback((assignment) => (
        assignment?.course_allocation
        || assignment?.course_allocation_id
        || assignmentDetails[assignment?.id]?.course_allocation
        || assignmentDetails[assignment?.id]?.course_allocation_id
        || ''
    ), [assignmentDetails]);

    const getAllocationLabel = useCallback((assignment) => {
        // Prefer the fields now returned directly by the serializer
        if (assignment?.classroom_name && assignment?.course_name) {
            return `${assignment.classroom_name} • ${assignment.course_name}`;
        }

        const allocationId = Number(getAllocationId(assignment));
        const allocation = allocations.find((item) => item.id === allocationId);

        if (allocation) {
            return `${allocation.classroom_name || allocation.class || 'Class'} • ${allocation.course_name || allocation.subject || 'Subject'}`;
        }

        return 'All my classes';
    }, [allocations, getAllocationId]);

    const filteredAllocations = useMemo(() => {
        const query = allocationSearch.trim().toLowerCase();
        if (!query) {
            return allocations;
        }

        return allocations.filter((allocation) => {
            const label = `${allocation.classroom_name || allocation.class || ''} ${allocation.course_name || allocation.subject || ''}`.toLowerCase();
            return label.includes(query);
        });
    }, [allocationSearch, allocations]);

    const filteredAssignments = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return assignments.filter((assignment) => {
            const status = getAssignmentStatus(assignment);
            const allocationId = String(getAllocationId(assignment) || '');

            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            const matchesAllocation = allocationFilter === 'all' || allocationId === allocationFilter;
            const matchesQuery = !query || [
                assignment.title,
                assignment.description,
                assignment.assignment_code,
                assignment.exam_type,
                assignment.assignment_type
            ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));

            return matchesStatus && matchesAllocation && matchesQuery;
        });
    }, [allocationFilter, assignments, getAllocationId, searchText, statusFilter]);

    const openCreateModal = useCallback(() => {
        setEditingAssignment(null);
        setAssignmentForm(emptyForm);
        setShowAssignmentModal(true);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('tab');
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, setSearchParams]);

    const openEditModal = useCallback((assignment) => {
        setEditingAssignment(assignment);
        setAssignmentForm({
            title: assignment.title || '',
            description: assignment.description || '',
            allocationId: String(getAllocationId(assignment) || ''),
            dueDate: toDateTimeLocal(assignment.due_date),
            maxMarks: String(assignment.full_mark || ''),
            type: assignment.assignment_type || assignment.exam_type || 'assignment',
            attachmentFile: null,
            existingAttachmentUrl: assignment.attachment_file_url || null
        });
        setShowAssignmentModal(true);
    }, [getAllocationId]);

    const closeAssignmentModal = useCallback(() => {
        setShowAssignmentModal(false);
        setEditingAssignment(null);
        setAssignmentForm(emptyForm);
    }, []);

    const handleSubmitAssignment = useCallback(async (event) => {
        event.preventDefault();

        const title = assignmentForm.title.trim();
        const fullMark = assignmentForm.maxMarks;

        if (!title || !fullMark) {
            toast.error('Title and max marks are required.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', assignmentForm.description.trim());
        formData.append('full_mark', String(Number(fullMark)));
        formData.append('exam_type', assignmentForm.type);
        formData.append('assignment_type', assignmentForm.type);

        const dueDateIso = toIsoFromLocal(assignmentForm.dueDate);
        if (dueDateIso) {
            formData.append('due_date', dueDateIso);
        }

        if (!editingAssignment) {
            if (assignmentForm.allocationId) {
                formData.append('course_allocation', String(Number(assignmentForm.allocationId)));
            }
        }

        if (assignmentForm.attachmentFile) {
            formData.append('attachment_file', assignmentForm.attachmentFile);
        }

        try {
            if (editingAssignment) {
                await updateAssignmentMutation.mutateAsync({ id: editingAssignment.id, payload: formData });
                toast.success('Assignment updated.');
            } else {
                await createAssignmentMutation.mutateAsync(formData);
                toast.success('Assignment created.');
            }
            closeAssignmentModal();
        } catch (error) {
            toast.error(error?.message || 'Failed to save assignment.');
        }
    }, [assignmentForm, closeAssignmentModal, createAssignmentMutation, editingAssignment, updateAssignmentMutation]);

    const handleDeactivateAssignment = useCallback(async (assignmentId) => {
        if (!window.confirm('Deactivate this assignment?')) {
            return;
        }

        try {
            await deactivateAssignmentMutation.mutateAsync(assignmentId);
            toast.success('Assignment deactivated.');
        } catch (error) {
            toast.error(error?.message || 'Failed to deactivate assignment.');
        }
    }, [deactivateAssignmentMutation]);

    const selectedMarkAllocation = useMemo(() => {
        if (!markingAssignment) {
            return null;
        }

        const allocationId = Number(getAllocationId(markingAssignment));
        return allocations.find((allocation) => allocation.id === allocationId) || null;
    }, [allocations, getAllocationId, markingAssignment]);

    const studentFiltersForMarking = useMemo(() => {
        if (!selectedMarkAllocation?.class_room_id) {
            return null;
        }

        return {
            classroom_id: selectedMarkAllocation.class_room_id,
            current_status: 'active',
            page_size: 200
        };
    }, [selectedMarkAllocation?.class_room_id]);

    const {
        data: markingStudentsData,
        isLoading: loadingMarkingStudents
    } = useTeacherStudents(studentFiltersForMarking || {}, {
        enabled: Boolean(studentFiltersForMarking && markingAssignment)
    });

    const {
        data: marksData,
        isLoading: loadingMarks
    } = useTeacherMarks(markingAssignment?.id, {
        enabled: Boolean(markingAssignment?.id)
    });

    const markingStudents = useMemo(() => toList(markingStudentsData), [markingStudentsData]);
    const existingMarks = useMemo(() => toList(marksData), [marksData]);

    useEffect(() => {
        if (!markingAssignment) {
            setMarkDrafts({});
            setBulkFile(null);
            return;
        }

        const initialDrafts = {};
        markingStudents.forEach((student) => {
            const studentId = student.user_id || student.id;
            const existing = existingMarks.find((mark) => Number(mark.student_id) === Number(studentId));
            initialDrafts[studentId] = {
                score: existing?.score ?? '',
                feedback: existing?.feedback ?? '',
                saved: Boolean(existing)
            };
        });
        setMarkDrafts(initialDrafts);
    }, [existingMarks, markingAssignment, markingStudents]);

    const handleChangeMarkDraft = useCallback((studentId, field, value) => {
        setMarkDrafts((previous) => ({
            ...previous,
            [studentId]: {
                ...(previous[studentId] || { score: '', feedback: '', saved: false }),
                [field]: value,
                saved: false
            }
        }));
    }, []);

    const handleSaveStudentMark = useCallback(async (studentId) => {
        const draft = markDrafts[studentId];
        if (!draft || draft.score === '' || draft.score === null) {
            toast.error('Enter a valid score first.');
            return;
        }

        try {
            setSavingMarkStudentId(studentId);
            await recordMarkMutation.mutateAsync({
                assignment_id: markingAssignment.id,
                student_id: Number(studentId),
                score: Number(draft.score),
                feedback: draft.feedback || ''
            });
            setMarkDrafts((previous) => ({
                ...previous,
                [studentId]: {
                    ...previous[studentId],
                    saved: true
                }
            }));
            toast.success('Mark saved.');
        } catch (error) {
            toast.error(error?.message || 'Failed to save mark.');
        } finally {
            setSavingMarkStudentId(null);
        }
    }, [markDrafts, markingAssignment?.id, recordMarkMutation]);

    const handleBulkUpload = useCallback(async () => {
        if (!markingAssignment?.id || !bulkFile) {
            toast.error('Select a CSV file first.');
            return;
        }

        try {
            const result = await bulkImportMarksMutation.mutateAsync({
                assignment_id: markingAssignment.id,
                file: bulkFile
            });

            if (result?.success_count !== undefined || result?.failed_count !== undefined) {
                toast.success(`Import completed: ${result.success_count || 0} success, ${result.failed_count || 0} failed.`);
            } else {
                toast.success('Bulk marks import completed.');
            }

            setBulkFile(null);
        } catch (error) {
            toast.error(error?.message || 'Bulk import failed.');
        }
    }, [bulkFile, bulkImportMarksMutation, markingAssignment?.id]);

    return (
        <div className="teacher-page">
            <div className="teacher-header">
                <div>
                    <h1 className="teacher-title">{t('teacher.assessments.title') || 'Assessments'}</h1>
                    <p className="teacher-subtitle">
                        Create and manage assignments, then record marks per student or via CSV bulk import.
                    </p>
                </div>
                <button type="button" className="btn-primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    New Assignment
                </button>
            </div>

            <div className="management-card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto auto', gap: '0.6rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
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
                            placeholder="Search assignments"
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            style={{
                                width: '100%',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0.55rem',
                                padding: '0.55rem 0.65rem 0.55rem 2rem',
                                fontSize: '0.85rem',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                            }}
                        />
                    </div>

                    <select
                        value={allocationFilter}
                        onChange={(event) => setAllocationFilter(event.target.value)}
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.55rem',
                            padding: '0.55rem 0.65rem',
                            fontSize: '0.85rem',
                            minWidth: '220px',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                        }}
                    >
                        <option value="all">All classes</option>
                        {allocations.map((allocation) => (
                            <option key={allocation.id} value={String(allocation.id)}>
                                {(allocation.classroom_name || allocation.class || 'Class')} • {(allocation.course_name || allocation.subject || 'Subject')}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: '0.55rem',
                            padding: '0.55rem 0.65rem',
                            fontSize: '0.85rem',
                            minWidth: '150px',
                            background: 'var(--color-bg-surface)',
                            color: 'var(--color-text-main)',
                        }}
                    >
                        <option value="all">All status</option>
                        <option value="active">Active</option>
                        <option value="overdue">Overdue</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="management-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="teacher-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Class</th>
                                <th>Due Date</th>
                                <th>Max Marks</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(loadingAssignments || loadingAllocations) ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '1.25rem', color: 'var(--color-text-muted)' }}>
                                        Loading assignments...
                                    </td>
                                </tr>
                            ) : filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '1.25rem', color: 'var(--color-text-muted)' }}>
                                        No assignments match your filters.
                                    </td>
                                </tr>
                            ) : filteredAssignments.map((assignment) => {
                                const status = getAssignmentStatus(assignment);
                                const badge = statusBadgeStyles[status];

                                return (
                                    <tr key={assignment.id}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{assignment.title}</div>
                                            {assignment.description && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                                                    {assignment.description}
                                                </div>
                                            )}
                                            <div style={{ marginTop: '0.4rem' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        borderRadius: '999px',
                                                        padding: '0.15rem 0.45rem',
                                                        background: '#e2e8f0',
                                                        color: '#334155',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    Submissions: {assignment.submitted_count ?? 0} / {assignment.total_students ?? 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{getAllocationLabel(assignment)}</td>
                                        <td>{assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'No due date'}</td>
                                        <td>{assignment.full_mark || '-'}</td>
                                        <td>
                                            <span
                                                style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '999px',
                                                    background: badge.background,
                                                    color: badge.color,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700
                                                }}
                                            >
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                                                <button type="button" className="icon-btn" onClick={() => openEditModal(assignment)} title="Edit">
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="icon-btn"
                                                    onClick={() => navigate(`/teacher/assignments/${assignment.id}/submissions`)}
                                                    title="View submissions"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="icon-btn"
                                                    onClick={() => setMarkingAssignment(assignment)}
                                                    title="Record marks"
                                                >
                                                    <Save size={14} />
                                                </button>
                                                {assignment.is_active !== false && (
                                                    <button
                                                        type="button"
                                                        className="icon-btn danger"
                                                        onClick={() => handleDeactivateAssignment(assignment.id)}
                                                        title="Deactivate"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderTop: '1px solid var(--color-border)'
                    }}
                >
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Page {page} of {totalPages}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            className="icon-btn"
                            style={{ width: 'auto', padding: '0.35rem 0.7rem' }}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page <= 1}
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            className="icon-btn"
                            style={{ width: 'auto', padding: '0.35rem 0.7rem' }}
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {showAssignmentModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                    onClick={closeAssignmentModal}
                >
                    <div
                        className="management-card"
                        style={{ width: '640px', maxWidth: '100%', padding: '1rem 1.25rem' }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</h3>
                            <button type="button" className="icon-btn" onClick={closeAssignmentModal}>
                                <X size={14} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitAssignment} style={{ display: 'grid', gap: '0.75rem', marginTop: '0.8rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={assignmentForm.title}
                                    onChange={(event) => setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))}
                                    required
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Description
                                </label>
                                <textarea
                                    rows={4}
                                    value={assignmentForm.description}
                                    onChange={(event) => setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Allocation
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search class/subject"
                                    value={allocationSearch}
                                    onChange={(event) => setAllocationSearch(event.target.value)}
                                    style={{ width: '100%', marginBottom: '0.45rem', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem' }}
                                />
                                <select
                                    value={assignmentForm.allocationId}
                                    onChange={(event) => setAssignmentForm((prev) => ({ ...prev, allocationId: event.target.value }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)' }}
                                >
                                    <option value="">All my classes (no specific class)</option>
                                    {filteredAllocations.map((allocation) => (
                                        <option key={allocation.id} value={String(allocation.id)}>
                                            {(allocation.classroom_name || allocation.class || 'Class')} • {(allocation.course_name || allocation.subject || 'Subject')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.55rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                        Due Date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={assignmentForm.dueDate}
                                        onChange={(event) => setAssignmentForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                                        style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                        Max Marks
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={assignmentForm.maxMarks}
                                        onChange={(event) => setAssignmentForm((prev) => ({ ...prev, maxMarks: event.target.value }))}
                                        required
                                        style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                        Type
                                    </label>
                                    <select
                                        value={assignmentForm.type}
                                        onChange={(event) => setAssignmentForm((prev) => ({ ...prev, type: event.target.value }))}
                                        style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem' }}
                                    >
                                        {assessmentTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Attachment File (optional)
                                </label>
                                {assignmentForm.existingAttachmentUrl && !assignmentForm.attachmentFile && (
                                    <div style={{ marginBottom: '0.45rem', fontSize: '0.78rem' }}>
                                        <a href={assignmentForm.existingAttachmentUrl} target="_blank" rel="noreferrer">
                                            Current attachment
                                        </a>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    onChange={(event) => setAssignmentForm((prev) => ({
                                        ...prev,
                                        attachmentFile: event.target.files?.[0] || null
                                    }))}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.5rem 0.6rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', marginTop: '0.2rem' }}>
                                <button type="button" onClick={closeAssignmentModal} className="icon-btn" style={{ width: 'auto', padding: '0.45rem 0.8rem' }}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
                                    style={{ opacity: createAssignmentMutation.isPending || updateAssignmentMutation.isPending ? 0.7 : 1 }}
                                >
                                    <Save size={15} />
                                    {editingAssignment ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {markingAssignment && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                    onClick={() => setMarkingAssignment(null)}
                >
                    <div
                        className="management-card"
                        style={{ width: '900px', maxWidth: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Record Marks</h3>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                                    {markingAssignment.title} • {getAllocationLabel(markingAssignment)}
                                </p>
                            </div>
                            <button type="button" className="icon-btn" onClick={() => setMarkingAssignment(null)}>
                                <X size={14} />
                            </button>
                        </div>

                        <div style={{ padding: '0.8rem 1.1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={(event) => setBulkFile(event.target.files?.[0] || null)}
                                style={{ fontSize: '0.8rem' }}
                            />
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleBulkUpload}
                                disabled={bulkImportMarksMutation.isPending}
                            >
                                <FileUp size={15} />
                                {bulkImportMarksMutation.isPending ? 'Importing...' : 'Bulk CSV Import'}
                            </button>
                        </div>

                        <div style={{ overflow: 'auto', flex: 1 }}>
                            <table className="teacher-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Score</th>
                                        <th>Feedback</th>
                                        <th>Status</th>
                                        <th>Save</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(loadingMarkingStudents || loadingMarks) ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '1.1rem', color: 'var(--color-text-muted)' }}>
                                                Loading students and marks...
                                            </td>
                                        </tr>
                                    ) : markingStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '1.1rem', color: 'var(--color-text-muted)' }}>
                                                No students found for this assignment allocation.
                                            </td>
                                        </tr>
                                    ) : markingStudents.map((student) => {
                                        const studentId = student.user_id || student.id;
                                        const draft = markDrafts[studentId] || { score: '', feedback: '', saved: false };
                                        const maxScore = Number(markingAssignment.full_mark || 100);

                                        return (
                                            <tr key={studentId}>
                                                <td>{student.full_name}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={maxScore}
                                                        value={draft.score}
                                                        onChange={(event) => handleChangeMarkDraft(studentId, 'score', event.target.value)}
                                                        style={{ width: '92px', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.35rem 0.5rem' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={draft.feedback}
                                                        onChange={(event) => handleChangeMarkDraft(studentId, 'feedback', event.target.value)}
                                                        style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.5rem', padding: '0.35rem 0.5rem' }}
                                                        placeholder="Optional feedback"
                                                    />
                                                </td>
                                                <td>
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '0.2rem 0.45rem',
                                                            borderRadius: '999px',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 700,
                                                            background: draft.saved ? '#dcfce7' : '#e2e8f0',
                                                            color: draft.saved ? '#166534' : '#334155'
                                                        }}
                                                    >
                                                        {draft.saved && <Check size={12} />}
                                                        {draft.saved ? 'Saved' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="icon-btn"
                                                        onClick={() => handleSaveStudentMark(studentId)}
                                                        disabled={savingMarkStudentId === studentId || draft.score === ''}
                                                        style={{ opacity: savingMarkStudentId === studentId ? 0.7 : 1 }}
                                                    >
                                                        <Save size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assessments;
