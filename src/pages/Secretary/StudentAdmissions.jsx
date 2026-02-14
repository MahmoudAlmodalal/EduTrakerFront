import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    Check,
    CheckCircle,
    Clock,
    Download,
    Edit2,
    FileText,
    GraduationCap,
    Search,
    Upload,
    UserPlus,
    Users,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import {
    AlertBanner,
    AvatarInitial,
    EmptyState,
    LoadingSpinner,
    PageHeader,
    StatCard,
    StatusBadge,
} from './components';
import './Secretary.css';

const STUDENT_STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'expelled', label: 'Expelled' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'rejected', label: 'Rejected' },
];

const createDefaultStudent = () => ({
    first_name: '',
    last_name: '',
    email: '',
    password: 'Student@123',
    date_of_birth: '',
    admission_date: new Date().toISOString().split('T')[0],
    grade_id: '',
});

const normalizeListResponse = (payload) => {
    if (Array.isArray(payload?.results)) {
        return payload.results;
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    return [];
};

const stringifyApiValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => stringifyApiValue(item)).filter(Boolean).join(', ');
    }

    if (value && typeof value === 'object') {
        return Object.values(value)
            .map((item) => stringifyApiValue(item))
            .filter(Boolean)
            .join(', ');
    }

    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
};

const getApiErrorMessage = (error, fallbackMessage) => {
    const apiErrors = error?.response?.data;

    if (typeof apiErrors === 'string' && apiErrors.trim()) {
        return apiErrors.trim();
    }

    if (apiErrors && typeof apiErrors === 'object' && !Array.isArray(apiErrors)) {
        const formattedEntries = Object.entries(apiErrors)
            .map(([field, value]) => {
                const formattedValue = stringifyApiValue(value);
                if (!formattedValue) {
                    return '';
                }

                return `${field}: ${formattedValue}`;
            })
            .filter(Boolean);

        if (formattedEntries.length) {
            return formattedEntries.join(' | ');
        }
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }

    return fallbackMessage;
};

const getStudentName = (student) => {
    const fallback = [student?.first_name, student?.last_name].filter(Boolean).join(' ');
    return student?.full_name || fallback || 'N/A';
};

const resolveSchoolId = (user) => {
    if (!user) {
        return '';
    }

    const school = user.school;
    const candidate = user.school_id ?? school?.id ?? school;

    if (candidate === null || candidate === undefined || candidate === '') {
        return '';
    }

    if (typeof candidate === 'object') {
        return '';
    }

    return String(candidate).trim();
};

const getEnrollmentAcademicYearId = (enrollment) => {
    return Number(enrollment?.academic_year_id ?? enrollment?.academic_year?.id ?? enrollment?.academic_year);
};

const getEnrollmentClassroomId = (enrollment) => {
    return Number(enrollment?.class_room_id ?? enrollment?.class_room?.id ?? enrollment?.class_room);
};

const EditStudentStatusModal = memo(function EditStudentStatusModal({
    student,
    loading,
    onClose,
    onStatusChange,
    onSubmit,
}) {
    if (!student) {
        return null;
    }

    return (
        <Modal isOpen={Boolean(student)} onClose={onClose} title="Edit Student Status">
            <form className="sec-modal-form" onSubmit={onSubmit}>
                <div className="form-group">
                    <label className="form-label">Student Name</label>
                    <input type="text" className="form-input" value={getStudentName(student)} readOnly />
                </div>

                <div className="form-group">
                    <label className="form-label">Enrollment Status</label>
                    <select
                        className="form-select"
                        value={student.current_status || 'pending'}
                        onChange={(event) => onStatusChange(event.target.value)}
                    >
                        {STUDENT_STATUS_OPTIONS.map((statusOption) => (
                            <option key={statusOption.value} value={statusOption.value}>
                                {statusOption.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sec-modal-actions">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
});

const StudentAdmissions = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();

    const [activeTab, setActiveTab] = useState('applications');
    const [banner, setBanner] = useState({ type: 'error', message: '' });

    const [applications, setApplications] = useState([]);
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);

    const [newStudent, setNewStudent] = useState(createDefaultStudent);
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [applicationYearFilter, setApplicationYearFilter] = useState('');
    const [assignmentAcademicYear, setAssignmentAcademicYear] = useState('');
    const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
    const [applicationSearch, setApplicationSearch] = useState('');

    const [gradeQuery, setGradeQuery] = useState('');
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);
    const [isCreatingStudent, setIsCreatingStudent] = useState(false);
    const [isAssigningStudent, setIsAssigningStudent] = useState(false);
    const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);

    const applicationsRequestRef = useRef(0);
    const studentsRequestRef = useRef(0);
    const classroomsRequestRef = useRef(0);
    const gradesRequestRef = useRef(0);
    const academicYearsRequestRef = useRef(0);

    const schoolId = useMemo(() => resolveSchoolId(user), [user]);
    const deferredApplicationSearch = useDeferredValue(applicationSearch);
    const deferredGradeQuery = useDeferredValue(gradeQuery);
    const files = [];

    const tabs = useMemo(() => {
        return [
            {
                id: 'applications',
                label: t('secretary.admissions.newApplications') || 'Applications',
                icon: FileText,
                badge: applications.length,
            },
            {
                id: 'add-student',
                label: t('secretary.admissions.addStudent') || 'Add Student',
                icon: UserPlus,
            },
            {
                id: 'class-assignment',
                label: t('secretary.admissions.classAssignment') || 'Class Assignment',
                icon: Users,
            },
            {
                id: 'files',
                label: t('secretary.admissions.manageFiles') || 'Manage Files',
                icon: Upload,
            },
        ];
    }, [applications.length, t]);

    const filteredGrades = useMemo(() => {
        const search = deferredGradeQuery.trim().toLowerCase();
        if (!search) {
            return grades;
        }

        return grades.filter((grade) => (grade?.name || '').toLowerCase().includes(search));
    }, [deferredGradeQuery, grades]);

    const filteredApplications = useMemo(() => {
        const search = deferredApplicationSearch.trim().toLowerCase();
        if (!search) {
            return applications;
        }

        return applications.filter((student) => {
            const fullName = getStudentName(student).toLowerCase();
            const email = (student?.email || '').toLowerCase();
            return fullName.includes(search) || email.includes(search);
        });
    }, [applications, deferredApplicationSearch]);

    const filteredClassrooms = useMemo(() => {
        if (!selectedGradeFilter) {
            return classrooms;
        }

        return classrooms.filter((classroom) => {
            const gradeId = classroom.grade_id ?? classroom.grade?.id ?? classroom.grade;
            return gradeId?.toString() === selectedGradeFilter;
        });
    }, [classrooms, selectedGradeFilter]);

    const activeAcademicYears = useMemo(() => {
        return academicYears.filter((year) => year.is_active);
    }, [academicYears]);

    const assignmentStudents = useMemo(() => {
        return [...students].sort((leftStudent, rightStudent) => {
            return getStudentName(leftStudent).localeCompare(getStudentName(rightStudent));
        });
    }, [students]);

    const getAcademicYearLabel = useCallback((year, includeStatus = true) => {
        const rawName = year?.name || year?.academic_year_code || `Year #${year?.id || ''}`;
        const name = rawName.toString().trim();

        if (!includeStatus) {
            return name;
        }

        if (/active|inactive/i.test(name)) {
            return name;
        }

        return `${name} ${year?.is_active ? '(Active)' : '(Inactive)'}`.trim();
    }, []);

    const statCards = useMemo(() => {
        const totalStudents = applications.length;
        const activeStudents = applications.filter((student) => {
            const status = (student.current_status || '').toLowerCase();
            return status === 'active' || student.is_active;
        }).length;
        const pendingStudents = applications.filter((student) => {
            return (student.current_status || '').toLowerCase() === 'pending';
        }).length;
        const assignedStudents = applications.filter((student) => {
            return Boolean(student.classroom?.classroom_name || student.class_room?.classroom_name);
        }).length;

        return [
            { title: 'Total Students', value: totalStudents, icon: Users, color: 'indigo' },
            { title: 'Active', value: activeStudents, icon: CheckCircle, color: 'green' },
            { title: 'Pending', value: pendingStudents, icon: Clock, color: 'amber' },
            { title: 'Assigned to Class', value: assignedStudents, icon: GraduationCap, color: 'blue' },
        ];
    }, [applications]);

    const setFeedback = useCallback((type, message, showToast = true) => {
        setBanner({ type, message });

        if (!showToast) {
            return;
        }

        if (type === 'success') {
            showSuccess(message);
        } else {
            showError(message);
        }
    }, [showError, showSuccess]);

    const fetchStudentApplications = useCallback(async (yearId = '') => {
        if (!schoolId) {
            applicationsRequestRef.current += 1;
            setApplications([]);
            return;
        }

        const requestId = applicationsRequestRef.current + 1;
        applicationsRequestRef.current = requestId;

        try {
            setIsApplicationsLoading(true);
            const params = { school_id: schoolId };
            if (yearId) {
                params.academic_year_id = yearId;
            }

            const data = await secretaryService.getStudents(params);
            if (applicationsRequestRef.current !== requestId) {
                return;
            }
            setApplications(normalizeListResponse(data));
        } catch (error) {
            if (applicationsRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching students:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to fetch student records.'));
        } finally {
            if (applicationsRequestRef.current === requestId) {
                setIsApplicationsLoading(false);
            }
        }
    }, [schoolId, setFeedback]);

    const fetchStudents = useCallback(async (yearId = '') => {
        if (!schoolId) {
            studentsRequestRef.current += 1;
            setStudents([]);
            return;
        }

        const requestId = studentsRequestRef.current + 1;
        studentsRequestRef.current = requestId;

        try {
            setIsStudentsLoading(true);
            const params = { school_id: schoolId };
            if (yearId) {
                params.academic_year_id = yearId;
            }

            const data = await secretaryService.getStudents(params);
            if (studentsRequestRef.current !== requestId) {
                return;
            }
            setStudents(normalizeListResponse(data));
        } catch (error) {
            if (studentsRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching students for assignment:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to load students for assignment.'));
        } finally {
            if (studentsRequestRef.current === requestId) {
                setIsStudentsLoading(false);
            }
        }
    }, [schoolId, setFeedback]);

    const fetchGrades = useCallback(async () => {
        if (!schoolId) {
            gradesRequestRef.current += 1;
            setGrades([]);
            return;
        }

        const requestId = gradesRequestRef.current + 1;
        gradesRequestRef.current = requestId;

        try {
            const data = await secretaryService.getGrades({ school_id: schoolId });
            if (gradesRequestRef.current !== requestId) {
                return;
            }
            setGrades(normalizeListResponse(data));
        } catch (error) {
            if (gradesRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching grades:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to load grades.'));
        }
    }, [schoolId, setFeedback]);

    const fetchAcademicYears = useCallback(async () => {
        if (!schoolId) {
            academicYearsRequestRef.current += 1;
            setAcademicYears([]);
            return;
        }

        const requestId = academicYearsRequestRef.current + 1;
        academicYearsRequestRef.current = requestId;

        try {
            const data = await secretaryService.getAcademicYears({ school_id: schoolId });
            if (academicYearsRequestRef.current !== requestId) {
                return;
            }
            setAcademicYears(normalizeListResponse(data));
        } catch (error) {
            if (academicYearsRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching academic years:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to load academic years.'));
        }
    }, [schoolId, setFeedback]);

    const fetchClassrooms = useCallback(async (currentSchoolId, academicYearId) => {
        if (!currentSchoolId || !academicYearId) {
            classroomsRequestRef.current += 1;
            setClassrooms([]);
            return;
        }

        const requestId = classroomsRequestRef.current + 1;
        classroomsRequestRef.current = requestId;

        try {
            const data = await secretaryService.getClassrooms(currentSchoolId, academicYearId);
            if (classroomsRequestRef.current !== requestId) {
                return;
            }
            setClassrooms(normalizeListResponse(data));
        } catch (error) {
            if (classroomsRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching classrooms:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to load classrooms.'));
        }
    }, [setFeedback]);

    useEffect(() => {
        applicationsRequestRef.current += 1;
        studentsRequestRef.current += 1;
        classroomsRequestRef.current += 1;
        gradesRequestRef.current += 1;
        academicYearsRequestRef.current += 1;

        setApplications([]);
        setStudents([]);
        setClassrooms([]);
        setGrades([]);
        setAcademicYears([]);

        setApplicationYearFilter('');
        setAssignmentAcademicYear('');
        setSelectedGradeFilter('');
        setSelectedClassroom('');
        setSelectedStudent('');
        setApplicationSearch('');
    }, [schoolId]);

    useEffect(() => {
        if (!schoolId) {
            return;
        }

        if ((activeTab === 'applications' || activeTab === 'class-assignment') && academicYears.length === 0) {
            fetchAcademicYears();
        }

        if ((activeTab === 'add-student' || activeTab === 'class-assignment') && grades.length === 0) {
            fetchGrades();
        }
    }, [
        academicYears.length,
        activeTab,
        fetchAcademicYears,
        fetchGrades,
        grades.length,
        schoolId,
    ]);

    useEffect(() => {
        if (activeTab !== 'applications') {
            return;
        }

        fetchStudentApplications(applicationYearFilter);
    }, [activeTab, applicationYearFilter, fetchStudentApplications]);

    useEffect(() => {
        if (activeTab !== 'class-assignment' || !assignmentAcademicYear || !schoolId) {
            setClassrooms([]);
            setSelectedClassroom('');
            return;
        }

        fetchClassrooms(schoolId, assignmentAcademicYear);
    }, [activeTab, assignmentAcademicYear, fetchClassrooms, schoolId]);

    useEffect(() => {
        if (activeTab !== 'class-assignment') {
            return;
        }

        if (!assignmentAcademicYear) {
            setStudents([]);
            return;
        }

        fetchStudents(assignmentAcademicYear);
    }, [activeTab, assignmentAcademicYear, fetchStudents]);

    useEffect(() => {
        if (!selectedClassroom) {
            return;
        }

        const classroomExists = filteredClassrooms.some((classroom) => {
            return classroom.id?.toString() === selectedClassroom.toString();
        });

        if (!classroomExists) {
            setSelectedClassroom('');
        }
    }, [filteredClassrooms, selectedClassroom]);

    useEffect(() => {
        setSelectedStudent('');
    }, [assignmentAcademicYear, selectedClassroom, selectedGradeFilter]);

    const handleGradeSelect = useCallback((grade) => {
        setNewStudent((previous) => ({ ...previous, grade_id: grade.id.toString() }));
        setGradeQuery(grade.name);
        setShowGradeDropdown(false);
    }, []);

    const handleGradeQueryChange = useCallback((event) => {
        const query = event.target.value;
        setGradeQuery(query);
        setShowGradeDropdown(true);
        setNewStudent((previous) => ({ ...previous, grade_id: '' }));
    }, []);

    const handleCreateStudent = useCallback(async (event) => {
        event.preventDefault();

        if (!schoolId) {
            setFeedback('error', 'School information is missing. Please re-login and try again.');
            return;
        }

        const firstName = newStudent.first_name.trim();
        const lastName = newStudent.last_name.trim();
        const email = newStudent.email.trim();
        const gradeId = Number.parseInt(newStudent.grade_id, 10);

        if (
            !firstName
            || !lastName
            || !email
            || !newStudent.date_of_birth
            || !newStudent.admission_date
            || !Number.isInteger(gradeId)
        ) {
            setFeedback('error', 'Please fill all required fields and choose a grade from the list.');
            return;
        }

        try {
            setIsCreatingStudent(true);

            await secretaryService.createStudent({
                email,
                full_name: `${firstName} ${lastName}`.trim(),
                password: newStudent.password || 'Student@123',
                school_id: schoolId,
                grade_id: gradeId,
                date_of_birth: newStudent.date_of_birth,
                admission_date: newStudent.admission_date,
            });

            setFeedback('success', 'Student created successfully!');
            setNewStudent(createDefaultStudent());
            setGradeQuery('');
            setShowGradeDropdown(false);
            setActiveTab('applications');
        } catch (error) {
            console.error('Error creating student:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to create student. Please try again.'));
        } finally {
            setIsCreatingStudent(false);
        }
    }, [newStudent, schoolId, setFeedback]);

    const handleAssign = useCallback(async () => {
        if (!selectedStudent || !selectedClassroom || !assignmentAcademicYear) {
            setFeedback('error', 'Please select a student, classroom and academic year.');
            return;
        }

        const studentId = Number(selectedStudent);
        const classroomId = Number(selectedClassroom);
        const academicYearId = Number(assignmentAcademicYear);

        if (!Number.isInteger(studentId) || !Number.isInteger(classroomId) || !Number.isInteger(academicYearId)) {
            setFeedback('error', 'Invalid student/classroom/academic year selection.');
            return;
        }

        try {
            setIsAssigningStudent(true);

            const enrollmentData = await secretaryService.getStudentEnrollments(studentId);
            const enrollments = normalizeListResponse(enrollmentData);

            const alreadyAssigned = enrollments.some((enrollment) => {
                const enrollmentYearId = getEnrollmentAcademicYearId(enrollment);
                const enrollmentClassId = getEnrollmentClassroomId(enrollment);
                const enrollmentStatus = String(enrollment?.status || '').toLowerCase();
                const isEnrollmentActive = enrollment.is_active !== false && enrollmentStatus !== 'withdrawn';

                return enrollmentYearId === academicYearId && enrollmentClassId === classroomId && isEnrollmentActive;
            });

            if (alreadyAssigned) {
                setFeedback(
                    'success',
                    'Student is already assigned to this classroom for the selected academic year.',
                    false
                );
                setSelectedStudent('');
                return;
            }

            await secretaryService.assignToClass({
                student_id: studentId,
                class_room_id: classroomId,
                academic_year_id: academicYearId,
                status: 'enrolled',
            });

            setFeedback('success', 'Student assigned to class successfully!');
            setSelectedStudent('');
            fetchStudents(assignmentAcademicYear);
        } catch (error) {
            console.error('Error assigning student:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to assign student to class.'));
        } finally {
            setIsAssigningStudent(false);
        }
    }, [assignmentAcademicYear, fetchStudents, selectedClassroom, selectedStudent, setFeedback]);

    const handleUpdateStudent = useCallback(async (event) => {
        event.preventDefault();

        if (!editingStudent) {
            return;
        }

        const studentId = editingStudent.user_id || editingStudent.id;
        if (!studentId) {
            setFeedback('error', 'Could not determine student record to update.');
            return;
        }

        try {
            setIsUpdatingStudent(true);

            await secretaryService.updateStudent(studentId, {
                current_status: (editingStudent.current_status || 'pending').toLowerCase(),
            });

            setFeedback('success', 'Student status updated successfully!');
            setEditingStudent(null);
            fetchStudentApplications(applicationYearFilter);
        } catch (error) {
            console.error('Error updating student:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to update student status.'));
        } finally {
            setIsUpdatingStudent(false);
        }
    }, [applicationYearFilter, editingStudent, fetchStudentApplications, setFeedback]);

    const updateNewStudentField = useCallback((field, value) => {
        setNewStudent((previous) => ({ ...previous, [field]: value }));
    }, []);

    const handleApplicationYearChange = useCallback((event) => {
        setApplicationYearFilter(event.target.value);
    }, []);

    const handleEditStatusChange = useCallback((value) => {
        setEditingStudent((previous) => {
            if (!previous) {
                return previous;
            }

            return { ...previous, current_status: value };
        });
    }, []);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        setBanner((previous) => ({ ...previous, message: '' }));
    }, []);

    const isAssignDisabled = (
        !selectedStudent
        || !selectedClassroom
        || !assignmentAcademicYear
        || isAssigningStudent
    );

    return (
        <div className="secretary-dashboard secretary-admissions-page">
            <PageHeader
                title={t('secretary.admissions.title') || 'Student Admissions'}
                subtitle={t('secretary.admissions.subtitle') || 'Manage applications, enrollment, classes, and files'}
            />

            <AlertBanner
                type={banner.type}
                message={banner.message}
                onDismiss={() => setBanner((previous) => ({ ...previous, message: '' }))}
            />

            <div className="secretary-tabs" role="tablist" aria-label="Student admissions tabs">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`secretary-tab ${isActive ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                            aria-pressed={isActive}
                        >
                            <div className="tab-content">
                                <Icon size={18} />
                                <span className="tab-label">{tab.label}</span>
                                {typeof tab.badge === 'number' ? <span className="tab-badge">{tab.badge}</span> : null}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="secretary-content">
                {activeTab === 'applications' ? (
                    <>
                        <section className="sec-stats-grid">
                            {statCards.map((card) => (
                                <StatCard
                                    key={card.title}
                                    title={card.title}
                                    value={card.value}
                                    icon={card.icon}
                                    color={card.color}
                                />
                            ))}
                        </section>

                        <section className="management-card">
                            <div className="sec-filter-bar">
                                <div className="sec-field sec-field--grow">
                                    <label htmlFor="application-search" className="form-label">Search Student</label>
                                    <div className="search-wrapper sec-search-wrapper">
                                        <Search size={16} className="search-icon" />
                                        <input
                                            id="application-search"
                                            type="text"
                                            className="search-input"
                                            placeholder="Search by name or email..."
                                            value={applicationSearch}
                                            onChange={(event) => setApplicationSearch(event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="sec-field">
                                    <label htmlFor="application-year" className="form-label">Academic Year</label>
                                    <select
                                        id="application-year"
                                        className="form-select"
                                        value={applicationYearFilter}
                                        onChange={handleApplicationYearChange}
                                    >
                                        <option value="">All Academic Years</option>
                                        {academicYears.map((year) => (
                                            <option key={year.id} value={year.id}>
                                                {getAcademicYearLabel(year)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="sec-table-wrap">
                                {isApplicationsLoading ? (
                                    <LoadingSpinner message="Loading students..." />
                                ) : (
                                    <div className="sec-table-scroll">
                                        <table className="data-table sec-data-table sec-data-table--applications">
                                            <thead>
                                                <tr>
                                                    <th className="cell-id">ID</th>
                                                    <th>Student Name</th>
                                                    <th>Grade</th>
                                                    <th>Classroom</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredApplications.map((student) => {
                                                    const studentId = student.user_id || student.id;
                                                    const studentName = getStudentName(student);
                                                    const status = student.current_status || (student.is_active ? 'active' : 'inactive');
                                                    const gradeName = (
                                                        student.current_grade?.name
                                                        || student.grade?.name
                                                        || student.grade_name
                                                        || 'N/A'
                                                    );
                                                    const classroomName = (
                                                        student.classroom?.classroom_name
                                                        || student.class_room?.classroom_name
                                                        || 'Not Assigned'
                                                    );

                                                    return (
                                                        <tr key={studentId}>
                                                            <td className="cell-id">#{studentId}</td>
                                                            <td>
                                                                <div className="sec-row-user">
                                                                    <AvatarInitial name={studentName} size="sm" color="indigo" />
                                                                    <span>{studentName}</span>
                                                                </div>
                                                            </td>
                                                            <td>{gradeName}</td>
                                                            <td className="cell-muted">{classroomName}</td>
                                                            <td>
                                                                <StatusBadge status={status} />
                                                            </td>
                                                            <td>
                                                                <div className="action-btn-group">
                                                                    <button
                                                                        type="button"
                                                                        className="btn-icon info"
                                                                        title="Edit Status"
                                                                        aria-label={`Edit status for ${studentName}`}
                                                                        onClick={() => setEditingStudent({
                                                                            ...student,
                                                                            current_status: student.current_status || 'pending',
                                                                        })}
                                                                    >
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {filteredApplications.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6">
                                                            <EmptyState icon={Users} message="No students found." />
                                                        </td>
                                                    </tr>
                                                ) : null}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                ) : null}

                {activeTab === 'add-student' ? (
                    <section className="management-card sec-form-card">
                        <div className="sec-section-head">
                            <h2>Manual Student Entry</h2>
                            <p>Add a new student to your school</p>
                        </div>

                        <form onSubmit={handleCreateStudent}>
                            <div className="sec-form-grid">
                                <div className="sec-field">
                                    <label className="form-label">First Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. John"
                                        value={newStudent.first_name}
                                        onChange={(event) => updateNewStudentField('first_name', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Last Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Doe"
                                        value={newStudent.last_name}
                                        onChange={(event) => updateNewStudentField('last_name', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Email *</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="student@example.com"
                                        value={newStudent.email}
                                        onChange={(event) => updateNewStudentField('email', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Default: Student@123"
                                        value={newStudent.password}
                                        onChange={(event) => updateNewStudentField('password', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Date of Birth *</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newStudent.date_of_birth}
                                        onChange={(event) => updateNewStudentField('date_of_birth', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Admission Date *</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newStudent.admission_date}
                                        onChange={(event) => updateNewStudentField('admission_date', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field sec-grade-field">
                                    <label className="form-label">Grade *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Search and select grade..."
                                        value={gradeQuery}
                                        onChange={handleGradeQueryChange}
                                        onFocus={() => setShowGradeDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowGradeDropdown(false), 200)}
                                        required={!newStudent.grade_id}
                                    />

                                    {showGradeDropdown ? (
                                        <div className="sec-grade-dropdown">
                                            {filteredGrades.length > 0 ? (
                                                filteredGrades.map((grade) => (
                                                    <button
                                                        key={grade.id}
                                                        type="button"
                                                        className={`sec-grade-option ${newStudent.grade_id === grade.id.toString() ? 'is-selected' : ''}`}
                                                        onMouseDown={() => handleGradeSelect(grade)}
                                                    >
                                                        {grade.name}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="sec-grade-empty">No grades found</div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="sec-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => handleTabChange('applications')}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isCreatingStudent}>
                                    {isCreatingStudent ? 'Saving...' : 'Save Student Record'}
                                </button>
                            </div>
                        </form>
                    </section>
                ) : null}

                {activeTab === 'class-assignment' ? (
                    <section className="management-card">
                        <div className="sec-filter-bar">
                            <div className="sec-field sec-field--grow">
                                <h3 className="sec-filter-title">Class Assignment</h3>
                                <p className="sec-subtle-text">Select a student and assign them to a class.</p>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label className="form-label">Academic Year</label>
                                <select
                                    className="form-select"
                                    value={assignmentAcademicYear}
                                    onChange={(event) => setAssignmentAcademicYear(event.target.value)}
                                >
                                    <option value="">Select Active Academic Year</option>
                                    {activeAcademicYears.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {getAcademicYearLabel(year, false)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label className="form-label">Grade</label>
                                <select
                                    className="form-select"
                                    value={selectedGradeFilter}
                                    onChange={(event) => setSelectedGradeFilter(event.target.value)}
                                    disabled={!assignmentAcademicYear}
                                >
                                    <option value="">All Grades</option>
                                    {grades.map((grade) => (
                                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label className="form-label">Classroom</label>
                                <select
                                    className="form-select"
                                    value={selectedClassroom}
                                    onChange={(event) => setSelectedClassroom(event.target.value)}
                                    disabled={!assignmentAcademicYear}
                                >
                                    <option value="">Select Classroom...</option>
                                    {filteredClassrooms.map((classroom) => (
                                        <option key={classroom.id} value={classroom.id}>
                                            {classroom.classroom_name} {classroom.grade_name ? `(${classroom.grade_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sec-assignment-action">
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleAssign}
                                    disabled={isAssignDisabled}
                                >
                                    <UserPlus size={18} />
                                    {isAssigningStudent ? 'Assigning...' : 'Assign Student'}
                                </button>
                            </div>
                        </div>

                        <div className="sec-assignment-content">
                            {!assignmentAcademicYear ? (
                                <EmptyState
                                    icon={AlertCircle}
                                    message="Please select an academic year to see classrooms and assign students."
                                />
                            ) : isStudentsLoading ? (
                                <LoadingSpinner message="Loading students..." />
                            ) : assignmentStudents.length === 0 ? (
                                <EmptyState icon={Users} message="No students found." />
                            ) : (
                                <div className="sec-assignment-grid">
                                    {assignmentStudents.map((student) => {
                                        const studentId = (student.user_id || student.id)?.toString();
                                        const isSelected = selectedStudent === studentId;

                                        return (
                                            <button
                                                key={studentId}
                                                type="button"
                                                className={`sec-student-card ${isSelected ? 'is-selected' : ''}`}
                                                onClick={() => setSelectedStudent(isSelected ? '' : studentId)}
                                            >
                                                <div className="sec-student-card-head">
                                                    <div className="sec-row-user">
                                                        <AvatarInitial
                                                            name={getStudentName(student)}
                                                            color={isSelected ? 'blue' : 'indigo'}
                                                        />
                                                        <div>
                                                            <h4>{getStudentName(student)}</h4>
                                                            <p>{student.email || 'No email provided'}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected ? (
                                                        <span className="sec-checkmark"><Check size={14} /></span>
                                                    ) : null}
                                                </div>

                                                <div className="sec-student-card-meta">
                                                    <span>ID: #{studentId}</span>
                                                    {student.current_grade?.name ? <span>{student.current_grade.name}</span> : null}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                ) : null}

                {activeTab === 'files' ? (
                    <section className="file-management-grid">
                        <article className="management-card">
                            <h3>Upload Documents</h3>
                            <div className="file-upload-area">
                                <div className="file-upload-icon">
                                    <Upload size={28} />
                                </div>
                                <p>Click to upload or drag and drop</p>
                                <span>PDF, JPG up to 10MB</span>
                            </div>

                            <div className="sec-field">
                                <label className="form-label">Assign to Student</label>
                                <input type="text" className="form-input" placeholder="Search student name..." />
                            </div>

                            <div className="sec-field">
                                <label className="form-label">Document Type</label>
                                <select className="form-select">
                                    <option>Birth Certificate</option>
                                    <option>ID Card</option>
                                    <option>Medical Record</option>
                                    <option>Previous School Report</option>
                                </select>
                            </div>

                            <button type="button" className="btn-primary sec-btn-block">Upload File</button>
                        </article>

                        <article className="management-card">
                            <div className="sec-files-head">
                                <h3>Recent Uploads</h3>
                                <div className="search-wrapper sec-search-wrapper sec-search-narrow">
                                    <Search size={16} className="search-icon" />
                                    <input type="text" className="search-input" placeholder="Search files..." />
                                </div>
                            </div>

                            <div className="sec-table-scroll">
                                <table className="data-table sec-data-table sec-data-table--files">
                                    <thead>
                                        <tr>
                                            <th>File Type</th>
                                            <th>Student</th>
                                            <th>Size</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {files.map((file) => (
                                            <tr key={file.id}>
                                                <td>
                                                    <div className="sec-file-cell">
                                                        <FileText size={16} />
                                                        <span>{file.type}</span>
                                                    </div>
                                                </td>
                                                <td>{file.student}</td>
                                                <td className="cell-muted">{file.size}</td>
                                                <td className="cell-muted">{file.date}</td>
                                                <td>
                                                    <button type="button" className="btn-icon success" aria-label={`Download ${file.type}`}>
                                                        <Download size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {files.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    <EmptyState icon={FileText} message="No files uploaded yet." />
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    </section>
                ) : null}
            </div>

            <EditStudentStatusModal
                student={editingStudent}
                loading={isUpdatingStudent}
                onClose={() => setEditingStudent(null)}
                onStatusChange={handleEditStatusChange}
                onSubmit={handleUpdateStudent}
            />
        </div>
    );
};

export default StudentAdmissions;
