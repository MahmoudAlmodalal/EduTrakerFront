import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileUp, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import studentService from '../../../services/studentService';
import { toList } from '../../../utils/helpers';
import '../../Teacher/Teacher.css';
import '../Student.css';

const statusStyles = {
    not_submitted: { label: 'Not Submitted', bg: '#e2e8f0', color: '#334155' },
    pending: { label: 'Pending', bg: '#e2e8f0', color: '#334155' },
    submitted: { label: 'Submitted', bg: '#dbeafe', color: '#1d4ed8' },
    late: { label: 'Late', bg: '#fee2e2', color: '#b91c1c' },
    graded: { label: 'Graded', bg: '#dcfce7', color: '#166534' }
};

const StudentAssignments = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [assignmentsPayload, setAssignmentsPayload] = useState({ results: [], count: 0 });

    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const pageSize = 10;

    const loadAssignments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await studentService.getAssignments({ page, page_size: pageSize });
            if (Array.isArray(response)) {
                setAssignmentsPayload({ results: response, count: response.length });
            } else {
                setAssignmentsPayload(response || { results: [], count: 0 });
            }
        } catch (loadError) {
            setError(loadError?.message || 'Failed to load assignments.');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        void loadAssignments();
    }, [loadAssignments]);

    const assignments = useMemo(() => toList(assignmentsPayload), [assignmentsPayload]);
    const totalCount = Number(assignmentsPayload?.count || assignments.length || 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const closeSubmitModal = () => {
        setSelectedAssignment(null);
        setSubmissionFile(null);
    };

    const handleSubmitAssignment = async (event) => {
        event.preventDefault();
        if (!selectedAssignment?.id || !submissionFile) {
            toast.error('Please select a file first.');
            return;
        }

        try {
            setSubmitting(true);
            await studentService.submitAssignment(selectedAssignment.id, submissionFile);
            toast.success('Submission uploaded successfully.');
            closeSubmitModal();
            await loadAssignments();
        } catch (submitError) {
            toast.error(submitError?.message || 'Failed to submit assignment.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="student-subjects">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Assignments</h1>
                    <p className="page-subtitle">Download homework, upload your file submission, and track grading status.</p>
                </div>
            </header>

            <div className="management-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="teacher-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Due Date</th>
                                <th>Type</th>
                                <th>Max Marks</th>
                                <th>Status</th>
                                <th>Submission</th>
                                <th>Grade</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ padding: '1.2rem', color: 'var(--color-text-muted)' }}>
                                        Loading assignments...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="8" style={{ padding: '1.2rem', color: 'var(--color-danger)' }}>
                                        {error}
                                    </td>
                                </tr>
                            ) : assignments.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ padding: '1.2rem', color: 'var(--color-text-muted)' }}>
                                        No assignments available.
                                    </td>
                                </tr>
                            ) : assignments.map((assignment) => {
                                const statusConfig = statusStyles[assignment.status] || statusStyles.pending;
                                return (
                                    <tr key={assignment.id}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{assignment.title}</div>
                                            {assignment.description && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {assignment.description}
                                                </div>
                                            )}
                                        </td>
                                        <td>{assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'No due date'}</td>
                                        <td>{assignment.assignment_type || 'assignment'}</td>
                                        <td>{assignment.full_mark || '—'}</td>
                                        <td>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    borderRadius: '999px',
                                                    padding: '0.2rem 0.5rem',
                                                    background: statusConfig.bg,
                                                    color: statusConfig.color,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700
                                                }}
                                            >
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td>
                                            {assignment.submission?.submission_file_name ? (
                                                <div>
                                                    <div>{assignment.submission.submission_file_name}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                                        {assignment.submission.submitted_at ? new Date(assignment.submission.submitted_at).toLocaleString() : ''}
                                                    </div>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            {assignment.is_grade_visible && assignment.grade ? (
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>
                                                        {assignment.grade.score}/{assignment.grade.max_score}
                                                        {assignment.grade.letter_grade ? ` (${assignment.grade.letter_grade})` : ''}
                                                    </div>
                                                    {assignment.grade.feedback && (
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                                            {assignment.grade.feedback}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                                                {assignment.attachment_file_url && (
                                                    <a
                                                        href={assignment.attachment_file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="icon-btn"
                                                        style={{ textDecoration: 'none' }}
                                                        title="Download assignment file"
                                                    >
                                                        <Download size={14} />
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    className="icon-btn"
                                                    onClick={() => setSelectedAssignment(assignment)}
                                                    title="Upload submission"
                                                >
                                                    <Upload size={14} />
                                                </button>
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

            {selectedAssignment && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1100,
                        padding: '1rem'
                    }}
                    onClick={closeSubmitModal}
                >
                    <div
                        className="management-card"
                        style={{ width: '520px', maxWidth: '100%', padding: '1rem 1.2rem' }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Submit Assignment</h3>
                            <button type="button" className="icon-btn" onClick={closeSubmitModal}>
                                <X size={14} />
                            </button>
                        </div>

                        <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            {selectedAssignment.title}
                        </p>

                        <form onSubmit={handleSubmitAssignment} style={{ marginTop: '0.8rem', display: 'grid', gap: '0.7rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Upload File
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    onChange={(event) => setSubmissionFile(event.target.files?.[0] || null)}
                                    required
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.5rem 0.6rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem' }}>
                                <button type="button" className="icon-btn" style={{ width: 'auto', padding: '0.45rem 0.8rem' }} onClick={closeSubmitModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting || !submissionFile}>
                                    <FileUp size={14} />
                                    {submitting ? 'Submitting...' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAssignments;
