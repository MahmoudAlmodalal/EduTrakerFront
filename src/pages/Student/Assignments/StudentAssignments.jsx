import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Download, FileUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import studentService from '../../../services/studentService';
import { toList } from '../../../utils/helpers';
import '../Student.css';

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (value) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDueLabel = (dueDate, now) => {
    if (!dueDate) {
        return 'No due date';
    }

    const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayDiff = Math.round((dueStart - nowStart) / ONE_DAY_MS);

    if (dayDiff === 0) {
        return 'Today';
    }
    if (dayDiff === 1) {
        return 'Tomorrow';
    }
    if (dayDiff > 1 && dayDiff <= 7) {
        return `In ${dayDiff} days`;
    }
    return dueDate.toLocaleDateString();
};

const buildAssignmentState = (assignment, now = new Date()) => {
    const dueDate = toDate(assignment?.due_date);
    const dueMs = dueDate?.getTime() ?? null;
    const nowMs = now.getTime();
    const graceEndsMs = dueMs !== null ? dueMs + GRACE_PERIOD_MS : null;

    const hasSubmission = Boolean(assignment?.submission?.id);
    const isGraded = assignment?.status === 'graded' || Boolean(assignment?.is_grade_visible && assignment?.grade);
    const isSubmitted = hasSubmission || assignment?.status === 'submitted' || assignment?.status === 'late';
    const inGrace = Boolean(
        dueMs !== null
        && nowMs > dueMs
        && graceEndsMs !== null
        && nowMs <= graceEndsMs
        && !hasSubmission
    );
    const isClosedNoSubmission = Boolean(
        dueMs !== null
        && graceEndsMs !== null
        && nowMs > graceEndsMs
        && !hasSubmission
    );

    const dueLabel = formatDueLabel(dueDate, now);

    let cardTone = 'default';
    let badgeLabel = '';
    if (isClosedNoSubmission) {
        cardTone = 'closed';
        badgeLabel = 'Closed';
    } else if (isSubmitted) {
        cardTone = 'submitted';
        badgeLabel = 'Submitted';
    } else if (inGrace) {
        cardTone = 'overdue';
        badgeLabel = 'Overdue';
    } else if (dueMs !== null) {
        const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
        const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const dayDiff = Math.round((dueStart - nowStart) / ONE_DAY_MS);
        if (dayDiff === 0) {
            cardTone = 'due-today';
            badgeLabel = 'Urgent';
        } else if (dayDiff === 1) {
            cardTone = 'due-tomorrow';
            badgeLabel = 'Due Tomorrow';
        } else if (dayDiff >= 2 && dayDiff <= 7) {
            cardTone = 'due-soon';
            badgeLabel = 'Upcoming';
        }
    }

    const isActiveTabItem = !isClosedNoSubmission && !isSubmitted && !isGraded;
    const isPastTabItem = isClosedNoSubmission || isSubmitted || isGraded;

    return {
        dueDate,
        dueLabel,
        cardTone,
        badgeLabel,
        hasSubmission,
        isGraded,
        isSubmitted,
        inGrace,
        isClosedNoSubmission,
        isActiveTabItem,
        isPastTabItem
    };
};

const calculateTimeLeft = (dueDateValue) => {
    const dueDate = toDate(dueDateValue);
    if (!dueDate) {
        return { totalMs: null, text: 'No due date' };
    }
    const diff = dueDate.getTime() - Date.now();
    if (diff <= 0) {
        return { totalMs: diff, text: 'Expired' };
    }

    const days = Math.floor(diff / ONE_DAY_MS);
    const hours = Math.floor((diff % ONE_DAY_MS) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    return { totalMs: diff, text: `${days}d ${hours}h ${minutes}m ${seconds}s` };
};

const compareDueDateAsc = (first, second) => {
    const firstDate = toDate(first?.due_date);
    const secondDate = toDate(second?.due_date);
    if (!firstDate && !secondDate) {
        return 0;
    }
    if (!firstDate) {
        return 1;
    }
    if (!secondDate) {
        return -1;
    }
    return firstDate.getTime() - secondDate.getTime();
};

const normalizeAssignment = (assignment = {}) => ({
    ...assignment,
    course_name: assignment.course_name || assignment.course?.name || assignment.course || 'Course',
    due_date: assignment.due_date || assignment.dueDate || null,
    full_mark: assignment.full_mark ?? assignment.fullMark ?? null,
    description: assignment.description || '',
    file_url: assignment.file_url || assignment.attachment_file_url || ''
});

const toToneBadgeClass = (tone) => {
    if (tone === 'due-today' || tone === 'overdue') {
        return 'assignment-badge-urgent';
    }
    if (tone === 'due-tomorrow' || tone === 'due-soon') {
        return 'assignment-badge-due-soon';
    }
    if (tone === 'closed') {
        return 'assignment-badge-closed';
    }
    if (tone === 'submitted') {
        return 'assignment-badge-submitted';
    }
    return 'assignment-badge-neutral';
};

const StudentAssignments = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [expandedId, setExpandedId] = useState(null);
    const [expandedDetail, setExpandedDetail] = useState(null);
    const [expandLoading, setExpandLoading] = useState(false);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ totalMs: null, text: 'No due date' });

    const {
        data,
        isLoading,
        isError,
        error,
        refetch
    } = useQuery({
        queryKey: ['student-assignments'],
        queryFn: () => studentService.getAssignments({
            ordering: 'due_date',
            page_size: 20
        }),
        staleTime: 2 * 60 * 1000
    });

    const loadDetail = useCallback(async (assignmentId) => {
        setExpandLoading(true);
        try {
            const [detail, submissionSnapshot] = await Promise.all([
                studentService.getAssignmentDetail(assignmentId),
                studentService.getAssignmentSubmission(assignmentId)
            ]);

            const merged = normalizeAssignment({
                ...detail,
                ...submissionSnapshot,
                submission: submissionSnapshot?.submission || detail?.submission,
                grade: submissionSnapshot?.grade || detail?.grade,
                is_grade_visible: submissionSnapshot?.is_grade_visible ?? detail?.is_grade_visible,
                status: submissionSnapshot?.status || detail?.status
            });

            setExpandedDetail(merged);
        } catch (detailError) {
            toast.error(detailError?.message || 'Failed to load assignment details.');
            setExpandedId(null);
            setExpandedDetail(null);
        } finally {
            setExpandLoading(false);
        }
    }, []);

    const toggleExpand = useCallback(async (assignment) => {
        const id = assignment.id;
        if (expandedId === id) {
            setExpandedId(null);
            setExpandedDetail(null);
            setSubmissionFile(null);
            return;
        }
        setExpandedId(id);
        setExpandedDetail(null);
        setSubmissionFile(null);
        await loadDetail(id);
    }, [expandedId, loadDetail]);

    useEffect(() => {
        if (!expandedDetail?.due_date) {
            setTimeLeft({ totalMs: null, text: 'No due date' });
            return undefined;
        }
        setTimeLeft(calculateTimeLeft(expandedDetail.due_date));
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft(expandedDetail.due_date));
        }, 1000);
        return () => clearInterval(interval);
    }, [expandedDetail?.due_date]);

    const assignments = useMemo(
        () => toList(data).map(normalizeAssignment).sort(compareDueDateAsc),
        [data]
    );

    const categorized = useMemo(() => {
        const now = new Date();
        const active = [];
        const past = [];

        assignments.forEach((assignment) => {
            const state = buildAssignmentState(assignment, now);
            const item = { ...assignment, _state: state };
            if (state.isPastTabItem) {
                past.push(item);
                return;
            }
            active.push(item);
        });

        return { active, past };
    }, [assignments]);

    const activeAssignments = categorized.active;
    const pastAssignments = categorized.past;
    const visibleAssignments = activeTab === 'active' ? activeAssignments : pastAssignments;

    const expandedState = useMemo(
        () => (expandedDetail ? buildAssignmentState(expandedDetail, new Date()) : null),
        [expandedDetail]
    );

    const handleRetryFetch = () => {
        void refetch();
    };

    const handleDownloadAssignment = (assignment, event) => {
        event.stopPropagation();
        const downloadUrl = assignment?.file_url || assignment?.attachment_file_url;
        if (downloadUrl) {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleSubmitAssignment = async (event) => {
        event.preventDefault();
        if (!expandedId || !submissionFile) {
            toast.error('Please select a file first.');
            return;
        }
        if (expandedState?.isClosedNoSubmission) {
            toast.error('This assignment is closed.');
            return;
        }

        try {
            setSubmitting(true);
            await studentService.submitAssignment(expandedId, submissionFile);
            toast.success('Homework submitted successfully!');
            setSubmissionFile(null);
            setActiveTab('past');
            await Promise.all([refetch(), loadDetail(expandedId)]);
        } catch (submitError) {
            toast.error(submitError?.message || 'Failed to submit assignment.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="student-assignments-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Assignments</h1>
                    <p className="page-subtitle">Track due work, read details, and submit homework from one place.</p>
                </div>
            </header>

            <div className="student-assignment-tabs tabs-bar">
                <button
                    type="button"
                    className={`student-assignment-tab ${activeTab === 'active' ? 'active tab-active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active Assignments ({activeAssignments.length})
                </button>
                <button
                    type="button"
                    className={`student-assignment-tab ${activeTab === 'past' ? 'active tab-active' : ''}`}
                    onClick={() => setActiveTab('past')}
                >
                    Past &amp; Graded ({pastAssignments.length})
                </button>
            </div>

            {isError && (
                <div className="student-assignment-error-banner" role="alert">
                    <span>{error?.message || 'Failed to load assignments.'}</span>
                    <button type="button" onClick={handleRetryFetch}>Retry</button>
                </div>
            )}

            <div className="student-assignment-list">
                {isLoading && (
                    <div className="student-assignment-skeleton-grid">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={`assignment-skeleton-${index}`} className="student-assignment-skeleton-card" />
                        ))}
                    </div>
                )}

                {!isLoading && !isError && visibleAssignments.length === 0 && activeTab === 'active' && (
                    <div className="student-assignments-empty">
                        <div className="student-assignments-empty-icon">Books</div>
                        <p>No active assignments</p>
                        <span>Check back when your teachers post new work.</span>
                    </div>
                )}

                {!isLoading && !isError && visibleAssignments.length === 0 && activeTab === 'past' && (
                    <div className="empty-state">No past assignments</div>
                )}

                {!isLoading && !isError && visibleAssignments.map((assignment) => {
                    const state = assignment._state;
                    const isExpanded = expandedId === assignment.id;
                    return (
                        <React.Fragment key={assignment.id}>
                            <article
                                className={`student-assignment-card assignment-card status-${state.cardTone} ${state.isClosedNoSubmission ? 'is-closed' : ''} ${isExpanded ? 'sa-card-expanded' : ''}`}
                            >
                                <div className="student-assignment-card-header">
                                    <div className="student-assignment-title-wrap">
                                        {state.badgeLabel && (
                                            <span className={`student-assignment-badge ${toToneBadgeClass(state.cardTone)}`}>
                                                {state.badgeLabel.toUpperCase()}
                                            </span>
                                        )}
                                        <h3>{assignment.title}</h3>
                                    </div>
                                    <div className="student-assignment-due">
                                        <span>Due: {state.dueLabel}</span>
                                    </div>
                                </div>

                                <div className="student-assignment-meta">
                                    <span>{assignment.course_name || 'Course'}</span>
                                    <span>{assignment.classroom_name || 'Classroom'}</span>
                                    <span>Full mark: {assignment.full_mark || '—'}</span>
                                </div>

                                <div className="student-assignment-status-row">
                                    <span className="status-text">
                                        Status: {state.isGraded ? 'Graded' : state.isSubmitted ? 'Submitted' : 'Not Submitted'}
                                    </span>
                                    {assignment.is_grade_visible && assignment.grade && (
                                        <span className="student-assignment-grade-chip">
                                            Grade: {assignment.grade.score}/{assignment.grade.max_score}
                                        </span>
                                    )}
                                </div>

                                {state.inGrace && (
                                    <p className="student-assignment-warning">
                                        OVERDUE - submit before cutoff.
                                    </p>
                                )}

                                <div className="student-assignment-actions">
                                    {(assignment.file_url || assignment.attachment_file_url) && (
                                        <button
                                            type="button"
                                            className="student-assign-btn"
                                            onClick={(event) => handleDownloadAssignment(assignment, event)}
                                        >
                                            <Download size={14} />
                                            Download
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="student-assign-btn primary"
                                        disabled={state.isClosedNoSubmission}
                                        onClick={() => toggleExpand(assignment)}
                                    >
                                        {isExpanded
                                            ? <ChevronUp size={14} />
                                            : <FileUp size={14} />}
                                        {state.isSubmitted
                                            ? (isExpanded ? 'Hide Details' : 'View Submission')
                                            : (isExpanded ? 'Hide' : 'Upload Homework')}
                                    </button>
                                </div>
                            </article>

                            {isExpanded && (
                                <div className="sa-expand-panel">
                                    {expandLoading && (
                                        <div className="sa-expand-loading">
                                            <span className="sa-expand-spinner" />
                                            Loading details…
                                        </div>
                                    )}

                                    {!expandLoading && expandedDetail && (
                                        <div className="sa-expand-body">

                                            {/* Description */}
                                            {expandedDetail.description && (
                                                <div className="sa-section">
                                                    <p className="sa-section-label">Description</p>
                                                    <p className="sa-desc">{expandedDetail.description}</p>
                                                </div>
                                            )}

                                            {/* Info grid */}
                                            <div className="sa-info-grid">
                                                <div className="sa-info-item">
                                                    <span className="sa-info-label">Due date</span>
                                                    <span className="sa-info-value">
                                                        {expandedState?.dueDate
                                                            ? expandedState.dueDate.toLocaleString()
                                                            : 'No due date'}
                                                    </span>
                                                </div>
                                                <div className="sa-info-item">
                                                    <span className="sa-info-label">Time left</span>
                                                    <span className={`sa-info-value ${
                                                        timeLeft.totalMs !== null && timeLeft.totalMs < ONE_DAY_MS && timeLeft.totalMs > 0
                                                            ? `countdown-text ${timeLeft.totalMs < 60 * 60 * 1000 ? 'pulse' : ''}`
                                                            : ''
                                                    }`}>
                                                        {timeLeft.text}
                                                    </span>
                                                </div>
                                                <div className="sa-info-item">
                                                    <span className="sa-info-label">Full mark</span>
                                                    <span className="sa-info-value">{expandedDetail.full_mark || '—'} pts</span>
                                                </div>
                                                <div className="sa-info-item">
                                                    <span className="sa-info-label">Teacher</span>
                                                    <span className="sa-info-value">{expandedDetail.teacher_name || '—'}</span>
                                                </div>
                                            </div>

                                            {/* Assignment file download */}
                                            {(expandedDetail.file_url || expandedDetail.attachment_file_url) && (
                                                <div className="sa-section">
                                                    <p className="sa-section-label">Assignment File</p>
                                                    <button
                                                        type="button"
                                                        className="student-assign-btn"
                                                        onClick={() => window.open(
                                                            expandedDetail.file_url || expandedDetail.attachment_file_url,
                                                            '_blank',
                                                            'noopener,noreferrer'
                                                        )}
                                                    >
                                                        <Download size={14} />
                                                        Download File
                                                    </button>
                                                </div>
                                            )}

                                            {/* Submit form */}
                                            <div className="sa-section sa-submit-section">
                                                <p className="sa-section-label">Submit Homework</p>

                                                {expandedState?.isClosedNoSubmission && (
                                                    <p className="student-assignment-warning">
                                                        This assignment is closed. Upload is disabled.
                                                    </p>
                                                )}
                                                {expandedState?.inGrace && (
                                                    <p className="student-assignment-warning">
                                                        Overdue — you can still submit during the 24-hour grace period.
                                                    </p>
                                                )}

                                                <form onSubmit={handleSubmitAssignment} className="sa-upload-form">
                                                    <label className={`sa-file-label ${expandedState?.isClosedNoSubmission ? 'sa-file-label--disabled' : ''}`}>
                                                        <FileUp size={18} />
                                                        <span>
                                                            {submissionFile
                                                                ? submissionFile.name
                                                                : 'Choose file (PDF, DOC, DOCX, images)'}
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                                            onChange={(event) => setSubmissionFile(event.target.files?.[0] || null)}
                                                            disabled={expandedState?.isClosedNoSubmission}
                                                        />
                                                    </label>

                                                    {submissionFile && (
                                                        <p className="sa-file-size">
                                                            {(submissionFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    )}

                                                    <button
                                                        type="submit"
                                                        className="btn-primary sa-submit-btn"
                                                        disabled={submitting || !submissionFile || expandedState?.isClosedNoSubmission}
                                                    >
                                                        <FileUp size={14} />
                                                        {submitting ? 'Submitting…' : 'Submit Homework'}
                                                    </button>
                                                </form>
                                            </div>

                                            {/* Previous submission */}
                                            {expandedDetail.submission && (
                                                <div className="sa-section sa-submission-history">
                                                    <p className="sa-section-label">Your Submission</p>
                                                    <div className="sa-submission-row">
                                                        <span className="sa-submission-name">
                                                            {expandedDetail.submission.submission_file_name || 'Submitted file'}
                                                        </span>
                                                        <span className="sa-submission-date">
                                                            {expandedDetail.submission.submitted_at
                                                                ? new Date(expandedDetail.submission.submitted_at).toLocaleString()
                                                                : 'Date unavailable'}
                                                        </span>
                                                        {expandedDetail.submission.submission_file_url && (
                                                            <button
                                                                type="button"
                                                                className="student-assign-btn"
                                                                onClick={() => window.open(
                                                                    expandedDetail.submission.submission_file_url,
                                                                    '_blank',
                                                                    'noopener,noreferrer'
                                                                )}
                                                            >
                                                                <Download size={14} />
                                                                Download
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentAssignments;
