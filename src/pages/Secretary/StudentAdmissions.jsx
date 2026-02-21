import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    Check,
    CheckCircle,
    Clock,
    Download,
    Eye,
    EyeOff,
    FileText,
    Pencil,
    GraduationCap,
    Search,
    Trash2,
    Upload,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import secretaryService from '../../services/secretaryService';
import {
    AlertBanner,
    AvatarInitial,
    ConfirmModal,
    EmptyState,
    LoadingSpinner,
    PageHeader,
    SkeletonTable,
    StatCard,
    StatusBadge,
} from './components';
import './Secretary.css';

const STUDENT_ENROLLMENT_STATUS_OPTIONS = [
    { value: 'rejected', labelKey: 'secretary.admissions.manual.enrollment.rejected', fallbackLabel: 'Rejected' },
    { value: 'pending', labelKey: 'secretary.admissions.manual.enrollment.pending', fallbackLabel: 'Pending' },
    { value: 'graduated', labelKey: 'secretary.admissions.manual.enrollment.graduated', fallbackLabel: 'Graduated' },
    { value: 'active', labelKey: 'secretary.admissions.manual.enrollment.active', fallbackLabel: 'Active' },
];

const GENDER_OPTIONS = [
    { value: '', labelKey: 'secretary.admissions.manual.gender.select', fallbackLabel: 'Select Gender' },
    { value: 'male', labelKey: 'secretary.admissions.manual.gender.male', fallbackLabel: 'Male' },
    { value: 'female', labelKey: 'secretary.admissions.manual.gender.female', fallbackLabel: 'Female' },
    { value: 'other', labelKey: 'secretary.admissions.manual.gender.other', fallbackLabel: 'Other' },
];

const STUDENT_ACTIVITY_FILTER_OPTIONS = [
    { value: 'all', labelKey: 'secretary.admissions.classAssignment.filters.allStudents', fallbackLabel: 'All Students' },
    { value: 'active', labelKey: 'secretary.admissions.classAssignment.filters.active', fallbackLabel: 'Active' },
    { value: 'not_active', labelKey: 'secretary.admissions.classAssignment.filters.notActive', fallbackLabel: 'Not Active' },
];

const ASSIGNMENT_CLASSROOM_FILTER_OPTIONS = [
    { value: '', labelKey: 'secretary.admissions.classAssignment.filters.all', fallbackLabel: 'All' },
    { value: 'assigned', labelKey: 'secretary.admissions.classAssignment.filters.assigned', fallbackLabel: 'Assigned' },
    { value: 'not_assigned', labelKey: 'secretary.admissions.classAssignment.filters.notAssigned', fallbackLabel: 'Not Assigned' },
];

const APPLICATION_STATUS_FILTER_OPTIONS = [
    { value: 'pending', labelKey: 'secretary.admissions.filter.pending', fallbackLabel: 'Pending' },
    { value: 'enrolled', labelKey: 'secretary.admissions.filter.enrolled', fallbackLabel: 'Enrolled' },
    { value: 'all', labelKey: 'secretary.admissions.filter.allStatuses', fallbackLabel: 'All Application Statuses' },
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
    password: '',
    confirm_password: '',
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
    birth_certificate: null,
});

const createDefaultDocumentUpload = () => ({
    student_id: '',
    studentSearch: '',
    selectedStudent: null,
    document_type: DOCUMENT_TYPE_OPTIONS[0].value,
    file: null,
});

const createDefaultStudentEditData = () => ({
    admission_date: '',
    enrollment_status: 'active',
    phone: '',
    address: '',
    medical_notes: '',
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

const formatDateForInput = (value) => {
    if (!value) {
        return '';
    }

    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) {
        return '';
    }

    return dateValue.toISOString().split('T')[0];
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

const getNumericStudentId = (student) => {
    const candidate = student?.user_id ?? student?.id ?? student?.display_id;
    if (candidate === null || candidate === undefined || candidate === '') {
        return null;
    }

    if (typeof candidate === 'number') {
        return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
    }

    const normalized = String(candidate).trim();
    if (!normalized) {
        return null;
    }

    if (/^\d+$/.test(normalized)) {
        const parsed = Number(normalized);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }

    const trailingDigits = normalized.match(/(\d+)$/);
    if (trailingDigits?.[1]) {
        const parsed = Number(trailingDigits[1]);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }

    return null;
};

const normalizeEnrollmentStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'suspending') {
        return 'pending';
    }

    return value;
};

const normalizeStudentActivityFilter = (status) => {
    const value = String(status || '').trim().toLowerCase();
    if (!value || value === 'all') {
        return '';
    }
    if (value === 'active' || value === 'not_active') {
        return value;
    }
    return '';
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

const getEnrollmentClassroomName = (enrollment) => {
    const candidate = (
        enrollment?.classroom_name
        ?? enrollment?.class_room_name
        ?? enrollment?.class_room?.classroom_name
        ?? ''
    );
    return String(candidate).trim();
};

const getEnrollmentGradeId = (enrollment) => {
    const candidate = (
        enrollment?.class_room?.grade?.id
        ?? enrollment?.class_room?.grade_id
        ?? enrollment?.grade?.id
        ?? enrollment?.grade_id
    );
    const gradeId = Number(candidate);
    return Number.isInteger(gradeId) && gradeId > 0 ? gradeId : null;
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

const getClassroomName = (classroom) => {
    const candidate = (
        classroom?.classroom_name
        ?? classroom?.class_room_name
        ?? classroom?.name
        ?? ''
    );
    const normalized = String(candidate).trim();
    if (normalized) {
        return normalized;
    }

    const classroomId = Number(classroom?.id ?? classroom?.classroom_id ?? classroom?.class_room_id);
    if (Number.isInteger(classroomId) && classroomId > 0) {
        return `Classroom #${classroomId}`;
    }
    return 'Selected classroom';
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

const normalizeStudentRecordForApplicationList = (student, index = 0, statusOverride = '') => {
    const rawStatus = statusOverride || resolveStudentStatus(student) || 'pending';
    const status = normalizeEnrollmentStatus(rawStatus) || 'pending';
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

const normalizePendingStudentRecord = (student, index = 0) => {
    return normalizeStudentRecordForApplicationList(student, index, 'pending');
};

const getApplicationBirthCertificateUrl = (application) => {
    const certificateUrl = application?.birth_certificate_url;
    if (typeof certificateUrl !== 'string') {
        return '';
    }

    return certificateUrl.trim();
};

const getApplicationLinkedStudentId = (application) => {
    const candidate = (
        application?.enrolled_student_id
        ?? application?.enrolled_student?.user_id
        ?? application?.enrolled_student?.id
    );

    if (candidate === null || candidate === undefined || candidate === '') {
        return null;
    }

    const normalized = Number.parseInt(String(candidate).trim(), 10);
    return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
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

const getStudentClassroomName = (student) => {
    const candidate = (
        student?.classroom_name
        ?? student?.classroom?.classroom_name
        ?? student?.class_room_name
        ?? student?.class_room?.classroom_name
        ?? ''
    );

    return String(candidate).trim();
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
    const [academicYears, setAcademicYears] = useState([]);

    const [newStudent, setNewStudent] = useState(createDefaultStudent);
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedAssignmentStudent, setSelectedAssignmentStudent] = useState(null);
    const [availableClassrooms, setAvailableClassrooms] = useState([]);
    const [currentClassroomId, setCurrentClassroomId] = useState(null);
    const [currentClassroomName, setCurrentClassroomName] = useState('');
    const [applicationYearFilter, setApplicationYearFilter] = useState('');
    const [assignmentAcademicYear, setAssignmentAcademicYear] = useState('');
    const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
    const [applicationSearch, setApplicationSearch] = useState('');
    const [assignmentSearch, setAssignmentSearch] = useState('');
    const [applicationActivityFilter, setApplicationActivityFilter] = useState('pending');
    const [assignmentActivityFilter, setAssignmentActivityFilter] = useState('all');
    const [assignmentClassroomFilter, setAssignmentClassroomFilter] = useState('');
    const [applicationsPage, setApplicationsPage] = useState(1);
    const [assignmentPage, setAssignmentPage] = useState(1);
    const [filesPage, setFilesPage] = useState(1);
    const [applicationsPagination, setApplicationsPagination] = useState(createEmptyPaginationState);
    const [assignmentPagination, setAssignmentPagination] = useState(createEmptyPaginationState);
    const [filesPagination, setFilesPagination] = useState(createEmptyPaginationState);
    const [assignmentClassroomMap, setAssignmentClassroomMap] = useState({});
    const [schoolStudentStats, setSchoolStudentStats] = useState(createEmptySchoolStudentStats);
    const [schoolClassroomsTotal, setSchoolClassroomsTotal] = useState(0);

    const [gradeQuery, setGradeQuery] = useState('');
    const [gradeOptions, setGradeOptions] = useState([]);
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [fileSearch, setFileSearch] = useState('');
    const [filesTypeFilter, setFilesTypeFilter] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [documentUpload, setDocumentUpload] = useState(createDefaultDocumentUpload);
    const [documentStudentQuery, setDocumentStudentQuery] = useState('');
    const [documentStudentOptions, setDocumentStudentOptions] = useState([]);
    const [showDocumentStudentDropdown, setShowDocumentStudentDropdown] = useState(false);
    const [studentSearchResults, setStudentSearchResults] = useState([]);
    const [showDeleteDocConfirm, setShowDeleteDocConfirm] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
    const [studentToView, setStudentToView] = useState(null);
    const [showEditStudentModal, setShowEditStudentModal] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState(null);
    const [studentEditData, setStudentEditData] = useState(createDefaultStudentEditData);
    const [showDeleteStudentConfirm, setShowDeleteStudentConfirm] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);

    const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);
    const [isStudentsLoading, setIsStudentsLoading] = useState(false);
    const [isFilesLoading, setIsFilesLoading] = useState(false);
    const [isDocumentStudentLoading, setIsDocumentStudentLoading] = useState(false);
    const [isGradeOptionsLoading, setIsGradeOptionsLoading] = useState(false);
    const [isCreatingStudent, setIsCreatingStudent] = useState(false);
    const [isAssigningStudent, setIsAssigningStudent] = useState(false);
    const [isUploadingDocument, setIsUploadingDocument] = useState(false);
    const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
    const [isDeletingStudent, setIsDeletingStudent] = useState(false);
    const [showReassignConfirm, setShowReassignConfirm] = useState(false);
    const [pendingReassignment, setPendingReassignment] = useState(null);

    const applicationsRequestRef = useRef(0);
    const studentsRequestRef = useRef(0);
    const filesRequestRef = useRef(0);
    const documentStudentsRequestRef = useRef(0);
    const gradesRequestRef = useRef(0);
    const gradeOptionsRequestRef = useRef(0);
    const academicYearsRequestRef = useRef(0);
    const schoolStatsRequestRef = useRef(0);
    const schoolClassroomsRequestRef = useRef(0);
    const assignmentClassroomMapRequestRef = useRef(0);
    const documentFileInputRef = useRef(null);
    const birthCertificateInputRef = useRef(null);

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

    const applicationStatusFilterOptions = useMemo(() => {
        return APPLICATION_STATUS_FILTER_OPTIONS.map((option) => ({
            ...option,
            label: t(option.labelKey) || option.fallbackLabel,
        }));
    }, [t]);

    const studentActivityFilterOptions = useMemo(() => {
        return STUDENT_ACTIVITY_FILTER_OPTIONS.map((option) => ({
            ...option,
            label: t(option.labelKey) || option.fallbackLabel,
        }));
    }, [t]);

    const assignmentClassroomFilterOptions = useMemo(() => {
        return ASSIGNMENT_CLASSROOM_FILTER_OPTIONS.map((option) => ({
            ...option,
            label: t(option.labelKey) || option.fallbackLabel,
        }));
    }, [t]);

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

    const activeAcademicYears = useMemo(() => {
        return academicYears.filter((year) => year.is_active);
    }, [academicYears]);

    const assignmentStudents = useMemo(() => {
        const selectedGradeId = Number(selectedGradeFilter);
        const hasGradeFilter = Number.isInteger(selectedGradeId) && selectedGradeId > 0;
        const normalizedClassroomFilter = String(assignmentClassroomFilter || '').trim().toLowerCase();

        const filteredStudents = students.filter((student) => {
            if (hasGradeFilter && getStudentGradeId(student) !== selectedGradeId) {
                return false;
            }

            if (!normalizedClassroomFilter) {
                return true;
            }

            const studentId = getStudentId(student);
            const classroomMeta = studentId ? assignmentClassroomMap[studentId] : null;
            const isAssigned = classroomMeta && typeof classroomMeta.isAssigned === 'boolean'
                ? classroomMeta.isAssigned
                : hasAssignedClassroom(student);

            if (normalizedClassroomFilter === 'assigned') {
                return isAssigned;
            }
            if (normalizedClassroomFilter === 'not_assigned') {
                return !isAssigned;
            }
            return true;
        });

        return [...filteredStudents].sort((leftStudent, rightStudent) => {
            return getStudentName(leftStudent).localeCompare(getStudentName(rightStudent));
        });
    }, [assignmentClassroomFilter, assignmentClassroomMap, selectedGradeFilter, students]);

    const selectedAssignmentGradeLabel = useMemo(() => {
        if (!selectedAssignmentStudent) {
            return '';
        }

        if (selectedAssignmentStudent.grade_name) {
            return selectedAssignmentStudent.grade_name;
        }
        if (selectedAssignmentStudent.current_grade?.name) {
            return selectedAssignmentStudent.current_grade.name;
        }

        const gradeId = getStudentGradeId(selectedAssignmentStudent);
        if (Number.isInteger(gradeId)) {
            const matchedGrade = grades.find((grade) => Number(grade?.id) === gradeId);
            if (matchedGrade?.name) {
                return matchedGrade.name;
            }
            return `Grade ${gradeId}`;
        }

        const selectedGradeId = Number(selectedGradeFilter);
        if (Number.isInteger(selectedGradeId) && selectedGradeId > 0) {
            const matchedSelectedGrade = grades.find((grade) => Number(grade?.id) === selectedGradeId);
            if (matchedSelectedGrade?.name) {
                return matchedSelectedGrade.name;
            }
            return `Grade ${selectedGradeId}`;
        }

        return 'selected grade';
    }, [grades, selectedAssignmentStudent, selectedGradeFilter]);

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
        const pendingApplications = schoolStudentStats.newApplications;
        const totalClassrooms = schoolClassroomsTotal;

        return [
            { title: t('secretary.admissions.stats.totalStudents') || 'Total Students', value: totalStudents, icon: Users, color: 'indigo' },
            { title: t('secretary.admissions.stats.active') || 'Active', value: activeStudents, icon: CheckCircle, color: 'green' },
            { title: t('secretary.admissions.stats.pending') || 'Pending', value: pendingApplications, icon: Clock, color: 'amber' },
            { title: t('secretary.admissions.stats.totalClassrooms') || 'Total Classrooms', value: totalClassrooms, icon: GraduationCap, color: 'blue' },
        ];
    }, [schoolClassroomsTotal, schoolStudentStats, t]);

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
        academicYearFilter = '',
        activityStatus = 'all',
        pageNumber = 1,
        gradeFilter = '',
        searchFilter = ''
    ) => {
        if (!schoolId || !academicYearFilter) {
            studentsRequestRef.current += 1;
            setStudents([]);
            setAssignmentPagination(createEmptyPaginationState());
            return;
        }

        const requestId = studentsRequestRef.current + 1;
        studentsRequestRef.current = requestId;

        try {
            setIsStudentsLoading(true);
            const params = {
                school_id: schoolId,
            };
            const normalizedActivityStatus = normalizeStudentActivityFilter(activityStatus);
            if (normalizedActivityStatus) {
                params.activity_status = normalizedActivityStatus;
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

    const fetchStudentDocuments = useCallback(async (pageNumber = 1, searchFilter = '', typeFilter = '') => {
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
            if (typeFilter) {
                params.search = normalizedSearch
                    ? `${normalizedSearch} ${typeFilter}`
                    : typeFilter;
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

    useEffect(() => {
        applicationsRequestRef.current += 1;
        studentsRequestRef.current += 1;
        filesRequestRef.current += 1;
        documentStudentsRequestRef.current += 1;
        gradesRequestRef.current += 1;
        gradeOptionsRequestRef.current += 1;
        academicYearsRequestRef.current += 1;
        schoolStatsRequestRef.current += 1;
        schoolClassroomsRequestRef.current += 1;
        assignmentClassroomMapRequestRef.current += 1;

        setApplications([]);
        setStudents([]);
        setFiles([]);
        setGrades([]);
        setGradeOptions([]);
        setAcademicYears([]);
        setDocumentStudentOptions([]);

        setApplicationYearFilter('');
        setAssignmentAcademicYear('');
        setSelectedGradeFilter('');
        setSelectedStudent('');
        setSelectedAssignmentStudent(null);
        setAvailableClassrooms([]);
        setCurrentClassroomId(null);
        setApplicationSearch('');
        setAssignmentSearch('');
        setFileSearch('');
        setFilesTypeFilter('');
        setDocumentStudentQuery('');
        setDocumentUpload(createDefaultDocumentUpload());
        setShowUploadModal(false);
        setStudentSearchResults([]);
        setShowDeleteDocConfirm(false);
        setDocumentToDelete(null);
        setShowStudentDetailsModal(false);
        setStudentToView(null);
        setShowEditStudentModal(false);
        setStudentToEdit(null);
        setStudentEditData(createDefaultStudentEditData());
        setShowDeleteStudentConfirm(false);
        setStudentToDelete(null);
        setApplicationActivityFilter('pending');
        setAssignmentActivityFilter('all');
        setAssignmentClassroomFilter('');
        setGradeQuery('');
        setShowGradeDropdown(false);
        setShowDocumentStudentDropdown(false);
        setShowPwd(false);
        setShowConfirmPwd(false);
        setIsFilesLoading(false);
        setIsDocumentStudentLoading(false);
        setIsGradeOptionsLoading(false);
        setIsUpdatingStudent(false);
        setIsDeletingStudent(false);
        setApplicationsPage(1);
        setAssignmentPage(1);
        setFilesPage(1);
        setApplicationsPagination(createEmptyPaginationState());
        setAssignmentPagination(createEmptyPaginationState());
        setFilesPagination(createEmptyPaginationState());
        setAssignmentClassroomMap({});
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
    }, [assignmentAcademicYear, assignmentActivityFilter, assignmentClassroomFilter, assignmentSearch, selectedGradeFilter]);

    useEffect(() => {
        setFilesPage(1);
    }, [fileSearch, filesTypeFilter]);

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
            setAvailableClassrooms([]);
            setCurrentClassroomId(null);
            setCurrentClassroomName('');
            setShowReassignConfirm(false);
            setPendingReassignment(null);
        }
    }, [activeTab, assignmentAcademicYear, schoolId]);

    useEffect(() => {
        if (activeTab !== 'class-assignment') {
            return;
        }

        fetchAssignmentStudents(
            assignmentAcademicYear,
            assignmentActivityFilter,
            assignmentPage,
            selectedGradeFilter,
            debouncedAssignmentSearch
        );
    }, [
        activeTab,
        assignmentAcademicYear,
        assignmentActivityFilter,
        assignmentPage,
        debouncedAssignmentSearch,
        fetchAssignmentStudents,
        selectedGradeFilter,
    ]);

    useEffect(() => {
        if (activeTab !== 'class-assignment' || !assignmentAcademicYear) {
            assignmentClassroomMapRequestRef.current += 1;
            setAssignmentClassroomMap({});
            return;
        }

        const studentsWithIds = students
            .map((student) => {
                const studentId = Number(student?.user_id ?? student?.id);
                if (!Number.isInteger(studentId) || studentId <= 0) {
                    return null;
                }
                return { student, studentId };
            })
            .filter(Boolean);

        if (studentsWithIds.length === 0) {
            assignmentClassroomMapRequestRef.current += 1;
            setAssignmentClassroomMap({});
            return;
        }

        const requestId = assignmentClassroomMapRequestRef.current + 1;
        assignmentClassroomMapRequestRef.current = requestId;
        const selectedYearId = Number(assignmentAcademicYear);

        const loadClassroomAssignments = async () => {
            const enrollmentResults = await Promise.allSettled(
                studentsWithIds.map(({ studentId }) => {
                    return secretaryService.getStudentEnrollments(
                        studentId,
                        { academic_year_id: assignmentAcademicYear }
                    );
                })
            );

            if (assignmentClassroomMapRequestRef.current !== requestId) {
                return;
            }

            const nextMap = {};
            studentsWithIds.forEach(({ student, studentId }, index) => {
                const studentKey = String(studentId);
                const result = enrollmentResults[index];

                if (result.status !== 'fulfilled') {
                    const fallbackClassroomName = getStudentClassroomName(student);
                    nextMap[studentKey] = {
                        isAssigned: hasAssignedClassroom(student),
                        classroomId: null,
                        classroomName: fallbackClassroomName,
                    };
                    return;
                }

                const enrollments = normalizeListResponse(result.value);
                const currentEnrollment = enrollments.find((enrollment) => {
                    const enrollmentYearId = getEnrollmentAcademicYearId(enrollment);
                    const enrollmentStatus = String(enrollment?.status || '').trim().toLowerCase();
                    return enrollmentYearId === selectedYearId
                        && enrollment?.is_active !== false
                        && (enrollmentStatus === 'active' || enrollmentStatus === 'enrolled');
                });

                const classroomId = currentEnrollment
                    ? getEnrollmentClassroomId(currentEnrollment)
                    : null;
                const normalizedClassroomId = Number.isInteger(classroomId) && classroomId > 0
                    ? classroomId
                    : null;
                const classroomName = currentEnrollment
                    ? getEnrollmentClassroomName(currentEnrollment)
                    : '';

                nextMap[studentKey] = {
                    isAssigned: Boolean(normalizedClassroomId),
                    classroomId: normalizedClassroomId,
                    classroomName: classroomName
                        || (normalizedClassroomId ? `Classroom #${normalizedClassroomId}` : ''),
                };
            });

            setAssignmentClassroomMap(nextMap);
        };

        void loadClassroomAssignments();
    }, [activeTab, assignmentAcademicYear, students]);

    useEffect(() => {
        if (activeTab !== 'files') {
            return;
        }

        fetchStudentDocuments(filesPage, debouncedFileSearch, filesTypeFilter);
    }, [activeTab, debouncedFileSearch, fetchStudentDocuments, filesPage, filesTypeFilter]);

    useEffect(() => {
        if (activeTab !== 'files') {
            setShowDocumentStudentDropdown(false);
            return;
        }

        fetchDocumentStudentOptions(debouncedDocumentStudentQuery);
    }, [activeTab, debouncedDocumentStudentQuery, fetchDocumentStudentOptions]);

    useEffect(() => {
        setStudentSearchResults(documentStudentOptions);
    }, [documentStudentOptions]);

    useEffect(() => {
        setSelectedStudent('');
        setSelectedAssignmentStudent(null);
        setAvailableClassrooms([]);
        setCurrentClassroomId(null);
        setCurrentClassroomName('');
        setShowReassignConfirm(false);
        setPendingReassignment(null);
        setShowStudentDetailsModal(false);
        setStudentToView(null);
        setShowEditStudentModal(false);
        setStudentToEdit(null);
        setStudentEditData(createDefaultStudentEditData());
        setShowDeleteStudentConfirm(false);
        setStudentToDelete(null);
    }, [
        assignmentAcademicYear,
        assignmentActivityFilter,
        assignmentClassroomFilter,
        assignmentPage,
        assignmentSearch,
        selectedGradeFilter,
    ]);

    useEffect(() => {
        if (!selectedStudent || !assignmentAcademicYear) {
            setSelectedAssignmentStudent(null);
            setAvailableClassrooms([]);
            setCurrentClassroomId(null);
            setCurrentClassroomName('');
            setShowReassignConfirm(false);
            setPendingReassignment(null);
            setShowStudentDetailsModal(false);
            setStudentToView(null);
            setShowEditStudentModal(false);
            setStudentToEdit(null);
            setStudentEditData(createDefaultStudentEditData());
            setShowDeleteStudentConfirm(false);
            setStudentToDelete(null);
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

    const handleDocumentStudentSelect = useCallback((student) => {
        const studentId = String(student?.user_id || student?.id || '');
        if (!studentId) {
            return;
        }

        setDocumentUpload((previous) => ({
            ...previous,
            student_id: studentId,
            studentSearch: getStudentName(student),
            selectedStudent: {
                id: studentId,
                full_name: getStudentName(student),
                email: student?.email || '',
            },
        }));
        setDocumentStudentQuery(getStudentName(student));
        setShowDocumentStudentDropdown(false);
    }, []);

    const handleStudentSearch = useCallback((value) => {
        setDocumentStudentQuery(value);
        setShowDocumentStudentDropdown(true);
        setDocumentUpload((previous) => ({
            ...previous,
            student_id: '',
            studentSearch: value,
            selectedStudent: null,
        }));
    }, []);

    const selectUploadStudent = useCallback((student) => {
        handleDocumentStudentSelect(student);
    }, [handleDocumentStudentSelect]);

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
            setStudentSearchResults([]);
            setShowDocumentStudentDropdown(false);
            setShowUploadModal(false);
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

        const password = newStudent.password || '';
        if (password.length < 8) {
            setFeedback('error', 'Password must be at least 8 characters.');
            return;
        }

        if (password !== (newStudent.confirm_password || '')) {
            setFeedback('error', 'Passwords do not match.');
            return;
        }

        const birthCertificate = newStudent.birth_certificate;
        if (!birthCertificate) {
            setFeedback('error', 'Birth certificate PDF is required.');
            return;
        }

        const fileName = String(birthCertificate.name || '').toLowerCase();
        if (!fileName.endsWith('.pdf')) {
            setFeedback('error', 'Birth certificate must be a PDF file.');
            return;
        }

        const fullName = `${firstName} ${lastName}`.trim();
        const payload = new FormData();
        payload.append('email', email);
        payload.append('full_name', fullName);
        payload.append('password', password);
        payload.append('school_id', String(schoolId));
        payload.append('grade_id', String(gradeId));
        payload.append('date_of_birth', newStudent.date_of_birth);
        payload.append('admission_date', newStudent.admission_date);
        payload.append('birth_certificate', birthCertificate);
        if (gender) payload.append('gender', gender);
        if (phone) payload.append('phone', phone);
        if (address) payload.append('address', address);
        if (nationalId) payload.append('national_id', nationalId);
        if (emergencyContact) payload.append('emergency_contact', emergencyContact);
        if (medicalNotes) payload.append('medical_notes', medicalNotes);
        if (enrollmentStatus) {
            payload.append('enrollment_status', enrollmentStatus);
            payload.append('current_status', enrollmentStatus);
        }

        try {
            setIsCreatingStudent(true);

            await secretaryService.createStudent(payload);

            setFeedback('success', 'Student created successfully!');
            fetchSchoolStudentStats();
            setNewStudent(createDefaultStudent());
            if (birthCertificateInputRef.current) {
                birthCertificateInputRef.current.value = '';
            }
            setGradeQuery('');
            setShowGradeDropdown(false);
            setShowPwd(false);
            setShowConfirmPwd(false);
            setActiveTab('applications');
        } catch (error) {
            console.error('Error creating student:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to create student. Please try again.'));
        } finally {
            setIsCreatingStudent(false);
        }
    }, [fetchSchoolStudentStats, newStudent, resolveGradeIdFromQuery, schoolId, setFeedback]);

    const handleDeleteDocument = useCallback((documentRecord) => {
        setDocumentToDelete(documentRecord);
        setShowDeleteDocConfirm(true);
    }, []);

    const confirmDeleteDocument = useCallback(async () => {
        if (!documentToDelete?.id) {
            setShowDeleteDocConfirm(false);
            setDocumentToDelete(null);
            return;
        }

        try {
            await secretaryService.deleteStudentDocument(documentToDelete.id);
            setFeedback('success', 'Document deleted successfully.');
            fetchStudentDocuments(filesPage, debouncedFileSearch, filesTypeFilter);
        } catch (error) {
            setFeedback('error', getApiErrorMessage(error, 'Failed to delete document.'));
        } finally {
            setShowDeleteDocConfirm(false);
            setDocumentToDelete(null);
        }
    }, [debouncedFileSearch, documentToDelete, fetchStudentDocuments, filesPage, filesTypeFilter, setFeedback]);

    const handleSelectStudentForAssignment = useCallback(async (student) => {
        const studentId = Number(student?.user_id || student?.id);
        if (!Number.isInteger(studentId) || studentId <= 0) {
            setSelectedStudent('');
            setSelectedAssignmentStudent(null);
            setCurrentClassroomId(null);
            setCurrentClassroomName('');
            setAvailableClassrooms([]);
            return;
        }

        setSelectedStudent(String(studentId));
        setSelectedAssignmentStudent(student);
        setCurrentClassroomId(null);
        setCurrentClassroomName('');
        setAvailableClassrooms([]);

        if (!assignmentAcademicYear || !schoolId) {
            return;
        }

        try {
            const selectedAcademicYearId = Number(assignmentAcademicYear);
            const selectedGradeId = Number(selectedGradeFilter);
            const normalizedSelectedGradeId = Number.isInteger(selectedGradeId) && selectedGradeId > 0
                ? selectedGradeId
                : null;

            const enrollmentData = await secretaryService.getStudentEnrollments(
                studentId,
                { academic_year_id: assignmentAcademicYear }
            );
            const enrollments = normalizeListResponse(enrollmentData);
            const yearEnrollments = enrollments.filter((enrollment) => {
                const enrollmentYearId = getEnrollmentAcademicYearId(enrollment);
                return enrollmentYearId === selectedAcademicYearId;
            });
            const currentEnrollment = yearEnrollments.find((enrollment) => {
                const enrollmentStatus = String(enrollment?.status || '').trim().toLowerCase();
                return enrollment?.is_active !== false && (enrollmentStatus === 'active' || enrollmentStatus === 'enrolled');
            });
            const enrollmentForGrade = currentEnrollment
                || yearEnrollments.find((enrollment) => Boolean(getEnrollmentGradeId(enrollment)))
                || null;

            const currentEnrollmentClassroomId = currentEnrollment
                ? getEnrollmentClassroomId(currentEnrollment)
                : null;
            const currentEnrollmentClassroomName = currentEnrollment
                ? getEnrollmentClassroomName(currentEnrollment)
                : '';

            const gradeId = getEnrollmentGradeId(enrollmentForGrade)
                ?? normalizedSelectedGradeId
                ?? getStudentGradeId(student);
            if (!gradeId) {
                setCurrentClassroomId(currentEnrollmentClassroomId);
                setCurrentClassroomName(currentEnrollmentClassroomName);
                setAvailableClassrooms([]);
                return;
            }

            const roomsData = await secretaryService.getClassrooms(
                schoolId,
                assignmentAcademicYear,
                { grade_id: gradeId }
            );
            const normalizedRooms = normalizeListResponse(roomsData);
            const matchedCurrentClassroom = normalizedRooms.find((room) => {
                const roomId = Number(room?.id ?? room?.classroom_id ?? room?.class_room_id);
                return Number.isInteger(roomId)
                    && roomId > 0
                    && roomId === currentEnrollmentClassroomId;
            });

            const fallbackClassroomName = matchedCurrentClassroom ? getClassroomName(matchedCurrentClassroom) : '';
            setCurrentClassroomId(currentEnrollmentClassroomId);
            setCurrentClassroomName(currentEnrollmentClassroomName || fallbackClassroomName);
            setAvailableClassrooms(normalizedRooms);
        } catch (error) {
            console.error('Error loading classrooms for selected student:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to load grade classrooms.'));
        }
    }, [assignmentAcademicYear, schoolId, selectedGradeFilter, setFeedback]);

    const handleShowStudentDetails = useCallback((student) => {
        if (!student) {
            return;
        }

        setStudentToView(student);
        setShowStudentDetailsModal(true);
    }, []);

    const openEditStudentModal = useCallback((student) => {
        if (!student) {
            return;
        }

        const normalizedStatus = normalizeEnrollmentStatus(
            student?.current_status || student?.enrollment_status || 'active'
        );
        const hasKnownStatus = STUDENT_ENROLLMENT_STATUS_OPTIONS.some((option) => option.value === normalizedStatus);

        setStudentEditData({
            admission_date: formatDateForInput(student?.admission_date),
            enrollment_status: hasKnownStatus ? normalizedStatus : 'active',
            phone: String(student?.phone || ''),
            address: String(student?.address || ''),
            medical_notes: String(student?.medical_notes || ''),
        });
        setStudentToEdit(student);
        setShowEditStudentModal(true);
    }, []);

    const updateStudentEditField = useCallback((field, value) => {
        setStudentEditData((previous) => ({
            ...previous,
            [field]: value,
        }));
    }, []);

    const handleUpdateStudentData = useCallback(async (event) => {
        event.preventDefault();

        const targetStudentId = (
            getNumericStudentId(studentToEdit)
            || (Number.isInteger(Number(selectedStudent)) && Number(selectedStudent) > 0 ? Number(selectedStudent) : null)
            || getNumericStudentId(selectedAssignmentStudent)
        );
        if (!Number.isInteger(targetStudentId) || targetStudentId <= 0) {
            setFeedback('error', 'Please select a valid student first.');
            return;
        }

        const normalizedAdmissionDate = String(studentEditData.admission_date || '').trim();
        if (!normalizedAdmissionDate) {
            setFeedback('error', 'Admission date is required.');
            return;
        }

        const normalizedEnrollmentStatus = normalizeEnrollmentStatus(studentEditData.enrollment_status) || 'active';
        const payload = {
            admission_date: normalizedAdmissionDate,
            enrollment_status: normalizedEnrollmentStatus,
            current_status: normalizedEnrollmentStatus,
            phone: String(studentEditData.phone || '').trim(),
            address: String(studentEditData.address || '').trim(),
            medical_notes: String(studentEditData.medical_notes || '').trim(),
        };

        try {
            setIsUpdatingStudent(true);

            const updatedStudent = await secretaryService.updateStudent(targetStudentId, payload);
            const studentKey = String(targetStudentId);
            const resolvedStudent = updatedStudent && typeof updatedStudent === 'object'
                ? updatedStudent
                : payload;

            setStudents((previous) => previous.map((student) => {
                const mappedId = getStudentId(student);
                if (mappedId !== studentKey) {
                    return student;
                }

                return {
                    ...student,
                    ...resolvedStudent,
                    user_id: student.user_id ?? targetStudentId,
                    id: student.id ?? targetStudentId,
                    current_status: resolvedStudent?.current_status || payload.current_status,
                    enrollment_status: resolvedStudent?.enrollment_status || payload.enrollment_status,
                    admission_date: resolvedStudent?.admission_date || payload.admission_date,
                    phone: resolvedStudent?.phone ?? payload.phone,
                    address: resolvedStudent?.address ?? payload.address,
                    medical_notes: resolvedStudent?.medical_notes ?? payload.medical_notes,
                };
            }));
            setApplications((previous) => previous.map((studentRow) => {
                const mappedId = getStudentId(studentRow);
                if (mappedId !== studentKey) {
                    return studentRow;
                }

                return {
                    ...studentRow,
                    ...resolvedStudent,
                    current_status: resolvedStudent?.current_status || payload.current_status,
                    enrollment_status: resolvedStudent?.enrollment_status || payload.enrollment_status,
                    admission_date: resolvedStudent?.admission_date || payload.admission_date,
                    phone: resolvedStudent?.phone ?? payload.phone,
                    address: resolvedStudent?.address ?? payload.address,
                    medical_notes: resolvedStudent?.medical_notes ?? payload.medical_notes,
                };
            }));
            setSelectedAssignmentStudent((previous) => {
                if (!previous) {
                    return previous;
                }

                const mappedId = getStudentId(previous);
                if (mappedId !== studentKey) {
                    return previous;
                }

                return {
                    ...previous,
                    ...resolvedStudent,
                    current_status: resolvedStudent?.current_status || payload.current_status,
                    enrollment_status: resolvedStudent?.enrollment_status || payload.enrollment_status,
                    admission_date: resolvedStudent?.admission_date || payload.admission_date,
                    phone: resolvedStudent?.phone ?? payload.phone,
                    address: resolvedStudent?.address ?? payload.address,
                    medical_notes: resolvedStudent?.medical_notes ?? payload.medical_notes,
                };
            });
            setStudentToView((previous) => {
                if (!previous) {
                    return previous;
                }

                const mappedId = getStudentId(previous);
                if (mappedId !== studentKey) {
                    return previous;
                }

                return {
                    ...previous,
                    ...resolvedStudent,
                    current_status: resolvedStudent?.current_status || payload.current_status,
                    enrollment_status: resolvedStudent?.enrollment_status || payload.enrollment_status,
                    admission_date: resolvedStudent?.admission_date || payload.admission_date,
                    phone: resolvedStudent?.phone ?? payload.phone,
                    address: resolvedStudent?.address ?? payload.address,
                    medical_notes: resolvedStudent?.medical_notes ?? payload.medical_notes,
                };
            });

            setFeedback('success', 'Student data updated successfully.');
            setShowEditStudentModal(false);
            setStudentToEdit(null);
            fetchSchoolStudentStats();
            if (activeTab === 'class-assignment') {
                fetchAssignmentStudents(
                    assignmentAcademicYear,
                    assignmentActivityFilter,
                    assignmentPage,
                    selectedGradeFilter,
                    debouncedAssignmentSearch
                );
            }
            if (activeTab === 'applications') {
                fetchStudentApplications(
                    applicationYearFilter,
                    applicationActivityFilter,
                    applicationsPage,
                    debouncedApplicationSearch
                );
            }
        } catch (error) {
            console.error('Error updating student data:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to update student data.'));
        } finally {
            setIsUpdatingStudent(false);
        }
    }, [
        activeTab,
        applicationActivityFilter,
        applicationYearFilter,
        applicationsPage,
        debouncedApplicationSearch,
        assignmentAcademicYear,
        assignmentActivityFilter,
        assignmentPage,
        debouncedAssignmentSearch,
        fetchAssignmentStudents,
        fetchStudentApplications,
        fetchSchoolStudentStats,
        selectedGradeFilter,
        selectedAssignmentStudent,
        selectedStudent,
        setFeedback,
        studentToEdit,
        studentEditData,
    ]);

    const handleDeleteStudent = useCallback((student) => {
        if (!student) {
            return;
        }

        setStudentToDelete(student);
        setShowDeleteStudentConfirm(true);
    }, []);

    const confirmDeleteStudent = useCallback(async () => {
        const studentIdValue = getNumericStudentId(studentToDelete);
        if (!Number.isInteger(studentIdValue) || studentIdValue <= 0) {
            setShowDeleteStudentConfirm(false);
            setStudentToDelete(null);
            setFeedback('error', 'Unable to determine the selected student.');
            return;
        }

        try {
            setIsDeletingStudent(true);
            await secretaryService.deactivateStudent(studentIdValue);

            const studentKey = String(studentIdValue);
            setStudents((previous) => previous.filter((student) => getStudentId(student) !== studentKey));
            setApplications((previous) => previous.filter((studentRow) => getStudentId(studentRow) !== studentKey));
            setAssignmentClassroomMap((previous) => {
                const nextMap = { ...previous };
                delete nextMap[studentKey];
                return nextMap;
            });
            if (getStudentId(studentToView) === studentKey) {
                setStudentToView(null);
                setShowStudentDetailsModal(false);
            }
            if (getStudentId(studentToEdit) === studentKey) {
                setStudentToEdit(null);
                setShowEditStudentModal(false);
            }

            if (selectedStudent === studentKey) {
                setSelectedStudent('');
                setSelectedAssignmentStudent(null);
                setAvailableClassrooms([]);
                setCurrentClassroomId(null);
                setCurrentClassroomName('');
                setShowEditStudentModal(false);
            }

            setShowDeleteStudentConfirm(false);
            setStudentToDelete(null);
            setFeedback('success', 'Student deleted successfully.');
            fetchSchoolStudentStats();
            if (activeTab === 'class-assignment') {
                fetchAssignmentStudents(
                    assignmentAcademicYear,
                    assignmentActivityFilter,
                    assignmentPage,
                    selectedGradeFilter,
                    debouncedAssignmentSearch
                );
            }
            if (activeTab === 'applications') {
                fetchStudentApplications(
                    applicationYearFilter,
                    applicationActivityFilter,
                    applicationsPage,
                    debouncedApplicationSearch
                );
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            setFeedback('error', getApiErrorMessage(error, 'Failed to delete student.'));
        } finally {
            setIsDeletingStudent(false);
        }
    }, [
        activeTab,
        applicationActivityFilter,
        applicationYearFilter,
        applicationsPage,
        debouncedApplicationSearch,
        assignmentAcademicYear,
        assignmentActivityFilter,
        assignmentPage,
        debouncedAssignmentSearch,
        fetchAssignmentStudents,
        fetchStudentApplications,
        fetchSchoolStudentStats,
        selectedGradeFilter,
        selectedStudent,
        setFeedback,
        studentToEdit,
        studentToDelete,
        studentToView,
    ]);

    const executeClassroomAssignment = useCallback(async ({
        studentId,
        academicYearId,
        targetClassroomId,
        targetClassroomName,
        isReassignment,
    }) => {
        try {
            setIsAssigningStudent(true);
            const assignmentPayload = isReassignment
                ? await secretaryService.reassignStudentClassroom(studentId, {
                    class_room_id: targetClassroomId,
                    academic_year_id: academicYearId,
                })
                : await secretaryService.assignToClass({
                    student_id: studentId,
                    class_room_id: targetClassroomId,
                    academic_year_id: academicYearId,
                    status: 'enrolled',
                });

            const payloadClassroomName = String(
                assignmentPayload?.class_room_name
                || assignmentPayload?.classroom_name
                || ''
            ).trim();
            const resolvedClassroomName = payloadClassroomName || targetClassroomName || `Classroom #${targetClassroomId}`;
            const studentKey = String(studentId);

            setCurrentClassroomId(targetClassroomId);
            setCurrentClassroomName(resolvedClassroomName);
            setAssignmentClassroomMap((previous) => ({
                ...previous,
                [studentKey]: {
                    isAssigned: true,
                    classroomId: targetClassroomId,
                    classroomName: resolvedClassroomName,
                },
            }));
            setStudents((previous) => {
                return previous.map((student) => {
                    const mappedStudentId = getStudentId(student);
                    if (mappedStudentId !== studentKey) {
                        return student;
                    }
                    return {
                        ...student,
                        classroom_name: resolvedClassroomName,
                    };
                });
            });
            setSelectedAssignmentStudent((previous) => {
                if (!previous) {
                    return previous;
                }

                return {
                    ...previous,
                    classroom_name: resolvedClassroomName,
                };
            });

            const defaultMessage = isReassignment
                ? `Student re-assigned to ${resolvedClassroomName}.`
                : `Student assigned to ${resolvedClassroomName}.`;
            setFeedback('success', assignmentPayload?.detail || defaultMessage);
            fetchSchoolStudentStats();
            fetchAssignmentStudents(
                assignmentAcademicYear,
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
        selectedGradeFilter,
        setFeedback,
    ]);

    const handleAssignToClassroom = useCallback((classroomId, classroomName = '') => {
        const studentId = Number(selectedStudent);
        const academicYearId = Number(assignmentAcademicYear);
        const targetClassroomId = Number(classroomId);
        const targetClassroomName = String(classroomName || '').trim() || `Classroom #${targetClassroomId}`;

        if (!Number.isInteger(studentId) || studentId <= 0 || !Number.isInteger(academicYearId) || academicYearId <= 0) {
            setFeedback('error', 'Please select a student and academic year.');
            return;
        }
        if (!Number.isInteger(targetClassroomId) || targetClassroomId <= 0) {
            setFeedback('error', 'Please choose a valid classroom.');
            return;
        }
        if (currentClassroomId === targetClassroomId) {
            setFeedback('success', 'Student is already assigned to this classroom.', false);
            return;
        }

        const isReassignment = Number.isInteger(currentClassroomId) && currentClassroomId > 0;
        if (isReassignment) {
            setPendingReassignment({
                studentId,
                academicYearId,
                targetClassroomId,
                targetClassroomName,
                currentClassroomName: currentClassroomName || `Classroom #${currentClassroomId}`,
            });
            setShowReassignConfirm(true);
            return;
        }

        void executeClassroomAssignment({
            studentId,
            academicYearId,
            targetClassroomId,
            targetClassroomName,
            isReassignment: false,
        });
    }, [
        assignmentAcademicYear,
        currentClassroomId,
        currentClassroomName,
        executeClassroomAssignment,
        selectedStudent,
        setFeedback,
    ]);

    const cancelReassignment = useCallback(() => {
        setShowReassignConfirm(false);
        setPendingReassignment(null);
    }, []);

    const confirmReassignment = useCallback(async () => {
        if (!pendingReassignment) {
            setShowReassignConfirm(false);
            return;
        }

        const reassignment = pendingReassignment;
        setShowReassignConfirm(false);
        setPendingReassignment(null);
        await executeClassroomAssignment({
            ...reassignment,
            isReassignment: true,
        });
    }, [executeClassroomAssignment, pendingReassignment]);

    const updateNewStudentField = useCallback((field, value) => {
        setNewStudent((previous) => ({ ...previous, [field]: value }));
    }, []);

    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        setBanner((previous) => ({ ...previous, message: '' }));
    }, []);

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
                                    <label htmlFor="application-search" className="form-label">
                                        {t('secretary.admissions.searchStudent') || 'Search Student'}
                                    </label>
                                    <div className="search-wrapper sec-search-wrapper">
                                        <Search size={16} className="search-icon" />
                                        <input
                                            id="application-search"
                                            type="text"
                                            className="search-input"
                                            placeholder={t('secretary.admissions.searchByNameOrEmail') || 'Search by name or email...'}
                                            value={applicationSearch}
                                            onChange={(event) => setApplicationSearch(event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="sec-field">
                                    <label htmlFor="application-status-filter" className="form-label">
                                        {t('secretary.admissions.status') || 'Status'}
                                    </label>
                                    <select
                                        id="application-status-filter"
                                        className="form-select"
                                        value={applicationActivityFilter}
                                        onChange={(event) => setApplicationActivityFilter(event.target.value)}
                                    >
                                        {applicationStatusFilterOptions.map((option) => (
                                            <option key={option.value || 'all'} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="sec-table-wrap">
                                {isApplicationsLoading && applications.length === 0 ? (
                                    <SkeletonTable rows={5} cols={6} />
                                ) : (
                                    <div className={`sec-table-scroll${isApplicationsLoading ? ' sec-table-scroll--loading' : ''}`}>
                                        <table className="data-table sec-data-table sec-data-table--applications">
                                            <thead>
                                                <tr>
                                                    <th className="cell-id">{t('secretary.admissions.table.id') || 'ID'}</th>
                                                    <th>{t('secretary.admissions.applicantName') || 'Applicant'}</th>
                                                    <th>{t('secretary.admissions.table.grade') || 'Grade'}</th>
                                                    <th>{t('secretary.admissions.table.school') || 'School'}</th>
                                                    <th>{t('secretary.admissions.status') || 'Status'}</th>
                                                    <th>{t('secretary.admissions.actions') || 'Actions'}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredApplications.map((application) => {
                                                    const isApplicationRecord = application?.source_type !== 'student';
                                                    const applicationId = application.id;
                                                    const displayId = application?.display_id ?? applicationId;
                                                    const studentName = getStudentName(application);
                                                    const status = resolveApplicationStatusForDisplay(application);
                                                    const linkedStudentId = isApplicationRecord
                                                        ? getApplicationLinkedStudentId(application)
                                                        : null;
                                                    const canManageEnrolledApplication = (
                                                        isApplicationRecord
                                                        && status === 'enrolled'
                                                        && Number.isInteger(linkedStudentId)
                                                        && linkedStudentId > 0
                                                    );
                                                    const linkedStudentRecord = canManageEnrolledApplication
                                                        ? {
                                                            ...application,
                                                            source_type: 'student',
                                                            user_id: linkedStudentId,
                                                            id: linkedStudentId,
                                                            display_id: linkedStudentId,
                                                        }
                                                        : null;
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
                                                                        {canManageEnrolledApplication ? (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    className="sec-inline-action sec-inline-action--compact"
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        handleShowStudentDetails(linkedStudentRecord);
                                                                                    }}
                                                                                >
                                                                                    <Eye size={14} />
                                                                                    {t('secretary.admissions.classAssignment.viewStudent') || 'Show'}
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className="sec-inline-action sec-inline-action--compact"
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        openEditStudentModal(linkedStudentRecord);
                                                                                    }}
                                                                                >
                                                                                    <Pencil size={14} />
                                                                                    {t('common.edit') || 'Edit'}
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className="sec-inline-action sec-inline-action--compact sec-inline-action--danger"
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        handleDeleteStudent(linkedStudentRecord);
                                                                                    }}
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                    {t('common.delete') || 'Delete'}
                                                                                </button>
                                                                            </>
                                                                        ) : null}
                                                                    </div>
                                                                ) : (
                                                                    <div className="sec-row-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="sec-inline-action sec-inline-action--compact"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                handleShowStudentDetails(application);
                                                                            }}
                                                                        >
                                                                            <Eye size={14} />
                                                                            {t('secretary.admissions.classAssignment.viewStudent') || 'Show'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="sec-inline-action sec-inline-action--compact"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                openEditStudentModal(application);
                                                                            }}
                                                                        >
                                                                            <Pencil size={14} />
                                                                            {t('common.edit') || 'Edit'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="sec-inline-action sec-inline-action--compact sec-inline-action--danger"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                handleDeleteStudent(application);
                                                                            }}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                            {t('common.delete') || 'Delete'}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {filteredApplications.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6">
                                                            <EmptyState
                                                                icon={Users}
                                                                message={t('secretary.admissions.noPendingStudentsOrApplications')
                                                                    || 'No pending students or applications found.'}
                                                            />
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
                            <h2>{t('secretary.admissions.manual.title') || 'Manual Student Entry'}</h2>
                            <p>{t('secretary.admissions.manual.subtitle') || 'Add a new student to your school'}</p>
                        </div>

                        <form onSubmit={handleCreateStudent}>
                            <div className="sec-form-grid">
                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.firstName') || 'First Name *'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('secretary.admissions.manual.firstNamePlaceholder') || 'e.g. John'}
                                        value={newStudent.first_name}
                                        onChange={(event) => updateNewStudentField('first_name', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.lastName') || 'Last Name *'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('secretary.admissions.manual.lastNamePlaceholder') || 'e.g. Doe'}
                                        value={newStudent.last_name}
                                        onChange={(event) => updateNewStudentField('last_name', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.email') || 'Email *'}</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder={t('secretary.admissions.manual.emailPlaceholder') || 's@s.com'}
                                        value={newStudent.email}
                                        onChange={(event) => updateNewStudentField('email', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.password') || 'Password *'}</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            className="form-input"
                                            placeholder={t('secretary.admissions.manual.passwordPlaceholder') || '••••••••'}
                                            value={newStudent.password}
                                            onChange={(event) => updateNewStudentField('password', event.target.value)}
                                            required
                                            minLength={8}
                                        />
                                        <button type="button" className="eye-toggle" onClick={() => setShowPwd((value) => !value)}>
                                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.confirmPassword') || 'Confirm Password *'}</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPwd ? 'text' : 'password'}
                                            className={`form-input ${newStudent.confirm_password && newStudent.password !== newStudent.confirm_password ? 'form-input--error' : ''}`}
                                            placeholder={t('secretary.admissions.manual.confirmPasswordPlaceholder') || 'Repeat password'}
                                            value={newStudent.confirm_password}
                                            onChange={(event) => updateNewStudentField('confirm_password', event.target.value)}
                                            required
                                        />
                                        <button type="button" className="eye-toggle" onClick={() => setShowConfirmPwd((value) => !value)}>
                                            {showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    {newStudent.confirm_password && newStudent.password !== newStudent.confirm_password ? (
                                        <p className="field-error-text">{t('secretary.admissions.manual.passwordMismatch') || 'Passwords do not match'}</p>
                                    ) : null}
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.gender.label') || 'Gender'}</label>
                                    <select
                                        className="form-select"
                                        value={newStudent.gender}
                                        onChange={(event) => updateNewStudentField('gender', event.target.value)}
                                    >
                                        {GENDER_OPTIONS.map((option) => (
                                            <option key={option.value || 'none'} value={option.value}>
                                                {t(option.labelKey) || option.fallbackLabel}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.phone') || 'Phone'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('secretary.admissions.manual.phonePlaceholder') || 'Optional phone'}
                                        value={newStudent.phone}
                                        onChange={(event) => updateNewStudentField('phone', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.dateOfBirth') || 'Date of Birth *'}</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newStudent.date_of_birth}
                                        onChange={(event) => updateNewStudentField('date_of_birth', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.admissionDate') || 'Admission Date *'}</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={newStudent.admission_date}
                                        onChange={(event) => updateNewStudentField('admission_date', event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="sec-field sec-grade-field">
                                    <label className="form-label">{t('secretary.admissions.manual.grade') || 'Grade *'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('secretary.admissions.manual.gradePlaceholder') || 'Search and select grade...'}
                                        value={gradeQuery}
                                        onChange={handleGradeQueryChange}
                                        onFocus={() => setShowGradeDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowGradeDropdown(false), 200)}
                                        required={!newStudent.grade_id}
                                    />

                                    {showGradeDropdown ? (
                                        <div className="sec-grade-dropdown">
                                            {isGradeOptionsLoading ? (
                                                <div className="sec-grade-empty">{t('secretary.admissions.manual.loadingGrades') || 'Loading grades...'}</div>
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
                                                <div className="sec-grade-empty">{t('secretary.admissions.manual.noGradesFound') || 'No grades found'}</div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.enrollmentStatus') || 'Enrollment Status'}</label>
                                    <select
                                        className="form-select"
                                        value={newStudent.enrollment_status}
                                        onChange={(event) => updateNewStudentField('enrollment_status', event.target.value)}
                                    >
                                        {STUDENT_ENROLLMENT_STATUS_OPTIONS.map((statusOption) => (
                                            <option key={`enrollment-${statusOption.value}`} value={statusOption.value}>
                                                {t(statusOption.labelKey) || statusOption.fallbackLabel}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.nationalId') || 'National ID'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('secretary.admissions.manual.nationalIdPlaceholder') || 'Optional national ID'}
                                        value={newStudent.national_id}
                                        onChange={(event) => updateNewStudentField('national_id', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.emergencyContact') || 'Emergency Contact'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t('secretary.admissions.manual.emergencyContactPlaceholder') || 'Optional emergency contact'}
                                        value={newStudent.emergency_contact}
                                        onChange={(event) => updateNewStudentField('emergency_contact', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.address') || 'Address'}</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder={t('secretary.admissions.manual.addressPlaceholder') || 'Optional address'}
                                        value={newStudent.address}
                                        onChange={(event) => updateNewStudentField('address', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field">
                                    <label className="form-label">{t('secretary.admissions.manual.medicalNotes') || 'Medical Notes'}</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        placeholder={t('secretary.admissions.manual.medicalNotesPlaceholder') || 'Optional medical notes'}
                                        value={newStudent.medical_notes}
                                        onChange={(event) => updateNewStudentField('medical_notes', event.target.value)}
                                    />
                                </div>

                                <div className="sec-field sec-field--full">
                                    <label className="form-label">
                                        {t('secretary.admissions.manual.birthCertificate') || 'Birth Certificate'} <span className="cell-muted">({t('secretary.admissions.manual.birthCertificateHint') || 'PDF only, optional'})</span>
                                    </label>
                                    <div className={`file-drop-zone ${newStudent.birth_certificate ? 'file-drop-zone--has-file' : ''}`}>
                                        {newStudent.birth_certificate ? (
                                            <div className="file-selected">
                                                <FileText size={20} />
                                                <span>{newStudent.birth_certificate.name}</span>
                                                <button
                                                    type="button"
                                                    className="file-remove-btn"
                                                    onClick={() => {
                                                        updateNewStudentField('birth_certificate', null);
                                                        if (birthCertificateInputRef.current) {
                                                            birthCertificateInputRef.current.value = '';
                                                        }
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="file-drop-label" htmlFor="birth_cert_input">
                                                <Upload size={24} />
                                                <span>{t('secretary.admissions.manual.uploadPdf') || 'Click to upload PDF'}</span>
                                                <input
                                                    id="birth_cert_input"
                                                    type="file"
                                                    ref={birthCertificateInputRef}
                                                    accept=".pdf,application/pdf"
                                                    style={{ display: 'none' }}
                                                    onChange={(event) => updateNewStudentField('birth_certificate', event.target.files?.[0] || null)}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="sec-form-actions">
                                <button type="button" className="btn-secondary" onClick={() => handleTabChange('applications')}>
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button type="submit" className="btn-primary" disabled={isCreatingStudent}>
                                    {isCreatingStudent
                                        ? (t('common.saving') || 'Saving...')
                                        : (t('secretary.admissions.manual.saveStudentRecord') || 'Save Student Record')}
                                </button>
                            </div>
                        </form>
                    </section>
                ) : null}

                {activeTab === 'class-assignment' ? (
                    <section className="management-card">
                        <div className="sec-filter-bar">
                            <div className="sec-field sec-field--grow">
                                <h3 className="sec-filter-title">{t('secretary.admissions.classAssignment') || 'Class Assignment'}</h3>
                                <p className="sec-subtle-text">
                                    {t('secretary.admissions.classAssignmentDescription') || 'Select a student and assign them to a class.'}
                                </p>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label className="form-label">{t('secretary.admissions.academicYear') || 'Academic Year'}</label>
                                <select
                                    className="form-select"
                                    value={assignmentAcademicYear}
                                    onChange={(event) => setAssignmentAcademicYear(event.target.value)}
                                >
                                    <option value="">{t('secretary.admissions.selectActiveAcademicYear') || 'Select Active Academic Year'}</option>
                                    {activeAcademicYears.map((year) => (
                                        <option key={year.id} value={year.id}>
                                            {getAcademicYearLabel(year, false)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label className="form-label">{t('secretary.admissions.grade') || 'Grade'}</label>
                                <select
                                    className="form-select"
                                    value={selectedGradeFilter}
                                    onChange={(event) => setSelectedGradeFilter(event.target.value)}
                                    disabled={!assignmentAcademicYear}
                                >
                                    <option value="">{t('secretary.admissions.allGrades') || 'All Grades'}</option>
                                    {grades.map((grade) => (
                                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label className="form-label">{t('secretary.admissions.status') || 'Status'}</label>
                                <select
                                    className="form-select"
                                    value={assignmentActivityFilter}
                                    onChange={(event) => setAssignmentActivityFilter(event.target.value)}
                                    disabled={!assignmentAcademicYear}
                                >
                                    {studentActivityFilterOptions.map((option) => (
                                        <option key={option.value || 'all'} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label className="form-label">{t('secretary.admissions.assignment') || 'Assignment'}</label>
                                <select
                                    className="form-select"
                                    value={assignmentClassroomFilter}
                                    onChange={(event) => setAssignmentClassroomFilter(event.target.value)}
                                    disabled={!assignmentAcademicYear}
                                >
                                    {assignmentClassroomFilterOptions.map((option) => (
                                        <option key={option.value || 'all'} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sec-field sec-field--compact">
                                <label htmlFor="assignment-search" className="form-label">
                                    {t('secretary.admissions.searchStudent') || 'Search Student'}
                                </label>
                                <div className="search-wrapper sec-search-wrapper">
                                    <Search size={16} className="search-icon" />
                                    <input
                                        id="assignment-search"
                                        type="text"
                                        className="search-input"
                                        placeholder={t('secretary.admissions.searchByNameOrEmail') || 'Search by name or email...'}
                                        value={assignmentSearch}
                                        onChange={(event) => setAssignmentSearch(event.target.value)}
                                        disabled={!assignmentAcademicYear}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={`sec-assignment-content${isStudentsLoading && students.length > 0 ? ' sec-content--loading' : ''}`}>
                            {!assignmentAcademicYear ? (
                                <EmptyState
                                    icon={AlertCircle}
                                    message={
                                        t('secretary.admissions.selectAcademicYearToAssign')
                                        || 'Please select an academic year to see classrooms and assign students.'
                                    }
                                />
                            ) : isStudentsLoading && students.length === 0 ? (
                                <LoadingSpinner message="Loading students..." />
                            ) : assignmentStudents.length === 0 ? (
                                <EmptyState icon={Users} message="No students found." />
                            ) : (
                                <>
                                    <div className="sec-assignment-grid">
                                        {assignmentStudents.map((student) => {
                                            const studentId = (student.user_id || student.id)?.toString();
                                            const isSelected = selectedStudent === studentId;
                                            const assignmentMeta = studentId ? assignmentClassroomMap[studentId] : null;
                                            const isAssignedToClassroom = assignmentMeta && typeof assignmentMeta.isAssigned === 'boolean'
                                                ? assignmentMeta.isAssigned
                                                : hasAssignedClassroom(student);
                                            const classroomName = assignmentMeta?.classroomName || getStudentClassroomName(student);
                                            const classroomLabel = classroomName || (
                                                isAssignedToClassroom
                                                    ? (t('secretary.admissions.classAssignment.filters.assigned') || 'Assigned')
                                                    : (t('secretary.admissions.classAssignment.unassigned') || 'Unassigned')
                                            );

                                            return (
                                                <button
                                                    key={studentId}
                                                    type="button"
                                                    className={`sec-student-card ${isSelected ? 'is-selected' : ''}`}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedStudent('');
                                                            setSelectedAssignmentStudent(null);
                                                            setAvailableClassrooms([]);
                                                            setCurrentClassroomId(null);
                                                            setCurrentClassroomName('');
                                                            setShowReassignConfirm(false);
                                                            setPendingReassignment(null);
                                                            return;
                                                        }
                                                        handleSelectStudentForAssignment(student);
                                                    }}
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
                                                        <span>Classroom: {classroomLabel}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedAssignmentStudent ? (
                                        <div className="sec-classroom-card-section">
                                            <div className="assignment-grade-notice">
                                                <GraduationCap size={16} />
                                                <span>
                                                    {t('secretary.admissions.classAssignment.showingClassroomsForGradeOnly', {
                                                        grade: selectedAssignmentGradeLabel,
                                                    }) || `Showing classrooms for ${selectedAssignmentGradeLabel} only`}
                                                </span>
                                            </div>
                                            <p className="sec-subtle-text">
                                                {t('secretary.admissions.classAssignment.currentClassroomSummary', {
                                                    student: getStudentName(selectedAssignmentStudent),
                                                    classroom: (
                                                        currentClassroomName
                                                        || (currentClassroomId ? `Classroom #${currentClassroomId}` : (t('secretary.admissions.classAssignment.unassigned') || 'Unassigned'))
                                                    ),
                                                }) || `${getStudentName(selectedAssignmentStudent)} | Current classroom: ${
                                                    currentClassroomName
                                                    || (currentClassroomId ? `Classroom #${currentClassroomId}` : 'Unassigned')
                                                }`}
                                            </p>
                                            {currentClassroomId ? (
                                                <p className="sec-reassign-hint">
                                                    {t('secretary.admissions.classAssignment.reassignHint')
                                                        || 'Selecting another classroom will reassign this student.'}
                                                </p>
                                            ) : null}
                                            <div className="sec-student-actions">
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    onClick={() => openEditStudentModal(selectedAssignmentStudent)}
                                                    disabled={isUpdatingStudent || isDeletingStudent}
                                                >
                                                    {t('secretary.admissions.classAssignment.updateStudentData') || 'Update Student Data'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-secondary btn-secondary--danger"
                                                    onClick={() => handleDeleteStudent(selectedAssignmentStudent)}
                                                    disabled={isUpdatingStudent || isDeletingStudent}
                                                >
                                                    {isDeletingStudent
                                                        ? (t('secretary.admissions.classAssignment.deletingStudent') || 'Deleting...')
                                                        : (t('secretary.admissions.classAssignment.deleteStudent') || 'Delete Student')}
                                                </button>
                                            </div>
                                            {availableClassrooms.length === 0 ? (
                                                <EmptyState
                                                    icon={GraduationCap}
                                                    message={
                                                        t('secretary.admissions.classAssignment.noClassroomsForGrade')
                                                        || "No classrooms found for this student's grade."
                                                    }
                                                />
                                            ) : (
                                                <div className="classroom-assign-grid">
                                                    {availableClassrooms.map((room) => {
                                                        const roomId = Number(room?.id ?? room?.classroom_id ?? room?.class_room_id);
                                                        if (!Number.isInteger(roomId) || roomId <= 0) {
                                                            return null;
                                                        }

                                                        const isCurrent = currentClassroomId === roomId;
                                                        const roomName = getClassroomName(room);
                                                        const studentCount = room.student_count ?? 0;
                                                        const capacity = room.capacity ?? '∞';

                                                        return (
                                                            <button
                                                                key={roomId}
                                                                type="button"
                                                                className={`classroom-assign-card ${isCurrent ? 'classroom-assign-card--current' : ''}`}
                                                                onClick={() => handleAssignToClassroom(roomId, roomName)}
                                                                disabled={isAssigningStudent}
                                                            >
                                                                <div className="classroom-assign-name">{roomName}</div>
                                                                <div className="classroom-assign-meta">
                                                                    <Users size={14} />
                                                                    {studentCount} / {capacity} {
                                                                        t('secretary.admissions.classAssignment.studentsLabel')
                                                                        || 'students'
                                                                    }
                                                                </div>
                                                                {isCurrent ? (
                                                                    <span className="classroom-assign-badge">
                                                                        {t('secretary.admissions.classAssignment.currentBadge') || 'Current'}
                                                                    </span>
                                                                ) : null}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <EmptyState icon={UserPlus} message="Select a student to load grade-matched classrooms." />
                                    )}
                                </>
                            )}
                        </div>

                        {assignmentAcademicYear && assignmentPagination.count > 0 ? (
                            <div className="sec-table-pagination">
                                <span className="sec-table-pagination-summary">
                                    {t('secretary.admissions.classAssignment.paginationSummary', {
                                        shown: assignmentStudents.length,
                                        total: assignmentPagination.count,
                                    }) || `Showing ${assignmentStudents.length} students on this page (${assignmentPagination.count} total)`}
                                </span>
                                <div className="sec-table-pagination-controls">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setAssignmentPage((previous) => Math.max(1, previous - 1))}
                                        disabled={!assignmentPagination.previous || isStudentsLoading}
                                    >
                                        {t('common.previous') || 'Previous'}
                                    </button>
                                    <span className="sec-table-pagination-page">
                                        {t('common.pageOf', { current: assignmentPage, total: assignmentTotalPages }) || `Page ${assignmentPage} of ${assignmentTotalPages}`}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setAssignmentPage((previous) => Math.min(assignmentTotalPages, previous + 1))}
                                        disabled={!assignmentPagination.next || isStudentsLoading}
                                    >
                                        {t('common.next') || 'Next'}
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </section>
                ) : null}

                {activeTab === 'files' ? (
                    <section className="management-card">
                        <div className="files-filter-bar">
                            <div className="search-input-wrapper">
                                <Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={t('secretary.admissions.files.searchByStudentName') || 'Search by student name...'}
                                    value={fileSearch}
                                    onChange={(event) => setFileSearch(event.target.value)}
                                />
                            </div>

                            <select
                                className="form-select"
                                value={filesTypeFilter}
                                onChange={(event) => setFilesTypeFilter(event.target.value)}
                            >
                                <option value="">{t('secretary.admissions.files.allDocumentTypes') || 'All Document Types'}</option>
                                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>

                            <button type="button" className="btn-primary" onClick={() => setShowUploadModal(true)}>
                                <Upload size={16} />
                                {t('secretary.admissions.files.uploadDocument') || 'Upload Document'}
                            </button>
                        </div>

                        {isFilesLoading && files.length === 0 ? (
                            <SkeletonTable rows={6} cols={7} />
                        ) : (
                            <div className={`sec-table-scroll${isFilesLoading ? ' sec-table-scroll--loading' : ''}`}>
                                <table className="data-table sec-data-table sec-data-table--files-wide">
                                    <thead>
                                        <tr>
                                            <th>{t('secretary.admissions.files.table.student') || 'Student'}</th>
                                            <th>{t('secretary.admissions.files.table.documentType') || 'Document Type'}</th>
                                            <th>{t('secretary.admissions.files.table.fileName') || 'File Name'}</th>
                                            <th>{t('secretary.admissions.files.table.size') || 'Size'}</th>
                                            <th>{t('secretary.admissions.files.table.uploadedBy') || 'Uploaded By'}</th>
                                            <th>{t('secretary.admissions.files.table.date') || 'Date'}</th>
                                            <th>{t('secretary.admissions.files.table.actions') || 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {files.map((documentRecord) => (
                                            <tr key={documentRecord.id}>
                                                <td>
                                                    <div className="student-cell">
                                                        <AvatarInitial name={documentRecord.student_name} color="indigo" size="sm" />
                                                        <div>
                                                            <p className="student-name">{documentRecord.student_name || 'N/A'}</p>
                                                            <p className="student-email">{documentRecord.student_email || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <StatusBadge status={documentRecord.document_type} />
                                                </td>
                                                <td className="file-name-cell">
                                                    <FileText size={14} />
                                                    {documentRecord.file_name || 'N/A'}
                                                </td>
                                                <td>{formatFileSize(documentRecord.file_size)}</td>
                                                <td>{documentRecord.uploaded_by_name || '—'}</td>
                                                <td>{formatDateValue(documentRecord.created_at)}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <a
                                                            href={documentRecord.file_url || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn-icon btn-icon--secondary"
                                                            title="View/Download"
                                                            onClick={(event) => {
                                                                if (!documentRecord.file_url) {
                                                                    event.preventDefault();
                                                                }
                                                            }}
                                                        >
                                                            <Download size={15} />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            className="btn-icon btn-icon--danger"
                                                            title="Delete"
                                                            onClick={() => handleDeleteDocument(documentRecord)}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {files.length === 0 ? (
                                            <tr>
                                                <td colSpan="7">
                                                    <EmptyState
                                                        icon={FileText}
                                                        message={t('secretary.admissions.files.noDocumentsFound') || 'No documents found.'}
                                                    />
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
                    </section>
                ) : null}

                {showUploadModal ? (
                    <div className="sec-modal-overlay" onClick={() => setShowUploadModal(false)}>
                        <div className="sec-modal sec-modal--sm" onClick={(event) => event.stopPropagation()}>
                            <div className="sec-modal-header">
                                <h3>Upload Student Document</h3>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => setShowUploadModal(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleUploadDocument}>
                                <div className="sec-modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Student <span className="required-star">*</span></label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Search student name..."
                                            value={documentUpload.studentSearch || documentStudentQuery}
                                            onChange={(event) => handleStudentSearch(event.target.value)}
                                            onFocus={() => setShowDocumentStudentDropdown(true)}
                                        />

                                        {showDocumentStudentDropdown ? (
                                            <div className="student-search-dropdown">
                                                {isDocumentStudentLoading ? (
                                                    <div className="student-search-option text-muted">Loading students...</div>
                                                ) : studentSearchResults.length > 0 ? (
                                                    studentSearchResults.map((studentOption) => (
                                                        <button
                                                            key={studentOption.id || studentOption.user_id}
                                                            type="button"
                                                            className="student-search-option"
                                                            onClick={() => selectUploadStudent(studentOption)}
                                                        >
                                                            <AvatarInitial name={getStudentName(studentOption)} size="sm" />
                                                            <span>{getStudentName(studentOption)}</span>
                                                            <span className="text-muted">{studentOption.email}</span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="student-search-option text-muted">No students found</div>
                                                )}
                                            </div>
                                        ) : null}

                                        {documentUpload.selectedStudent ? (
                                            <div className="selected-student-badge">
                                                <AvatarInitial name={documentUpload.selectedStudent.full_name} size="sm" />
                                                {documentUpload.selectedStudent.full_name}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDocumentUpload((previous) => ({
                                                            ...previous,
                                                            selectedStudent: null,
                                                            student_id: '',
                                                            studentSearch: '',
                                                        }));
                                                        setDocumentStudentQuery('');
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Document Type <span className="required-star">*</span></label>
                                        <select
                                            className="form-select"
                                            value={documentUpload.document_type}
                                            onChange={(event) => setDocumentUpload((previous) => ({ ...previous, document_type: event.target.value }))}
                                        >
                                            {DOCUMENT_TYPE_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">File <span className="required-star">*</span></label>
                                        <div className={`file-drop-zone ${documentUpload.file ? 'file-drop-zone--has-file' : ''}`}>
                                            {documentUpload.file ? (
                                                <div className="file-selected">
                                                    <FileText size={20} />
                                                    <span>{documentUpload.file.name}</span>
                                                    <span className="text-muted">({formatFileSize(documentUpload.file.size)})</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDocumentUpload((previous) => ({ ...previous, file: null }))}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="file-drop-label" htmlFor="doc_file_input">
                                                    <Upload size={28} />
                                                    <span>Drag & drop or click to upload</span>
                                                    <span className="file-hint">PDF, JPG, PNG accepted</span>
                                                    <input
                                                        id="doc_file_input"
                                                        type="file"
                                                        ref={documentFileInputRef}
                                                        style={{ display: 'none' }}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={handleDocumentFileChange}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="sec-modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isUploadingDocument}>
                                        {isUploadingDocument ? 'Uploading...' : (
                                            <>
                                                <Upload size={16} />
                                                Upload
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}

                {showStudentDetailsModal ? (
                    <div
                        className="sec-modal-overlay"
                        onClick={() => {
                            setShowStudentDetailsModal(false);
                            setStudentToView(null);
                        }}
                    >
                        <div className="sec-modal sec-modal--sm" onClick={(event) => event.stopPropagation()}>
                            <div className="sec-modal-header">
                                <h3>{t('secretary.admissions.classAssignment.viewStudent') || 'Show Student'}</h3>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowStudentDetailsModal(false);
                                        setStudentToView(null);
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="sec-modal-body">
                                <div className="sec-form-grid">
                                    <div className="sec-field sec-field--full">
                                        <label className="form-label">{t('secretary.admissions.applicantName') || 'Applicant Name'}</label>
                                        <div className="form-input">{getStudentName(studentToView)}</div>
                                    </div>
                                    <div className="sec-field">
                                        <label className="form-label">{t('secretary.admissions.table.id') || 'ID'}</label>
                                        <div className="form-input">#{getNumericStudentId(studentToView) || 'N/A'}</div>
                                    </div>
                                    <div className="sec-field">
                                        <label className="form-label">{t('secretary.admissions.status') || 'Status'}</label>
                                        <div className="form-input">
                                            {resolveStudentStatus(studentToView) || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="sec-field">
                                        <label className="form-label">{t('secretary.admissions.table.grade') || 'Grade'}</label>
                                        <div className="form-input">
                                            {studentToView?.grade_name || studentToView?.current_grade?.name || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="sec-field">
                                        <label className="form-label">{t('secretary.admissions.manual.admissionDate') || 'Admission Date'}</label>
                                        <div className="form-input">{formatDateValue(studentToView?.admission_date)}</div>
                                    </div>
                                    <div className="sec-field sec-field--full">
                                        <label className="form-label">{t('secretary.admissions.manual.phone') || 'Phone'}</label>
                                        <div className="form-input">{studentToView?.phone || 'N/A'}</div>
                                    </div>
                                    <div className="sec-field sec-field--full">
                                        <label className="form-label">{t('secretary.admissions.manual.address') || 'Address'}</label>
                                        <div className="form-input">{studentToView?.address || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="sec-modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowStudentDetailsModal(false);
                                        setStudentToView(null);
                                    }}
                                >
                                    {t('common.close') || 'Close'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {showEditStudentModal ? (
                    <div
                        className="sec-modal-overlay"
                        onClick={() => {
                            if (!isUpdatingStudent) {
                                setShowEditStudentModal(false);
                                setStudentToEdit(null);
                            }
                        }}
                    >
                        <div className="sec-modal sec-modal--sm" onClick={(event) => event.stopPropagation()}>
                            <div className="sec-modal-header">
                                <h3>{t('secretary.admissions.classAssignment.updateStudentData') || 'Update Student Data'}</h3>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowEditStudentModal(false);
                                        setStudentToEdit(null);
                                    }}
                                    disabled={isUpdatingStudent}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateStudentData}>
                                <div className="sec-modal-body">
                                    <div className="sec-form-grid">
                                        <div className="sec-field">
                                            <label className="form-label">
                                                {t('secretary.admissions.manual.admissionDate') || 'Admission Date'}
                                            </label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={studentEditData.admission_date}
                                                onChange={(event) => updateStudentEditField('admission_date', event.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="sec-field">
                                            <label className="form-label">
                                                {t('secretary.admissions.status') || 'Status'}
                                            </label>
                                            <select
                                                className="form-select"
                                                value={studentEditData.enrollment_status}
                                                onChange={(event) => updateStudentEditField('enrollment_status', event.target.value)}
                                            >
                                                {STUDENT_ENROLLMENT_STATUS_OPTIONS.map((statusOption) => (
                                                    <option key={`student-edit-status-${statusOption.value}`} value={statusOption.value}>
                                                        {t(statusOption.labelKey) || statusOption.fallbackLabel}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="sec-field sec-field--full">
                                            <label className="form-label">
                                                {t('secretary.admissions.manual.phone') || 'Phone'}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={studentEditData.phone}
                                                onChange={(event) => updateStudentEditField('phone', event.target.value)}
                                            />
                                        </div>

                                        <div className="sec-field sec-field--full">
                                            <label className="form-label">
                                                {t('secretary.admissions.manual.address') || 'Address'}
                                            </label>
                                            <textarea
                                                className="form-input"
                                                rows={3}
                                                value={studentEditData.address}
                                                onChange={(event) => updateStudentEditField('address', event.target.value)}
                                            />
                                        </div>

                                        <div className="sec-field sec-field--full">
                                            <label className="form-label">
                                                {t('secretary.admissions.manual.medicalNotes') || 'Medical Notes'}
                                            </label>
                                            <textarea
                                                className="form-input"
                                                rows={3}
                                                value={studentEditData.medical_notes}
                                                onChange={(event) => updateStudentEditField('medical_notes', event.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="sec-modal-footer">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowEditStudentModal(false);
                                            setStudentToEdit(null);
                                        }}
                                        disabled={isUpdatingStudent}
                                    >
                                        {t('common.cancel') || 'Cancel'}
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isUpdatingStudent}>
                                        {isUpdatingStudent
                                            ? (t('secretary.admissions.classAssignment.updatingStudent') || 'Updating...')
                                            : (t('secretary.admissions.classAssignment.saveStudentData') || 'Save Changes')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}

                <ConfirmModal
                    isOpen={showDeleteStudentConfirm}
                    title={t('secretary.admissions.classAssignment.deleteStudentConfirmTitle') || 'Delete Student?'}
                    message={(
                        t('secretary.admissions.classAssignment.deleteStudentConfirmMessage', {
                            student: getStudentName(studentToDelete),
                        })
                        || `Delete ${getStudentName(studentToDelete)}? This action can be reversed only by a manager/admin.`
                    )}
                    confirmLabel={isDeletingStudent
                        ? (t('secretary.admissions.classAssignment.deletingStudent') || 'Deleting...')
                        : (t('secretary.admissions.classAssignment.deleteStudent') || 'Delete Student')}
                    cancelLabel={t('common.cancel') || 'Cancel'}
                    danger
                    confirmDisabled={isDeletingStudent}
                    onCancel={() => {
                        if (isDeletingStudent) {
                            return;
                        }
                        setShowDeleteStudentConfirm(false);
                        setStudentToDelete(null);
                    }}
                    onConfirm={confirmDeleteStudent}
                />

                <ConfirmModal
                    isOpen={showReassignConfirm}
                    title="Confirm Re-assignment"
                    message={(
                        `Re-assign ${getStudentName(selectedAssignmentStudent)} `
                        + `from ${pendingReassignment?.currentClassroomName || 'the current classroom'} `
                        + `to ${pendingReassignment?.targetClassroomName || 'the selected classroom'}?`
                    )}
                    confirmLabel={isAssigningStudent ? 'Re-assigning...' : 'Re-assign'}
                    cancelLabel="Cancel"
                    confirmDisabled={isAssigningStudent}
                    onCancel={cancelReassignment}
                    onConfirm={confirmReassignment}
                />

                <ConfirmModal
                    isOpen={showDeleteDocConfirm}
                    title="Delete Document?"
                    message={`Delete ${documentToDelete?.file_name || 'this document'}? This action cannot be undone.`}
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    danger
                    onCancel={() => {
                        setShowDeleteDocConfirm(false);
                        setDocumentToDelete(null);
                    }}
                    onConfirm={confirmDeleteDocument}
                />
            </div>
        </div>
    );
};

export default StudentAdmissions;
