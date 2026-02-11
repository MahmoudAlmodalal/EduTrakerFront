import React, { memo, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Star, Activity, Clock, Search, Plus, Mail, UserCheck, Trash2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import managerService from '../../services/managerService';
import Modal from '../../components/ui/Modal';
import SearchableSelect from '../../components/ui/SearchableSelect';
import './SchoolManager.css';

const DEFAULT_PASSWORD = 'Teacher@123';
const STAR_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const normalizeList = (response) => {
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response)) return response;
    return [];
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

const getLoginStatus = (lastLogin) => {
    if (!lastLogin) return { text: 'Never logged in', variant: 'never' };

    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffDays = Math.floor((now - lastLoginDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Today', variant: 'today' };
    if (diffDays <= 7) return { text: `${diffDays}d ago`, variant: 'week' };
    if (diffDays <= 30) return { text: `${diffDays}d ago`, variant: 'month' };
    return { text: `${diffDays}d ago`, variant: 'stale' };
};

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
        queryFn: () => managerService.getTeachers({ school_id: schoolId }),
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
        { id: 'performance', label: t('school.teachers.performance') || 'Performance', icon: Star },
        { id: 'activity', label: 'Activity Log', icon: Activity }
    ]), [t]);

    const renderTabContent = () => {
        if (!hasSchoolId) {
            return (
                <QueryErrorState message="School information is missing. Please log in again." />
            );
        }

        if (teachersLoading) {
            return <div className="sm-loading-state">Loading teacher data...</div>;
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
            case 'activity':
                return <ActivityLogs teachers={teachers} />;
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
        <div className="teacher-monitoring-page">
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

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

const TeacherDirectory = memo(function TeacherDirectory({ teachers, schoolId, teachersQueryKey }) {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);
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

    const createTeacherMutation = useMutation({
        mutationFn: (payload) => managerService.createTeacher(payload),
        onSuccess: (createdTeacher) => {
            const createdTeacherId = getTeacherId(createdTeacher);

            if (createdTeacherId) {
                queryClient.setQueryData(teachersQueryKey, (current = []) => {
                    const currentTeachers = Array.isArray(current) ? current : [];
                    if (currentTeachers.some((teacher) => getTeacherId(teacher) === createdTeacherId)) {
                        return currentTeachers;
                    }
                    return [createdTeacher, ...currentTeachers];
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
            queryClient.setQueryData(teachersQueryKey, (current = []) => {
                const currentTeachers = Array.isArray(current) ? current : [];
                return currentTeachers.map((teacher) => (
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

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <div className="sm-search-wrap">
                    <Search size={18} className="sm-search-icon" />
                    <input
                        type="text"
                        placeholder="Search teachers..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="sm-search-input"
                    />
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Add Teacher
                </button>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Specialization</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTeachers.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="sm-empty-state">
                                No teachers found.
                            </td>
                        </tr>
                    ) : filteredTeachers.map((teacher) => {
                        const id = getTeacherId(teacher);
                        const isActive = teacher.is_active !== false;
                        const isUpdatingThisTeacher = updateTeacherStatusMutation.isPending
                            && updateTeacherStatusMutation.variables?.teacherId === id;

                        return (
                            <tr key={id}>
                                <td>
                                    <div className="teacher-row-identity">
                                        <div className="teacher-avatar">
                                            {teacher.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                        </div>
                                        <div>
                                            <div className="teacher-name">{teacher.full_name}</div>
                                            <div className="teacher-email">
                                                <Mail size={12} />
                                                {teacher.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className={`teacher-specialization ${!teacher.specialization ? 'empty' : ''}`}>
                                    {teacher.specialization || 'Not specified'}
                                </td>
                                <td>
                                    <span className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                                        {isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div className="table-actions">
                                        {isActive ? (
                                            <button
                                                onClick={() => requestStatusChange(teacher, false)}
                                                title="Deactivate Teacher"
                                                className="icon-btn danger"
                                                disabled={isUpdatingThisTeacher}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => requestStatusChange(teacher, true)}
                                                title="Activate Teacher"
                                                className="icon-btn success"
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
        </div>
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
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Performance Evaluations</h3>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    New Evaluation
                </button>
            </div>

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
        </div>
    );
});

const ActivityLogs = memo(function ActivityLogs({ teachers }) {
    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Teacher Activity & Presence</h3>
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Teacher</th>
                        <th>Last Login</th>
                        <th>Status</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="sm-empty-state">
                                No teachers found.
                            </td>
                        </tr>
                    ) : (
                        teachers.map((teacher) => {
                            const loginStatus = getLoginStatus(teacher.last_login);
                            return (
                                <tr key={getTeacherId(teacher)}>
                                    <td>
                                        <div className="teacher-row-identity">
                                            <div className="teacher-avatar">
                                                {teacher.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                            </div>
                                            <div>
                                                <div className="teacher-name">{teacher.full_name}</div>
                                                <div className="teacher-email">
                                                    <Mail size={12} />
                                                    {teacher.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="activity-login-wrap">
                                            <Clock size={16} className="activity-login-icon" />
                                            <span className="sm-muted-cell">
                                                {teacher.last_login
                                                    ? new Date(teacher.last_login).toLocaleString()
                                                    : 'Never'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`activity-badge activity-badge--${loginStatus.variant}`}>
                                            {loginStatus.text}
                                        </span>
                                    </td>
                                    <td className="sm-muted-cell">
                                        {teacher.date_joined
                                            ? new Date(teacher.date_joined).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
});

export default TeacherMonitoring;
