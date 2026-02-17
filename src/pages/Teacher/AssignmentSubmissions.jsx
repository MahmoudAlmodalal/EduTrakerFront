import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useGradeAssignmentSubmissionMutation,
    usePublishAssignmentGradesMutation,
    useTeacherAssignmentSubmissions
} from '../../hooks/useTeacherQueries';
import './Teacher.css';

const formatDateTime = (value) => {
    if (!value) {
        return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return date.toLocaleString();
};

const AssignmentSubmissions = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const assignmentId = Number(id);

    const [selectedRow, setSelectedRow] = useState(null);
    const [score, setScore] = useState('');
    const [feedback, setFeedback] = useState('');

    const {
        data,
        isLoading,
        isError
    } = useTeacherAssignmentSubmissions(assignmentId, {
        enabled: Number.isFinite(assignmentId) && assignmentId > 0
    });

    const gradeMutation = useGradeAssignmentSubmissionMutation();
    const publishMutation = usePublishAssignmentGradesMutation();

    const assignment = data?.assignment || null;
    const students = data?.students || [];
    const submittedCount = data?.submitted_count ?? 0;
    const totalStudents = data?.total_students ?? 0;

    const published = Boolean(assignment?.is_grades_published);

    const tableRows = useMemo(() => students.map((row) => ({
        ...row,
        statusLabel: row.status === 'not_submitted'
            ? 'Not submitted'
            : row.status.charAt(0).toUpperCase() + row.status.slice(1)
    })), [students]);

    const openGradeModal = (row) => {
        if (!row?.submission_id) {
            toast.error('No submission file found for this student.');
            return;
        }
        setSelectedRow(row);
        setScore(row.score ?? '');
        setFeedback(row.feedback ?? '');
    };

    const closeGradeModal = () => {
        setSelectedRow(null);
        setScore('');
        setFeedback('');
    };

    const handleSaveGrade = async (event) => {
        event.preventDefault();
        if (!selectedRow?.submission_id) {
            return;
        }
        if (score === '' || score === null) {
            toast.error('Score is required.');
            return;
        }

        try {
            await gradeMutation.mutateAsync({
                assignmentId,
                submissionId: selectedRow.submission_id,
                payload: {
                    score: Number(score),
                    feedback: feedback || ''
                }
            });
            toast.success('Grade saved.');
            closeGradeModal();
        } catch (error) {
            toast.error(error?.message || 'Failed to save grade.');
        }
    };

    const togglePublishGrades = async () => {
        try {
            await publishMutation.mutateAsync({
                assignmentId,
                is_grades_published: !published
            });
            toast.success(!published ? 'Grades published to all students.' : 'Grades hidden from students.');
        } catch (error) {
            toast.error(error?.message || 'Failed to update grade visibility.');
        }
    };

    return (
        <div className="teacher-page">
            <div className="teacher-header">
                <div>
                    <button
                        type="button"
                        className="icon-btn"
                        style={{ width: 'auto', padding: '0.4rem 0.7rem', marginBottom: '0.55rem' }}
                        onClick={() => navigate('/teacher/assessments')}
                    >
                        <ArrowLeft size={14} />
                        Back
                    </button>
                    <h1 className="teacher-title">{assignment?.title || 'Assignment Submissions'}</h1>
                    <p className="teacher-subtitle">
                        {assignment?.assignment_type || 'Assignment'} • Due {formatDateTime(assignment?.due_date)} • Full Mark {assignment?.full_mark || '—'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <span
                        style={{
                            alignSelf: 'center',
                            borderRadius: '999px',
                            padding: '0.25rem 0.65rem',
                            background: '#e2e8f0',
                            color: '#1e293b',
                            fontSize: '0.78rem',
                            fontWeight: 700
                        }}
                    >
                        Submitted: {submittedCount} / {totalStudents}
                    </span>
                    {assignment?.attachment_file_url && (
                        <a
                            href={assignment.attachment_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="icon-btn"
                            style={{ width: 'auto', padding: '0.45rem 0.75rem', textDecoration: 'none' }}
                        >
                            Download HW
                        </a>
                    )}
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={togglePublishGrades}
                        disabled={publishMutation.isPending}
                    >
                        {published ? <EyeOff size={15} /> : <Eye size={15} />}
                        {published ? 'Hide Grades' : 'Publish Grades'}
                    </button>
                </div>
            </div>

            <div className="management-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="teacher-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Submitted</th>
                                <th>File</th>
                                <th>Late?</th>
                                <th>Score</th>
                                <th>Feedback</th>
                                <th>Visible</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" style={{ padding: '1.2rem', color: 'var(--color-text-muted)' }}>
                                        Loading submissions...
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan="8" style={{ padding: '1.2rem', color: 'var(--color-danger)' }}>
                                        Failed to load submissions.
                                    </td>
                                </tr>
                            ) : tableRows.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ padding: '1.2rem', color: 'var(--color-text-muted)' }}>
                                        No students found for this assignment class.
                                    </td>
                                </tr>
                            ) : tableRows.map((row) => (
                                <tr key={row.student_id}>
                                    <td>{row.student_name}</td>
                                    <td>{row.submitted_at ? formatDateTime(row.submitted_at) : 'Not submitted'}</td>
                                    <td>
                                        {row.submission_file_url ? (
                                            <a href={row.submission_file_url} target="_blank" rel="noreferrer">
                                                {row.submission_file_name || 'Download'}
                                            </a>
                                        ) : '—'}
                                    </td>
                                    <td>{row.submitted_at ? (row.is_late ? 'Yes' : 'No') : '—'}</td>
                                    <td>{row.score ? `${row.score}/${row.max_score}` : '—'}</td>
                                    <td>{row.feedback || '—'}</td>
                                    <td>{row.is_grade_visible ? 'Yes' : 'No'}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="icon-btn"
                                            onClick={() => openGradeModal(row)}
                                            disabled={!row.submission_id}
                                            title={row.submission_id ? 'Edit grade' : 'No submission yet'}
                                        >
                                            <Save size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRow && (
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
                    onClick={closeGradeModal}
                >
                    <div
                        className="management-card"
                        style={{ width: '520px', maxWidth: '100%', padding: '1rem 1.2rem' }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Grade Submission</h3>
                            <button type="button" className="icon-btn" onClick={closeGradeModal}>
                                <X size={14} />
                            </button>
                        </div>

                        <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            {selectedRow.student_name}
                        </p>

                        <form onSubmit={handleSaveGrade} style={{ marginTop: '0.8rem', display: 'grid', gap: '0.7rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Score
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={assignment?.full_mark || 100}
                                    value={score}
                                    onChange={(event) => setScore(event.target.value)}
                                    required
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.82rem' }}>
                                    Feedback
                                </label>
                                <textarea
                                    rows={4}
                                    value={feedback}
                                    onChange={(event) => setFeedback(event.target.value)}
                                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: '0.55rem', padding: '0.55rem 0.65rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem' }}>
                                <button type="button" className="icon-btn" style={{ width: 'auto', padding: '0.45rem 0.8rem' }} onClick={closeGradeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={gradeMutation.isPending}>
                                    <Save size={14} />
                                    Save Grade
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentSubmissions;
