import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Users,
    Calendar,
    AlertTriangle,
    Plus,
    CheckCircle,
    GraduationCap,
    Layers,
    Edit,
    Building,
    UserCheck,
    Trash2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import managerService from '../../services/managerService';
import Modal from '../../components/ui/Modal';
import './SchoolManager.css';

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
            .map((value) => (Array.isArray(value) ? value[0] : value))
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

const runMobileAction = (event, actions) => {
    const action = event.target.value;
    event.target.value = '';
    if (!action || !actions[action]) return;
    actions[action]();
};

const RowActions = ({
    isActive,
    onUpdate,
    onActivate,
    onDeactivate,
    updateTitle = 'Update',
    activateTitle = 'Activate',
    deactivateTitle = 'Deactivate'
}) => (
    <>
        <div className="table-actions sm-row-actions-desktop">
            <button
                type="button"
                className="icon-btn"
                title={updateTitle}
                onClick={onUpdate}
                style={{ color: 'var(--color-primary)' }}
            >
                <Edit size={17} />
            </button>
            {isActive ? (
                <button
                    type="button"
                    className="icon-btn danger"
                    title={deactivateTitle}
                    onClick={onDeactivate}
                >
                    <Trash2 size={17} />
                </button>
            ) : (
                <button
                    type="button"
                    className="icon-btn success"
                    title={activateTitle}
                    onClick={onActivate}
                >
                    <UserCheck size={17} />
                </button>
            )}
        </div>
        <div className="sm-row-actions-mobile">
            <select
                className="sm-action-select"
                defaultValue=""
                onChange={(event) =>
                    runMobileAction(event, {
                        update: onUpdate,
                        activate: onActivate,
                        deactivate: onDeactivate
                    })
                }
            >
                <option value="">Actions</option>
                <option value="update">Update</option>
                {isActive ? (
                    <option value="deactivate">Deactivate</option>
                ) : (
                    <option value="activate">Activate</option>
                )}
            </select>
        </div>
    </>
);

const AcademicConfiguration = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('subjects');
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);

    const schoolId = user?.school_id || user?.school?.id || user?.school;
    const hasActiveAcademicYear = academicYears.some(ay => ay.is_active);

    useEffect(() => {
        // Debug logging
        console.log('User object:', user);
        console.log('School ID:', schoolId);

        const fetchData = async () => {
            if (!schoolId) {
                console.warn('No school ID found for user. User object:', user);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [coursesData, teachersData, academicYearsData] = await Promise.all([
                    managerService.getCourses(schoolId, { include_inactive: true }),
                    managerService.getTeachers(),
                    managerService.getAcademicYears({ school_id: schoolId, include_inactive: true })
                ]);
                setCourses(coursesData.results || coursesData || []);
                setTeachers(teachersData.results || teachersData || []);
                setAcademicYears(academicYearsData.results || academicYearsData || []);
            } catch (error) {
                console.error('Failed to fetch academic configuration data:', error);
                setCourses([]);
                setTeachers([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [schoolId, user]);

    const fetchCourses = async () => {
        if (!schoolId) return;
        try {
            const data = await managerService.getCourses(schoolId, { include_inactive: true });
            setCourses(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
            setCourses([]);
        }
    }

    const fetchAcademicYears = async () => {
        if (!schoolId) return;
        try {
            const data = await managerService.getAcademicYears({ school_id: schoolId, include_inactive: true });
            setAcademicYears(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch academic years:', error);
            setAcademicYears([]);
        }
    }

    // Mock conflicts - keep for UI demonstration until backend supports it
    const [conflicts] = useState([
        { id: 1, type: 'Room Double Booking', description: 'Room 101 booked for Math 1-A and Sci 1-B at Monday 9:00 AM', severity: 'High' },
        { id: 2, type: 'Teacher Overlap', description: 'Mr. Smith assigned to 1-A and 1-B at Tuesday 10:00 AM', severity: 'High' },
    ]);

    const renderTabContent = () => {
        if (loading) return <div>Loading...</div>;
        switch (activeTab) {
            case 'subjects':
                return <SubjectAllocation courses={courses} schoolId={schoolId} onCourseUpdated={fetchCourses} />;
            case 'classrooms':
                return <ClassroomManagement schoolId={schoolId} academicYears={academicYears} />;
            case 'teachers':
                return <TeacherAllocation courses={courses} teachers={teachers} schoolId={schoolId} onCourseUpdated={fetchCourses} hasActiveAcademicYear={hasActiveAcademicYear} />;
            case 'timetable':
                return <TimetableGenerator />;
            case 'conflicts':
                return <ConflictDetection conflicts={conflicts} />;
            default:
                return <SubjectAllocation courses={courses} schoolId={schoolId} onCourseUpdated={fetchCourses} />;
        }
    };

    const tabs = [
        { id: 'subjects', label: 'Subjects', icon: BookOpen },
        { id: 'classrooms', label: 'Classrooms', icon: Building },
        { id: 'teachers', label: 'Teachers', icon: Users },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
    ];

    return (
        <div className="academic-config-page">
            {/* Clean Header - No Subtitle */}
            <div className="school-manager-header" style={{ marginBottom: '1.5rem' }}>
                <h1 className="school-manager-title">{t('school.config.title') || 'Academic Configuration'}</h1>
            </div>

            {/* Warning banner when no active academic year */}
            {!loading && !hasActiveAcademicYear && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.5rem', marginBottom: '1.5rem',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px', color: '#92400e',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
                }}>
                    <div style={{
                        background: '#f59e0b',
                        borderRadius: '50%',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertTriangle size={18} color="#fff" />
                    </div>
                    <div>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>No Active Academic Year</strong>
                        <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Create and activate an academic year to enable teacher assignments.</span>
                    </div>
                </div>
            )}

            {/* Enhanced Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                padding: '0.5rem',
                background: 'var(--color-bg-body)',
                borderRadius: '14px',
                border: '1px solid var(--color-border)',
                flexWrap: 'wrap'
            }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '0.75rem 1.25rem',
                                borderRadius: '10px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                transition: 'all 0.2s ease',
                                background: isActive ? 'var(--color-primary)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--color-text-muted)',
                                boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
                                position: 'relative'
                            }}
                        >
                            <Icon size={18} strokeWidth={2.25} />
                            {tab.label}
                            {tab.hasWarning && (
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: isActive ? '#fff' : '#ef4444',
                                    display: 'inline-block',
                                    marginLeft: '4px',
                                    animation: 'pulse 2s infinite'
                                }} />
                            )}
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

// ============================================
// Academic Year Management Tab
// ============================================
export const AcademicYearManagement = ({ academicYears, schoolId, onUpdated }) => {
    const { showSuccess, showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ start_date: '', end_date: '' });
    const [saving, setSaving] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!schoolId) {
            showError('Error: School ID not found.');
            return;
        }
        setSaving(true);
        try {
            await managerService.createAcademicYear({
                school: parseInt(schoolId),
                start_date: formData.start_date,
                end_date: formData.end_date
            });
            showSuccess('Academic year created successfully.');
            setIsModalOpen(false);
            setFormData({ start_date: '', end_date: '' });
            onUpdated();
        } catch (error) {
            console.error('Failed to create academic year:', error);
            const msg = error?.response?.data?.detail || error?.response?.data?.non_field_errors?.[0] || error.message || 'Failed to create academic year.';
            showError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (ay) => {
        try {
            if (ay.is_active) {
                await managerService.deactivateAcademicYear(ay.id);
                showSuccess('Academic year deactivated.');
            } else {
                await managerService.activateAcademicYear(ay.id);
                showSuccess('Academic year activated.');
            }
            onUpdated();
        } catch (error) {
            console.error('Failed to toggle status:', error);
            showError(error?.response?.data?.detail || 'Failed to update academic year status.');
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Academic Years</h3>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Create Academic Year
                </button>
            </div>

            {academicYears.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <GraduationCap size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                        No Academic Years Configured
                    </h3>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Create an academic year to enable teacher assignments and course management.
                    </p>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Create First Academic Year
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Academic Year</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {academicYears.map((ay) => (
                            <tr key={ay.id}>
                                <td style={{ fontWeight: 600 }}>{ay.academic_year_code}</td>
                                <td>{ay.start_date}</td>
                                <td>{ay.end_date}</td>
                                <td>
                                    <span
                                        className={`status-badge ${ay.is_active ? 'status-active' : 'status-inactive'}`}
                                        onClick={() => handleToggleStatus(ay)}
                                        style={{ cursor: 'pointer' }}
                                        title={ay.is_active ? 'Click to deactivate' : 'Click to activate'}
                                    >
                                        {ay.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Create Academic Year Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-surface)', padding: '2rem', borderRadius: '0.5rem', width: '420px',
                        border: '1px solid var(--color-border)'
                    }}>
                        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Create Academic Year</h2>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            The academic year code will be auto-generated from the dates (e.g. 2025-2026).
                        </p>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-main)' }}>Start Date</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem', color: 'var(--color-text-main)', background: 'var(--color-bg-surface)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-main)' }}>End Date</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem', color: 'var(--color-text-main)', background: 'var(--color-bg-surface)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

// Sub-components for Tabs
export const GradeManagement = () => {
    const { showSuccess, showError, showWarning } = useToast();
    const [grades, setGrades] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingGrade, setEditingGrade] = useState(null);
    const [pendingStatusAction, setPendingStatusAction] = useState(null);
    const [togglingGradeId, setTogglingGradeId] = useState(null);
    const [formData, setFormData] = useState({ name: '', numeric_level: '', min_age: '', max_age: '' });
    const [editFormData, setEditFormData] = useState({ name: '', numeric_level: '', min_age: '', max_age: '' });

    const fetchGrades = async () => {
        try {
            const data = await managerService.getGrades({ include_inactive: true });
            setGrades(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
            setGrades([]);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    const resetCreateForm = () => {
        setFormData({ name: '', numeric_level: '', min_age: '', max_age: '' });
    };

    const validateAges = (minAge, maxAge) => {
        if (Number.parseInt(minAge, 10) > Number.parseInt(maxAge, 10)) {
            showWarning('Minimum age must be less than or equal to maximum age.');
            return false;
        }
        return true;
    };

    const handleCreateGrade = async (event) => {
        event.preventDefault();
        if (!formData.name || !formData.numeric_level || !formData.min_age || !formData.max_age) {
            showWarning('Please complete all grade fields.');
            return;
        }
        if (!validateAges(formData.min_age, formData.max_age)) {
            return;
        }

        setSaving(true);
        try {
            const createdGrade = await managerService.createGrade({
                name: formData.name.trim(),
                numeric_level: Number.parseInt(formData.numeric_level, 10),
                min_age: Number.parseInt(formData.min_age, 10),
                max_age: Number.parseInt(formData.max_age, 10),
            });
            setGrades((prev) => [...prev, createdGrade].sort((a, b) => a.numeric_level - b.numeric_level));
            showSuccess('Grade created successfully.');
            setIsCreateModalOpen(false);
            resetCreateForm();
        } catch (error) {
            console.error('Failed to create grade:', error);
            showError(getErrorMessage(error, 'Failed to create grade.'));
        } finally {
            setSaving(false);
        }
    };

    const handleOpenEdit = (grade) => {
        if (!grade.is_active) {
            showError('Cannot update an inactive grade. Activate it first.');
            return;
        }
        setEditingGrade(grade);
        setEditFormData({
            name: grade.name || '',
            numeric_level: String(grade.numeric_level || ''),
            min_age: String(grade.min_age || ''),
            max_age: String(grade.max_age || ''),
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateGrade = async (event) => {
        event.preventDefault();
        if (!editingGrade) return;
        if (!editFormData.name || !editFormData.numeric_level || !editFormData.min_age || !editFormData.max_age) {
            showWarning('Please complete all grade fields.');
            return;
        }
        if (!validateAges(editFormData.min_age, editFormData.max_age)) {
            return;
        }

        setSaving(true);
        try {
            const updated = await managerService.updateGrade(editingGrade.id, {
                name: editFormData.name.trim(),
                numeric_level: Number.parseInt(editFormData.numeric_level, 10),
                min_age: Number.parseInt(editFormData.min_age, 10),
                max_age: Number.parseInt(editFormData.max_age, 10),
            });
            setGrades((prev) => prev
                .map((grade) => (grade.id === updated.id ? updated : grade))
                .sort((a, b) => a.numeric_level - b.numeric_level));
            showSuccess('Grade updated successfully.');
            setIsEditModalOpen(false);
            setEditingGrade(null);
        } catch (error) {
            console.error('Failed to update grade:', error);
            showError(getErrorMessage(error, 'Failed to update grade.'));
        } finally {
            setSaving(false);
        }
    };

    const updateGradeStatus = async (grade, nextIsActive) => {
        if (nextIsActive) {
            await managerService.activateGrade(grade.id);
        } else {
            await managerService.deactivateGrade(grade.id);
        }
        setGrades((prev) =>
            prev.map((item) =>
                item.id === grade.id
                    ? { ...item, is_active: nextIsActive }
                    : item
            )
        );
        showSuccess(nextIsActive ? 'Grade activated.' : 'Grade deactivated.');
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusAction) return;
        try {
            await updateGradeStatus(pendingStatusAction.grade, pendingStatusAction.nextIsActive);
            setPendingStatusAction(null);
        } catch (error) {
            console.error('Failed to update grade status:', error);
            showError(getErrorMessage(error, 'Failed to update grade status.'));
        }
    };

    const handleStatusBadgeToggle = async (grade) => {
        if (togglingGradeId) return;

        setTogglingGradeId(grade.id);
        try {
            const response = await managerService.toggleGradeStatus(grade.id);
            setGrades((prev) =>
                prev.map((item) =>
                    item.id === grade.id
                        ? { ...item, is_active: response.is_active }
                        : item
                )
            );
            showSuccess(response.message || 'Grade status updated.');
        } catch (error) {
            console.error('Failed to toggle grade status:', error);
            showError(getErrorMessage(error, 'Failed to update grade status.'));
        } finally {
            setTogglingGradeId(null);
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Grade Management</h3>
                <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={18} />
                    Add Grade
                </button>
            </div>

            {grades.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No grades found. Create your first grade.
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Grade</th>
                            <th>Level</th>
                            <th>Age Range</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map((grade) => (
                            <tr key={grade.id} className={grade.is_active ? '' : 'inactive-row'}>
                                <td style={{ fontWeight: 600 }}>{grade.name}</td>
                                <td>{grade.numeric_level}</td>
                                <td>{grade.min_age} - {grade.max_age}</td>
                                <td>
                                    <span
                                        className={`status-badge ${grade.is_active ? 'status-active' : 'status-inactive'}`}
                                        onClick={() => handleStatusBadgeToggle(grade)}
                                        style={{
                                            cursor: togglingGradeId === grade.id ? 'wait' : 'pointer',
                                            opacity: togglingGradeId === grade.id ? 0.75 : 1
                                        }}
                                        title={togglingGradeId === grade.id ? 'Updating status...' : 'Click to toggle status'}
                                    >
                                        {togglingGradeId === grade.id ? 'Updating...' : (grade.is_active ? 'Active' : 'Inactive')}
                                    </span>
                                </td>
                                <td>
                                    <RowActions
                                        isActive={grade.is_active}
                                        onUpdate={() => handleOpenEdit(grade)}
                                        onActivate={() => setPendingStatusAction({ grade, nextIsActive: true })}
                                        onDeactivate={() => setPendingStatusAction({ grade, nextIsActive: false })}
                                        updateTitle="Update Grade"
                                        activateTitle="Activate Grade"
                                        deactivateTitle="Deactivate Grade"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Grade">
                <form onSubmit={handleCreateGrade} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Grade Name</label>
                        <input
                            required
                            value={formData.name}
                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                            placeholder="e.g. Grade 7"
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Numeric Level</label>
                        <input
                            required
                            type="number"
                            min="1"
                            value={formData.numeric_level}
                            onChange={(event) => setFormData({ ...formData, numeric_level: event.target.value })}
                            placeholder="e.g. 7"
                            className="sm-form-input"
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="sm-form-field">
                            <label className="sm-form-label">Min Age</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={formData.min_age}
                                onChange={(event) => setFormData({ ...formData, min_age: event.target.value })}
                                className="sm-form-input"
                            />
                        </div>
                        <div className="sm-form-field">
                            <label className="sm-form-label">Max Age</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={formData.max_age}
                                onChange={(event) => setFormData({ ...formData, max_age: event.target.value })}
                                className="sm-form-input"
                            />
                        </div>
                    </div>
                    <div className="sm-form-actions">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="sm-btn-secondary"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Add Grade'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Grade">
                <form onSubmit={handleUpdateGrade} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Grade Name</label>
                        <input
                            required
                            value={editFormData.name}
                            onChange={(event) => setEditFormData({ ...editFormData, name: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Numeric Level</label>
                        <input
                            required
                            type="number"
                            min="1"
                            value={editFormData.numeric_level}
                            onChange={(event) => setEditFormData({ ...editFormData, numeric_level: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="sm-form-field">
                            <label className="sm-form-label">Min Age</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={editFormData.min_age}
                                onChange={(event) => setEditFormData({ ...editFormData, min_age: event.target.value })}
                                className="sm-form-input"
                            />
                        </div>
                        <div className="sm-form-field">
                            <label className="sm-form-label">Max Age</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={editFormData.max_age}
                                onChange={(event) => setEditFormData({ ...editFormData, max_age: event.target.value })}
                                className="sm-form-input"
                            />
                        </div>
                    </div>
                    <div className="sm-form-actions">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="sm-btn-secondary" disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Update Grade'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={Boolean(pendingStatusAction)}
                onClose={() => setPendingStatusAction(null)}
                title={pendingStatusAction?.nextIsActive ? 'Activate Grade' : 'Deactivate Grade'}
            >
                <p className="sm-confirm-copy">
                    Are you sure you want to {pendingStatusAction?.nextIsActive ? 'activate' : 'deactivate'}{' '}
                    <strong>{pendingStatusAction?.grade?.name}</strong>?
                </p>
                <div className="sm-form-actions">
                    <button type="button" onClick={() => setPendingStatusAction(null)} className="sm-btn-secondary">
                        Cancel
                    </button>
                    <button type="button" onClick={confirmStatusChange} className="btn-primary">
                        Confirm
                    </button>
                </div>
            </Modal>
        </div>
    );
};

const SubjectAllocation = ({ courses, schoolId, onCourseUpdated }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [grades, setGrades] = useState([]);
    const [editingSubject, setEditingSubject] = useState(null);
    const [pendingStatusAction, setPendingStatusAction] = useState(null);
    const [formData, setFormData] = useState({ grade_id: '', course_code: '', name: '' });
    const [editFormData, setEditFormData] = useState({ grade_id: '', course_code: '', name: '' });
    const [gradeForm, setGradeForm] = useState({ name: '', numeric_level: '', min_age: '', max_age: '' });
    const [creatingGrade, setCreatingGrade] = useState(false);
    const [savingSubject, setSavingSubject] = useState(false);
    const [togglingCourseId, setTogglingCourseId] = useState(null);
    const [courseStatusOverrides, setCourseStatusOverrides] = useState({});

    const fetchGrades = async () => {
        try {
            const data = await managerService.getGrades({ include_inactive: false });
            setGrades(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
            setGrades([]);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    const handleSave = async (event) => {
        event.preventDefault();
        if (!schoolId) {
            showError('School ID not found. Please log out and log in again.');
            return;
        }

        setSavingSubject(true);
        try {
            await managerService.createCourse(schoolId, {
                ...formData,
                grade_id: Number.parseInt(formData.grade_id, 10)
            });
            onCourseUpdated();
            setIsModalOpen(false);
            setFormData({ grade_id: '', course_code: '', name: '' });
            showSuccess('Subject created successfully.');
        } catch (error) {
            console.error('Failed to create subject:', error);
            showError(getErrorMessage(error, 'Failed to create subject.'));
        } finally {
            setSavingSubject(false);
        }
    };

    const handleOpenEdit = (subject) => {
        if (!subject.is_active) {
            showError('Cannot update an inactive subject. Activate it first.');
            return;
        }
        setEditingSubject(subject);
        setEditFormData({
            grade_id: String(subject.grade || ''),
            course_code: subject.course_code || '',
            name: subject.name || '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubject = async (event) => {
        event.preventDefault();
        if (!editingSubject) return;

        setSavingSubject(true);
        try {
            await managerService.updateCourse(schoolId, editingSubject.id, {
                grade_id: Number.parseInt(editFormData.grade_id, 10),
                course_code: editFormData.course_code.trim(),
                name: editFormData.name.trim(),
            });
            onCourseUpdated();
            setIsEditModalOpen(false);
            setEditingSubject(null);
            showSuccess('Subject updated successfully.');
        } catch (error) {
            console.error('Failed to update subject:', error);
            showError(getErrorMessage(error, 'Failed to update subject.'));
        } finally {
            setSavingSubject(false);
        }
    };

    const handleCreateGrade = async (event) => {
        event.preventDefault();
        if (!gradeForm.name || !gradeForm.numeric_level || !gradeForm.min_age || !gradeForm.max_age) {
            showWarning('Please fill all grade fields.');
            return;
        }
        setCreatingGrade(true);
        try {
            const created = await managerService.createGrade({
                name: gradeForm.name.trim(),
                numeric_level: Number.parseInt(gradeForm.numeric_level, 10),
                min_age: Number.parseInt(gradeForm.min_age, 10),
                max_age: Number.parseInt(gradeForm.max_age, 10),
            });
            showSuccess('Grade created successfully.');
            setIsGradeModalOpen(false);
            setGradeForm({ name: '', numeric_level: '', min_age: '', max_age: '' });
            await fetchGrades();
            if (created?.id) {
                setFormData((prev) => ({ ...prev, grade_id: String(created.id) }));
            }
        } catch (error) {
            console.error('Failed to create grade:', error);
            showError(getErrorMessage(error, 'Failed to create grade.'));
        } finally {
            setCreatingGrade(false);
        }
    };

    const updateSubjectStatus = async (subject, nextIsActive) => {
        if (nextIsActive) {
            await managerService.activateCourse(schoolId, subject.id);
        } else {
            await managerService.deactivateCourse(schoolId, subject.id);
        }
        onCourseUpdated();
        showSuccess(nextIsActive ? 'Subject activated successfully.' : 'Subject deactivated successfully.');
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusAction) return;
        try {
            await updateSubjectStatus(pendingStatusAction.subject, pendingStatusAction.nextIsActive);
            setPendingStatusAction(null);
        } catch (error) {
            console.error('Failed to update subject status:', error);
            showError(getErrorMessage(error, 'Failed to update subject status.'));
        }
    };

    const handleStatusBadgeToggle = async (subject) => {
        if (!schoolId || togglingCourseId) return;

        setTogglingCourseId(subject.id);
        try {
            const response = await managerService.toggleCourseStatus(schoolId, subject.id);
            setCourseStatusOverrides((prev) => ({ ...prev, [subject.id]: response.is_active }));
            showSuccess(response.message || 'Subject status updated.');
            onCourseUpdated();
        } catch (error) {
            console.error('Failed to toggle subject status:', error);
            showError(getErrorMessage(error, 'Failed to update subject status.'));
        } finally {
            setTogglingCourseId(null);
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Subject Allocations</h3>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Add Subject
                </button>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Grade</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="sm-empty-state">No subjects found.</td>
                        </tr>
                    ) : courses.map((item) => {
                        const isCourseActive = courseStatusOverrides[item.id] ?? item.is_active;
                        return (
                        <tr key={item.id} className={isCourseActive ? '' : 'inactive-row'}>
                            <td>{item.grade_name || item.grade}</td>
                            <td>{item.course_code}</td>
                            <td>{item.name}</td>
                            <td>
                                <span
                                    className={`status-badge ${isCourseActive ? 'status-active' : 'status-inactive'}`}
                                    onClick={() => handleStatusBadgeToggle(item)}
                                    style={{
                                        cursor: togglingCourseId === item.id ? 'wait' : 'pointer',
                                        opacity: togglingCourseId === item.id ? 0.75 : 1
                                    }}
                                    title={togglingCourseId === item.id ? 'Updating status...' : 'Click to toggle status'}
                                >
                                    {togglingCourseId === item.id ? 'Updating...' : (isCourseActive ? 'Active' : 'Inactive')}
                                </span>
                            </td>
                            <td>
                                <RowActions
                                    isActive={isCourseActive}
                                    onUpdate={() => handleOpenEdit(item)}
                                    onActivate={() => setPendingStatusAction({ subject: item, nextIsActive: true })}
                                    onDeactivate={() => setPendingStatusAction({ subject: item, nextIsActive: false })}
                                    updateTitle="Update Subject"
                                    activateTitle="Activate Subject"
                                    deactivateTitle="Deactivate Subject"
                                />
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Subject to School">
                <form onSubmit={handleSave} className="sm-modal-form">
                    <div className="sm-form-field">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <label className="sm-form-label" style={{ marginBottom: 0 }}>Grade</label>
                            <button
                                type="button"
                                onClick={() => setIsGradeModalOpen(true)}
                                style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                                + Add Grade
                            </button>
                        </div>
                        <select
                            required
                            value={formData.grade_id}
                            onChange={(event) => setFormData({ ...formData, grade_id: event.target.value })}
                            className="sm-form-select"
                        >
                            <option value="">Select Grade</option>
                            {grades.map((grade) => (
                                <option key={grade.id} value={grade.id}>{grade.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Course Code</label>
                        <input
                            required
                            placeholder="e.g. MATH101"
                            value={formData.course_code}
                            onChange={(event) => setFormData({ ...formData, course_code: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Name</label>
                        <input
                            required
                            placeholder="e.g. Mathematics"
                            value={formData.name}
                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="sm-btn-secondary" disabled={savingSubject}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={savingSubject}>
                            {savingSubject ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Subject">
                <form onSubmit={handleUpdateSubject} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Grade</label>
                        <select
                            required
                            value={editFormData.grade_id}
                            onChange={(event) => setEditFormData({ ...editFormData, grade_id: event.target.value })}
                            className="sm-form-select"
                        >
                            <option value="">Select Grade</option>
                            {grades.map((grade) => (
                                <option key={grade.id} value={grade.id}>{grade.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Course Code</label>
                        <input
                            required
                            value={editFormData.course_code}
                            onChange={(event) => setEditFormData({ ...editFormData, course_code: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Name</label>
                        <input
                            required
                            value={editFormData.name}
                            onChange={(event) => setEditFormData({ ...editFormData, name: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-actions">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="sm-btn-secondary" disabled={savingSubject}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={savingSubject}>
                            {savingSubject ? 'Saving...' : 'Update Subject'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title="Add Specific Grade">
                <form onSubmit={handleCreateGrade} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Grade Name</label>
                        <input
                            required
                            value={gradeForm.name}
                            onChange={(event) => setGradeForm({ ...gradeForm, name: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Numeric Level</label>
                        <input
                            required
                            type="number"
                            min="1"
                            value={gradeForm.numeric_level}
                            onChange={(event) => setGradeForm({ ...gradeForm, numeric_level: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="sm-form-field">
                            <label className="sm-form-label">Min Age</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={gradeForm.min_age}
                                onChange={(event) => setGradeForm({ ...gradeForm, min_age: event.target.value })}
                                className="sm-form-input"
                            />
                        </div>
                        <div className="sm-form-field">
                            <label className="sm-form-label">Max Age</label>
                            <input
                                required
                                type="number"
                                min="0"
                                value={gradeForm.max_age}
                                onChange={(event) => setGradeForm({ ...gradeForm, max_age: event.target.value })}
                                className="sm-form-input"
                            />
                        </div>
                    </div>
                    <div className="sm-form-actions">
                        <button type="button" onClick={() => setIsGradeModalOpen(false)} className="sm-btn-secondary" disabled={creatingGrade}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={creatingGrade}>
                            {creatingGrade ? 'Saving...' : 'Add Grade'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={Boolean(pendingStatusAction)}
                onClose={() => setPendingStatusAction(null)}
                title={pendingStatusAction?.nextIsActive ? 'Activate Subject' : 'Deactivate Subject'}
            >
                <p className="sm-confirm-copy">
                    Are you sure you want to {pendingStatusAction?.nextIsActive ? 'activate' : 'deactivate'}{' '}
                    <strong>{pendingStatusAction?.subject?.name}</strong>?
                </p>
                <div className="sm-form-actions">
                    <button type="button" onClick={() => setPendingStatusAction(null)} className="sm-btn-secondary">
                        Cancel
                    </button>
                    <button type="button" onClick={confirmStatusChange} className="btn-primary">
                        Confirm
                    </button>
                </div>
            </Modal>
        </div>
    );
};

const TeacherAllocation = ({ courses, teachers, schoolId, onCourseUpdated, hasActiveAcademicYear }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [pendingStatusAction, setPendingStatusAction] = useState(null);
    const [togglingAllocationId, setTogglingAllocationId] = useState(null);
    const [allocationStatusOverrides, setAllocationStatusOverrides] = useState({});

    const handleOpenAssign = (course) => {
        if (!hasActiveAcademicYear) {
            showWarning('No active academic year found. Please go to the "Academic Year" tab and create/activate one first.');
            return;
        }
        if (!course.is_active) {
            showError('Cannot update teacher allocation for an inactive subject.');
            return;
        }
        setSelectedCourse(course);
        setSelectedTeacher('');
        setIsAssignModalOpen(true);
    };

    const handleAssign = async (event) => {
        event.preventDefault();
        if (!selectedCourse || !selectedTeacher) return;

        try {
            await managerService.assignTeacherToCourse(schoolId, selectedCourse.id, selectedTeacher);
            setIsAssignModalOpen(false);
            showSuccess('Teacher allocation updated successfully.');
            onCourseUpdated();
        } catch (error) {
            console.error('Failed to assign teacher:', error);
            showError(getErrorMessage(error, 'Failed to update teacher allocation.'));
        }
    };

    const handleAllocationStatusChange = async (course, nextIsActive) => {
        if (!course?.allocation_id) {
            showWarning('No allocation found for this subject. Assign a teacher first.');
            return;
        }

        const response = await managerService.toggleCourseAllocationStatus(schoolId, course.allocation_id);
        setAllocationStatusOverrides((prev) => ({ ...prev, [course.allocation_id]: response.is_active }));
        onCourseUpdated();
        showSuccess(response.message || (nextIsActive ? 'Teacher allocation activated.' : 'Teacher allocation deactivated.'));
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusAction) return;
        try {
            await handleAllocationStatusChange(pendingStatusAction.course, pendingStatusAction.nextIsActive);
            setPendingStatusAction(null);
        } catch (error) {
            console.error('Failed to update teacher allocation status:', error);
            showError(getErrorMessage(error, 'Failed to update teacher allocation status.'));
        }
    };

    const handleStatusBadgeToggle = async (course) => {
        if (!course?.allocation_id) {
            showWarning('No allocation found for this subject. Assign a teacher first.');
            return;
        }
        if (togglingAllocationId) return;

        setTogglingAllocationId(course.allocation_id);
        try {
            const response = await managerService.toggleCourseAllocationStatus(schoolId, course.allocation_id);
            setAllocationStatusOverrides((prev) => ({ ...prev, [course.allocation_id]: response.is_active }));
            onCourseUpdated();
            showSuccess(response.message || 'Teacher allocation status updated.');
        } catch (error) {
            console.error('Failed to toggle teacher allocation status:', error);
            showError(getErrorMessage(error, 'Failed to update teacher allocation status.'));
        } finally {
            setTogglingAllocationId(null);
        }
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Teacher Allocations</h3>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Grade</th>
                        <th>Classroom Name</th>
                        <th>Assigned Teacher</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                No subjects found. Configure subjects first.
                            </td>
                        </tr>
                    ) : courses.map((item) => {
                        const hasAllocation = Boolean(item.allocation_id);
                        const isAllocationActive = hasAllocation
                            ? (allocationStatusOverrides[item.allocation_id] ?? (item.allocation_is_active !== false))
                            : null;
                        return (
                        <tr key={item.id} className={item.is_active ? '' : 'inactive-row'}>
                            <td>{item.name}</td>
                            <td>{item.grade_name || item.grade}</td>
                            <td>{item.classroom_name || 'Not Allocated'}</td>
                            <td>{item.teacher_name || 'Unassigned'}</td>
                            <td>
                                <span
                                    className={`status-badge ${hasAllocation ? (isAllocationActive ? 'status-active' : 'status-inactive') : 'status-inactive'}`}
                                    onClick={() => handleStatusBadgeToggle(item)}
                                    style={{
                                        cursor: hasAllocation && togglingAllocationId !== item.allocation_id ? 'pointer' : (hasAllocation ? 'wait' : 'not-allowed'),
                                        opacity: togglingAllocationId === item.allocation_id ? 0.75 : (hasAllocation ? 1 : 0.7)
                                    }}
                                    title={
                                        hasAllocation
                                            ? (togglingAllocationId === item.allocation_id ? 'Updating status...' : 'Click to toggle status')
                                            : 'No allocation to toggle'
                                    }
                                >
                                    {togglingAllocationId === item.allocation_id
                                        ? 'Updating...'
                                        : (hasAllocation ? (isAllocationActive ? 'Active' : 'Inactive') : 'Not Allocated')}
                                </span>
                            </td>
                            <td>
                                <RowActions
                                    isActive={hasAllocation ? isAllocationActive : false}
                                    onUpdate={() => handleOpenAssign(item)}
                                    onActivate={() => setPendingStatusAction({ course: item, nextIsActive: true })}
                                    onDeactivate={() => setPendingStatusAction({ course: item, nextIsActive: false })}
                                    updateTitle="Update Allocation"
                                    activateTitle="Activate Allocation"
                                    deactivateTitle="Deactivate Allocation"
                                />
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>

            <Modal
                isOpen={Boolean(pendingStatusAction)}
                onClose={() => setPendingStatusAction(null)}
                title={pendingStatusAction?.nextIsActive ? 'Activate Allocation' : 'Deactivate Allocation'}
            >
                <p className="sm-confirm-copy">
                    Are you sure you want to {pendingStatusAction?.nextIsActive ? 'activate' : 'deactivate'}{' '}
                    <strong>{pendingStatusAction?.course?.name} allocation</strong>?
                </p>
                <div className="sm-form-actions">
                    <button type="button" onClick={() => setPendingStatusAction(null)} className="sm-btn-secondary">
                        Cancel
                    </button>
                    <button type="button" onClick={confirmStatusChange} className="btn-primary">
                        Confirm
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Teacher">
                <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                    Assigning teacher for <strong>{selectedCourse?.name} ({selectedCourse?.grade_name})</strong>
                </p>
                <form onSubmit={handleAssign} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Select Teacher</label>
                        <select
                            required
                            value={selectedTeacher}
                            onChange={(event) => setSelectedTeacher(event.target.value)}
                            className="sm-form-select"
                        >
                            <option value="">Select a teacher...</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.user_id || teacher.id} value={teacher.user_id || teacher.id}>
                                    {teacher.full_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="sm-form-actions">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="sm-btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Assign Teacher
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// ============================================
// Classroom Management Tab
// ============================================
const ClassroomManagement = ({ schoolId, academicYears }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const [classrooms, setClassrooms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [grades, setGrades] = useState([]);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState(null);
    const [pendingStatusAction, setPendingStatusAction] = useState(null);
    const [formData, setFormData] = useState({ grade_id: '', classroom_name: '' });
    const [editFormData, setEditFormData] = useState({ grade_id: '', classroom_name: '' });
    const [saving, setSaving] = useState(false);
    const [loadingClassrooms, setLoadingClassrooms] = useState(false);
    const [togglingClassroomId, setTogglingClassroomId] = useState(null);

    const activeAcademicYear = academicYears.find((year) => year.is_active);

    useEffect(() => {
        if (activeAcademicYear && !selectedAcademicYear) {
            setSelectedAcademicYear(String(activeAcademicYear.id));
        }
    }, [activeAcademicYear, selectedAcademicYear]);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const data = await managerService.getGrades();
                setGrades(data.results || data || []);
            } catch (error) {
                console.error('Failed to fetch grades:', error);
            }
        };
        fetchGrades();
    }, []);

    useEffect(() => {
        if (schoolId && selectedAcademicYear) {
            fetchClassrooms();
            fetchCoursesForYear();
        }
    }, [schoolId, selectedAcademicYear]);

    const fetchCoursesForYear = async () => {
        if (!schoolId) return;
        try {
            const data = await managerService.getCourses(schoolId, { include_inactive: true });
            setCourses(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch courses for classroom teacher mapping:', error);
            setCourses([]);
        }
    };

    const fetchClassrooms = async () => {
        if (!schoolId || !selectedAcademicYear) return;
        setLoadingClassrooms(true);
        try {
            const data = await managerService.getClassrooms(schoolId, selectedAcademicYear, { include_inactive: true });
            setClassrooms(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch classrooms:', error);
            setClassrooms([]);
        } finally {
            setLoadingClassrooms(false);
        }
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        if (!schoolId || !selectedAcademicYear) {
            showWarning('Please select an academic year first.');
            return;
        }
        setSaving(true);
        try {
            const created = await managerService.createClassroom(schoolId, selectedAcademicYear, {
                grade_id: Number.parseInt(formData.grade_id, 10),
                classroom_name: formData.classroom_name
            });
            setClassrooms((prev) => [...prev, created]);
            showSuccess('Classroom created successfully.');
            setIsModalOpen(false);
            setFormData({ grade_id: '', classroom_name: '' });
        } catch (error) {
            console.error('Failed to create classroom:', error);
            showError(getErrorMessage(error, 'Failed to create classroom.'));
        } finally {
            setSaving(false);
        }
    };

    const handleOpenEdit = (classroom) => {
        if (!classroom.is_active) {
            showError('Cannot update an inactive classroom. Activate it first.');
            return;
        }
        setEditingClassroom(classroom);
        setEditFormData({
            grade_id: String(classroom.grade || ''),
            classroom_name: classroom.classroom_name || '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateClassroom = async (event) => {
        event.preventDefault();
        if (!editingClassroom) return;

        setSaving(true);
        try {
            const updated = await managerService.updateClassroom(
                schoolId,
                selectedAcademicYear,
                editingClassroom.id,
                {
                    grade_id: Number.parseInt(editFormData.grade_id, 10),
                    classroom_name: editFormData.classroom_name.trim(),
                }
            );
            setClassrooms((prev) =>
                prev.map((classroom) => (classroom.id === updated.id ? updated : classroom))
            );
            showSuccess('Classroom updated successfully.');
            setIsEditModalOpen(false);
            setEditingClassroom(null);
        } catch (error) {
            console.error('Failed to update classroom:', error);
            showError(getErrorMessage(error, 'Failed to update classroom.'));
        } finally {
            setSaving(false);
        }
    };

    const updateClassroomStatus = async (classroom, nextIsActive) => {
        if (nextIsActive) {
            await managerService.activateClassroom(schoolId, selectedAcademicYear, classroom.id);
        } else {
            await managerService.deactivateClassroom(schoolId, selectedAcademicYear, classroom.id);
        }
        setClassrooms((prev) =>
            prev.map((item) =>
                item.id === classroom.id
                    ? { ...item, is_active: nextIsActive }
                    : item
            )
        );
        showSuccess(nextIsActive ? 'Classroom activated.' : 'Classroom deactivated.');
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusAction) return;
        try {
            await updateClassroomStatus(pendingStatusAction.classroom, pendingStatusAction.nextIsActive);
            setPendingStatusAction(null);
        } catch (error) {
            console.error('Failed to update classroom status:', error);
            showError(getErrorMessage(error, 'Failed to update classroom status.'));
        }
    };

    const handleStatusBadgeToggle = async (classroom) => {
        if (!schoolId || !selectedAcademicYear || togglingClassroomId) return;

        setTogglingClassroomId(classroom.id);
        try {
            const response = await managerService.toggleClassroomStatus(schoolId, selectedAcademicYear, classroom.id);
            setClassrooms((prev) =>
                prev.map((item) =>
                    item.id === classroom.id
                        ? { ...item, is_active: response.is_active }
                        : item
                )
            );
            showSuccess(response.message || 'Classroom status updated.');
        } catch (error) {
            console.error('Failed to toggle classroom status:', error);
            showError(getErrorMessage(error, 'Failed to update classroom status.'));
        } finally {
            setTogglingClassroomId(null);
        }
    };

    const getAssignedTeacherName = (classroom) => {
        if (classroom.homeroom_teacher_name) return classroom.homeroom_teacher_name;
        const courseWithTeacher = courses.find(
            (course) =>
                (course.grade_name || course.grade) === (classroom.grade_name || classroom.grade) &&
                !!course.teacher_name
        );
        return courseWithTeacher?.teacher_name || 'Not assigned';
    };

    return (
        <div className="management-card">
            <div className="table-header-actions">
                <h3 className="chart-title">Classroom Management</h3>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                        value={selectedAcademicYear}
                        onChange={(event) => setSelectedAcademicYear(event.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '0.25rem', fontSize: '0.875rem', color: 'var(--color-text-main)', background: 'var(--color-bg-surface)' }}
                    >
                        <option value="">Select Academic Year</option>
                        {academicYears.map((year) => (
                            <option key={year.id} value={year.id}>
                                {year.academic_year_code} {year.is_active ? '(Active)' : '(Inactive)'}
                            </option>
                        ))}
                    </select>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)} disabled={!selectedAcademicYear}>
                        <Plus size={18} />
                        Add Classroom
                    </button>
                </div>
            </div>

            {!selectedAcademicYear ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Building size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                        Select an Academic Year
                    </h3>
                    <p>Choose an academic year above to manage its classrooms.</p>
                </div>
            ) : loadingClassrooms ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>Loading classrooms...</div>
            ) : classrooms.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Building size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                        No Classrooms Found
                    </h3>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Create classrooms for this academic year to enable teacher assignments.
                    </p>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Create First Classroom
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Classroom Name</th>
                            <th>Grade</th>
                            <th>Homeroom Teacher</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classrooms.map((classroom) => (
                            <tr key={classroom.id} className={classroom.is_active ? '' : 'inactive-row'}>
                                <td style={{ fontWeight: 600 }}>{classroom.classroom_name}</td>
                                <td>{classroom.grade_name || classroom.grade}</td>
                                <td>{getAssignedTeacherName(classroom)}</td>
                                <td>
                                    <span
                                        className={`status-badge ${classroom.is_active ? 'status-active' : 'status-inactive'}`}
                                        onClick={() => handleStatusBadgeToggle(classroom)}
                                        style={{
                                            cursor: togglingClassroomId === classroom.id ? 'wait' : 'pointer',
                                            opacity: togglingClassroomId === classroom.id ? 0.75 : 1
                                        }}
                                        title={togglingClassroomId === classroom.id ? 'Updating status...' : 'Click to toggle status'}
                                    >
                                        {togglingClassroomId === classroom.id ? 'Updating...' : (classroom.is_active ? 'Active' : 'Inactive')}
                                    </span>
                                </td>
                                <td>
                                    <RowActions
                                        isActive={classroom.is_active}
                                        onUpdate={() => handleOpenEdit(classroom)}
                                        onActivate={() => setPendingStatusAction({ classroom, nextIsActive: true })}
                                        onDeactivate={() => setPendingStatusAction({ classroom, nextIsActive: false })}
                                        updateTitle="Update Classroom"
                                        activateTitle="Activate Classroom"
                                        deactivateTitle="Deactivate Classroom"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Classroom">
                <p style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
                    Add a new classroom for the selected academic year.
                </p>
                <form onSubmit={handleCreate} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Grade</label>
                        <select
                            required
                            value={formData.grade_id}
                            onChange={(event) => setFormData({ ...formData, grade_id: event.target.value })}
                            className="sm-form-select"
                        >
                            <option value="">Select Grade</option>
                            {grades.map((grade) => (
                                <option key={grade.id} value={grade.id}>{grade.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Classroom Name</label>
                        <input
                            required
                            placeholder="e.g. Class 1-A"
                            value={formData.classroom_name}
                            onChange={(event) => setFormData({ ...formData, classroom_name: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-actions">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="sm-btn-secondary" disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Update Classroom">
                <form onSubmit={handleUpdateClassroom} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">Grade</label>
                        <select
                            required
                            value={editFormData.grade_id}
                            onChange={(event) => setEditFormData({ ...editFormData, grade_id: event.target.value })}
                            className="sm-form-select"
                        >
                            <option value="">Select Grade</option>
                            {grades.map((grade) => (
                                <option key={grade.id} value={grade.id}>{grade.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm-form-field">
                        <label className="sm-form-label">Classroom Name</label>
                        <input
                            required
                            value={editFormData.classroom_name}
                            onChange={(event) => setEditFormData({ ...editFormData, classroom_name: event.target.value })}
                            className="sm-form-input"
                        />
                    </div>
                    <div className="sm-form-actions">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="sm-btn-secondary" disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Update Classroom'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={Boolean(pendingStatusAction)}
                onClose={() => setPendingStatusAction(null)}
                title={pendingStatusAction?.nextIsActive ? 'Activate Classroom' : 'Deactivate Classroom'}
            >
                <p className="sm-confirm-copy">
                    Are you sure you want to {pendingStatusAction?.nextIsActive ? 'activate' : 'deactivate'}{' '}
                    <strong>{pendingStatusAction?.classroom?.classroom_name}</strong>?
                </p>
                <div className="sm-form-actions">
                    <button type="button" onClick={() => setPendingStatusAction(null)} className="sm-btn-secondary">
                        Cancel
                    </button>
                    <button type="button" onClick={confirmStatusChange} className="btn-primary">
                        Confirm
                    </button>
                </div>
            </Modal>
        </div>
    );
};

const TimetableGenerator = () => {
    const [isGenerated, setIsGenerated] = useState(false);

    const timeSlots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const mockSchedule = {
        'Monday-08:00 AM': 'Math (1-A)',
        'Monday-10:00 AM': 'Science (1-A)',
        'Tuesday-09:00 AM': 'English (1-A)',
        'Wednesday-11:00 AM': 'History (1-A)',
        'Thursday-08:00 AM': 'Math (1-A)',
        'Friday-10:00 AM': 'Art (1-A)',
    };

    return (
        <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="management-card p-6" style={{ padding: '1.5rem' }}>
                <h3 className="chart-title mb-4" style={{ marginBottom: '1rem' }}>Generate Weekly Schedule</h3>
                <p className="text-gray-500 mb-6" style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                    Automatically generate the weekly timetable based on subject allocations and teacher availability.
                </p>
                <div className="flex gap-4" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={() => setIsGenerated(true)}>
                        <Calendar size={18} />
                        {isGenerated ? 'Regenerate Timetable' : 'Generate Timetable'}
                    </button>
                    <button style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0.375rem', background: 'var(--color-bg-surface)', cursor: 'pointer', color: 'var(--color-text-main)' }}>
                        View Constraints
                    </button>
                </div>
            </div>

            <div className="management-card">
                <div className="table-header-actions">
                    <h3 className="chart-title">Generated Timetable Preview</h3>
                </div>
                <div className="p-6" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    {!isGenerated ? (
                        <div style={{ background: 'var(--color-bg-body)', padding: '2rem', borderRadius: '0.5rem', border: '2px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Timetable not yet generated. Click "Generate Timetable" to start.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '0.75rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', textAlign: 'center' }}>Time / Day</th>
                                    {days.map(day => (
                                        <th key={day} style={{ padding: '0.75rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-body)', textAlign: 'center' }}>{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(time => (
                                    <tr key={time}>
                                        <td style={{ padding: '0.75rem', border: '1px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text-muted)' }}>{time}</td>
                                        {days.map(day => {
                                            const key = `${day}-${time}`;
                                            const entry = mockSchedule[key];
                                            return (
                                                <td key={key} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', textAlign: 'center', height: '60px' }}>
                                                    {entry ? (
                                                        <div style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '500' }}>
                                                            {entry}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#cbd5e1' }}>-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConflictDetection = ({ conflicts }) => (
    <div className="flex flex-col gap-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="management-card">
            <div className="table-header-actions" style={{ justifyContent: 'space-between' }}>
                <h3 className="chart-title">System Alerts & Conflicts</h3>
                <button className="btn-primary" style={{ background: 'var(--color-warning)', color: '#000' }}>
                    Run Conflict Check
                </button>
            </div>

            {conflicts.length > 0 ? (
                <div style={{ padding: '0' }}>
                    {conflicts.map((conflict) => (
                        <div key={conflict.id} style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ color: 'var(--color-error)', marginTop: '2px' }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{conflict.type}</h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{conflict.description}</p>
                                <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: '#fee2e2', color: '#991b1b' }}>
                                    {conflict.severity} Severity
                                </span>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <button style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer' }}>
                                    Resolve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle size={48} className="text-green-500" style={{ color: 'var(--color-success)' }} />
                    <h3 className="text-lg font-medium">No Conflicts Detected</h3>
                    <p className="text-gray-500">All academic allocations look good.</p>
                </div>
            )}
        </div>
    </div>
);

export default AcademicConfiguration;
