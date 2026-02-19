import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Book,
    Calendar,
    ChevronLeft,
    Download,
    ExternalLink,
    FileText,
    Link as LinkIcon,
    MapPin,
    Upload,
    User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../../context/ThemeContext';
import { useStudentData } from '../../../context/StudentDataContext';
import studentService from '../../../services/studentService';
import { toList } from '../../../utils/helpers';
import '../Student.css';

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (value) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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

const calculateTimeLeft = (dueDateValue) => {
    const dueDate = toDate(dueDateValue);
    if (!dueDate) {
        return { totalMs: null, text: 'No due date' };
    }

    const diff = dueDate.getTime() - Date.now();
    if (diff <= 0) {
        return { totalMs: diff, text: 'Expired' };
    }

    const days = Math.floor(diff / DAY_MS);
    const hours = Math.floor((diff % DAY_MS) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);
    return { totalMs: diff, text: `${days}d ${hours}h ${minutes}m ${seconds}s` };
};

const getInitials = (fullName = '') => {
    const tokens = String(fullName).trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
        return 'NA';
    }
    if (tokens.length === 1) {
        return tokens[0].slice(0, 2).toUpperCase();
    }
    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
};

const getFileTypeMeta = (fileType = '') => {
    const value = String(fileType).toLowerCase();
    if (value.includes('pdf')) {
        return { label: 'PDF', color: '#dc2626' };
    }
    if (value.includes('doc')) {
        return { label: 'DOC', color: '#2563eb' };
    }
    if (value.includes('image') || value.includes('png') || value.includes('jpg') || value.includes('jpeg')) {
        return { label: 'IMG', color: '#16a34a' };
    }
    return { label: 'FILE', color: '#64748b' };
};

const getMaterialType = (material = {}) => {
    const explicitType = String(material?.content_type || '').toLowerCase();
    if (['file', 'link', 'text'].includes(explicitType)) {
        return explicitType;
    }
    if (material?.external_link) {
        return 'link';
    }
    if (material?.file_url) {
        return 'file';
    }
    return 'text';
};

const getMaterialLink = (material = {}) => material?.external_link || material?.file_url || '';

const extractDomain = (url = '') => {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
};

const extractYouTubeVideoId = (url = '') => {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');
        if (host === 'youtu.be') {
            return parsed.pathname.split('/').filter(Boolean)[0] || null;
        }
        if (host === 'youtube.com' || host === 'm.youtube.com') {
            if (parsed.pathname === '/watch') {
                return parsed.searchParams.get('v');
            }
            if (parsed.pathname.startsWith('/shorts/')) {
                return parsed.pathname.split('/')[2] || null;
            }
            if (parsed.pathname.startsWith('/embed/')) {
                return parsed.pathname.split('/')[2] || null;
            }
        }
        return null;
    } catch {
        return null;
    }
};

const isRecentMaterial = (createdAt) => {
    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) {
        return false;
    }
    return (Date.now() - parsed.getTime()) <= 48 * 60 * 60 * 1000;
};

const buildAssignmentState = (assignment, now = new Date()) => {
    const dueDate = toDate(assignment?.due_date);
    const dueMs = dueDate?.getTime() ?? null;
    const nowMs = now.getTime();
    const graceEndsMs = dueMs !== null ? dueMs + GRACE_PERIOD_MS : null;

    const hasSubmission = Boolean(assignment?.submission?.id);
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

    let tone = 'default';
    if (isClosedNoSubmission) {
        tone = 'closed';
    } else if (isSubmitted) {
        tone = 'submitted';
    } else if (inGrace) {
        tone = 'overdue';
    } else if (dueDate) {
        const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
        const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const dayDiff = Math.round((dueStart - nowStart) / DAY_MS);
        if (dayDiff === 0) {
            tone = 'due-today';
        } else if (dayDiff === 1) {
            tone = 'due-tomorrow';
        } else if (dayDiff >= 2 && dayDiff <= 7) {
            tone = 'due-soon';
        }
    }

    return { tone, isClosedNoSubmission, inGrace };
};

const toCount = (payload) => {
    if (typeof payload?.count === 'number') {
        return payload.count;
    }
    return toList(payload).length;
};

const StudentSubjects = () => {
    const { t } = useTheme();
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [searchParams] = useSearchParams();
    const { dashboardData, loading, error, refreshData } = useStudentData();

    const materialQueryId = searchParams.get('material');
    const classroomQueryId = searchParams.get('classroom');
    const courseQueryId = searchParams.get('course');
    const queryTab = searchParams.get('tab');
    const normalizedQueryTab = queryTab === 'materials' ? 'content' : queryTab;

    const [subjectCounts, setSubjectCounts] = useState({});
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [activeTab, setActiveTab] = useState('content');
    const [detailData, setDetailData] = useState({
        materials: [],
        assignments: [],
        lessonPlans: [],
        teacher: null
    });

    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ totalMs: null, text: 'No due date' });

    const subjects = useMemo(() => {
        const courseData = dashboardData?.courses?.courses || [];
        const markCounts = (dashboardData?.grades?.marks || []).reduce((acc, item) => {
            if (!item?.course_id) {
                return acc;
            }
            acc[item.course_id] = (acc[item.course_id] || 0) + 1;
            return acc;
        }, {});

        return courseData.map((course, index) => ({
            id: course.course_id,
            course_allocation_id: course.course_allocation_id,
            classroom_id: course.classroom_id,
            classroom_name: course.classroom_name,
            name: course.course_name,
            teacher_name: course.teacher_name,
            course_code: course.course_code,
            grade_name: course.grade_name,
            color: ['#0891b2', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][index % 5],
            initialAssignmentCount: markCounts[course.course_id] || 0
        }));
    }, [dashboardData?.courses?.courses, dashboardData?.grades?.marks]);

    const selectedSubject = useMemo(
        () => subjects.find((subject) => String(subject.id) === String(courseId)),
        [courseId, subjects]
    );

    const subjectKey = useCallback((subject) => `${subject.id}:${subject.classroom_id}`, []);

    const loadSubjectDetails = useCallback(async (subject) => {
        if (!subject) {
            return;
        }
        setDetailLoading(true);
        setDetailError('');

        try {
            const assignmentRequest = subject.course_allocation_id
                ? studentService.getAssignments({
                    course_allocation_id: subject.course_allocation_id,
                    ordering: 'due_date',
                    page_size: 200
                })
                : studentService.getAssignments({
                    ordering: 'due_date',
                    page_size: 200
                });

            const [materialsData, assignmentsData, lessonPlansData, teacherData] = await Promise.all([
                studentService.getLearningMaterials({
                    course: subject.id,
                    classroom: subject.classroom_id,
                    ordering: '-created_at',
                    page_size: 100
                }),
                assignmentRequest,
                studentService.getLessonPlans({
                    course: subject.id,
                    classroom: subject.classroom_id,
                    ordering: '-date_planned',
                    page_size: 100
                }),
                subject.course_allocation_id
                    ? studentService.getTeacherInfo(subject.course_allocation_id)
                    : Promise.resolve(null)
            ]);

            const materials = toList(materialsData)
                .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime());

            const fetchedAssignments = toList(assignmentsData);
            const assignments = (
                subject.course_allocation_id
                    ? fetchedAssignments
                    : fetchedAssignments.filter((item) => (
                        Number(item.course_id) === Number(subject.id)
                        && Number(item.classroom_id) === Number(subject.classroom_id)
                    ))
            ).sort(compareDueDateAsc);

            const lessonPlans = toList(lessonPlansData)
                .sort((first, second) => new Date(second.date_planned).getTime() - new Date(first.date_planned).getTime());

            const teacher = {
                name: teacherData?.teacher_name || subject.teacher_name,
                email: teacherData?.teacher_email || '',
                specialization: teacherData?.teacher_specialization || '',
                office: teacherData?.teacher_office_location || ''
            };

            setDetailData({
                materials,
                assignments,
                lessonPlans,
                teacher
            });

            setSubjectCounts((previous) => ({
                ...previous,
                [subjectKey(subject)]: {
                    materials: materials.length,
                    assignments: assignments.length,
                    lessonPlans: lessonPlans.length
                }
            }));
        } catch (loadError) {
            setDetailError(loadError?.message || 'Failed to load subject details.');
            setDetailData({
                materials: [],
                assignments: [],
                lessonPlans: [],
                teacher: null
            });
        } finally {
            setDetailLoading(false);
        }
    }, [subjectKey]);

    useEffect(() => {
        if (!courseId || !selectedSubject) {
            setActiveTab('content');
            setDetailError('');
            return;
        }
        void loadSubjectDetails(selectedSubject);
    }, [courseId, loadSubjectDetails, selectedSubject]);

    useEffect(() => {
        if (!normalizedQueryTab) {
            if (materialQueryId) {
                setActiveTab('content');
            }
            return;
        }
        if (['content', 'assignments', 'lesson-plans'].includes(normalizedQueryTab)) {
            setActiveTab(normalizedQueryTab);
        }
    }, [materialQueryId, normalizedQueryTab]);

    useEffect(() => {
        if (courseId || subjects.length === 0 || (!classroomQueryId && !courseQueryId)) {
            return;
        }
        const targetSubject = subjects.find((subject) => {
            const matchesCourse = courseQueryId
                ? String(subject.id) === String(courseQueryId)
                : true;
            const matchesClassroom = classroomQueryId
                ? String(subject.classroom_id) === String(classroomQueryId)
                : true;
            return matchesCourse && matchesClassroom;
        }) || (courseQueryId
            ? subjects.find((subject) => String(subject.id) === String(courseQueryId))
            : null);
        if (!targetSubject) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams.toString());
        if (!nextParams.get('tab')) {
            nextParams.set('tab', 'content');
        }
        navigate(`/student/subjects/${targetSubject.id}?${nextParams.toString()}`, { replace: true });
    }, [classroomQueryId, courseId, courseQueryId, navigate, searchParams, subjects]);

    useEffect(() => {
        if (!courseId || !materialQueryId || detailLoading || activeTab !== 'content') {
            return;
        }
        const element = document.querySelector(`[data-material-id="${materialQueryId}"]`);
        if (!element) {
            return;
        }
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('subject-material-highlight');
        const timeoutId = setTimeout(() => {
            element.classList.remove('subject-material-highlight');
        }, 1800);
        return () => clearTimeout(timeoutId);
    }, [activeTab, courseId, detailData.materials, detailLoading, materialQueryId]);

    useEffect(() => {
        if (courseId || subjects.length === 0) {
            return;
        }
        let canceled = false;

        const preloadCounts = async () => {
            const nextCounts = {};
            await Promise.all(subjects.map(async (subject) => {
                try {
                    const assignmentCountPromise = subject.course_allocation_id
                        ? studentService.getAssignments({
                            course_allocation_id: subject.course_allocation_id,
                            page_size: 1,
                            ordering: 'due_date'
                        })
                        : Promise.resolve({ count: subject.initialAssignmentCount });

                    const [materialsData, assignmentsData, lessonPlansData] = await Promise.all([
                        studentService.getLearningMaterials({
                            course: subject.id,
                            classroom: subject.classroom_id,
                            page_size: 1
                        }),
                        assignmentCountPromise,
                        studentService.getLessonPlans({
                            course: subject.id,
                            classroom: subject.classroom_id,
                            page_size: 1
                        })
                    ]);

                    nextCounts[subjectKey(subject)] = {
                        materials: toCount(materialsData),
                        assignments: toCount(assignmentsData),
                        lessonPlans: toCount(lessonPlansData)
                    };
                } catch {
                    nextCounts[subjectKey(subject)] = {
                        materials: 0,
                        assignments: subject.initialAssignmentCount || 0,
                        lessonPlans: 0
                    };
                }
            }));

            if (!canceled) {
                setSubjectCounts((previous) => ({ ...previous, ...nextCounts }));
            }
        };

        void preloadCounts();
        return () => {
            canceled = true;
        };
    }, [courseId, subjectKey, subjects]);

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

    const openAssignmentDrawer = async (assignmentId) => {
        try {
            const detail = await studentService.getAssignmentDetail(assignmentId);
            setSelectedAssignment(detail);
            setSubmissionFile(null);
        } catch (loadError) {
            toast.error(loadError?.message || 'Failed to load assignment details.');
        }
    };

    const handleSubmitAssignment = async (event) => {
        event.preventDefault();
        if (!selectedAssignment?.id || !submissionFile) {
            toast.error('Please select a file first.');
            return;
        }

        const state = buildAssignmentState(selectedAssignment, new Date());
        if (state.isClosedNoSubmission) {
            toast.error('This assignment is closed.');
            return;
        }

        try {
            setSubmitting(true);
            const updated = await studentService.submitAssignment(selectedAssignment.id, submissionFile);
            setSelectedAssignment(updated);
            setSubmissionFile(null);
            setDetailData((previous) => ({
                ...previous,
                assignments: previous.assignments.map((item) => (
                    item.id === updated.id ? updated : item
                ))
            }));
            toast.success('Homework submitted successfully!');
        } catch (submitError) {
            toast.error(submitError?.message || 'Failed to submit assignment.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <p>Loading subjects...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <p>{error}</p>
                <button onClick={refreshData} className="retry-btn" type="button">
                    Try Again
                </button>
            </div>
        );
    }

    if (courseId && selectedSubject) {
        const teacher = detailData.teacher || { name: selectedSubject.teacher_name };

        return (
            <div className="student-subject-detail-page">
                <button
                    type="button"
                    onClick={() => navigate('/student/subjects')}
                    className="back-button"
                >
                    <ChevronLeft size={18} />
                    <span>Back to Subjects</span>
                </button>

                <div className="subject-detail-shell">
                    <div className="subject-detail-main">
                        <header className="subject-detail-header" style={{ '--subject-color': selectedSubject.color }}>
                            <div>
                                <h1>{selectedSubject.name} - {selectedSubject.grade_name}</h1>
                                <p>{selectedSubject.course_code} • {selectedSubject.classroom_name}</p>
                            </div>
                        </header>

                        <div className="subject-tabs">
                            <button
                                type="button"
                                className={activeTab === 'content' ? 'active' : ''}
                                onClick={() => setActiveTab('content')}
                            >
                                Content ({detailData.materials.length})
                            </button>
                            <button
                                type="button"
                                className={activeTab === 'assignments' ? 'active' : ''}
                                onClick={() => setActiveTab('assignments')}
                            >
                                Assignments ({detailData.assignments.length})
                            </button>
                            <button
                                type="button"
                                className={activeTab === 'lesson-plans' ? 'active' : ''}
                                onClick={() => setActiveTab('lesson-plans')}
                            >
                                Lesson Plans ({detailData.lessonPlans.length})
                            </button>
                        </div>

                        {detailLoading && <div className="empty-state">Loading subject details...</div>}
                        {!detailLoading && detailError && <div className="empty-state">{detailError}</div>}

                        {!detailLoading && !detailError && activeTab === 'content' && (
                            <div className="subject-tab-panel">
                                {detailData.materials.length === 0 && (
                                    <div className="empty-state">No content posted yet for this subject.</div>
                                )}
                                {detailData.materials.map((material) => {
                                    const materialType = getMaterialType(material);
                                    const fileTypeMeta = getFileTypeMeta(material.file_type || material.file_url);
                                    const externalLink = getMaterialLink(material);
                                    const domain = extractDomain(externalLink);
                                    const videoId = materialType === 'link'
                                        ? extractYouTubeVideoId(externalLink)
                                        : null;
                                    const isFileMaterial = materialType === 'file';
                                    const isLinkMaterial = materialType === 'link';
                                    const isTextMaterial = materialType === 'text';
                                    const materialBadgeLabel = isLinkMaterial
                                        ? 'LINK'
                                        : (isTextMaterial ? 'TEXT' : fileTypeMeta.label);
                                    const materialBadgeColor = isTextMaterial ? '#d97706' : fileTypeMeta.color;
                                    return (
                                        <article
                                            key={material.id}
                                            className={`subject-material-row ${isLinkMaterial ? 'subject-material-row-link' : ''} ${isTextMaterial ? 'subject-material-row-text' : ''}`}
                                            data-material-id={material.id}
                                        >
                                            <div className="subject-material-top">
                                                <div className="subject-material-icon" style={{ color: materialBadgeColor }}>
                                                    {isLinkMaterial ? <LinkIcon size={18} /> : isTextMaterial ? <Book size={18} /> : <FileText size={18} />}
                                                    <span>{materialBadgeLabel}</span>
                                                </div>
                                                {isRecentMaterial(material.created_at) && (
                                                    <span className="subject-material-new-badge">New</span>
                                                )}
                                            </div>

                                            <div className="subject-material-info">
                                                <h4>{material.title}</h4>
                                                <p>
                                                    {new Date(material.created_at).toLocaleDateString()} •{' '}
                                                    {isFileMaterial
                                                        ? (material.file_size
                                                            ? `${(material.file_size / 1024 / 1024).toFixed(2)} MB`
                                                            : 'N/A')
                                                        : (isLinkMaterial ? (domain || 'External Link') : 'Text content')}
                                                </p>
                                                {(material.description || isTextMaterial) && (
                                                    <p className="subject-material-description">
                                                        {material.description || 'No description provided.'}
                                                    </p>
                                                )}
                                            </div>

                                            {videoId && (
                                                <button
                                                    type="button"
                                                    className="subject-material-thumb"
                                                    onClick={() => window.open(externalLink, '_blank', 'noopener,noreferrer')}
                                                >
                                                    <img
                                                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                                        alt="YouTube preview"
                                                    />
                                                    <span className="subject-material-thumb-overlay">Open on YouTube</span>
                                                </button>
                                            )}

                                            <div className="subject-material-actions">
                                                {isFileMaterial && (
                                                    <button
                                                        type="button"
                                                        className="student-assign-btn"
                                                        onClick={() => studentService.downloadMaterial(material)}
                                                    >
                                                        <Download size={14} />
                                                        Download
                                                    </button>
                                                )}
                                                {isLinkMaterial && (
                                                    <button
                                                        type="button"
                                                        className="student-assign-btn"
                                                        onClick={() => window.open(externalLink, '_blank', 'noopener,noreferrer')}
                                                    >
                                                        <ExternalLink size={14} />
                                                        Open Link
                                                    </button>
                                                )}
                                                {isTextMaterial && (
                                                    <span className="subject-material-text-note">Description only</span>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {!detailLoading && !detailError && activeTab === 'assignments' && (
                            <div className="subject-tab-panel">
                                {detailData.assignments.length === 0 && (
                                    <div className="empty-state">No assignments for this subject yet.</div>
                                )}
                                {detailData.assignments.map((assignment) => {
                                    const state = buildAssignmentState(assignment, new Date());
                                    return (
                                        <article
                                            key={assignment.id}
                                            className={`student-assignment-card tone-${state.tone}`}
                                            onClick={() => openAssignmentDrawer(assignment.id)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    openAssignmentDrawer(assignment.id);
                                                }
                                            }}
                                        >
                                            <div className="student-assignment-card-header">
                                                <div className="student-assignment-title-wrap">
                                                    <h3>{assignment.title}</h3>
                                                </div>
                                                <div className="student-assignment-due">
                                                    <span>
                                                        Due:{' '}
                                                        {assignment.due_date
                                                            ? new Date(assignment.due_date).toLocaleDateString()
                                                            : 'No due date'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="student-assignment-meta">
                                                <span>{assignment.course_name}</span>
                                                <span>Full mark: {assignment.full_mark || '—'}</span>
                                            </div>
                                            <div className="student-assignment-actions">
                                                {assignment.attachment_file_url && (
                                                    <button
                                                        type="button"
                                                        className="student-assign-btn"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            window.open(assignment.attachment_file_url, '_blank', 'noopener,noreferrer');
                                                        }}
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
                                                        openAssignmentDrawer(assignment.id);
                                                    }}
                                                >
                                                    <Upload size={14} />
                                                    {state.isClosedNoSubmission ? 'Closed' : 'Open'}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {!detailLoading && !detailError && activeTab === 'lesson-plans' && (
                            <div className="subject-tab-panel lesson-plan-panel">
                                {detailData.lessonPlans.length === 0 && (
                                    <div className="empty-state">No lesson plans published for this subject.</div>
                                )}
                                {detailData.lessonPlans.map((plan) => (
                                    <article key={plan.id} className="subject-lesson-plan-card">
                                        <div className="subject-lesson-plan-head">
                                            <h4>{plan.title}</h4>
                                            <span>{new Date(plan.date_planned).toLocaleDateString()}</span>
                                        </div>
                                        <p className="subject-lesson-plan-objectives">
                                            {plan.objectives || plan.content || 'No objectives provided.'}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="subject-teacher-card">
                        <div className="subject-teacher-avatar">{getInitials(teacher.name)}</div>
                        <h3>{teacher.name || selectedSubject.teacher_name}</h3>
                        {teacher.email && (
                            <p className="subject-teacher-line">
                                <User size={14} />
                                {teacher.email}
                            </p>
                        )}
                        {teacher.specialization && (
                            <span className="subject-teacher-specialization">{teacher.specialization}</span>
                        )}
                        {teacher.office && (
                            <p className="subject-teacher-line">
                                <MapPin size={14} />
                                {teacher.office}
                            </p>
                        )}
                    </aside>
                </div>

                {selectedAssignment && (
                    <div className="student-assignment-drawer-overlay" onClick={() => setSelectedAssignment(null)}>
                        <aside className="student-assignment-drawer" onClick={(event) => event.stopPropagation()}>
                            <div className="student-assignment-drawer-header">
                                <h3>{selectedAssignment.title}</h3>
                                <button type="button" className="icon-btn" onClick={() => setSelectedAssignment(null)}>
                                    <ChevronLeft size={14} />
                                </button>
                            </div>

                            <div className="student-assignment-drawer-content">
                                <section>
                                    <h4>Description</h4>
                                    <p>{selectedAssignment.description || 'No description provided.'}</p>
                                </section>

                                <section className="student-assignment-info-grid">
                                    <div>
                                        <strong>Due:</strong>
                                        <span>
                                            {selectedAssignment.due_date
                                                ? new Date(selectedAssignment.due_date).toLocaleString()
                                                : 'No due date'}
                                        </span>
                                    </div>
                                    <div>
                                        <strong>Time left:</strong>
                                        <span className={timeLeft.totalMs !== null && timeLeft.totalMs < DAY_MS ? 'countdown-text' : ''}>
                                            {timeLeft.text}
                                        </span>
                                    </div>
                                    <div>
                                        <strong>Full mark:</strong>
                                        <span>{selectedAssignment.full_mark || '—'} pts</span>
                                    </div>
                                    <div>
                                        <strong>Course:</strong>
                                        <span>{selectedAssignment.course_name || selectedSubject.name}</span>
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
                                    <form onSubmit={handleSubmitAssignment} className="student-assignment-submit-form">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                            onChange={(event) => setSubmissionFile(event.target.files?.[0] || null)}
                                        />
                                        <button type="submit" className="btn-primary" disabled={submitting || !submissionFile}>
                                            <Upload size={14} />
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
                        </aside>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="student-subjects">
            <header className="page-header">
                <div>
                    <h1 className="page-title">{t('student.subjects.title') || 'My Subjects'}</h1>
                    <p className="page-subtitle">{t('student.subjects.subtitle') || 'Access your courses, content, and assignments'}</p>
                </div>
            </header>

            <div className="subjects-grid">
                {subjects.map((subject) => {
                    const counts = subjectCounts[subjectKey(subject)] || {};
                    return (
                        <article
                            key={subjectKey(subject)}
                            className="subject-card-premium"
                            onClick={() => navigate(`/student/subjects/${subject.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    navigate(`/student/subjects/${subject.id}`);
                                }
                            }}
                            style={{ '--subject-color': subject.color }}
                        >
                            <div className="subject-card-headline">
                                <span className="subject-course-code">{subject.course_code || 'N/A'}</span>
                                <div className="subject-teacher-mini-avatar">{getInitials(subject.teacher_name)}</div>
                            </div>
                            <h3 className="subject-card-title">{subject.name}</h3>
                            <p className="subject-card-teacher">{subject.teacher_name}</p>

                            <div className="subject-card-badges">
                                <span><Book size={13} /> {counts.materials ?? 0} Content</span>
                                <span><Calendar size={13} /> {counts.assignments ?? subject.initialAssignmentCount} Assignments</span>
                                <span><FileText size={13} /> {counts.lessonPlans ?? 0} Plans</span>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentSubjects;
