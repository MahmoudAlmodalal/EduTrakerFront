import React, { memo, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Star, Search, Plus, Mail, UserCheck, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import managerService from '../../services/managerService';
import Modal from '../../components/ui/Modal';
import SearchableSelect from '../../components/ui/SearchableSelect';
import './SchoolManager.css';

const DEFAULT_PASSWORD = 'Teacher@123';
const STAR_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const TABLE_ROWS_PER_PAGE = 10;

const normalizeList = (response) => {
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response)) return response;
    return [];
};

const mapTeachersCache = (cachedValue, mapper) => {
    if (Array.isArray(cachedValue)) {
        return cachedValue.map(mapper);
    }
    if (cachedValue && Array.isArray(cachedValue.results)) {
        return {
            ...cachedValue,
            results: cachedValue.results.map(mapper)
        };
    }
    return cachedValue;
};

const prependTeacherToCache = (cachedValue, teacherToAdd) => {
    if (Array.isArray(cachedValue)) {
        return [teacherToAdd, ...cachedValue];
    }
    if (cachedValue && Array.isArray(cachedValue.results)) {
        return {
            ...cachedValue,
            count: typeof cachedValue.count === 'number' ? cachedValue.count + 1 : cachedValue.count,
            results: [teacherToAdd, ...cachedValue.results]
        };
    }
    return [teacherToAdd];
};

const getTeacherId = (teacher) => teacher?.user_id || teacher?.id;

const getTeacherName = (teacher) => teacher?.full_name || teacher?.name || 'this teacher';

const getTodayISO = () => new Date().toISOString().split('T')[0];

const createInitialTeacherForm = () => ({
    full_name: '',
    email: '',
    password: DEFAULT_PASSWORD,
    specialization: '',
    employment_status: 'full_time',
    hire_date: getTodayISO()
});

const createInitialEvaluationForm = () => ({
    reviewee_id: '',
    rating_score: 5,
    comments: ''
});

const getErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData;
    }

    if (responseData?.detail) {
        return responseData.detail;
    }

    if (responseData && typeof responseData === 'object') {
        const flattened = Object.values(responseData)
            .flat()
            .map((value) => (typeof value === 'string' ? value : ''))
            .filter(Boolean)
            .join(' ');

        if (flattened) {
            return flattened;
        }
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message;
    }

    return fallbackMessage;
};

const QueryErrorState = ({ message, onRetry, compact = false }) => (
    <div className={compact ? 'sm-inline-state' : 'sm-error-state'}>
        <span>{message}</span>
        {onRetry ? (
            <button type="button" className="sm-inline-action" onClick={onRetry}>
                Retry
            </button>
        ) : null}
    </div>
);

const TableCard = memo(function TableCard({ left, right, children }) {
    return (
        <div className="management-card">
            <div className="table-header-actions">
                {left}
                {right}
            </div>
            {children}
        </div>
    );
});

const TeacherMonitoring = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('directory');

    const schoolId = user?.school_id
        || user?.school?.id
        || (typeof user?.school === 'number' ? user.school : null);
    const hasSchoolId = schoolId !== null && schoolId !== undefined && schoolId !== '';

    const teachersQueryKey = useMemo(() => ['school-manager', 'teachers', schoolId], [schoolId]);
    const evaluationsQueryKey = useMemo(() => ['school-manager', 'staff-evaluations', schoolId], [schoolId]);

    const {
        data: teachers = [],
        isLoading: teachersLoading,
        error: teachersError,
        refetch: refetchTeachers
    } = useQuery({
        queryKey: teachersQueryKey,
        queryFn: () => managerService.getTeachers({ school_id: schoolId, include_inactive: true }),
        select: normalizeList,
        enabled: hasSchoolId,
        staleTime: 5 * 60 * 1000
    });

    const {
        data: evaluations = [],
        isLoading: evaluationsLoading,
        error: evaluationsError,
        refetch: refetchEvaluations
    } = useQuery({
        queryKey: evaluationsQueryKey,
        queryFn: () => managerService.getStaffEvaluations({ school_id: schoolId }),
        select: normalizeList,
        enabled: hasSchoolId && activeTab === 'performance',
        staleTime: 5 * 60 * 1000
    });

    const tabs = useMemo(() => ([
        { id: 'directory', label: t('school.teachers.directory') || 'Directory', icon: Users },
        { id: 'performance', label: t('school.teachers.performance') || 'Performance', icon: Star }
    ]), [t]);

    const renderTabContent = () => {
        if (!hasSchoolId) {
            return (
                <QueryErrorState message="School information is missing. Please log in again." />
            );
        }

        if (teachersLoading) {
            return (
                <div className="management-card">
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        {t('common.loading') || 'Loading...'}
                    </div>
                </div>
            );
        }

        if (teachersError) {
            return (
                <QueryErrorState
                    message={getErrorMessage(teachersError, 'Unable to load teacher monitoring data.')}
                    onRetry={refetchTeachers}
                />
            );
        }

        switch (activeTab) {
            case 'directory':
                return (
                    <TeacherDirectory
                        teachers={teachers}
                        schoolId={schoolId}
                        teachersQueryKey={teachersQueryKey}
                    />
                );
            case 'performance':
                return (
                    <PerformanceEvaluation
                        evaluations={evaluations}
                        evaluationsLoading={evaluationsLoading}
                        evaluationsError={evaluationsError}
                        onRetryEvaluations={refetchEvaluations}
                        evaluationsQueryKey={evaluationsQueryKey}
                        teachers={teachers}
                    />
                );
            default:
                return (
                    <TeacherDirectory
                        teachers={teachers}
                        schoolId={schoolId}
                        teachersQueryKey={teachersQueryKey}
                    />
                );
        }
    };

    return (
        <div className="management-page teacher-monitoring-page">
            <div className="school-manager-header">
                <h1 className="school-manager-title">{t('school.teachers.title') || 'Teacher Monitoring'}</h1>
            </div>

            <div className="teacher-monitoring-tabs">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`teacher-monitoring-tab ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={18} strokeWidth={2} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {renderTabContent()}
        </div>
    );
};

const TeacherDirectory = memo(function TeacherDirectory({ teachers, schoolId, teachersQueryKey }) {
    const { t } = useTheme();
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [page, setPage] = useState(1);
    const [formData, setFormData] = useState(createInitialTeacherForm);
    const [pendingStatusAction, setPendingStatusAction] = useState(null);

    const filteredTeachers = useMemo(() => {
        const query = deferredSearchTerm.trim().toLowerCase();
        if (!query) return teachers;

        return teachers.filter((teacher) => (
            (teacher.full_name?.toLowerCase() || '').includes(query)
            || (teacher.email?.toLowerCase() || '').includes(query)
            || (teacher.specialization?.toLowerCase() || '').includes(query)
        ));
    }, [teachers, deferredSearchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / TABLE_ROWS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedTeachers = useMemo(() => {
        const startIndex = (currentPage - 1) * TABLE_ROWS_PER_PAGE;
        return filteredTeachers.slice(startIndex, startIndex + TABLE_ROWS_PER_PAGE);
    }, [currentPage, filteredTeachers]);

    const createTeacherMutation = useMutation({
        mutationFn: (payload) => managerService.createTeacher(payload),
        onSuccess: (createdTeacher) => {
            const createdTeacherId = getTeacherId(createdTeacher);

            if (createdTeacherId) {
                queryClient.setQueryData(teachersQueryKey, (current) => {
                    const currentTeachers = normalizeList(current);
                    if (currentTeachers.some((teacher) => getTeacherId(teacher) === createdTeacherId)) {
                        return current;
                    }
                    return prependTeacherToCache(current, createdTeacher);
                });
            } else {
                queryClient.invalidateQueries({ queryKey: teachersQueryKey });
            }

            showSuccess('Teacher created successfully.');
            setIsModalOpen(false);
            setFormData(createInitialTeacherForm());
        },
        onError: (error) => {
            showError(getErrorMessage(error, 'Failed to create teacher.'));
        }
    });

    const updateTeacherStatusMutation = useMutation({
        mutationFn: ({ teacherId, nextIsActive }) => (
            nextIsActive
                ? managerService.activateTeacher(teacherId)
                : managerService.deactivateTeacher(teacherId)
        ),
        onMutate: async ({ teacherId, nextIsActive }) => {
            await queryClient.cancelQueries({ queryKey: teachersQueryKey });

            const previousTeachers = queryClient.getQueryData(teachersQueryKey) || [];
            queryClient.setQueryData(teachersQueryKey, (current) => {
                return mapTeachersCache(current, (teacher) => (
                    getTeacherId(teacher) === teacherId
                        ? { ...teacher, is_active: nextIsActive }
                        : teacher
                ));
            });

            return { previousTeachers };
        },
        onError: (error, _variables, context) => {
            if (context?.previousTeachers) {
                queryClient.setQueryData(teachersQueryKey, context.previousTeachers);
            }
            showError(getErrorMessage(error, 'Failed to update teacher status.'));
        },
        onSuccess: (_response, variables) => {
            showSuccess(variables.nextIsActive ? 'Teacher activated.' : 'Teacher deactivated.');
        }
    });

    const toggleTeacherStatusMutation = useMutation({
        mutationFn: (teacherId) => managerService.toggleTeacherStatus(teacherId),
        onMutate: async (teacherId) => {
            await queryClient.cancelQueries({ queryKey: teachersQueryKey });
            const previousTeachers = queryClient.getQueryData(teachersQueryKey) || [];

            queryClient.setQueryData(teachersQueryKey, (current) => (
                mapTeachersCache(current, (teacher) => (
                    getTeacherId(teacher) === teacherId
                        ? { ...teacher, is_active: !(teacher.is_active !== false) }
                        : teacher
                ))
            ));

            return { previousTeachers, teacherId };
        },
        onError: (error, _teacherId, context) => {
            if (context?.previousTeachers) {
                queryClient.setQueryData(teachersQueryKey, context.previousTeachers);
            }
            showError(getErrorMessage(error, 'Failed to update teacher status.'));
        },
        onSuccess: (response, teacherId) => {
            queryClient.setQueryData(teachersQueryKey, (current) => (
                mapTeachersCache(current, (teacher) => (
                    getTeacherId(teacher) === teacherId
                        ? { ...teacher, is_active: response?.is_active }
                        : teacher
                ))
            ));
            showSuccess(response?.message || 'Teacher status updated.');
        }
    });

    const handleSave = useCallback((event) => {
        event.preventDefault();

        const fallbackSchoolId = localStorage.getItem('school_id');
        const resolvedSchoolId = schoolId || fallbackSchoolId;
        const parsedSchoolId = Number.parseInt(String(resolvedSchoolId), 10);

        if (!resolvedSchoolId || Number.isNaN(parsedSchoolId)) {
            showError('School ID not found. Please log out and log in again.');
            return;
        }

        createTeacherMutation.mutate({
            email: formData.email,
            full_name: formData.full_name,
            password: formData.password,
            school_id: parsedSchoolId,
            specialization: formData.specialization,
            employment_status: formData.employment_status,
            hire_date: formData.hire_date
        });
    }, [createTeacherMutation, formData, schoolId, showError]);

    const handleCloseCreateModal = useCallback(() => {
        if (createTeacherMutation.isPending) return;
        setIsModalOpen(false);
        setFormData(createInitialTeacherForm());
    }, [createTeacherMutation.isPending]);

    const requestStatusChange = useCallback((teacher, nextIsActive) => {
        const teacherId = getTeacherId(teacher);
        if (!teacherId) return;

        setPendingStatusAction({
            teacherId,
            nextIsActive,
            teacherName: getTeacherName(teacher)
        });
    }, []);

    const closeStatusModal = useCallback(() => {
        if (updateTeacherStatusMutation.isPending) return;
        setPendingStatusAction(null);
    }, [updateTeacherStatusMutation.isPending]);

    const confirmStatusChange = useCallback(() => {
        if (!pendingStatusAction) return;
        updateTeacherStatusMutation.mutate(pendingStatusAction);
        setPendingStatusAction(null);
    }, [pendingStatusAction, updateTeacherStatusMutation]);

    const handleStatusBadgeToggle = useCallback((teacher) => {
        const teacherId = getTeacherId(teacher);
        if (!teacherId || toggleTeacherStatusMutation.isPending) return;
        toggleTeacherStatusMutation.mutate(teacherId);
    }, [toggleTeacherStatusMutation]);

    return (
        <TableCard
            left={(
                <div className="sm-search-control">
                    <Search size={18} className="sm-search-control-icon" />
                    <input
                        type="text"
                        placeholder={t('common.search') || 'Search teachers...'}
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setPage(1);
                        }}
                        className="sm-search-control-input"
                    />
                </div>
            )}
            right={(
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Add Teacher
                </button>
            )}
        >

            <div className="sm-table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>School</th>
                            <th>Specialization</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeachers.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    No teachers found.
                                </td>
                            </tr>
                        ) : paginatedTeachers.map((teacher) => {
                            const id = getTeacherId(teacher);
                            const isActive = teacher.is_active !== false;
                            const isUpdatingThisTeacher = updateTeacherStatusMutation.isPending
                                && updateTeacherStatusMutation.variables?.teacherId === id;

                            return (
                                <tr key={id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: '#f3e8ff', color: '#9333ea',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold', fontSize: '0.875rem'
                                            }}>
                                                {teacher.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>
                                                    {teacher.full_name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Mail size={12} />
                                                    {teacher.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: teacher.school_name ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                                        {teacher.school_name || 'Not assigned'}
                                    </td>
                                    <td style={{ color: teacher.specialization ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                                        {teacher.specialization || 'Not specified'}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`status-badge ${isActive ? 'status-active active' : 'status-inactive inactive'} status-toggle-btn`}
                                            onClick={() => handleStatusBadgeToggle(teacher)}
                                            style={{
                                                opacity: toggleTeacherStatusMutation.isPending && toggleTeacherStatusMutation.variables === id ? 0.75 : 1
                                            }}
                                            disabled={toggleTeacherStatusMutation.isPending && toggleTeacherStatusMutation.variables === id}
                                            title="Click to toggle status"
                                        >
                                            {isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {isActive ? (
                                                <button
                                                    onClick={() => requestStatusChange(teacher, false)}
                                                    title="Deactivate Teacher"
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-error)' }}
                                                    disabled={isUpdatingThisTeacher}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => requestStatusChange(teacher, true)}
                                                    title="Activate Teacher"
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--color-success)' }}
                                                    disabled={isUpdatingThisTeacher}
                                                >
                                                    <UserCheck size={18} />
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

            {filteredTeachers.length > 0 ? (
                <div className="sm-table-pagination">
                    <span className="sm-table-pagination-summary">
                        Showing {(currentPage - 1) * TABLE_ROWS_PER_PAGE + 1}
                        -
                        {Math.min(currentPage * TABLE_ROWS_PER_PAGE, filteredTeachers.length)} of {filteredTeachers.length}
                    </span>
                    <div className="sm-table-pagination-controls">
                        <button
                            type="button"
                            className="sm-btn-secondary"
                            onClick={() => setPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage <= 1}
                        >
                            Previous
                        </button>
                        <span className="sm-table-pagination-page">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            type="button"
                            className="sm-btn-secondary"
                            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : null}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseCreateModal}
                title="Add New Teacher"
            >
                <form onSubmit={handleSave} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Full Name</label>
                        <input
                            required
                            value={formData.full_name}
                            onChange={(event) => setFormData({ ...formData, full_name: event.target.value })}
                            className="sm-form-input"
                            placeholder="Enter teacher's full name"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Email</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                            className="sm-form-input"
                            placeholder="teacher@example.com"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Password</label>
                        <input
                            required
                            type="password"
                            value={formData.password}
                            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Specialization</label>
                        <input
                            value={formData.specialization}
                            onChange={(event) => setFormData({ ...formData, specialization: event.target.value })}
                            placeholder="e.g., Mathematics, Science, English"
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Employment Status</label>
                        <select
                            required
                            value={formData.employment_status}
                            onChange={(event) => setFormData({ ...formData, employment_status: event.target.value })}
                            className="sm-form-select"
                        >
                            <option value="full_time">Full Time</option>
                            <option value="part_time">Part Time</option>
                            <option value="contract">Contract</option>
                            <option value="substitute">Substitute</option>
                        </select>
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Hire Date</label>
                        <input
                            required
                            type="date"
                            value={formData.hire_date}
                            onChange={(event) => setFormData({ ...formData, hire_date: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-actions">
                        <button
                            type="button"
                            onClick={handleCloseCreateModal}
                            className="sm-btn-secondary"
                            disabled={createTeacherMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={createTeacherMutation.isPending}>
                            {createTeacherMutation.isPending ? 'Creating...' : 'Create Teacher'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={Boolean(pendingStatusAction)}
                onClose={closeStatusModal}
                title={pendingStatusAction?.nextIsActive ? 'Activate Teacher' : 'Deactivate Teacher'}
            >
                <div className="sm-confirm-copy">
                    Are you sure you want to {pendingStatusAction?.nextIsActive ? 'activate' : 'deactivate'}{' '}
                    <strong>{pendingStatusAction?.teacherName}</strong>?
                </div>
                <div className="sm-form-actions">
                    <button
                        type="button"
                        onClick={closeStatusModal}
                        className="sm-btn-secondary"
                        disabled={updateTeacherStatusMutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={confirmStatusChange}
                        className="btn-primary"
                        disabled={updateTeacherStatusMutation.isPending}
                    >
                        {updateTeacherStatusMutation.isPending ? 'Updating...' : 'Confirm'}
                    </button>
                </div>
            </Modal>
        </TableCard>
    );
});

const StarRating = memo(function StarRating({ score }) {
    const normalizedScore = Number.parseInt(score, 10) || 0;

    return (
        <div className="eval-stars">
            {STAR_INDICES.map((starIndex) => {
                const filled = starIndex <= normalizedScore;
                return (
                    <Star
                        key={starIndex}
                        size={14}
                        fill={filled ? '#fbbf24' : 'transparent'}
                        stroke={filled ? '#fbbf24' : '#d1d5db'}
                    />
                );
            })}
        </div>
    );
});

const PerformanceEvaluation = memo(function PerformanceEvaluation({
    evaluations,
    evaluationsLoading,
    evaluationsError,
    onRetryEvaluations,
    evaluationsQueryKey,
    teachers
}) {
    const queryClient = useQueryClient();
    const { showSuccess, showError, showWarning } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(createInitialEvaluationForm);

    const teacherOptions = useMemo(() => (
        teachers.map((teacher) => ({
            value: getTeacherId(teacher),
            label: teacher.full_name
        }))
    ), [teachers]);

    const createEvaluationMutation = useMutation({
        mutationFn: (payload) => managerService.createStaffEvaluation(payload),
        onSuccess: (createdEvaluation) => {
            if (createdEvaluation?.id) {
                queryClient.setQueryData(evaluationsQueryKey, (current = []) => {
                    const currentEvaluations = Array.isArray(current) ? current : [];
                    return [createdEvaluation, ...currentEvaluations];
                });
            } else {
                queryClient.invalidateQueries({ queryKey: evaluationsQueryKey });
            }

            showSuccess('Evaluation saved.');
            setIsModalOpen(false);
            setFormData(createInitialEvaluationForm());
        },
        onError: (error) => {
            showError(getErrorMessage(error, 'Failed to create evaluation.'));
        }
    });

    const handleSave = useCallback((event) => {
        event.preventDefault();

        if (!formData.reviewee_id) {
            showWarning('Please select a teacher.');
            return;
        }

        createEvaluationMutation.mutate({
            reviewee_id: Number.parseInt(formData.reviewee_id, 10),
            rating_score: Number.parseInt(formData.rating_score, 10),
            comments: formData.comments,
            evaluation_date: getTodayISO()
        });
    }, [createEvaluationMutation, formData, showWarning]);

    const handleCloseModal = useCallback(() => {
        if (createEvaluationMutation.isPending) return;
        setIsModalOpen(false);
        setFormData(createInitialEvaluationForm());
    }, [createEvaluationMutation.isPending]);

    const evaluationRows = useMemo(() => {
        if (evaluationsLoading) {
            return (
                <tr>
                    <td colSpan="4" className="sm-loading-state">
                        Loading evaluations...
                    </td>
                </tr>
            );
        }

        if (evaluationsError) {
            return (
                <tr>
                    <td colSpan="4">
                        <QueryErrorState
                            compact
                            message={getErrorMessage(evaluationsError, 'Unable to load evaluations.')}
                            onRetry={onRetryEvaluations}
                        />
                    </td>
                </tr>
            );
        }

        if (evaluations.length === 0) {
            return (
                <tr>
                    <td colSpan="4" className="sm-empty-state">
                        No evaluations yet. Click "New Evaluation" to add one.
                    </td>
                </tr>
            );
        }

        return evaluations.map((evalItem) => (
            <tr key={evalItem.id}>
                <td>
                    <div className="eval-teacher-info">
                        <div className="eval-avatar">
                            {(evalItem.reviewee_name || evalItem.reviewee_email)?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                        <span className="eval-name">{evalItem.reviewee_name || evalItem.reviewee_email}</span>
                    </div>
                </td>
                <td>
                    <div className="eval-rating-wrap">
                        <StarRating score={evalItem.rating_score} />
                        <span className={`eval-score ${evalItem.rating_score >= 7 ? 'good' : evalItem.rating_score >= 4 ? 'warn' : 'poor'}`}>
                            {evalItem.rating_score}/10
                        </span>
                    </div>
                </td>
                <td className="eval-comments-cell">
                    <p className="eval-comments">{evalItem.comments || 'No comments'}</p>
                </td>
                <td className="sm-muted-cell">
                    {evalItem.evaluation_date
                        ? new Date(evalItem.evaluation_date).toLocaleDateString()
                        : 'N/A'}
                </td>
            </tr>
        ));
    }, [evaluations, evaluationsError, evaluationsLoading, onRetryEvaluations]);

    return (
        <TableCard
            left={<h3 className="chart-title">Performance Evaluations</h3>}
            right={(
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    New Evaluation
                </button>
            )}
        >

            <div className="sm-table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Teacher</th>
                            <th>Rating</th>
                            <th>Comments</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>{evaluationRows}</tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="New Staff Evaluation"
            >
                <form onSubmit={handleSave} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Select Teacher</label>
                        <SearchableSelect
                            options={teacherOptions}
                            value={formData.reviewee_id}
                            onChange={(value) => setFormData({ ...formData, reviewee_id: value })}
                            placeholder="Select a teacher..."
                            searchPlaceholder="Search teachers..."
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Rating Score (1-10)</label>
                        <div className="sm-range-row">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={formData.rating_score}
                                onChange={(event) => setFormData({ ...formData, rating_score: event.target.value })}
                                className="sm-range-input"
                            />
                            <span className={`sm-range-score ${formData.rating_score >= 7 ? 'good' : formData.rating_score >= 4 ? 'warn' : 'poor'}`}>
                                {formData.rating_score}
                            </span>
                        </div>
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Comments</label>
                        <textarea
                            required
                            value={formData.comments}
                            onChange={(event) => setFormData({ ...formData, comments: event.target.value })}
                            placeholder="Enter evaluation comments..."
                            className="sm-form-textarea"
                        />
                    </div>
                    <div className="sm-form-actions">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="sm-btn-secondary"
                            disabled={createEvaluationMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={createEvaluationMutation.isPending}>
                            {createEvaluationMutation.isPending ? 'Saving...' : 'Save Evaluation'}
                        </button>
                    </div>
                </form>
            </Modal>
        </TableCard>
    );
});

export default TeacherMonitoring;
