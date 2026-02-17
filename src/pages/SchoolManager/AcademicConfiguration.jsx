import React, { useState, useEffect, useMemo } from 'react';
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
    Trash2,
    Copy,
    UserPlus,
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

const TABLE_ROWS_PER_PAGE = 10;

const TablePagination = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPrevious,
    onNext
}) => {
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="sm-table-pagination">
            <span className="sm-table-pagination-summary">
                Showing {startItem}-{endItem} of {totalItems}
            </span>
            <div className="sm-table-pagination-controls">
                <button
                    type="button"
                    className="sm-btn-secondary"
                    onClick={onPrevious}
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
                    onClick={onNext}
                    disabled={currentPage >= totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
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
        const fetchData = async () => {
            if (!schoolId) {
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
                return <ClassroomManagement schoolId={schoolId} academicYears={academicYears} teachers={teachers} />;
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
                <div className="sm-config-warning" style={{
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
            <div className="sm-config-tabs">
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
    // Copy-structure state
    const [copyPrompt, setCopyPrompt] = useState(null); // { targetYear }
    const [copySourceId, setCopySourceId] = useState('');
    const [copying, setCopying] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!schoolId) {
            showError('Error: School ID not found.');
            return;
        }
        setSaving(true);
        try {
            const created = await managerService.createAcademicYear({
                school: parseInt(schoolId),
                start_date: formData.start_date,
                end_date: formData.end_date
            });
            showSuccess('Academic year created successfully.');
            setIsModalOpen(false);
            setFormData({ start_date: '', end_date: '' });
            await onUpdated();
            // If other years exist, prompt to copy structure
            if (academicYears.length > 0 && created?.id) {
                const latestYear = [...academicYears].sort((a, b) => b.id - a.id)[0];
                setCopySourceId(String(latestYear.id));
                setCopyPrompt({ targetYear: created });
            }
        } catch (error) {
            console.error('Failed to create academic year:', error);
            const msg = error?.response?.data?.detail || error?.response?.data?.non_field_errors?.[0] || error.message || 'Failed to create academic year.';
            showError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleCopyStructure = async (targetYearId) => {
        if (!copySourceId) {
            showError('Please select a source year.');
            return;
        }
        setCopying(true);
        try {
            const result = await managerService.copyAcademicYearStructure(targetYearId, parseInt(copySourceId));
            showSuccess(`Copied ${result.copied} classroom(s)${result.skipped > 0 ? `, skipped ${result.skipped} (already exist)` : ''}.`);
            setCopyPrompt(null);
            onUpdated();
        } catch (error) {
            console.error('Failed to copy structure:', error);
            showError(error?.response?.data?.detail || 'Failed to copy classroom structure.');
        } finally {
            setCopying(false);
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
                <div className="sm-table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Academic Year</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Actions</th>
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
                                    <td>
                                        {academicYears.length > 1 && (
                                            <button
                                                type="button"
                                                title="Copy classroom structure from another year into this year"
                                                onClick={() => {
                                                    const other = [...academicYears].filter(y => y.id !== ay.id).sort((a, b) => b.id - a.id)[0];
                                                    setCopySourceId(other ? String(other.id) : '');
                                                    setCopyPrompt({ targetYear: ay });
                                                }}
                                                style={{
                                                    padding: '0.3rem 0.7rem',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                    border: '1px solid var(--color-primary)',
                                                    borderRadius: '6px',
                                                    background: 'transparent',
                                                    color: 'var(--color-primary)',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}
                                            >
                                                <Copy size={13} />
                                                Copy Structure
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Academic Year Modal */}
            {isModalOpen && (
                <div className="sm-modal-backdrop">
                    <div className="sm-modal-panel">
                        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Create Academic Year</h2>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            The academic year code will be auto-generated from the dates (e.g. 2025/2026).
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

            {/* Copy Structure Prompt */}
            {copyPrompt && (
                <div className="sm-modal-backdrop">
                    <div className="sm-modal-panel">
                        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                            Copy Classroom Structure
                        </h2>
                        <p style={{ marginBottom: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                            Copy all classrooms (grade assignments &amp; homeroom teachers) into{' '}
                            <strong>{copyPrompt.targetYear?.academic_year_code}</strong>.
                            Student enrollments and course allocations are <em>not</em> copied — those are set up per year.
                        </p>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                Copy classrooms from:
                            </label>
                            <select
                                value={copySourceId}
                                onChange={e => setCopySourceId(e.target.value)}
                                className="sm-form-select"
                            >
                                <option value="">Select year…</option>
                                {academicYears
                                    .filter(y => y.id !== copyPrompt.targetYear?.id)
                                    .sort((a, b) => b.id - a.id)
                                    .map(y => (
                                        <option key={y.id} value={y.id}>
                                            {y.academic_year_code}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setCopyPrompt(null)}
                                style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '0.25rem', cursor: 'pointer', color: 'var(--color-text-main)' }}
                            >
                                Skip
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                disabled={copying || !copySourceId}
                                onClick={() => handleCopyStructure(copyPrompt.targetYear.id)}
                            >
                                {copying ? 'Copying...' : 'Copy Structure'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// Sub-components for Tabs
export const GradeManagement = () => {
    const { user } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const [grades, setGrades] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYearId, setSelectedYearId] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingGrade, setEditingGrade] = useState(null);
    const [pendingStatusAction, setPendingStatusAction] = useState(null);
    const [togglingGradeId, setTogglingGradeId] = useState(null);
    const [gradePage, setGradePage] = useState(1);
    const [formData, setFormData] = useState({ name: '', numeric_level: '', min_age: '', max_age: '' });
    const [editFormData, setEditFormData] = useState({ name: '', numeric_level: '', min_age: '', max_age: '' });

    const schoolId = user?.school_id || user?.school?.id || user?.school;

    const gradeTotalPages = Math.max(1, Math.ceil(grades.length / TABLE_ROWS_PER_PAGE));
    const activeGradePage = Math.min(gradePage, gradeTotalPages);
    const gradePageStart = (activeGradePage - 1) * TABLE_ROWS_PER_PAGE;
    const paginatedGrades = grades.slice(gradePageStart, gradePageStart + TABLE_ROWS_PER_PAGE);

    const fetchGrades = async (yearId) => {
        try {
            const params = { include_inactive: true };
            if (yearId) {
                params.academic_year_id = yearId;
                if (schoolId) params.school_id = schoolId;
            }
            const data = await managerService.getGrades(params);
            setGrades(data.results || data || []);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
            setGrades([]);
        }
    };

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const yearsData = await (schoolId
                    ? managerService.getAcademicYears({ school_id: schoolId, include_inactive: true })
                    : Promise.resolve([]));
                const years = yearsData.results || yearsData || [];
                setAcademicYears(years);
                // Auto-select the active year and fetch grades filtered by it
                const activeYear = years.find(y => y.is_active);
                const initialYearId = activeYear ? activeYear.id : null;
                if (activeYear) setSelectedYearId(String(activeYear.id));
                await fetchGrades(initialYearId);
            } catch (error) {
                console.error('Failed to fetch grades:', error);
                setGrades([]);
            }
        };
        loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch when year filter changes (skip on mount since loadInitial covers it)
    const isFirstRender = React.useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        fetchGrades(selectedYearId ? parseInt(selectedYearId, 10) : null);
        setGradePage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYearId]);

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
            await fetchGrades(selectedYearId ? parseInt(selectedYearId, 10) : null);
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
            await fetchGrades(selectedYearId ? parseInt(selectedYearId, 10) : null);
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

            {/* Academic Year Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
                    Academic Year:
                </label>
                <select
                    value={selectedYearId}
                    onChange={(e) => setSelectedYearId(e.target.value)}
                    className="sm-form-input"
                    style={{ maxWidth: '220px', padding: '0.4rem 0.6rem' }}
                >
                    <option value="">All Years (global grades)</option>
                    {academicYears.map(ay => (
                        <option key={ay.id} value={String(ay.id)}>
                            {ay.academic_year_code}{ay.is_active ? ' (Active)' : ''}
                        </option>
                    ))}
                </select>
                {selectedYearId && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Showing grades with classrooms in selected year
                    </span>
                )}
            </div>

            {grades.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    {selectedYearId
                        ? 'No grades have classrooms in the selected academic year.'
                        : 'No grades found. Create your first grade.'}
                </div>
            ) : (
                <>
                    <div className="sm-table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Grade</th>
                                    <th>Level</th>
                                    <th>Age Range</th>
                                    {selectedYearId && <th>Classrooms</th>}
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedGrades.map((grade) => (
                                    <tr key={grade.id} className={grade.is_active ? '' : 'inactive-row'}>
                                        <td style={{ fontWeight: 600 }}>{grade.name}</td>
                                        <td>{grade.numeric_level}</td>
                                        <td>{grade.min_age} - {grade.max_age}</td>
                                        {selectedYearId && (
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                    background: 'var(--color-primary-light, #eff6ff)',
                                                    color: 'var(--color-primary, #2563eb)',
                                                    borderRadius: '0.75rem',
                                                    padding: '0.15rem 0.6rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}>
                                                    <Building size={12} />
                                                    {grade.classroom_count ?? 0}
                                                </span>
                                            </td>
                                        )}
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
                    </div>
                    <TablePagination
                        currentPage={activeGradePage}
                        totalPages={gradeTotalPages}
                        totalItems={grades.length}
                        pageSize={TABLE_ROWS_PER_PAGE}
                        onPrevious={() => setGradePage((prev) => Math.max(1, prev - 1))}
                        onNext={() => setGradePage((prev) => Math.min(gradeTotalPages, prev + 1))}
                    />
                </>
            )}

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Grade">
                <form onSubmit={handleCreateGrade} className="sm-modal-form">
                    <div className="sm-form-field">
                        <label className="sm-form-label">
                            <Calendar size={14} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: 'middle' }} />
                            Academic Year
                        </label>
                        <input
                            readOnly
                            className="sm-form-input"
                            style={{ background: 'var(--color-bg-secondary, #f9fafb)', cursor: 'default', color: 'var(--color-text-secondary)' }}
                            value={
                                (() => {
                                    const activeYear = academicYears.find(y => y.is_active);
                                    return activeYear ? `${activeYear.academic_year_code} (Active)` : 'No active academic year';
                                })()
                            }
                        />
                    </div>
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
                    <div className="sm-form-grid-two">
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
                    <div className="sm-form-grid-two">
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
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectPage, setSubjectPage] = useState(1);
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

    const gradeFilterOptions = useMemo(() => {
        return Array.from(
            new Set(
                courses
                    .map((course) => course.grade_name || course.grade)
                    .filter(Boolean)
                    .map((gradeName) => String(gradeName))
            )
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }, [courses]);

    const filteredCourses = useMemo(() => {
        if (!gradeFilter) return courses;
        return courses.filter((course) => String(course.grade_name || course.grade || '') === gradeFilter);
    }, [courses, gradeFilter]);

    const subjectTotalPages = Math.max(1, Math.ceil(filteredCourses.length / TABLE_ROWS_PER_PAGE));
    const activeSubjectPage = Math.min(subjectPage, subjectTotalPages);
    const subjectPageStart = (activeSubjectPage - 1) * TABLE_ROWS_PER_PAGE;
    const paginatedCourses = useMemo(
        () => filteredCourses.slice(subjectPageStart, subjectPageStart + TABLE_ROWS_PER_PAGE),
        [filteredCourses, subjectPageStart]
    );

    useEffect(() => {
        setSubjectPage(1);
    }, [gradeFilter]);

    useEffect(() => {
        if (subjectPage > subjectTotalPages) {
            setSubjectPage(subjectTotalPages);
        }
    }, [subjectPage, subjectTotalPages]);

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
                <div className="sm-inline-controls sm-subject-actions">
                    <select
                        className="sm-form-select sm-select-control"
                        value={gradeFilter}
                        onChange={(event) => setGradeFilter(event.target.value)}
                    >
                        <option value="">All Grades</option>
                        {gradeFilterOptions.map((gradeName) => (
                            <option key={gradeName} value={gradeName}>
                                {gradeName}
                            </option>
                        ))}
                    </select>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Add Subject
                    </button>
                </div>
            </div>
            <div className="sm-table-scroll sm-config-responsive-scroll">
                <table className="data-table sm-config-responsive-table sm-subject-allocation-table">
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
                        ) : filteredCourses.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="sm-empty-state">No subjects match the selected grade.</td>
                            </tr>
                        ) : paginatedCourses.map((item) => {
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
            </div>
            <TablePagination
                currentPage={activeSubjectPage}
                totalPages={subjectTotalPages}
                totalItems={filteredCourses.length}
                pageSize={TABLE_ROWS_PER_PAGE}
                onPrevious={() => setSubjectPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setSubjectPage((prev) => Math.min(subjectTotalPages, prev + 1))}
            />

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
                    <div className="sm-form-grid-two">
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
    const [classroomFilter, setClassroomFilter] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');
    const [allocationPage, setAllocationPage] = useState(1);
    const [pendingStatusAction, setPendingStatusAction] = useState(null);
    const [togglingAllocationId, setTogglingAllocationId] = useState(null);
    const [allocationStatusOverrides, setAllocationStatusOverrides] = useState({});

    /* Collect all unique classroom names across all courses */
    const classroomOptions = useMemo(() => {
        const names = new Set();
        courses.forEach((course) => {
            (course.all_classrooms || []).forEach((c) => {
                if (c.classroom_name) names.add(c.classroom_name);
            });
            // fallback for older API responses
            if (course.classroom_name) names.add(course.classroom_name);
        });
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }, [courses]);

    const teacherOptions = useMemo(() => {
        return Array.from(
            new Set(
                [
                    ...courses.map((course) => course.teacher_name).filter(Boolean),
                    ...teachers.map((teacher) => teacher.full_name).filter(Boolean),
                ]
            )
        ).sort((a, b) => a.localeCompare(b));
    }, [courses, teachers]);

    const filteredCourses = useMemo(() => {
        return courses.filter((course) => {
            const classrooms = course.all_classrooms || [];
            const matchesClassroom = !classroomFilter || classrooms.some((c) => c.classroom_name === classroomFilter);
            const matchesTeacher = !teacherFilter || (course.teacher_name || '') === teacherFilter;
            return matchesClassroom && matchesTeacher;
        });
    }, [courses, classroomFilter, teacherFilter]);

    const allocationTotalPages = Math.max(1, Math.ceil(filteredCourses.length / TABLE_ROWS_PER_PAGE));
    const activeAllocationPage = Math.min(allocationPage, allocationTotalPages);
    const allocationPageStart = (activeAllocationPage - 1) * TABLE_ROWS_PER_PAGE;
    const paginatedAllocations = useMemo(
        () => filteredCourses.slice(allocationPageStart, allocationPageStart + TABLE_ROWS_PER_PAGE),
        [filteredCourses, allocationPageStart]
    );

    useEffect(() => {
        setAllocationPage(1);
    }, [classroomFilter, teacherFilter]);

    useEffect(() => {
        if (allocationPage > allocationTotalPages) {
            setAllocationPage(allocationTotalPages);
        }
    }, [allocationPage, allocationTotalPages]);

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
        // Pre-select the currently assigned teacher if any
        const currentTeacher = teachers.find(
            (t) => t.full_name === course.teacher_name
        );
        setSelectedTeacher(currentTeacher ? String(currentTeacher.user_id || currentTeacher.id) : '');
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
                <div>
                    <h3 className="chart-title" style={{ marginBottom: '0.2rem' }}>Teacher Allocations</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        Click <strong>Assign Teacher</strong> on any subject row to assign or change the teacher.
                        Classroom badges show per-classroom status — click to toggle.
                    </p>
                </div>
                <div className="sm-inline-controls sm-allocation-filters">
                    <select
                        className="sm-form-select sm-select-control"
                        value={classroomFilter}
                        onChange={(event) => setClassroomFilter(event.target.value)}
                    >
                        <option value="">All Classrooms</option>
                        {classroomOptions.map((classroomName) => (
                            <option key={classroomName} value={classroomName}>
                                {classroomName}
                            </option>
                        ))}
                    </select>
                    <select
                        className="sm-form-select sm-select-control"
                        value={teacherFilter}
                        onChange={(event) => setTeacherFilter(event.target.value)}
                    >
                        <option value="">All Teachers</option>
                        {teacherOptions.map((teacherName) => (
                            <option key={teacherName} value={teacherName}>
                                {teacherName}
                            </option>
                        ))}
                    </select>
                    {(classroomFilter || teacherFilter) && (
                        <button
                            type="button"
                            className="sm-btn-secondary"
                            onClick={() => {
                                setClassroomFilter('');
                                setTeacherFilter('');
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>
            <div className="sm-table-scroll sm-config-responsive-scroll">
                <table className="data-table sm-config-responsive-table sm-teacher-allocation-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Grade</th>
                            <th>Assigned Teacher</th>
                            <th>Classrooms & Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    No subjects found. Configure subjects first.
                                </td>
                            </tr>
                        ) : filteredCourses.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                    No allocations match the selected filters.
                                </td>
                            </tr>
                        ) : paginatedAllocations.map((item) => {
                            const allClassrooms = item.all_classrooms || [];
                            const hasAnyAllocation = allClassrooms.length > 0;

                            /* Count active classrooms (respect local overrides) */
                            const activeCount = allClassrooms.filter((c) =>
                                allocationStatusOverrides[c.allocation_id] !== undefined
                                    ? allocationStatusOverrides[c.allocation_id]
                                    : c.is_active
                            ).length;

                            return (
                            <tr key={item.id} className={item.is_active ? '' : 'inactive-row'}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    {item.course_code && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {item.course_code}
                                        </div>
                                    )}
                                </td>
                                <td>{item.grade_name || item.grade}</td>

                                {/* Assigned Teacher */}
                                <td>
                                    {item.teacher_name ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                                            <UserCheck size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                            {item.teacher_name}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                            Unassigned
                                        </span>
                                    )}
                                </td>

                                {/* Classrooms & Status — one clickable chip per classroom */}
                                <td>
                                    {!hasAnyAllocation ? (
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                            No classrooms allocated
                                        </span>
                                    ) : (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                                            {allClassrooms.map((cls) => {
                                                const resolvedActive = allocationStatusOverrides[cls.allocation_id] !== undefined
                                                    ? allocationStatusOverrides[cls.allocation_id]
                                                    : cls.is_active;
                                                const isToggling = togglingAllocationId === cls.allocation_id;
                                                return (
                                                    <span
                                                        key={cls.allocation_id}
                                                        onClick={() => !isToggling && handleStatusBadgeToggle({
                                                            ...item,
                                                            allocation_id: cls.allocation_id,
                                                            allocation_is_active: cls.is_active,
                                                        })}
                                                        title={isToggling ? 'Updating…' : (resolvedActive ? 'Active — click to deactivate' : 'Inactive — click to activate')}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                            padding: '0.22rem 0.55rem', borderRadius: '999px',
                                                            fontSize: '0.78rem', fontWeight: 600,
                                                            cursor: isToggling ? 'wait' : 'pointer',
                                                            opacity: isToggling ? 0.65 : 1,
                                                            transition: 'all .12s',
                                                            background: resolvedActive ? '#dcfce7' : 'var(--color-bg-body)',
                                                            color: resolvedActive ? '#16a34a' : 'var(--color-text-muted)',
                                                            border: resolvedActive ? '1px solid #86efac' : '1px solid var(--color-border)',
                                                            userSelect: 'none',
                                                        }}
                                                    >
                                                        <span style={{
                                                            width: 6, height: 6, borderRadius: '50%',
                                                            background: 'currentColor', flexShrink: 0,
                                                        }} />
                                                        {isToggling ? '…' : cls.classroom_name}
                                                    </span>
                                                );
                                            })}
                                            {/* Summary label */}
                                            <span style={{
                                                fontSize: '0.73rem', color: 'var(--color-text-muted)',
                                                marginLeft: '0.1rem',
                                            }}>
                                                {activeCount}/{allClassrooms.length} active
                                            </span>
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenAssign(item)}
                                        disabled={!item.is_active}
                                        title={!item.is_active ? 'Subject is inactive' : (item.teacher_name ? 'Change teacher assignment' : 'Assign a teacher to this subject')}
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                            padding: '0.38rem 0.8rem', borderRadius: '0.5rem',
                                            fontSize: '0.8rem', fontWeight: 600, cursor: item.is_active ? 'pointer' : 'not-allowed',
                                            opacity: item.is_active ? 1 : 0.45,
                                            border: '1.5px solid var(--color-primary)',
                                            background: item.teacher_name ? 'transparent' : 'var(--color-primary)',
                                            color: item.teacher_name ? 'var(--color-primary)' : '#fff',
                                            transition: 'all .15s',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <UserPlus size={14} />
                                        {item.teacher_name ? 'Change Teacher' : 'Assign Teacher'}
                                    </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            <TablePagination
                currentPage={activeAllocationPage}
                totalPages={allocationTotalPages}
                totalItems={filteredCourses.length}
                pageSize={TABLE_ROWS_PER_PAGE}
                onPrevious={() => setAllocationPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setAllocationPage((prev) => Math.min(allocationTotalPages, prev + 1))}
            />

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

            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title={selectedCourse?.teacher_name ? 'Change Teacher Assignment' : 'Assign Teacher'}
            >
                <div style={{ marginTop: 0, marginBottom: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Subject: <strong style={{ color: 'var(--color-text-main)' }}>
                            {selectedCourse?.name}
                        </strong>
                        &nbsp;·&nbsp;Grade: <strong style={{ color: 'var(--color-text-main)' }}>
                            {selectedCourse?.grade_name}
                        </strong>
                    </p>
                    {selectedCourse?.teacher_name && (
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
                            Currently assigned to: <strong style={{ color: 'var(--color-text-main)' }}>
                                {selectedCourse.teacher_name}
                            </strong>
                        </p>
                    )}
                    {(selectedCourse?.all_classrooms || []).length > 0 && (
                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            Will be assigned to {selectedCourse.all_classrooms.length} classroom(s):&nbsp;
                            {selectedCourse.all_classrooms.map((c) => c.classroom_name).join(', ')}
                        </p>
                    )}
                </div>
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
const ClassroomManagement = ({ schoolId, academicYears, teachers = [] }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const [classrooms, setClassrooms] = useState([]);
    const [courses, setCourses] = useState([]);
    const [grades, setGrades] = useState([]);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [classroomPage, setClassroomPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState(null);
    const [pendingStatusAction, setPendingStatusAction] = useState(null);
    const [formData, setFormData] = useState({ grade_id: '', classroom_name: '', homeroom_teacher_id: '' });
    const [editFormData, setEditFormData] = useState({ grade_id: '', classroom_name: '', homeroom_teacher_id: '' });
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

    useEffect(() => {
        setGradeFilter('');
    }, [selectedAcademicYear]);

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

    const gradeFilterOptions = useMemo(() => {
        return Array.from(
            new Set(
                classrooms
                    .map((classroom) => classroom.grade_name || classroom.grade)
                    .filter(Boolean)
                    .map((gradeName) => String(gradeName))
            )
        ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }, [classrooms]);

    const filteredClassrooms = useMemo(() => {
        if (!gradeFilter) return classrooms;
        return classrooms.filter(
            (classroom) => String(classroom.grade_name || classroom.grade || '') === gradeFilter
        );
    }, [classrooms, gradeFilter]);

    const classroomTotalPages = Math.max(1, Math.ceil(filteredClassrooms.length / TABLE_ROWS_PER_PAGE));
    const activeClassroomPage = Math.min(classroomPage, classroomTotalPages);
    const classroomPageStart = (activeClassroomPage - 1) * TABLE_ROWS_PER_PAGE;
    const paginatedClassrooms = useMemo(
        () => filteredClassrooms.slice(classroomPageStart, classroomPageStart + TABLE_ROWS_PER_PAGE),
        [filteredClassrooms, classroomPageStart]
    );

    useEffect(() => {
        setClassroomPage(1);
    }, [selectedAcademicYear, gradeFilter]);

    useEffect(() => {
        if (classroomPage > classroomTotalPages) {
            setClassroomPage(classroomTotalPages);
        }
    }, [classroomPage, classroomTotalPages]);

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
                classroom_name: formData.classroom_name,
                homeroom_teacher_id: formData.homeroom_teacher_id
                    ? Number.parseInt(formData.homeroom_teacher_id, 10)
                    : null,
            });
            setClassrooms((prev) => [...prev, created]);
            showSuccess('Classroom created successfully.');
            setIsModalOpen(false);
            setFormData({ grade_id: '', classroom_name: '', homeroom_teacher_id: '' });
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
            homeroom_teacher_id: String(classroom.homeroom_teacher || ''),
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
                    homeroom_teacher_id: editFormData.homeroom_teacher_id
                        ? Number.parseInt(editFormData.homeroom_teacher_id, 10)
                        : null,
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
                <div className="sm-inline-controls sm-classroom-actions">
                    <select
                        className="sm-form-select sm-select-control sm-classroom-year-select"
                        value={selectedAcademicYear}
                        onChange={(event) => setSelectedAcademicYear(event.target.value)}
                    >
                        <option value="">Select Academic Year</option>
                        {academicYears.map((year) => (
                            <option key={year.id} value={year.id}>
                                {year.academic_year_code} {year.is_active ? '(Active)' : '(Inactive)'}
                            </option>
                        ))}
                    </select>
                    <select
                        className="sm-form-select sm-select-control"
                        value={gradeFilter}
                        onChange={(event) => setGradeFilter(event.target.value)}
                        disabled={!selectedAcademicYear || classrooms.length === 0}
                    >
                        <option value="">All Grades</option>
                        {gradeFilterOptions.map((gradeName) => (
                            <option key={gradeName} value={gradeName}>
                                {gradeName}
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
                <>
                    <div className="sm-table-scroll sm-config-responsive-scroll">
                        <table className="data-table sm-config-responsive-table sm-classroom-management-table">
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
                                {filteredClassrooms.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="sm-empty-state">No classrooms match the selected grade.</td>
                                    </tr>
                                ) : paginatedClassrooms.map((classroom) => (
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
                    </div>
                    <TablePagination
                        currentPage={activeClassroomPage}
                        totalPages={classroomTotalPages}
                        totalItems={filteredClassrooms.length}
                        pageSize={TABLE_ROWS_PER_PAGE}
                        onPrevious={() => setClassroomPage((prev) => Math.max(1, prev - 1))}
                        onNext={() => setClassroomPage((prev) => Math.min(classroomTotalPages, prev + 1))}
                    />
                </>
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
                    <div className="sm-form-field">
                        <label className="sm-form-label">
                            Homeroom Teacher <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <select
                            value={formData.homeroom_teacher_id}
                            onChange={(event) => setFormData({ ...formData, homeroom_teacher_id: event.target.value })}
                            className="sm-form-select"
                        >
                            <option value="">— No homeroom teacher —</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.user_id || teacher.id} value={teacher.user_id || teacher.id}>
                                    {teacher.full_name}
                                </option>
                            ))}
                        </select>
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
                    <div className="sm-form-field">
                        <label className="sm-form-label">
                            Homeroom Teacher <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <select
                            value={editFormData.homeroom_teacher_id}
                            onChange={(event) => setEditFormData({ ...editFormData, homeroom_teacher_id: event.target.value })}
                            className="sm-form-select"
                        >
                            <option value="">— No homeroom teacher —</option>
                            {teachers.map((teacher) => (
                                <option key={teacher.user_id || teacher.id} value={teacher.user_id || teacher.id}>
                                    {teacher.full_name}
                                </option>
                            ))}
                        </select>
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
                <div className="sm-inline-controls" style={{ gap: '1rem' }}>
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
                <div className="p-6 sm-timetable-wrap" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    {!isGenerated ? (
                        <div style={{ background: 'var(--color-bg-body)', padding: '2rem', borderRadius: '0.5rem', border: '2px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Timetable not yet generated. Click "Generate Timetable" to start.
                        </div>
                    ) : (
                        <table className="sm-timetable-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
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
                        <div key={conflict.id} className="sm-conflict-row" style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ color: 'var(--color-error)', marginTop: '2px' }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div className="sm-conflict-content">
                                <h4 style={{ fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>{conflict.type}</h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{conflict.description}</p>
                                <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: '#fee2e2', color: '#991b1b' }}>
                                    {conflict.severity} Severity
                                </span>
                            </div>
                            <div className="sm-conflict-action" style={{ marginLeft: 'auto' }}>
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
