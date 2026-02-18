import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    Check,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileText,
    GraduationCap,
    Search,
    Upload,
    UserPlus,
    Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    SkeletonTable,
    StatCard,
    StatusBadge,
} from './components';
import './Secretary.css';

const STUDENT_ENROLLMENT_STATUS_OPTIONS = [
    { value: 'rejected', label: 'Rejected' },
    { value: 'pending', label: 'Pending' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'active', label: 'Active' },
];

const GENDER_OPTIONS = [
    { value: '', label: 'Select Gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
];

const STUDENT_ACTIVITY_FILTER_OPTIONS = [
    { value: '', label: 'All Students' },
    { value: 'active', label: 'Active' },
    { value: 'not_active', label: 'Not Active' },
];

const APPLICATION_STATUS_FILTER_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'enrolled', label: 'Enrolled' },
    { value: 'all', label: 'All Application Statuses' },
];

const APPLICATIONS_PAGE_SIZE = 10;
const ASSIGNMENT_PAGE_SIZE = 12;
const FILES_PAGE_SIZE = 10;

const DOCUMENT_TYPE_OPTIONS = [
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'id_card', label: 'ID Card' },
    { value: 'medical_record', label: 'Medical Record' },
    { value: 'previous_school_report', label: 'Previous School Report' },
    { value: 'other', label: 'Other' },
];

const createDefaultStudent = () => ({
    first_name: '',
    last_name: '',
    email: '',
    password: 'Student@123',
    gender: '',
    date_of_birth: '',
    admission_date: new Date().toISOString().split('T')[0],
    grade_id: '',
    enrollment_status: 'active',
    phone: '',
    address: '',
    national_id: '',
    emergency_contact: '',
    medical_notes: '',
});

const createDefaultDocumentUpload = () => ({
    student_id: '',
    document_type: DOCUMENT_TYPE_OPTIONS[0].value,
    file: null,
});

const createEmptyPaginationState = () => ({
    count: 0,
    next: null,
    previous: null,
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

const normalizePaginatedListResponse = (payload) => {
    const results = normalizeListResponse(payload);
    const countValue = Number(payload?.count);

    if (Array.isArray(payload?.results)) {
        return {
            results,
            count: Number.isFinite(countValue) ? countValue : results.length,
            next: payload?.next || null,
            previous: payload?.previous || null,
        };
    }

    return {
        results,
        count: results.length,
        next: null,
        previous: null,
    };
};

const getListCount = (payload) => {
    const countValue = Number(payload?.count);
    if (Number.isFinite(countValue)) {
        return countValue;
    }

    const results = normalizeListResponse(payload);
    return results.length;
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
    const apiErrors = error?.response?.data ?? error?.data;

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

const formatFileSize = (bytes) => {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value <= 0) {
        return 'N/A';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const unitSize = value / (1024 ** unitIndex);
    const fractionDigits = unitIndex === 0 ? 0 : 1;
    return `${unitSize.toFixed(fractionDigits)} ${units[unitIndex]}`;
};

const formatDateValue = (value) => {
    if (!value) {
        return 'N/A';
    }

    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
        return 'N/A';
    }

    return dateValue.toLocaleDateString();
};

const useDebouncedValue = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [delay, value]);

    return debouncedValue;
};

const getStudentName = (student) => {
    const fallback = [student?.first_name, student?.last_name].filter(Boolean).join(' ');
    return student?.full_name || fallback || 'N/A';
};

const getStudentId = (student) => {
    const candidate = student?.user_id ?? student?.id;
    if (candidate === null || candidate === undefined || candidate === '') {
        return null;
    }

    return String(candidate);
};

const normalizeEnrollmentStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'suspending') {
        return 'pending';
    }

    return value;
};

const resolveSchoolId = (user) => {
    if (!user) {
        return null;
    }

    const school = user.school;
    const candidate = user.school_id ?? school?.id ?? school;

    if (candidate === null || candidate === undefined || candidate === '') {
        return null;
    }

    if (typeof candidate === 'object') {
        return null;
    }

    const normalized = Number.parseInt(String(candidate).trim(), 10);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
};

const getEnrollmentAcademicYearId = (enrollment) => {
    return Number(enrollment?.academic_year_id ?? enrollment?.academic_year?.id ?? enrollment?.academic_year);
};

const getEnrollmentClassroomId = (enrollment) => {
    return Number(enrollment?.class_room_id ?? enrollment?.class_room?.id ?? enrollment?.class_room);
};

const getEnrollmentStudentId = (enrollment) => {
    const candidate = enrollment?.student_id ?? enrollment?.student?.id ?? enrollment?.student;
    if (candidate === null || candidate === undefined || candidate === '') {
        return null;
    }

    return String(candidate);
};

const getStudentGradeId = (student) => {
    const candidateGrade = (
        student?.current_grade?.id
        ?? student?.grade_id
        ?? student?.grade?.id
        ?? student?.grade
    );

    const gradeId = Number(candidateGrade);
    if (!Number.isInteger(gradeId) || gradeId <= 0) {
        return null;
    }

    return gradeId;
};

const getClassroomId = (classroom) => {
    const candidate = (
        classroom?.id
        ?? classroom?.classroom_id
        ?? classroom?.class_room_id
        ?? classroom?.class_room?.id
        ?? classroom?.class_room
    );

    if (candidate === null || candidate === undefined || candidate === '') {
        return null;
    }

    return String(candidate);
};

const resolveStudentStatus = (student) => {
    const currentStatus = normalizeEnrollmentStatus(student?.current_status);
    if (currentStatus) {
        return currentStatus;
    }

    const enrollmentStatus = normalizeEnrollmentStatus(student?.enrollment_status);
    if (enrollmentStatus) {
        return enrollmentStatus;
    }

    return student?.is_active ? 'active' : 'inactive';
};

const resolveApplicationStatusForDisplay = (application) => {
    return normalizeEnrollmentStatus(application?.status || application?.current_status || 'pending');
};

const normalizePendingStudentRecord = (student, index = 0) => {
    const status = resolveStudentStatus(student) || 'pending';
    const studentId = student?.user_id ?? student?.id ?? null;
    const fallbackId = student?.student_id || student?.email || index + 1;

    return {
        ...student,
        source_type: 'student',
        id: `student-${studentId ?? fallbackId}`,
        display_id: studentId ?? fallbackId,
        full_name: getStudentName(student),
        status,
        current_status: status,
        school_name: student?.school_name || student?.school?.school_name || 'N/A',
        grade_name: student?.grade_name || student?.current_grade?.name || student?.grade?.name || 'N/A',
        birth_certificate_url: '',
    };
};

const getApplicationBirthCertificateUrl = (application) => {
    const certificateUrl = application?.birth_certificate_url;
    if (typeof certificateUrl !== 'string') {
        return '';
    }

    return certificateUrl.trim();
};

const hasAssignedClassroom = (student) => {
    const hasCurrentEnrollmentGrade = Boolean(
        student?.current_grade?.id
        || student?.current_grade?.name
    );

    return Boolean(
        hasCurrentEnrollmentGrade
        || student?.classroom_name
        || student?.classroom?.classroom_name
        || student?.classroom?.id
        || student?.classroom_id
        || student?.class_room_name
        || student?.class_room?.classroom_name
        || student?.class_room?.id
        || student?.class_room_id
    );
};

const createEmptySchoolStudentStats = () => ({
    totalStudents: 0,
    activeStudents: 0,
    pendingStudents: 0,
    newApplications: 0,
    assignedStudents: 0,
});

const ASSIGNED_ENROLLMENT_STATUSES = new Set(['active', 'enrolled']);
const NEW_APPLICATION_STATUSES = new Set(['pending']);

const calculateSchoolStudentStats = (studentList, assignedStudentIds = null) => {
    return studentList.reduce((stats, student) => {
        const status = resolveStudentStatus(student);
        const studentId = getStudentId(student);

        stats.totalStudents += 1;
        if (status === 'active') {
            stats.activeStudents += 1;
        }
        if (status === 'pending') {
            stats.pendingStudents += 1;
        }
        if (NEW_APPLICATION_STATUSES.has(status)) {
            stats.newApplications += 1;
        }

        const isAssigned = assignedStudentIds
            ? Boolean(studentId && assignedStudentIds.has(studentId))
            : hasAssignedClassroom(student);

        if (isAssigned) {
            stats.assignedStudents += 1;
        }

        return stats;
    }, createEmptySchoolStudentStats());
};

const StudentAdmissions = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('applications');
    const [banner, setBanner] = useState({ type: 'error', message: '' });

    const [applications, setApplications] = useState([]);
    const [students, setStudents] = useState([]);
    const [files, setFiles] = useState([]);
    const [grades, setGrades] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);

    const [newStudent, setNewStudent] = useState(createDefaultStudent);
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [isClassroomStepOpen, setIsClassroomStepOpen] = useState(false);
    const [applicationYearFilter, setApplicationYearFilter] = useState('');
    const [assignmentAcademicYear, setAssignmentAcademicYear] = useState('');
    const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
    const [applicationSearch, setApplicationSearch] = useState('');
    const [assignmentSearch, setAssignmentSearch] = useState('');
    const [applicationActivityFilter, setApplicationActivityFilter] = useState('pending');
    const [assignmentActivityFilter, setAssignmentActivityFilter] = useState('');
    const [applicationsPage, setApplicationsPage] = useState(1);
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [filesPage, setFilesPage] = useState(1);
    const [applicationsPagination, setApplicationsPagination] = useState(createEmptyPaginationState);
    const [assignmentPagination, setAssignmentPagination] = useState(createEmptyPaginationState);
    const [filesPagination, setFilesPagination] = useState(createEmptyPaginationState);
    const [schoolStudentStats, setSchoolStudentStats] = useState(createEmptySchoolStudentStats);
    const [schoolClassroomsTotal, setSchoolClassroomsTotal] = useState(0);

    const [gradeQuery, setGradeQuery] = useState('');
    const [gradeOptions, setGradeOptions] = useState([]);
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [fileSearch, setFileSearch] = useState('');
    const [documentUpload, setDocumentUpload] = useState(createDefaultDocumentUpload);
    const [documentStudentQuery, setDocumentStudentQuery] = useState('');
    const [documentStudentOptions, setDocumentStudentOptions] = useState([]);
    const [showDocumentStudentDropdown, setShowDocumentStudentDropdown] = useState(false);

    const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);
    const [isFilesLoading, setIsFilesLoading] = useState(false);
    const [isDocumentStudentLoading, setIsDocumentStudentLoading] = useState(false);
    const [isGradeOptionsLoading, setIsGradeOptionsLoading] = useState(false);
    const [isCreatingStudent, setIsCreatingStudent] = useState(false);
    const [isAssigningStudent, setIsAssigningStudent] = useState(false);
    const [isUploadingDocument, setIsUploadingDocument] = useState(false);

    const applicationsRequestRef = useRef(0);
    const studentsRequestRef = useRef(0);
    const filesRequestRef = useRef(0);
    const documentStudentsRequestRef = useRef(0);
    const classroomsRequestRef = useRef(0);
    const gradesRequestRef = useRef(0);
    const gradeOptionsRequestRef = useRef(0);
    const academicYearsRequestRef = useRef(0);
    const schoolStatsRequestRef = useRef(0);
    const schoolClassroomsRequestRef = useRef(0);
    const documentFileInputRef = useRef(null);

    const schoolId = useMemo(() => resolveSchoolId(user), [user]);
    const debouncedApplicationSearch = useDebouncedValue(applicationSearch, 350);
    const debouncedAssignmentSearch = useDebouncedValue(assignmentSearch, 350);
    const debouncedGradeQuery = useDebouncedValue(gradeQuery, 250);
    const debouncedFileSearch = useDebouncedValue(fileSearch, 350);
    const debouncedDocumentStudentQuery = useDebouncedValue(documentStudentQuery, 300);

    const tabs = useMemo(() => {
        return [
            {
                id: 'applications',
                label: t('secretary.admissions.newApplications') || 'Applications',
                icon: FileText,
                badge: schoolStudentStats.newApplications,
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
    }, [schoolStudentStats.newApplications, t]);

    const filteredApplications = useMemo(() => {
        const normalizedStatusFilter = normalizeEnrollmentStatus(applicationActivityFilter);
        const normalizedSearch = debouncedApplicationSearch.trim().toLowerCase();

        return applications.filter((application) => {
            const status = resolveApplicationStatusForDisplay(application);
            if (normalizedStatusFilter && normalizedStatusFilter !== 'all' && status !== normalizedStatusFilter) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const searchHaystack = [
                application?.full_name,
                application?.email,
                application?.school_name,
                application?.school?.school_name,
                application?.grade_name,
                application?.grade?.name,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchHaystack.includes(normalizedSearch);
        });
    }, [applicationActivityFilter, applications, debouncedApplicationSearch]);

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
        const selectedGradeId = Number(selectedGradeFilter);
        const hasGradeFilter = Number.isInteger(selectedGradeId) && selectedGradeId > 0;

        const filteredStudents = hasGradeFilter
            ? students.filter((student) => getStudentGradeId(student) === selectedGradeId)
            : students;

        return [...filteredStudents].sort((leftStudent, rightStudent) => {
            return getStudentName(leftStudent).localeCompare(getStudentName(rightStudent));
        });
    }, [selectedGradeFilter, students]);

    const applicationsTotalPages = useMemo(() => {
        const total = Math.ceil((applicationsPagination.count || 0) / APPLICATIONS_PAGE_SIZE);
        return Math.max(total, 1);
    }, [applicationsPagination.count]);

    const assignmentTotalPages = useMemo(() => {
        const total = Math.ceil((assignmentPagination.count || 0) / ASSIGNMENT_PAGE_SIZE);
        return Math.max(total, 1);
    }, [assignmentPagination.count]);

    const filesTotalPages = useMemo(() => {
        const total = Math.ceil((filesPagination.count || 0) / FILES_PAGE_SIZE);
        return Math.max(total, 1);
    }, [filesPagination.count]);

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
        const totalStudents = schoolStudentStats.totalStudents;
        const activeStudents = schoolStudentStats.activeStudents;
        const pendingStudents = schoolStudentStats.pendingStudents;
        const totalClassrooms = schoolClassroomsTotal;

        return [
            { title: 'Total Students', value: totalStudents, icon: Users, color: 'indigo' },
            { title: 'Active', value: activeStudents, icon: CheckCircle, color: 'green' },
            { title: 'Pending', value: pendingStudents, icon: Clock, color: 'amber' },
            { title: 'Total Classrooms', value: totalClassrooms, icon: GraduationCap, color: 'blue' },
        ];
    }, [schoolClassroomsTotal, schoolStudentStats]);

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

    const fetchSchoolStudentStats = useCallback(async () => {
        if (!schoolId) {
            schoolStatsRequestRef.current += 1;
            setSchoolStudentStats(createEmptySchoolStudentStats());
            return;
        }

        const requestId = schoolStatsRequestRef.current + 1;
        schoolStatsRequestRef.current = requestId;

        try {
            const [studentsResult, enrollmentsResult, pendingApplicationsResult] = await Promise.allSettled([
                secretaryService.getAllStudents({ school_id: schoolId }),
                secretaryService.getAllEnrollments(),
                secretaryService.getStudentApplications({
                    school_id: schoolId,
                    status: 'pending',
                    page: 1,
                    page_size: 1,
                }),
            ]);

            if (studentsResult.status !== 'fulfilled') {
                throw studentsResult.reason;
            }

            const allStudents = studentsResult.value;
            if (schoolStatsRequestRef.current !== requestId) {
                return;
            }

            let assignedStudentIds = null;

            if (enrollmentsResult.status === 'fulfilled') {
                const schoolStudentIds = new Set(
                    allStudents
                        .map((student) => getStudentId(student))
                        .filter(Boolean)
                );

                assignedStudentIds = new Set(
                    enrollmentsResult.value
                        .filter((enrollment) => {
                            const status = String(enrollment?.status || '').trim().toLowerCase();
                            return ASSIGNED_ENROLLMENT_STATUSES.has(status) && enrollment?.is_active !== false;
                        })
                        .map((enrollment) => getEnrollmentStudentId(enrollment))
                        .filter((studentId) => studentId && schoolStudentIds.has(studentId))
                );
            }

            const nextStats = calculateSchoolStudentStats(allStudents, assignedStudentIds);

            if (pendingApplicationsResult.status === 'fulfilled') {
                const pendingPayload = pendingApplicationsResult.value;
                nextStats.newApplications = getListCount(pendingPayload);
            } else {
                console.error('Error fetching pending admissions count:', pendingApplicationsResult.reason);
            }

            setSchoolStudentStats(nextStats);
        } catch (error) {
            if (schoolStatsRequestRef.current !== requestId) {
                return;
            }

            console.error('Error fetching school-wide student stats:', error);
        }
    }, [schoolId]);

    const fetchSchoolClassroomsTotal = useCallback(async () => {
        if (!schoolId) {
            schoolClassroomsRequestRef.current += 1;
            setSchoolClassroomsTotal(0);
            return;
        }

        const requestId = schoolClassroomsRequestRef.current + 1;
        schoolClassroomsRequestRef.current = requestId;

        try {
            const context = await secretaryService.getSecretaryContext();
            if (schoolClassroomsRequestRef.current !== requestId) {
                return;
            }

            const classroomsList = Array.isArray(context?.classrooms) ? context.classrooms : [];
            setSchoolClassroomsTotal(classroomsList.length);
        } catch (error) {
            if (schoolClassroomsRequestRef.current !== requestId) {
                return;
            }

            console.error('Error fetching school classroom totals:', error);
            setSchoolClassroomsTotal(0);
        }
    }, [schoolId]);

    const fetchStudentApplications = useCallback(async (
        _yearId = '',
        statusFilter = '',
        pageNumber = 1,
        searchFilter = ''
    ) => {
        void _yearId;

        const requestId = applicationsRequestRef.current + 1;
        applicationsRequestRef.current = requestId;

        try {
            setIsApplicationsLoading(true);
            const params = {};
            if (schoolId) {
                params.school_id = schoolId;
            }

            const normalizedStatus = normalizeEnrollmentStatus(statusFilter);
            if (normalizedStatus === 'all') {
                params.status = 'all';
            } else if (normalizedStatus) {
                params.status = normalizedStatus;
            }

            const normalizedSearch = searchFilter.trim();
            if (normalizedSearch) {
                params.search = normalizedSearch;
            }
            params.page = pageNumber;
            params.page_size = APPLICATIONS_PAGE_SIZE;

            const data = await secretaryService.getStudentApplications(params);
            if (applicationsRequestRef.current !== requestId) {
                return;
            }
            const normalizedData = normalizePaginatedListResponse(data);
            const applicationResults = normalizedData.results.map((application) => ({
                ...application,
                source_type: 'application',
                display_id: application?.id ?? 'N/A',
            }));

            if (normalizedStatus === 'pending' && applicationResults.length === 0) {
                const pendingStudentParams = {
                    current_status: 'pending',
                    page: pageNumber,
                    page_size: APPLICATIONS_PAGE_SIZE,
                };
                if (schoolId) {
                    pendingStudentParams.school_id = schoolId;
                }
                if (normalizedSearch) {
                    pendingStudentParams.search = normalizedSearch;
                }

                const pendingStudentsData = await secretaryService.getStudents(pendingStudentParams);
                if (applicationsRequestRef.current !== requestId) {
                    return;
                }

                const normalizedStudentsData = normalizePaginatedListResponse(pendingStudentsData);
                const fallbackRows = normalizedStudentsData.results.map((student, index) =>
                    normalizePendingStudentRecord(student, index)
                );

                setApplications(fallbackRows);
                setApplicationsPagination({
                    count: normalizedStudentsData.count,
                    next: normalizedStudentsData.next,
                    previous: normalizedStudentsData.previous,
                });
                return;
            }

            setApplications(applicationResults);
            setApplicationsPagination({
                count: normalizedData.count,
                next: normalizedData.next,
                previous: normalizedData.previous,
            });
        } catch (error) {
            if (applicationsRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching applications:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to fetch applications.'));
        } finally {
            if (applicationsRequestRef.current === requestId) {
                setIsApplicationsLoading(false);
            }
        }
    }, [schoolId, setFeedback]);

    const fetchAssignmentStudents = useCallback(async (
        activityStatus = '',
        pageNumber = 1,
        gradeFilter = '',
        searchFilter = ''
    ) => {
        if (!schoolId) {
            studentsRequestRef.current += 1;
            setStudents([]);
            setAssignmentPagination(createEmptyPaginationState());
            return;
        }

        const requestId = studentsRequestRef.current + 1;
        studentsRequestRef.current = requestId;

        try {
            setIsStudentsLoading(true);
            const params = { school_id: schoolId };
            if (activityStatus) {
                params.activity_status = activityStatus;
            }
            if (gradeFilter) {
                params.grade_id = gradeFilter;
            }
            const normalizedSearch = searchFilter.trim();
            if (normalizedSearch) {
                params.search = normalizedSearch;
            }
            params.page = pageNumber;
            params.page_size = ASSIGNMENT_PAGE_SIZE;

            const data = await secretaryService.getStudents(params);
            if (studentsRequestRef.current !== requestId) {
                return;
            }
            const normalizedData = normalizePaginatedListResponse(data);
            setStudents(normalizedData.results);
            setAssignmentPagination({
                count: normalizedData.count,
                next: normalizedData.next,
                previous: normalizedData.previous,
            });
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

    const fetchStudentDocuments = useCallback(async (pageNumber = 1, searchFilter = '') => {
        if (!schoolId) {
            filesRequestRef.current += 1;
            setFiles([]);
            setFilesPagination(createEmptyPaginationState());
            return;
        }

        const requestId = filesRequestRef.current + 1;
        filesRequestRef.current = requestId;

        try {
            setIsFilesLoading(true);
            const params = {
                school_id: schoolId,
                page: pageNumber,
                page_size: FILES_PAGE_SIZE,
            };

            const normalizedSearch = searchFilter.trim();
            if (normalizedSearch) {
                params.search = normalizedSearch;
            }

            const data = await secretaryService.getStudentDocuments(params);
            if (filesRequestRef.current !== requestId) {
                return;
            }

            const normalizedData = normalizePaginatedListResponse(data);
            setFiles(normalizedData.results);
            setFilesPagination({
                count: normalizedData.count,
                next: normalizedData.next,
                previous: normalizedData.previous,
            });
        } catch (error) {
            if (filesRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching student documents:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to load uploaded files.'));
        } finally {
            if (filesRequestRef.current === requestId) {
                setIsFilesLoading(false);
            }
        }
    }, [schoolId, setFeedback]);

    const fetchDocumentStudentOptions = useCallback(async (searchFilter = '') => {
        if (!schoolId) {
            documentStudentsRequestRef.current += 1;
            setDocumentStudentOptions([]);
            setIsDocumentStudentLoading(false);
            return;
        }

        const requestId = documentStudentsRequestRef.current + 1;
        documentStudentsRequestRef.current = requestId;

        try {
            setIsDocumentStudentLoading(true);
            const params = {
                school_id: schoolId,
                page_size: 20,
            };
            const normalizedSearch = searchFilter.trim();
            if (normalizedSearch) {
                params.search = normalizedSearch;
            }

            const data = await secretaryService.getStudents(params);
            if (documentStudentsRequestRef.current !== requestId) {
                return;
            }

            setDocumentStudentOptions(normalizeListResponse(data));
        } catch (error) {
            if (documentStudentsRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching students for file assignment:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to load student options.'));
        } finally {
            if (documentStudentsRequestRef.current === requestId) {
                setIsDocumentStudentLoading(false);
            }
        }
    }, [schoolId, setFeedback]);

    const fetchGradeOptions = useCallback(async (query = '') => {
        if (!schoolId) {
            gradeOptionsRequestRef.current += 1;
            setGradeOptions([]);
            setIsGradeOptionsLoading(false);
            return;
        }

        const requestId = gradeOptionsRequestRef.current + 1;
        gradeOptionsRequestRef.current = requestId;

        try {
            setIsGradeOptionsLoading(true);
            const params = {
                school_id: schoolId,
                page_size: 20,
            };
            const normalizedQuery = query.trim();
            if (normalizedQuery) {
                params.name = normalizedQuery;
            }

            const data = await secretaryService.getGrades(params);
            if (gradeOptionsRequestRef.current !== requestId) {
                return;
            }
            setGradeOptions(normalizeListResponse(data));
        } catch (error) {
            if (gradeOptionsRequestRef.current !== requestId) {
                return;
            }
            console.error('Error fetching grade options:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to load grade options.'));
        } finally {
            if (gradeOptionsRequestRef.current === requestId) {
                setIsGradeOptionsLoading(false);
            }
        }
    }, [schoolId, setFeedback]);

    const resolveGradeIdFromQuery = useCallback(async () => {
        const normalizedQuery = gradeQuery.trim();
        if (!normalizedQuery) {
            return null;
        }

        const lowerCaseQuery = normalizedQuery.toLowerCase();
        const exactOption = gradeOptions.find((option) => {
            return (option?.name || '').trim().toLowerCase() === lowerCaseQuery;
        });
        if (exactOption?.id) {
            return Number(exactOption.id);
        }

        try {
            const data = await secretaryService.getGrades({
                school_id: schoolId,
                name: normalizedQuery,
                page_size: 20,
            });
            const options = normalizeListResponse(data);
            if (options.length) {
                setGradeOptions(options);
            }

            const exactApiOption = options.find((option) => {
                return (option?.name || '').trim().toLowerCase() === lowerCaseQuery;
            });
            if (exactApiOption?.id) {
                return Number(exactApiOption.id);
            }

            if (options.length === 1 && options[0]?.id) {
                return Number(options[0].id);
            }
        } catch (error) {
            console.error('Error resolving grade from query:', error);
        }

        return null;
    }, [gradeOptions, gradeQuery, schoolId]);

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
        filesRequestRef.current += 1;
        documentStudentsRequestRef.current += 1;
        classroomsRequestRef.current += 1;
        gradesRequestRef.current += 1;
        gradeOptionsRequestRef.current += 1;
        academicYearsRequestRef.current += 1;
        schoolStatsRequestRef.current += 1;
        schoolClassroomsRequestRef.current += 1;

        setApplications([]);
        setStudents([]);
        setFiles([]);
        setClassrooms([]);
        setGrades([]);
        setGradeOptions([]);
        setAcademicYears([]);
        setDocumentStudentOptions([]);

        setApplicationYearFilter('');
        setAssignmentAcademicYear('');
        setSelectedGradeFilter('');
        setSelectedClassroom('');
        setSelectedStudent('');
        setIsClassroomStepOpen(false);
        setApplicationSearch('');
        setAssignmentSearch('');
        setFileSearch('');
        setDocumentStudentQuery('');
        setDocumentUpload(createDefaultDocumentUpload());
        setApplicationActivityFilter('pending');
        setAssignmentActivityFilter('');
        setGradeQuery('');
        setShowGradeDropdown(false);
        setShowDocumentStudentDropdown(false);
        setIsFilesLoading(false);
        setIsDocumentStudentLoading(false);
        setIsGradeOptionsLoading(false);
        setApplicationsPage(1);
        setAssignmentPage(1);
        setFilesPage(1);
        setApplicationsPagination(createEmptyPaginationState());
        setAssignmentPagination(createEmptyPaginationState());
        setFilesPagination(createEmptyPaginationState());
        setSchoolStudentStats(createEmptySchoolStudentStats());
        setSchoolClassroomsTotal(0);
    }, [schoolId]);

    useEffect(() => {
        fetchSchoolStudentStats();
    }, [fetchSchoolStudentStats]);

    useEffect(() => {
        fetchSchoolClassroomsTotal();
    }, [fetchSchoolClassroomsTotal]);

    useEffect(() => {
        setApplicationsPage(1);
    }, [applicationActivityFilter, applicationSearch, applicationYearFilter]);

    useEffect(() => {
        setAssignmentPage(1);
    }, [assignmentAcademicYear, assignmentActivityFilter, assignmentSearch, selectedGradeFilter]);

    useEffect(() => {
        setFilesPage(1);
    }, [fileSearch]);

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
        if (activeTab !== 'add-student') {
            return;
        }

        fetchGradeOptions(debouncedGradeQuery);
    }, [activeTab, debouncedGradeQuery, fetchGradeOptions]);

    useEffect(() => {
        if (activeTab !== 'applications') {
            return;
        }

        fetchStudentApplications(
            applicationYearFilter,
            applicationActivityFilter,
            applicationsPage,
            debouncedApplicationSearch
        );
    }, [
        activeTab,
        applicationActivityFilter,
        applicationYearFilter,
        applicationsPage,
        debouncedApplicationSearch,
        fetchStudentApplications,
    ]);

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

        fetchAssignmentStudents(
            assignmentActivityFilter,
            assignmentPage,
            selectedGradeFilter,
            debouncedAssignmentSearch
        );
    }, [
        activeTab,
        assignmentActivityFilter,
        assignmentPage,
        debouncedAssignmentSearch,
        fetchAssignmentStudents,
        selectedGradeFilter,
    ]);

    useEffect(() => {
        if (activeTab !== 'files') {
            return;
        }

        fetchStudentDocuments(filesPage, debouncedFileSearch);
    }, [activeTab, debouncedFileSearch, fetchStudentDocuments, filesPage]);

    useEffect(() => {
        if (activeTab !== 'files') {
            setShowDocumentStudentDropdown(false);
            return;
        }

        fetchDocumentStudentOptions(debouncedDocumentStudentQuery);
    }, [activeTab, debouncedDocumentStudentQuery, fetchDocumentStudentOptions]);

    useEffect(() => {
        if (!selectedClassroom) {
            return;
        }

        const classroomExists = filteredClassrooms.some((classroom) => {
            return getClassroomId(classroom) === selectedClassroom.toString();
        });

        if (!classroomExists) {
            setSelectedClassroom('');
        }
    }, [filteredClassrooms, selectedClassroom]);

    useEffect(() => {
        setSelectedStudent('');
    }, [
        assignmentAcademicYear,
        assignmentActivityFilter,
        assignmentPage,
        assignmentSearch,
        selectedGradeFilter,
    ]);

    useEffect(() => {
        if (!selectedStudent || !assignmentAcademicYear) {
            setIsClassroomStepOpen(false);
            setSelectedClassroom('');
        }
    }, [assignmentAcademicYear, selectedStudent]);

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

    const handleDocumentStudentQueryChange = useCallback((event) => {
        const query = event.target.value;
        setDocumentStudentQuery(query);
        setShowDocumentStudentDropdown(true);
        setDocumentUpload((previous) => ({ ...previous, student_id: '' }));
    }, []);

    const handleDocumentStudentSelect = useCallback((student) => {
        const studentId = String(student?.user_id || student?.id || '');
        if (!studentId) {
            return;
        }

        setDocumentUpload((previous) => ({ ...previous, student_id: studentId }));
        setDocumentStudentQuery(getStudentName(student));
        setShowDocumentStudentDropdown(false);
    }, []);

    const handleDocumentFileChange = useCallback((event) => {
        const selectedFile = event.target.files?.[0] || null;
        setDocumentUpload((previous) => ({ ...previous, file: selectedFile }));
    }, []);

    const handleUploadDocument = useCallback(async (event) => {
        event.preventDefault();

        if (!schoolId) {
            setFeedback('error', 'School information is missing. Please re-login and try again.');
            return;
        }

        const studentId = Number.parseInt(documentUpload.student_id, 10);
        if (!Number.isInteger(studentId) || studentId <= 0) {
            setFeedback('error', 'Please search and select a student before uploading.');
            return;
        }

        if (!documentUpload.file) {
            setFeedback('error', 'Please choose a file to upload.');
            return;
        }

        try {
            setIsUploadingDocument(true);

            const formData = new FormData();
            formData.append('student_id', String(studentId));
            formData.append('document_type', documentUpload.document_type || DOCUMENT_TYPE_OPTIONS[0].value);
            formData.append('file', documentUpload.file);

            await secretaryService.uploadStudentDocument(formData);

            setFeedback('success', 'Document uploaded successfully.');
            setDocumentUpload(createDefaultDocumentUpload());
            if (documentFileInputRef.current) {
                documentFileInputRef.current.value = '';
            }
            setDocumentStudentQuery('');
            setShowDocumentStudentDropdown(false);
            setFilesPage(1);
        } catch (error) {
            console.error('Error uploading student document:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to upload document.'));
        } finally {
            setIsUploadingDocument(false);
        }
    }, [documentUpload, schoolId, setFeedback]);

    const handleCreateStudent = useCallback(async (event) => {
        event.preventDefault();

        if (!schoolId) {
            setFeedback('error', 'School information is missing. Please re-login and try again.');
            return;
        }

        const firstName = newStudent.first_name.trim();
        const lastName = newStudent.last_name.trim();
        const email = newStudent.email.trim();
        const gender = newStudent.gender.trim();
        const phone = newStudent.phone.trim();
        const address = newStudent.address.trim();
        const nationalId = newStudent.national_id.trim();
        const emergencyContact = newStudent.emergency_contact.trim();
        const medicalNotes = newStudent.medical_notes.trim();
        const enrollmentStatus = (newStudent.enrollment_status || '').trim();
        let gradeId = Number.parseInt(newStudent.grade_id, 10);
        if (!Number.isInteger(gradeId)) {
            const resolvedGradeId = await resolveGradeIdFromQuery();
            if (Number.isInteger(resolvedGradeId) && resolvedGradeId > 0) {
                gradeId = resolvedGradeId;
                setNewStudent((previous) => ({ ...previous, grade_id: String(resolvedGradeId) }));
            }
        }

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

        const payload = {
            email,
            full_name: `${firstName} ${lastName}`.trim(),
            password: newStudent.password || 'Student@123',
            school_id: schoolId,
            grade_id: gradeId,
            date_of_birth: newStudent.date_of_birth,
            admission_date: newStudent.admission_date,
        };

        if (gender) payload.gender = gender;
        if (phone) payload.phone = phone;
        if (address) payload.address = address;
        if (nationalId) payload.national_id = nationalId;
        if (emergencyContact) payload.emergency_contact = emergencyContact;
        if (medicalNotes) payload.medical_notes = medicalNotes;
        if (enrollmentStatus) {
            payload.enrollment_status = enrollmentStatus;
            payload.current_status = enrollmentStatus;
        }

        try {
            setIsCreatingStudent(true);

            await secretaryService.createStudent(payload);

            setFeedback('success', 'Student created successfully!');
            fetchSchoolStudentStats();
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
    }, [fetchSchoolStudentStats, newStudent, resolveGradeIdFromQuery, schoolId, setFeedback]);

    const handleAssign = useCallback(async () => {
        if (!selectedStudent || !assignmentAcademicYear) {
            setFeedback('error', 'Please select a student and academic year.');
            return;
        }

        if (!isClassroomStepOpen) {
            setIsClassroomStepOpen(true);
            setSelectedClassroom('');
            return;
        }

        if (!selectedClassroom) {
            setFeedback('error', 'Please select a classroom to finish assignment.');
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
            setIsClassroomStepOpen(false);
            setSelectedClassroom('');
            fetchSchoolStudentStats();
            fetchAssignmentStudents(
                assignmentActivityFilter,
                assignmentPage,
                selectedGradeFilter,
                debouncedAssignmentSearch
            );
        } catch (error) {
            console.error('Error assigning student:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to assign student to class.'));
        } finally {
            setIsAssigningStudent(false);
        }
    }, [
        assignmentAcademicYear,
        assignmentActivityFilter,
        assignmentPage,
        debouncedAssignmentSearch,
        fetchSchoolStudentStats,
        fetchAssignmentStudents,
        isClassroomStepOpen,
        selectedGradeFilter,
        selectedClassroom,
        selectedStudent,
        setFeedback,
    ]);

    const updateNewStudentField = useCallback((field, value) => {
        setNewStudent((previous) => ({ ...previous, [field]: value }));
    }, []);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        setBanner((previous) => ({ ...previous, message: '' }));
    }, []);

    const isAssignDisabled = (
        !selectedStudent
        || !assignmentAcademicYear
        || (isClassroomStepOpen && !selectedClassroom)
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
                                    <label htmlFor="application-status-filter" className="form-label">Status</label>
                                    <select
                                        id="application-status-filter"
                                        className="form-select"
                                        value={applicationActivityFilter}
                                        onChange={(event) => setApplicationActivityFilter(event.target.value)}
                                    >
                                        {APPLICATION_STATUS_FILTER_OPTIONS.map((option) => (
                                            <option key={option.value || 'all'} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="sec-table-wrap">
                                {isApplicationsLoading ? (
                                    <SkeletonTable rows={5} cols={6} />
                                ) : (
                                    <div className="sec-table-scroll">
                                        <table className="data-table sec-data-table sec-data-table--applications">
                                            <thead>
                                                <tr>
                                                    <th className="cell-id">ID</th>
                                                    <th>Applicant</th>
                                                    <th>Grade</th>
                                                    <th>School</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredApplications.map((application) => {
                                                    const isApplicationRecord = application?.source_type !== 'student';
                                                    const applicationId = application.id;
                                                    const displayId = application?.display_id ?? applicationId;
                                                    const studentName = getStudentName(application);
                                                    const status = resolveApplicationStatusForDisplay(application);
                                                    const gradeName = (
                                                        application.grade_name
                                                        || application.grade?.name
                                                        || 'N/A'
                                                    );
                                                    const schoolName = application.school_name || application.school?.school_name || 'N/A';
                                                    const birthCertificateUrl = getApplicationBirthCertificateUrl(application);

                                                    return (
                                                        <tr
                                                            key={applicationId}
                                                            className={isApplicationRecord ? 'sec-clickable-row' : ''}
                                                            onClick={() => {
                                                                if (!isApplicationRecord) {
                                                                    return;
                                                                }
                                                                navigate(`/secretary/admissions/${applicationId}`);
                                                            }}
                                                        >
                                                            <td className="cell-id">#{displayId}</td>
                                                            <td>
                                                                <div className="sec-row-user">
                                                                    <AvatarInitial name={studentName} size="sm" color="indigo" />
                                                                    <div className="sec-file-student">
                                                                        <span>{studentName}</span>
                                                                        {application.email ? <small className="cell-muted">{application.email}</small> : null}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{gradeName}</td>
                                                            <td className="cell-muted">{schoolName}</td>
                                                            <td>
                                                                <StatusBadge status={status} />
                                                            </td>
                                                            <td>
                                                                {isApplicationRecord ? (
                                                                    <div className="action-btn-group">
                                                                        <button
                                                                            type="button"
                                                                            className="btn-icon success"
                                                                            title={birthCertificateUrl ? 'Open Birth Certificate' : 'Birth certificate not available'}
                                                                            aria-label={`Open birth certificate for ${studentName}`}
                                                                            disabled={!birthCertificateUrl}
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                if (!birthCertificateUrl) {
                                                                                    return;
                                                                                }

                                                                                window.open(birthCertificateUrl, '_blank', 'noopener,noreferrer');
                                                                            }}
                                                                        >
                                                                            <Download size={16} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn-icon info"
                                                                            title="Review Application"
                                                                            aria-label={`Review application for ${studentName}`}
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                navigate(`/secretary/admissions/${applicationId}`);
                                                                            }}
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="cell-muted">Pending student</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {filteredApplications.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6">
                                                            <EmptyState icon={Users} message="No pending students or applications found." />
                                                        </td>
                                                    </tr>
                                                ) : null}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {applicationsPagination.count > 0 ? (
                                <div className="sec-table-pagination">
                                    <span className="sec-table-pagination-summary">
                                        Showing {applications.length} records on this page ({applicationsPagination.count} total)
                                    </span>
                                    <div className="sec-table-pagination-controls">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setApplicationsPage((previous) => Math.max(1, previous - 1))}
                                            disabled={!applicationsPagination.previous || isApplicationsLoading}
                                        >
                                            Previous
                                        </button>
                                        <span className="sec-table-pagination-page">
                                            Page {applicationsPage} of {applicationsTotalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setApplicationsPage((previous) => Math.min(applicationsTotalPages, previous + 1))}
                                            disabled={!applicationsPagination.next || isApplicationsLoading}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            ) : null}
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
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-select"
                                        value={newStudent.gender}
                                        onChange={(event) => updateNewStudentField('gender', event.target.value)}
                                    >
                                        {GENDER_OPTIONS.map((option) => (
                                            <option key={option.value || 'none'} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Optional phone"
                                        value={newStudent.phone}
                                        onChange={(event) => updateNewStudentField('phone', event.target.value)}
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
                                            {isGradeOptionsLoading ? (
                                                <div className="sec-grade-empty">Loading grades...</div>
                                            ) : gradeOptions.length > 0 ? (
                                                gradeOptions.map((grade) => (
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

                                <div className="sec-field">
                                    <label className="form-label">Enrollment Status</label>
                                    <select
                                        className="form-select"
                                        value={newStudent.enrollment_status}
                                        onChange={(event) => updateNewStudentField('enrollment_status', event.target.value)}
                                    >
                                        {STUDENT_ENROLLMENT_STATUS_OPTIONS.map((statusOption) => (
                                            <option key={`enrollment-${statusOption.value}`} value={statusOption.value}>
                                                {statusOption.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">National ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Optional national ID"
                                        value={newStudent.national_id}
                                        onChange={(event) => updateNewStudentField('national_id', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Emergency Contact</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Optional emergency contact"
                                        value={newStudent.emergency_contact}
                                        onChange={(event) => updateNewStudentField('emergency_contact', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Optional address"
                                        value={newStudent.address}
                                        onChange={(event) => updateNewStudentField('address', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Medical Notes</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder="Optional medical notes"
                                        value={newStudent.medical_notes}
                                        onChange={(event) => updateNewStudentField('medical_notes', event.target.value)}
                                    />
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
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={assignmentActivityFilter}
                                    onChange={(event) => setAssignmentActivityFilter(event.target.value)}
                                    disabled={!assignmentAcademicYear}
                                >
                                    {STUDENT_ACTIVITY_FILTER_OPTIONS.map((option) => (
                                        <option key={option.value || 'all'} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label htmlFor="assignment-search" className="form-label">Search Student</label>
                                <div className="search-wrapper sec-search-wrapper">
                                    <Search size={16} className="search-icon" />
                                    <input
                                        id="assignment-search"
                                        type="text"
                                        className="search-input"
                                        placeholder="Search by name or email..."
                                        value={assignmentSearch}
                                        onChange={(event) => setAssignmentSearch(event.target.value)}
                                        disabled={!assignmentAcademicYear}
                                    />
                                </div>
                            </div>

                            {isClassroomStepOpen ? (
                                <div className="sec-field sec-field--compact">
                                    <label className="form-label">Classroom</label>
                                    <select
                                        className="form-select"
                                        value={selectedClassroom}
                                        onChange={(event) => setSelectedClassroom(event.target.value)}
                                        disabled={!assignmentAcademicYear}
                                    >
                                        <option value="">Select Classroom...</option>
                                        {filteredClassrooms.map((classroom) => {
                                            const classroomId = getClassroomId(classroom);
                                            if (!classroomId) {
                                                return null;
                                            }

                                            const homeroomTeacherName = classroom.homeroom_teacher_name || 'No homeroom teacher';

                                            return (
                                                <option key={classroomId} value={classroomId}>
                                                    {classroom.classroom_name} {classroom.grade_name ? `(${classroom.grade_name})` : ''} - {homeroomTeacherName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            ) : (
                                <div className="sec-field sec-field--compact">
                                    <label className="form-label">Classroom</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value="Select a student, then click Assign Student"
                                        readOnly
                                        disabled
                                    />
                                </div>
                            )}

                            <div className="sec-assignment-action">
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleAssign}
                                    disabled={isAssignDisabled}
                                >
                                    <UserPlus size={18} />
                                    {isAssigningStudent
                                        ? 'Assigning...'
                                        : isClassroomStepOpen
                                            ? 'Confirm Assignment'
                                            : 'Assign Student'}
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
                                <>
                                    {isClassroomStepOpen ? (
                                        <div className="sec-classroom-card-section">
                                            <h4 className="sec-classroom-card-title">Available Classrooms</h4>
                                            {filteredClassrooms.length === 0 ? (
                                                <EmptyState
                                                    icon={GraduationCap}
                                                    message="No classrooms found for the selected academic year and grade."
                                                />
                                            ) : (
                                                <div className="sec-classroom-grid">
                                                    {filteredClassrooms.map((classroom) => {
                                                        const classroomId = getClassroomId(classroom);
                                                        if (!classroomId) {
                                                            return null;
                                                        }

                                                        const classroomName = classroom.classroom_name || `Classroom #${classroomId}`;
                                                        const gradeName = classroom.grade_name || classroom.grade?.name || 'Grade not set';
                                                        const homeroomTeacherName = classroom.homeroom_teacher_name || 'No homeroom teacher';
                                                        const isSelectedClassroom = selectedClassroom === classroomId.toString();

                                                        return (
                                                            <button
                                                                key={classroomId}
                                                                type="button"
                                                                className={`sec-classroom-card ${isSelectedClassroom ? 'is-selected' : ''}`}
                                                                onClick={() => setSelectedClassroom(classroomId.toString())}
                                                            >
                                                                <div className="sec-classroom-card-head">
                                                                    <h4>{classroomName}</h4>
                                                                    {isSelectedClassroom ? (
                                                                        <span className="sec-checkmark"><Check size={14} /></span>
                                                                    ) : null}
                                                                </div>
                                                                <div className="sec-classroom-card-meta">
                                                                    <span>Grade: {gradeName}</span>
                                                                    <span>Homeroom: {homeroomTeacherName}</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : null}

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
                                </>
                            )}
                        </div>

                        {assignmentAcademicYear && assignmentPagination.count > 0 ? (
                            <div className="sec-table-pagination">
                                <span className="sec-table-pagination-summary">
                                    Showing {assignmentStudents.length} students on this page ({assignmentPagination.count} total)
                                </span>
                                <div className="sec-table-pagination-controls">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setAssignmentPage((previous) => Math.max(1, previous - 1))}
                                        disabled={!assignmentPagination.previous || isStudentsLoading}
                                    >
                                        Previous
                                    </button>
                                    <span className="sec-table-pagination-page">
                                        Page {assignmentPage} of {assignmentTotalPages}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setAssignmentPage((previous) => Math.min(assignmentTotalPages, previous + 1))}
                                        disabled={!assignmentPagination.next || isStudentsLoading}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </section>
                ) : null}

                {activeTab === 'files' ? (
                    <section className="file-management-grid">
                        <article className="management-card">
                            <h3>Upload Documents</h3>
                            <form onSubmit={handleUploadDocument}>
                                <div className="file-upload-area">
                                    <div className="file-upload-icon">
                                        <Upload size={28} />
                                    </div>
                                    <p>Select a document file to upload</p>
                                    <label htmlFor="student-document-upload" className="btn-secondary sec-upload-trigger">
                                        Choose File
                                    </label>
                                    <input
                                        id="student-document-upload"
                                        type="file"
                                        ref={documentFileInputRef}
                                        className="sec-hidden-file-input"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleDocumentFileChange}
                                    />
                                    <span>
                                        {documentUpload.file
                                            ? `${documentUpload.file.name} (${formatFileSize(documentUpload.file.size)})`
                                            : 'PDF, JPG, PNG up to 10MB'}
                                    </span>
                                </div>

                                <div className="sec-field sec-grade-field">
                                    <label className="form-label">Assign to Student *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Search and select student..."
                                        value={documentStudentQuery}
                                        onChange={handleDocumentStudentQueryChange}
                                        onFocus={() => setShowDocumentStudentDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowDocumentStudentDropdown(false), 200)}
                                        required={!documentUpload.student_id}
                                    />

                                    {showDocumentStudentDropdown ? (
                                        <div className="sec-grade-dropdown">
                                            {isDocumentStudentLoading ? (
                                                <div className="sec-grade-empty">Loading students...</div>
                                            ) : documentStudentOptions.length > 0 ? (
                                                documentStudentOptions.map((studentOption) => {
                                                    const studentId = String(studentOption?.user_id || studentOption?.id || '');
                                                    const studentLabel = getStudentName(studentOption);
                                                    const studentEmail = studentOption?.email || '';

                                                    return (
                                                        <button
                                                            key={`${studentId}-${studentEmail}`}
                                                            type="button"
                                                            className={`sec-grade-option ${documentUpload.student_id === studentId ? 'is-selected' : ''}`}
                                                            onMouseDown={() => handleDocumentStudentSelect(studentOption)}
                                                        >
                                                            {studentLabel}{studentEmail ? ` (${studentEmail})` : ''}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="sec-grade-empty">No students found</div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">Document Type</label>
                                    <select
                                        className="form-select"
                                        value={documentUpload.document_type}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setDocumentUpload((previous) => ({ ...previous, document_type: value }));
                                        }}
                                    >
                                        {DOCUMENT_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button type="submit" className="btn-primary sec-btn-block" disabled={isUploadingDocument}>
                                    {isUploadingDocument ? 'Uploading...' : 'Upload File'}
                                </button>
                            </form>
                        </article>

                        <article className="management-card">
                            <div className="sec-files-head">
                                <h3>Recent Uploads</h3>
                                <div className="search-wrapper sec-search-wrapper sec-search-narrow">
                                    <Search size={16} className="search-icon" />
                                    <input
                                        type="text"
                                        className="search-input"
                                        placeholder="Search files..."
                                        value={fileSearch}
                                        onChange={(event) => setFileSearch(event.target.value)}
                                    />
                                </div>
                            </div>

                            {isFilesLoading ? (
                                <SkeletonTable rows={5} cols={5} />
                            ) : (
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
                                            {files.map((file) => {
                                                const fileTypeLabel = file.document_type_label || file.document_type || 'Document';
                                                const studentLabel = file.student_name || 'Unknown Student';
                                                const studentEmail = file.student_email || '';

                                                return (
                                                    <tr key={file.id}>
                                                        <td>
                                                            <div className="sec-file-cell">
                                                                <FileText size={16} />
                                                                <span>{fileTypeLabel}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="sec-file-student">
                                                                <span>{studentLabel}</span>
                                                                {studentEmail ? <small className="cell-muted">{studentEmail}</small> : null}
                                                            </div>
                                                        </td>
                                                        <td className="cell-muted">{formatFileSize(file.file_size)}</td>
                                                        <td className="cell-muted">{formatDateValue(file.created_at)}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn-icon success"
                                                                aria-label={`Download ${fileTypeLabel}`}
                                                                disabled={!file.file_url}
                                                                onClick={() => {
                                                                    if (file.file_url) {
                                                                        window.open(file.file_url, '_blank', 'noopener,noreferrer');
                                                                    }
                                                                }}
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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
                            )}

                            {filesPagination.count > 0 ? (
                                <div className="sec-table-pagination">
                                    <span className="sec-table-pagination-summary">
                                        Showing {files.length} files on this page ({filesPagination.count} total)
                                    </span>
                                    <div className="sec-table-pagination-controls">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setFilesPage((previous) => Math.max(1, previous - 1))}
                                            disabled={!filesPagination.previous || isFilesLoading}
                                        >
                                            Previous
                                        </button>
                                        <span className="sec-table-pagination-page">
                                            Page {filesPage} of {filesTotalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setFilesPage((previous) => Math.min(filesTotalPages, previous + 1))}
                                            disabled={!filesPagination.next || isFilesLoading}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </article>
                    </section>
                ) : null}
            </div>
        </div>
    );
};

export default StudentAdmissions;
