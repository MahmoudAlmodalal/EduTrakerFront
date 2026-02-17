import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, FileUp, Upload, X } from 'lucide-react';
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

const StudentAssignments = () => {
    const navigate = useNavigate();
    const { id: routeAssignmentId } = useParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [assignmentsPayload, setAssignmentsPayload] = useState({ results: [], count: 0 });

    const [activeTab, setActiveTab] = useState('active');
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ totalMs: null, text: 'No due date' });

    const loadAssignments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await studentService.getAssignments({
                ordering: 'due_date',
                page_size: 20
            });
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
    }, []);

    const openAssignmentDrawer = useCallback(async (assignmentId) => {
        if (!assignmentId) {
            return;
        }

        setDrawerLoading(true);
        try {
            const detail = await studentService.getAssignmentDetail(assignmentId);
            setSelectedAssignment(detail);
            setSubmissionFile(null);
        } catch (detailError) {
            toast.error(detailError?.message || 'Failed to load assignment details.');
            navigate('/student/assignments', { replace: true });
        } finally {
            setDrawerLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        void loadAssignments();
    }, [loadAssignments]);

    useEffect(() => {
        if (routeAssignmentId) {
            void openAssignmentDrawer(routeAssignmentId);
            return;
        }
        setSelectedAssignment(null);
        setSubmissionFile(null);
    }, [openAssignmentDrawer, routeAssignmentId]);

    useEffect(() => {
        if (!selectedAssignment?.due_date) {
            setTimeLeft({ totalMs: null, text: 'No due date' });
            return undefined;
        }
        setTimeLeft(calculateTimeLeft(selectedAssignment.due_date));
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft(selectedAssignment.due_date));
        }, 1000);
        return () => clearInterval(interval);
    }, [selectedAssignment?.due_date]);

    const assignments = useMemo(
        () => [...toList(assignmentsPayload)].sort(compareDueDateAsc),
        [assignmentsPayload]
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

    const selectedState = useMemo(
        () => (selectedAssignment ? buildAssignmentState(selectedAssignment, new Date()) : null),
        [selectedAssignment]
    );

    const closeDrawer = () => {
        navigate('/student/assignments');
    };

    const handleDownloadAssignment = (assignment, event) => {
        event.stopPropagation();
        if (assignment?.attachment_file_url) {
            window.open(assignment.attachment_file_url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleOpenAssignment = (assignment) => {
        navigate(`/student/assignments/${assignment.id}`);
    };

    const handleSubmitAssignment = async (event) => {
        event.preventDefault();
        if (!selectedAssignment?.id || !submissionFile) {
            toast.error('Please select a file first.');
            return;
        }
        if (selectedState?.isClosedNoSubmission) {
            toast.error('This assignment is closed.');
            return;
        }

        try {
            setSubmitting(true);
            const updatedAssignment = await studentService.submitAssignment(selectedAssignment.id, submissionFile);
            toast.success('Homework submitted successfully!');

            setAssignmentsPayload((previous) => {
                const list = toList(previous);
                const exists = list.some((item) => item.id === updatedAssignment.id);
                const nextResults = exists
                    ? list.map((item) => (item.id === updatedAssignment.id ? updatedAssignment : item))
                    : [updatedAssignment, ...list];
                return {
                    ...previous,
                    results: nextResults,
                    count: Number(previous?.count || list.length) + (exists ? 0 : 1)
                };
            });

            setSelectedAssignment(updatedAssignment);
            setSubmissionFile(null);
            setActiveTab('past');
            closeDrawer();
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

            <div className="student-assignment-tabs">
                <button
                    type="button"
                    className={`student-assignment-tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Active Assignments ({activeAssignments.length})
                </button>
                <button
                    type="button"
                    className={`student-assignment-tab ${activeTab === 'past' ? 'active' : ''}`}
                    onClick={() => setActiveTab('past')}
                >
                    Past &amp; Graded ({pastAssignments.length})
                </button>
            </div>

            <div className="student-assignment-list">
                {loading && <div className="empty-state">Loading assignments...</div>}
                {!loading && error && <div className="empty-state">{error}</div>}
                {!loading && !error && visibleAssignments.length === 0 && activeTab === 'active' && (
                    <div className="student-assignments-empty">
                        <div className="student-assignments-empty-icon">Books</div>
                        <p>No assignments right now.</p>
                        <span>Check back when your teachers post new work!</span>
                    </div>
                )}
                {!loading && !error && visibleAssignments.length === 0 && activeTab === 'past' && (
                    <div className="empty-state">No past assignments yet.</div>
                )}

                {!loading && !error && visibleAssignments.map((assignment) => {
                    const state = assignment._state;
                    return (
                        <article
                            key={assignment.id}
                            className={`student-assignment-card tone-${state.cardTone} ${state.isClosedNoSubmission ? 'is-closed' : ''}`}
                            onClick={() => handleOpenAssignment(assignment)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    handleOpenAssignment(assignment);
                                }
                            }}
                        >
                            <div className="student-assignment-card-header">
                                <div className="student-assignment-title-wrap">
                                    {state.badgeLabel && (
                                        <span className={`student-assignment-badge tone-${state.cardTone}`}>
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
                                {assignment.attachment_file_url && (
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
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleOpenAssignment(assignment);
                                    }}
                                >
                                    <Upload size={14} />
                                    {state.isSubmitted ? 'View Submission' : 'Upload Homework'}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>

            {routeAssignmentId && (
                <div className="student-assignment-drawer-overlay" onClick={closeDrawer}>
                    <aside className="student-assignment-drawer" onClick={(event) => event.stopPropagation()}>
                        <div className="student-assignment-drawer-header">
                            <h3>{selectedAssignment?.title || 'Assignment'}</h3>
                            <button type="button" className="icon-btn" onClick={closeDrawer}>
                                <X size={14} />
                            </button>
                        </div>

                        {drawerLoading && (
                            <div className="empty-state">Loading assignment details...</div>
                        )}

                        {!drawerLoading && selectedAssignment && (
                            <div className="student-assignment-drawer-content">
                                <section>
                                    <h4>Description</h4>
                                    <p>{selectedAssignment.description || 'No description provided.'}</p>
                                </section>

                                <section className="student-assignment-info-grid">
                                    <div>
                                        <strong>Due:</strong>
                                        <span>{selectedState?.dueDate ? selectedState.dueDate.toLocaleString() : 'No due date'}</span>
                                    </div>
                                    <div>
                                        <strong>Time left:</strong>
                                        <span
                                            className={
                                                timeLeft.totalMs !== null && timeLeft.totalMs < ONE_DAY_MS && timeLeft.totalMs > 0
                                                    ? `countdown-text ${timeLeft.totalMs < 60 * 60 * 1000 ? 'pulse' : ''}`
                                                    : ''
                                            }
                                        >
                                            {timeLeft.text}
                                        </span>
                                    </div>
                                    <div>
                                        <strong>Full mark:</strong>
                                        <span>{selectedAssignment.full_mark || '—'} pts</span>
                                    </div>
                                    <div>
                                        <strong>Teacher:</strong>
                                        <span>{selectedAssignment.teacher_name || 'Teacher'}</span>
                                    </div>
                                    <div>
                                        <strong>Course:</strong>
                                        <span>{selectedAssignment.course_name || 'Course'}</span>
                                    </div>
                                </section>

                                {selectedAssignment.attachment_file_url && (
                                    <section>
                                        <h4>Assignment File</h4>
                                        <button
                                            type="button"
                                            className="student-assign-btn"
                                            onClick={() => window.open(selectedAssignment.attachment_file_url, '_blank', 'noopener,noreferrer')}
                                        >
                                            <Download size={14} />
                                            Download File
                                        </button>
                                    </section>
                                )}

                                <section>
                                    <h4>Submit Homework</h4>
                                    {selectedState?.isClosedNoSubmission && (
                                        <p className="student-assignment-warning">This assignment is closed. Upload is disabled.</p>
                                    )}
                                    {selectedState?.inGrace && (
                                        <p className="student-assignment-warning">
                                            Overdue: you can still submit during the 24-hour grace period.
                                        </p>
                                    )}
                                    <form onSubmit={handleSubmitAssignment} className="student-assignment-submit-form">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                            onChange={(event) => setSubmissionFile(event.target.files?.[0] || null)}
                                            disabled={selectedState?.isClosedNoSubmission}
                                        />
                                        <span className="student-assignment-file-hint">Accepted: PDF, DOC, DOCX, images</span>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={submitting || !submissionFile || selectedState?.isClosedNoSubmission}
                                        >
                                            <FileUp size={14} />
                                            {submitting ? 'Submitting...' : 'Submit'}
                                        </button>
                                    </form>
                                </section>

                                {selectedAssignment.submission && (
                                    <section>
                                        <h4>Your Submission</h4>
                                        <p>
                                            {selectedAssignment.submission.submission_file_name || 'Submitted file'} -{' '}
                                            {selectedAssignment.submission.submitted_at
                                                ? new Date(selectedAssignment.submission.submitted_at).toLocaleString()
                                                : 'Date unavailable'}
                                        </p>
                                        {selectedAssignment.submission.submission_file_url && (
                                            <button
                                                type="button"
                                                className="student-assign-btn"
                                                onClick={() => window.open(selectedAssignment.submission.submission_file_url, '_blank', 'noopener,noreferrer')}
                                            >
                                                <Download size={14} />
                                                Download your submission
                                            </button>
                                        )}
                                    </section>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            )}
        </div>
    );
};

export default StudentAssignments;
