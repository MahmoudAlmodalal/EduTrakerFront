import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Link as LinkIcon, Mail, Phone, Search, UserPlus, Users } from 'lucide-react';
import Modal from '../../components/ui/Modal';
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

const DEFAULT_LINK_DATA = {
    student_id: '',
    relationship_type: 'parent',
    is_primary: false,
    can_pickup: true,
};

const DEFAULT_GUARDIAN = {
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
};

const RELATIONSHIP_OPTIONS = [
    { value: 'parent', label: 'Parent' },
    { value: 'legal_guardian', label: 'Legal Guardian' },
    { value: 'foster_parent', label: 'Foster Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'other', label: 'Other' },
];

const GUARDIAN_STATUS_VALUES = ['active', 'inactive', 'all'];

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

const toList = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.results)) {
        return payload.results;
    }

    return [];
};

const getEntityId = (record) => record?.user_id ?? record?.id ?? null;

const getStudentIdFromLink = (link) => {
    const resolvedId = link?.student_id ?? link?.student?.user_id ?? link?.student?.id ?? null;
    if (resolvedId === null || resolvedId === undefined || resolvedId === '') {
        console.warn('Guardian link does not contain a resolvable student identifier.', link);
        return null;
    }
    return resolvedId;
};

const getStudentName = (student) => {
    if (student?.full_name) {
        return student.full_name;
    }

    const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ').trim();
    return fullName || 'Student';
};

const humanize = (value = '') => {
    const normalized = value.toString().trim().toLowerCase();

    if (!normalized) {
        return 'N/A';
    }

    return normalized
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatApiError = (error, fallback) => {
    const responseData = error?.response?.data;
    const fallbackData = responseData ?? error?.data ?? null;

    if (typeof fallbackData === 'string' && fallbackData.trim()) {
        return fallbackData.trim();
    }

    if (fallbackData && typeof fallbackData === 'object' && !Array.isArray(fallbackData)) {
        const message = Object.entries(fallbackData)
            .map(([key, value]) => {
                const normalizedValue = Array.isArray(value) ? value.filter(Boolean).join(', ') : value;
                if (normalizedValue === undefined || normalizedValue === null || normalizedValue === '') {
                    return '';
                }
                if (key === 'detail' || key === 'message') {
                    return String(normalizedValue);
                }
                return `${key}: ${normalizedValue}`;
            })
            .filter(Boolean)
            .join(' | ');

        if (message) {
            return message;
        }
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }

    return fallback;
};

const isRequestCanceled = (error) => {
    return error?.code === 'ERR_CANCELED'
        || error?.name === 'CanceledError'
        || error?.name === 'AbortError';
};

const GuardianLinking = () => {
    const { t } = useTheme();
    const { user } = useAuth();
    const { showError, showSuccess } = useToast();

    const isMountedRef = useRef(true);
    const guardiansRequestRef = useRef(0);
    const summaryRequestRef = useRef(0);
    const linksRequestRef = useRef(0);
    const studentsRef = useRef([]);
    const studentsLoadedRef = useRef(false);
    const studentsLoadingRef = useRef(false);
    const studentsAbortControllerRef = useRef(null);
    const summaryAbortControllerRef = useRef(null);
    const isResettingForSchoolRef = useRef(false);
    const abortControllerRef = useRef(null);

    const [guardians, setGuardians] = useState([]);
    const [students, setStudents] = useState([]);
    const [guardianLinks, setGuardianLinks] = useState([]);
    const [selectedGuardian, setSelectedGuardian] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [guardiansCount, setGuardiansCount] = useState(0);
    const [guardiansTotalPages, setGuardiansTotalPages] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [hasLoadedGuardians, setHasLoadedGuardians] = useState(false);
    const [summaryLoaded, setSummaryLoaded] = useState(false);
    const [guardianSummary, setGuardianSummary] = useState({
        total_guardians: 0,
        active_guardians: 0,
        inactive_guardians: 0,
    });
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsLoaded, setStudentsLoaded] = useState(false);
    const [linksLoading, setLinksLoading] = useState(false);
    const [deactivatingGuardianId, setDeactivatingGuardianId] = useState(null);
    const [activatingGuardianId, setActivatingGuardianId] = useState(null);
    const [deactivatingLinkId, setDeactivatingLinkId] = useState(null);
    const [activatingLinkId, setActivatingLinkId] = useState(null);
    const [linkSubmitting, setLinkSubmitting] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [banner, setBanner] = useState({ type: 'error', message: '' });
    const [confirmAction, setConfirmAction] = useState(null);

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [linkData, setLinkData] = useState({ ...DEFAULT_LINK_DATA });
    const [newGuardian, setNewGuardian] = useState({ ...DEFAULT_GUARDIAN });
    const [showGuardianPassword, setShowGuardianPassword] = useState(false);

    const schoolId = useMemo(() => {
        const school = user?.school;
        const candidate = user?.school_id ?? school?.id ?? school;
        const parsed = Number.parseInt(candidate, 10);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }, [user?.school, user?.school_id]);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            isResettingForSchoolRef.current = false;
            guardiansRequestRef.current += 1;
            summaryRequestRef.current += 1;
            linksRequestRef.current += 1;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (studentsAbortControllerRef.current) {
                studentsAbortControllerRef.current.abort();
            }
            if (summaryAbortControllerRef.current) {
                summaryAbortControllerRef.current.abort();
            }
        };
    }, []);

    const closeConfirmModal = useCallback(() => {
        setConfirmAction(null);
    }, []);

    const setFeedback = useCallback((type, message) => {
        if (!isMountedRef.current) {
            return;
        }

        setBanner({ type, message });

        if (type === 'success') {
            showSuccess(message);
            return;
        }

        showError(message);
    }, [showError, showSuccess]);

    const fetchGuardians = useCallback(async ({
        search = '',
        status = 'active',
        page = 1,
        size = DEFAULT_PAGE_SIZE,
        forceRefresh = false,
    } = {}) => {
        if (!schoolId) {
            guardiansRequestRef.current += 1;
            setGuardians([]);
            setGuardiansCount(0);
            setGuardiansTotalPages(1);
            setHasNextPage(false);
            setHasPreviousPage(false);
            setHasLoadedGuardians(true);
            setTableLoading(false);
            return;
        }

        const requestId = guardiansRequestRef.current + 1;
        guardiansRequestRef.current = requestId;

        try {
            setTableLoading(true);

            // Abort any previous in-flight request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const normalizedSearch = search.trim();
            const includeInactive = status !== 'active';
            const isActive = status === 'inactive' ? false : null;
            const data = await secretaryService.getGuardians({
                search: normalizedSearch,
                schoolId,
                includeInactive,
                isActive,
                page,
                pageSize: size,
                forceRefresh,
                signal: controller.signal,
            });

            if (!isMountedRef.current || guardiansRequestRef.current !== requestId) {
                return;
            }

            const nextGuardians = toList(data);
            setGuardians(nextGuardians);

            if (Array.isArray(data?.results)) {
                const parsedCount = Number.parseInt(data.count, 10);
                const totalCount = Number.isInteger(parsedCount) && parsedCount >= 0
                    ? parsedCount
                    : nextGuardians.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / size));

                if (page > totalPages && totalCount > 0) {
                    setCurrentPage(totalPages);
                    return;
                }

                setGuardiansCount(totalCount);
                setGuardiansTotalPages(totalPages);
                setHasNextPage(Boolean(data.next));
                setHasPreviousPage(Boolean(data.previous));
            } else {
                setGuardiansCount(nextGuardians.length);
                setGuardiansTotalPages(1);
                setHasNextPage(false);
                setHasPreviousPage(false);
            }
        } catch (error) {
            if (!isMountedRef.current || guardiansRequestRef.current !== requestId) {
                return;
            }

            if (isRequestCanceled(error)) {
                return;
            }

            console.error('Error fetching guardians:', error);
            setFeedback('error', formatApiError(error, 'Failed to load guardians.'));
        } finally {
            if (isMountedRef.current && guardiansRequestRef.current === requestId) {
                setTableLoading(false);
                setHasLoadedGuardians(true);
            }
        }
    }, [schoolId, setFeedback]);

    const fetchGuardianSummary = useCallback(async ({ forceRefresh = false, silent = false } = {}) => {
        const requestId = summaryRequestRef.current + 1;
        summaryRequestRef.current = requestId;

        if (summaryAbortControllerRef.current) {
            summaryAbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        summaryAbortControllerRef.current = controller;

        try {
            const data = await secretaryService.getGuardianSummary({
                forceRefresh,
                signal: controller.signal,
            });

            if (!isMountedRef.current || summaryRequestRef.current !== requestId) {
                return data;
            }

            const totalGuardians = Number.parseInt(data?.total_guardians, 10);
            const activeGuardians = Number.parseInt(data?.active_guardians, 10);
            const inactiveGuardians = Number.parseInt(data?.inactive_guardians, 10);

            setGuardianSummary({
                total_guardians: Number.isInteger(totalGuardians) && totalGuardians >= 0 ? totalGuardians : 0,
                active_guardians: Number.isInteger(activeGuardians) && activeGuardians >= 0 ? activeGuardians : 0,
                inactive_guardians: Number.isInteger(inactiveGuardians) && inactiveGuardians >= 0 ? inactiveGuardians : 0,
            });
            setSummaryLoaded(true);
            return data;
        } catch (error) {
            if (!isMountedRef.current || summaryRequestRef.current !== requestId || isRequestCanceled(error)) {
                return null;
            }

            console.error('Error fetching guardian summary:', error);
            setSummaryLoaded(false);
            if (!silent) {
                setFeedback('error', formatApiError(error, 'Failed to load guardian summary.'));
            }
            return null;
        } finally {
            if (summaryAbortControllerRef.current === controller) {
                summaryAbortControllerRef.current = null;
            }
        }
    }, [setFeedback]);

    const fetchStudents = useCallback(async ({ force = false, silent = false } = {}) => {
        if (!schoolId) {
            studentsLoadingRef.current = false;
            studentsLoadedRef.current = false;
            studentsRef.current = [];
            if (isMountedRef.current) {
                setStudents([]);
                setStudentsLoaded(false);
                if (!silent) {
                    setStudentsLoading(false);
                }
            }
            return [];
        }

        if (studentsLoadingRef.current && !force && silent) {
            return studentsRef.current;
        }

        if (studentsLoadedRef.current && !force) {
            return studentsRef.current;
        }

        studentsLoadingRef.current = true;
        if (studentsAbortControllerRef.current) {
            studentsAbortControllerRef.current.abort();
        }
        const controller = new AbortController();
        studentsAbortControllerRef.current = controller;

        try {
            if (!silent) {
                setStudentsLoading(true);
            }

            const data = await secretaryService.getStudents(
                { school_id: schoolId },
                { signal: controller.signal, timeout: 8000 },
            );
            const nextStudents = toList(data);

            if (!isMountedRef.current || studentsAbortControllerRef.current !== controller) {
                return nextStudents;
            }

            studentsRef.current = nextStudents;
            studentsLoadedRef.current = true;
            setStudents(nextStudents);
            setStudentsLoaded(true);
            return nextStudents;
        } catch (error) {
            if (isRequestCanceled(error)) {
                return studentsRef.current;
            }

            console.error('Error fetching students:', error);

            if (isMountedRef.current && studentsAbortControllerRef.current === controller) {
                studentsLoadedRef.current = false;
                setStudentsLoaded(false);
                if (!silent) {
                    setFeedback('error', 'Failed to load students.');
                }
            }

            return [];
        } finally {
            if (studentsAbortControllerRef.current === controller) {
                studentsAbortControllerRef.current = null;
                studentsLoadingRef.current = false;
                if (!silent && isMountedRef.current) {
                    setStudentsLoading(false);
                }
            }
        }
    }, [schoolId, setFeedback]);

    const fetchGuardianLinks = useCallback(async (guardianId) => {
        if (!guardianId) {
            if (isMountedRef.current) {
                setGuardianLinks([]);
            }
            return [];
        }

        const requestId = linksRequestRef.current + 1;
        linksRequestRef.current = requestId;

        try {
            setLinksLoading(true);
            const data = await secretaryService.getGuardianLinks(guardianId, {
                includeInactive: true,
            });
            const links = toList(data);

            if (!isMountedRef.current || linksRequestRef.current !== requestId) {
                return links;
            }

            setGuardianLinks(links);
            return links;
        } catch (error) {
            if (!isMountedRef.current || linksRequestRef.current !== requestId) {
                return [];
            }

            console.error('Error fetching guardian links:', error);
            setGuardianLinks([]);
            setFeedback('error', 'Failed to load guardian links.');
            return [];
        } finally {
            if (isMountedRef.current && linksRequestRef.current === requestId) {
                setLinksLoading(false);
            }
        }
    }, [setFeedback]);

    const refreshCurrentGuardians = useCallback(async ({ forceRefresh = false } = {}) => {
        await fetchGuardians({
            search: appliedSearch,
            status: statusFilter,
            page: currentPage,
            size: pageSize,
            forceRefresh,
        });
    }, [appliedSearch, currentPage, fetchGuardians, pageSize, statusFilter]);

    useEffect(() => {
        isResettingForSchoolRef.current = true;
        if (studentsAbortControllerRef.current) {
            studentsAbortControllerRef.current.abort();
            studentsAbortControllerRef.current = null;
        }
        if (summaryAbortControllerRef.current) {
            summaryAbortControllerRef.current.abort();
            summaryAbortControllerRef.current = null;
        }
        setGuardians([]);
        setGuardiansCount(0);
        setGuardiansTotalPages(1);
        setHasNextPage(false);
        setHasPreviousPage(false);
        setSummaryLoaded(false);
        setGuardianSummary({
            total_guardians: 0,
            active_guardians: 0,
            inactive_guardians: 0,
        });
        studentsRef.current = [];
        studentsLoadedRef.current = false;
        studentsLoadingRef.current = false;
        setStudents([]);
        setStudentsLoading(false);
        setStudentsLoaded(false);
        setDeactivatingGuardianId(null);
        setActivatingGuardianId(null);
        setHasLoadedGuardians(false);
        setSearchTerm('');
        setAppliedSearch('');
        setStatusFilter('active');
        setCurrentPage(1);
        setPageSize(DEFAULT_PAGE_SIZE);

        if (!schoolId) {
            isResettingForSchoolRef.current = false;
            return;
        }

        void fetchGuardians({ search: '', status: 'active', page: 1, size: DEFAULT_PAGE_SIZE });
        void fetchGuardianSummary({ forceRefresh: true, silent: true });
        void fetchStudents({ silent: true, force: true });
    }, [schoolId, fetchGuardians, fetchGuardianSummary, fetchStudents]);

    useEffect(() => {
        if (isResettingForSchoolRef.current) {
            const defaultsApplied = appliedSearch === ''
                && statusFilter === 'active'
                && currentPage === 1
                && pageSize === DEFAULT_PAGE_SIZE;

            if (defaultsApplied) {
                isResettingForSchoolRef.current = false;
            }
            return;
        }

        void fetchGuardians({
            search: appliedSearch,
            status: statusFilter,
            page: currentPage,
            size: pageSize,
        });
    }, [appliedSearch, currentPage, fetchGuardians, pageSize, statusFilter]);

    const filteredGuardians = guardians;

    const linkedStudentIds = useMemo(() => {
        const ids = new Set();

        guardianLinks.forEach((link) => {
            if (link?.is_active === false) {
                return;
            }
            const id = getStudentIdFromLink(link);
            if (id !== null && id !== undefined) {
                ids.add(String(id));
            }
        });

        return ids;
    }, [guardianLinks]);

    const availableStudents = useMemo(() => {
        return students.filter((student) => {
            const id = getEntityId(student);
            return id !== null && id !== undefined && !linkedStudentIds.has(String(id));
        });
    }, [students, linkedStudentIds]);

    const statCards = useMemo(() => {
        const activeGuardians = summaryLoaded
            ? guardianSummary.active_guardians
            : statusFilter === 'active'
                ? guardiansCount
                : guardians.filter((guardian) => guardian.is_active !== false).length;
        const totalGuardians = summaryLoaded ? guardianSummary.total_guardians : guardiansCount;
        const studentValue = studentsLoaded ? students.length : '...';

        return [
            { title: t('secretary.guardians.totalGuardians') || 'Total Guardians', value: totalGuardians, icon: Users, color: 'indigo' },
            { title: t('secretary.guardians.active') || 'Active Guardians', value: activeGuardians, icon: Users, color: 'green' },
            { title: t('secretary.guardians.students') || 'Students', value: studentValue, icon: Users, color: 'blue' },
        ];
    }, [guardians, guardiansCount, guardianSummary.active_guardians, guardianSummary.total_guardians, statusFilter, students.length, studentsLoaded, summaryLoaded, t]);

    const guardianStatusOptions = useMemo(() => (
        GUARDIAN_STATUS_VALUES.map((value) => ({
            value,
            label: value === 'active'
                ? (t('common.active') || 'Active')
                : value === 'inactive'
                    ? (t('common.inactive') || 'Inactive')
                    : (t('common.all') || 'All'),
        }))
    ), [t]);

    const handleSearchChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    const handleSearchSubmit = useCallback(() => {
        setAppliedSearch(searchTerm.trim());
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSearchKeyDown = useCallback((event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearchSubmit();
        }
    }, [handleSearchSubmit]);

    const closeLinkModal = useCallback(() => {
        linksRequestRef.current += 1;
        setIsLinkModalOpen(false);
        setSelectedGuardian(null);
        setGuardianLinks([]);
        setLinkData({ ...DEFAULT_LINK_DATA });
        setLinksLoading(false);
        setDeactivatingLinkId(null);
        setActivatingLinkId(null);
    }, []);

    const closeCreateModal = useCallback(() => {
        setIsCreateModalOpen(false);
        setNewGuardian({ ...DEFAULT_GUARDIAN });
        setShowGuardianPassword(false);
    }, []);

    const handleStatusFilterChange = useCallback((event) => {
        setStatusFilter(event.target.value);
        setCurrentPage(1);
    }, []);

    const handlePageSizeChange = useCallback((event) => {
        const nextSize = Number.parseInt(event.target.value, 10);
        if (!Number.isInteger(nextSize) || nextSize <= 0) {
            return;
        }

        setPageSize(nextSize);
        setCurrentPage(1);
    }, []);

    const handlePreviousPage = useCallback(() => {
        if (!hasPreviousPage || tableLoading) {
            return;
        }

        setCurrentPage((prev) => Math.max(1, prev - 1));
    }, [hasPreviousPage, tableLoading]);

    const handleNextPage = useCallback(() => {
        if (!hasNextPage || tableLoading) {
            return;
        }

        setCurrentPage((prev) => prev + 1);
    }, [hasNextPage, tableLoading]);

    const handleOpenLinkModal = useCallback((guardian) => {
        const guardianId = getEntityId(guardian);

        if (!guardianId) {
            setFeedback('error', 'Selected guardian does not have a valid identifier.');
            return;
        }

        setSelectedGuardian({
            id: guardianId,
            name: guardian.full_name || `Guardian #${guardianId}`,
        });
        setLinkData({ ...DEFAULT_LINK_DATA });
        setGuardianLinks([]);
        setIsLinkModalOpen(true);

        void fetchGuardianLinks(guardianId);

        if (!studentsLoadedRef.current) {
            void fetchStudents({ silent: false });
        }
    }, [fetchGuardianLinks, fetchStudents, setFeedback]);

    const executeDeactivateGuardian = useCallback(async (guardian) => {
        const guardianId = getEntityId(guardian);

        if (!guardianId) {
            setFeedback('error', 'Selected guardian does not have a valid identifier.');
            return;
        }

        if (guardian.is_active === false) {
            return;
        }

        try {
            setDeactivatingGuardianId(guardianId);
            await secretaryService.deactivateGuardian(guardianId);

            if (!isMountedRef.current) {
                return;
            }

            if (selectedGuardian?.id === guardianId) {
                closeLinkModal();
            }

            if (summaryLoaded) {
                setGuardianSummary((prev) => ({
                    ...prev,
                    active_guardians: Math.max(Number(prev.active_guardians || 0) - 1, 0),
                    inactive_guardians: Math.max(Number(prev.inactive_guardians || 0) + 1, 0),
                    total_guardians: Math.max(Number(prev.total_guardians || 0), 0),
                }));
            }

            setFeedback('success', 'Guardian deactivated successfully.');
            await Promise.all([
                refreshCurrentGuardians({ forceRefresh: true }),
                fetchGuardianSummary({ forceRefresh: true, silent: true }),
            ]);
        } catch (error) {
            console.error('Error deactivating guardian:', error);
            setFeedback('error', formatApiError(error, 'Failed to deactivate guardian.'));
        } finally {
            if (isMountedRef.current) {
                setDeactivatingGuardianId(null);
            }
        }
    }, [closeLinkModal, fetchGuardianSummary, refreshCurrentGuardians, selectedGuardian, setFeedback, summaryLoaded]);

    const handleDeactivateGuardian = useCallback((guardian) => {
        const guardianId = getEntityId(guardian);
        if (!guardianId || guardian.is_active === false) {
            return;
        }

        const guardianName = guardian.full_name || `Guardian #${guardianId}`;
        setConfirmAction({
            title: 'Deactivate Guardian',
            message: `Deactivate ${guardianName}?`,
            danger: true,
            confirmLabel: 'Deactivate',
            onConfirm: () => {
                closeConfirmModal();
                void executeDeactivateGuardian(guardian);
            },
        });
    }, [closeConfirmModal, executeDeactivateGuardian]);

    const executeActivateGuardian = useCallback(async (guardian) => {
        const guardianId = getEntityId(guardian);

        if (!guardianId) {
            setFeedback('error', 'Selected guardian does not have a valid identifier.');
            return;
        }

        if (guardian.is_active !== false) {
            return;
        }

        try {
            setActivatingGuardianId(guardianId);
            await secretaryService.activateGuardian(guardianId);

            if (!isMountedRef.current) {
                return;
            }

            if (summaryLoaded) {
                setGuardianSummary((prev) => ({
                    ...prev,
                    active_guardians: Math.max(Number(prev.active_guardians || 0) + 1, 0),
                    inactive_guardians: Math.max(Number(prev.inactive_guardians || 0) - 1, 0),
                    total_guardians: Math.max(Number(prev.total_guardians || 0), 0),
                }));
            }

            setFeedback('success', 'Guardian activated successfully.');
            await Promise.all([
                refreshCurrentGuardians({ forceRefresh: true }),
                fetchGuardianSummary({ forceRefresh: true, silent: true }),
            ]);
        } catch (error) {
            console.error('Error activating guardian:', error);
            setFeedback('error', formatApiError(error, 'Failed to activate guardian.'));
        } finally {
            if (isMountedRef.current) {
                setActivatingGuardianId(null);
            }
        }
    }, [fetchGuardianSummary, refreshCurrentGuardians, setFeedback, summaryLoaded]);

    const handleActivateGuardian = useCallback((guardian) => {
        const guardianId = getEntityId(guardian);
        if (!guardianId || guardian.is_active !== false) {
            return;
        }

        const guardianName = guardian.full_name || `Guardian #${guardianId}`;
        setConfirmAction({
            title: 'Activate Guardian',
            message: `Activate ${guardianName}?`,
            confirmLabel: 'Activate',
            onConfirm: () => {
                closeConfirmModal();
                void executeActivateGuardian(guardian);
            },
        });
    }, [closeConfirmModal, executeActivateGuardian]);

    const handleLinkFieldChange = useCallback((field, value) => {
        setLinkData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveLink = useCallback(async () => {
        const guardianId = selectedGuardian?.id;
        const studentId = String(linkData.student_id || '').trim();

        if (!guardianId || !studentId) {
            setFeedback('error', 'Please select a student before linking.');
            return;
        }

        if (linkedStudentIds.has(studentId)) {
            setFeedback('error', 'This student is already linked to the selected guardian.');
            return;
        }

        try {
            setLinkSubmitting(true);

            await secretaryService.linkGuardianToStudent(guardianId, studentId, {
                relationship_type: linkData.relationship_type,
                is_primary: linkData.is_primary,
                can_pickup: linkData.can_pickup,
            });

            if (!isMountedRef.current) {
                return;
            }

            setFeedback('success', 'Guardian linked to student successfully.');
            setLinkData({ ...DEFAULT_LINK_DATA });
            await Promise.all([
                fetchGuardianLinks(guardianId),
                refreshCurrentGuardians({ forceRefresh: true }),
            ]);
        } catch (error) {
            console.error('Error linking guardian:', error);
            setFeedback('error', formatApiError(error, 'Failed to link guardian.'));
        } finally {
            if (isMountedRef.current) {
                setLinkSubmitting(false);
            }
        }
    }, [
        fetchGuardianLinks,
        linkData,
        linkedStudentIds,
        refreshCurrentGuardians,
        selectedGuardian,
        setFeedback,
    ]);

    const executeDeactivateLink = useCallback(async (link) => {
        const guardianId = selectedGuardian?.id;
        const linkId = link?.id;

        if (!guardianId || !linkId) {
            setFeedback('error', 'Selected guardian link is invalid.');
            return;
        }

        try {
            setDeactivatingLinkId(linkId);
            await secretaryService.deactivateGuardianLink(linkId);

            if (!isMountedRef.current) {
                return;
            }

            setFeedback('success', 'Guardian link deactivated successfully.');
            setLinkData((prev) => ({ ...prev, student_id: '' }));
            await Promise.all([
                fetchGuardianLinks(guardianId),
                refreshCurrentGuardians({ forceRefresh: true }),
            ]);
        } catch (error) {
            console.error('Error deactivating guardian link:', error);
            setFeedback('error', formatApiError(error, 'Failed to deactivate guardian link.'));
        } finally {
            if (isMountedRef.current) {
                setDeactivatingLinkId(null);
            }
        }
    }, [fetchGuardianLinks, refreshCurrentGuardians, selectedGuardian, setFeedback]);

    const handleDeactivateLink = useCallback((link) => {
        const linkId = link?.id;
        if (!linkId) {
            return;
        }

        const studentName = link.student_name || 'this student';
        setConfirmAction({
            title: 'Deactivate Guardian Link',
            message: `Deactivate link with ${studentName}?`,
            danger: true,
            confirmLabel: 'Deactivate',
            onConfirm: () => {
                closeConfirmModal();
                void executeDeactivateLink(link);
            },
        });
    }, [closeConfirmModal, executeDeactivateLink]);

    const handleActivateLink = useCallback(async (link) => {
        const guardianId = selectedGuardian?.id;
        const linkId = link?.id;

        if (!guardianId || !linkId) {
            setFeedback('error', 'Selected guardian link is invalid.');
            return;
        }

        try {
            setActivatingLinkId(linkId);
            await secretaryService.activateGuardianLink(linkId);

            if (!isMountedRef.current) {
                return;
            }

            setFeedback('success', 'Guardian link activated successfully.');
            await Promise.all([
                fetchGuardianLinks(guardianId),
                refreshCurrentGuardians({ forceRefresh: true }),
            ]);
        } catch (error) {
            console.error('Error activating guardian link:', error);
            setFeedback('error', formatApiError(error, 'Failed to activate guardian link.'));
        } finally {
            if (isMountedRef.current) {
                setActivatingLinkId(null);
            }
        }
    }, [fetchGuardianLinks, refreshCurrentGuardians, selectedGuardian, setFeedback]);

    const handleCreateGuardianField = useCallback((field, value) => {
        setNewGuardian((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleCreateGuardian = useCallback(async (event) => {
        event.preventDefault();

        const payload = {
            full_name: newGuardian.full_name.trim(),
            email: newGuardian.email.trim(),
            phone_number: newGuardian.phone_number.trim(),
            password: newGuardian.password,
            school_id: schoolId,
        };

        if (!payload.full_name || !payload.email || !payload.phone_number || !payload.password) {
            setFeedback('error', 'Please fill in all guardian fields.');
            return;
        }

        if (!payload.school_id) {
            setFeedback('error', 'Unable to determine the school for this guardian.');
            return;
        }

        try {
            setCreateSubmitting(true);

            await secretaryService.createGuardian(payload);

            if (!isMountedRef.current) {
                return;
            }

            closeCreateModal();
            setFeedback('success', 'Guardian created successfully.');
            await Promise.all([
                refreshCurrentGuardians({ forceRefresh: true }),
                fetchGuardianSummary({ forceRefresh: true, silent: true }),
            ]);
        } catch (error) {
            console.error('Error creating guardian:', error);
            setFeedback('error', formatApiError(error, 'Failed to create guardian.'));
        } finally {
            if (isMountedRef.current) {
                setCreateSubmitting(false);
            }
        }
    }, [closeCreateModal, fetchGuardianSummary, newGuardian, refreshCurrentGuardians, schoolId, setFeedback]);

    const canSubmitLink = Boolean(
        selectedGuardian?.id
        && linkData.student_id
        && !linkSubmitting
        && !studentsLoading
        && !linksLoading
        && !activatingLinkId
        && !deactivatingLinkId
        && availableStudents.length > 0
    );
    const showGuardiansInitialLoader = tableLoading && !hasLoadedGuardians && guardians.length === 0;
    const summaryStart = guardiansCount === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
    const summaryEnd = guardiansCount === 0 ? 0 : Math.min(currentPage * pageSize, guardiansCount);

    return (
        <div className="secretary-dashboard guardian-linking-page">
            <PageHeader
                title={t('secretary.guardians.title') || 'Guardian Management'}
                subtitle={t('secretary.guardians.subtitle') || 'Manage guardian accounts and student links'}
                action={(
                    <button className="btn-primary" type="button" onClick={() => setIsCreateModalOpen(true)}>
                        <UserPlus size={18} />
                        {t('secretary.guardians.addGuardian') || 'Add Guardian'}
                    </button>
                )}
            />

            <AlertBanner
                type={banner.type}
                message={banner.message}
                onDismiss={() => setBanner((prev) => ({ ...prev, message: '' }))}
            />

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
                        <label htmlFor="guardian-search" className="form-label">{t('secretary.guardians.searchLabel') || 'Search Guardians'}</label>
                        <div className="search-wrapper sec-search-wrapper">
                            <Search size={16} className="search-icon" />
                            <input
                                id="guardian-search"
                                type="text"
                                className="search-input"
                                placeholder={t('secretary.guardians.searchGuardians') || 'Search guardians by name, email, or phone...'}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>
                    </div>
                    <div className="sec-field sec-field--compact">
                        <label htmlFor="guardian-status-filter" className="form-label">{t('secretary.guardians.status') || 'Status'}</label>
                        <select
                            id="guardian-status-filter"
                            className="form-select"
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                            disabled={tableLoading}
                        >
                            {guardianStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sec-field sec-field--compact">
                        <label htmlFor="guardian-page-size" className="form-label">{t('secretary.guardians.rows') || 'Rows'}</label>
                        <select
                            id="guardian-page-size"
                            className="form-select"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            disabled={tableLoading}
                        >
                            {PAGE_SIZE_OPTIONS.map((sizeOption) => (
                                <option key={sizeOption} value={sizeOption}>{sizeOption}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn-primary" type="button" onClick={handleSearchSubmit} disabled={tableLoading}>
                        <Search size={16} />
                        {tableLoading && hasLoadedGuardians
                            ? (t('common.loading') || 'Loading...')
                            : (t('secretary.guardians.searchButton') || 'Search')}
                    </button>
                </div>

                <div className="sec-table-wrap">
                    {showGuardiansInitialLoader ? (
                        <SkeletonTable rows={Math.min(pageSize, 5)} cols={5} />
                    ) : (
                        <>
                            {tableLoading ? (
                                <p className="sec-subtle-text">Refreshing guardians...</p>
                            ) : null}
                            <div className="sec-table-scroll">
                                <table className="data-table sec-data-table sec-data-table--guardians">
                                    <thead>
                                        <tr>
                                            <th className="cell-id">{t('secretary.guardians.id') || 'ID'}</th>
                                            <th>{t('secretary.guardians.guardianName') || 'Guardian'}</th>
                                            <th>{t('secretary.guardians.contact') || 'Contact'}</th>
                                            <th>{t('secretary.guardians.status') || 'Status'}</th>
                                            <th>{t('secretary.guardians.actions') || 'Actions'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredGuardians.map((guardian, index) => {
                                            const guardianId = getEntityId(guardian);
                                            const rowKey = guardianId ?? `${guardian.email || guardian.full_name || 'guardian'}-${index}`;

                                            return (
                                                <tr key={rowKey}>
                                                    <td className="cell-id">{guardianId ? `#${guardianId}` : 'N/A'}</td>
                                                    <td>
                                                        <div className="sec-row-user">
                                                            <AvatarInitial name={guardian.full_name || 'Guardian'} color="purple" />
                                                            <span>{guardian.full_name || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="sec-contact-stack">
                                                            {guardian.email ? (
                                                                <span><Mail size={14} /> {guardian.email}</span>
                                                            ) : null}
                                                            {guardian.phone_number ? (
                                                                <span><Phone size={14} /> {guardian.phone_number}</span>
                                                            ) : null}
                                                            {!guardian.email && !guardian.phone_number ? (
                                                                <span className="cell-muted">No contact details</span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <StatusBadge status={guardian.is_active !== false ? 'active' : 'inactive'} />
                                                    </td>
                                                    <td>
                                                        <div className="sec-row-actions">
                                                            <button
                                                                type="button"
                                                                className="sec-inline-action"
                                                                onClick={() => handleOpenLinkModal(guardian)}
                                                                title={t('secretary.guardians.manageLink') || 'Link to Student'}
                                                                disabled={!guardianId}
                                                            >
                                                                <LinkIcon size={14} />
                                                                Link
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`sec-inline-action ${guardian.is_active === false ? '' : 'sec-inline-action--danger'}`.trim()}
                                                                onClick={() => (guardian.is_active === false
                                                                    ? void handleActivateGuardian(guardian)
                                                                    : void handleDeactivateGuardian(guardian))}
                                                                disabled={!guardianId || deactivatingGuardianId === guardianId || activatingGuardianId === guardianId}
                                                            >
                                                                {guardian.is_active === false
                                                                    ? activatingGuardianId === guardianId ? 'Activating...' : 'Activate'
                                                                    : deactivatingGuardianId === guardianId ? 'Deactivating...' : 'Deactivate'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {filteredGuardians.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    <EmptyState icon={Users} message={t('secretary.guardians.noGuardiansFound') || 'No guardians found.'} />
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                            {guardiansCount > 0 ? (
                                <div className="sec-table-pagination">
                                    <span className="sec-table-pagination-summary">
                                        Showing {summaryStart} to {summaryEnd} of {guardiansCount} guardians
                                    </span>
                                    <div className="sec-table-pagination-controls">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={handlePreviousPage}
                                            disabled={tableLoading || !hasPreviousPage}
                                        >
                                            Previous
                                        </button>
                                        <span className="sec-table-pagination-page">
                                            Page {currentPage} of {guardiansTotalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={handleNextPage}
                                            disabled={tableLoading || !hasNextPage}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            </section>

            <Modal
                isOpen={isLinkModalOpen}
                onClose={closeLinkModal}
                title={selectedGuardian ? `Link Student to: ${selectedGuardian.name}` : 'Link Guardian to Student'}
            >
                <form
                    className="sec-modal-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveLink();
                    }}
                >
                    {linksLoading ? (
                        <LoadingSpinner message="Loading linked students..." />
                    ) : guardianLinks.length > 0 ? (
                        <div className="sec-link-panel">
                            <p>Existing Links</p>
                            <div className="sec-link-list">
                                {guardianLinks.map((link, index) => {
                                    const linkKey = link?.id ?? `${getStudentIdFromLink(link) || 'student'}-${index}`;
                                    const isInactive = link?.is_active === false;
                                    return (
                                        <div className="sec-link-item" key={linkKey}>
                                            <div className="sec-link-item-main">
                                                <span>{link.student_name || 'Student'}</span>
                                                <span className="sec-link-relation">
                                                    {humanize(link.relationship_display || link.relationship_type)}
                                                    {isInactive ? ' · Inactive' : ' · Active'}
                                                </span>
                                            </div>
                                            {isInactive ? (
                                                <button
                                                    type="button"
                                                    className="sec-inline-action sec-inline-action--compact"
                                                    onClick={() => void handleActivateLink(link)}
                                                    disabled={!link?.id || activatingLinkId === link.id || Boolean(deactivatingLinkId)}
                                                >
                                                    {activatingLinkId === link.id ? 'Activating...' : 'Activate Link'}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="sec-inline-action sec-inline-action--danger sec-inline-action--compact"
                                                    onClick={() => void handleDeactivateLink(link)}
                                                    disabled={!link?.id || deactivatingLinkId === link.id || Boolean(activatingLinkId)}
                                                >
                                                    {deactivatingLinkId === link.id ? 'Deactivating...' : 'Deactivate Link'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="sec-subtle-text">This guardian has no linked students yet.</p>
                    )}

                    <div className="form-group">
                        <label className="form-label">Select Student *</label>
                        <select
                            className="form-select"
                            value={linkData.student_id}
                            onChange={(event) => handleLinkFieldChange('student_id', event.target.value)}
                            required
                            disabled={studentsLoading || linksLoading || linkSubmitting || Boolean(deactivatingLinkId) || Boolean(activatingLinkId) || availableStudents.length === 0}
                        >
                            <option value="">
                                {studentsLoading ? 'Loading students...' : 'Choose a student...'}
                            </option>
                            {availableStudents.map((student) => {
                                const studentId = getEntityId(student);

                                if (!studentId) {
                                    return null;
                                }

                                return (
                                    <option key={studentId} value={studentId}>
                                        {getStudentName(student)} (#{studentId})
                                    </option>
                                );
                            })}
                        </select>
                        {!studentsLoading && studentsLoaded && availableStudents.length === 0 ? (
                            <p className="sec-subtle-text">All available students are already linked to this guardian.</p>
                        ) : null}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Relationship Type *</label>
                        <select
                            className="form-select"
                            value={linkData.relationship_type}
                            onChange={(event) => handleLinkFieldChange('relationship_type', event.target.value)}
                        >
                            {RELATIONSHIP_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sec-checkbox-row">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                checked={linkData.is_primary}
                                onChange={(event) => handleLinkFieldChange('is_primary', event.target.checked)}
                            />
                            Primary Guardian
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                checked={linkData.can_pickup}
                                onChange={(event) => handleLinkFieldChange('can_pickup', event.target.checked)}
                            />
                            Can Pick Up Student
                        </label>
                    </div>

                    <div className="sec-modal-actions">
                        <button type="button" className="btn-secondary" onClick={closeLinkModal}>
                            Close
                        </button>
                        <button type="submit" className="btn-primary" disabled={!canSubmitLink}>
                            {linkSubmitting ? 'Linking...' : 'Link Student'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                title={t('secretary.guardians.createModal.title') || 'Create New Guardian'}
            >
                <form className="sec-modal-form" onSubmit={handleCreateGuardian}>
                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.createModal.fullName') || 'Full Name *'}</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('secretary.guardians.createModal.fullNamePlaceholder') || "Enter guardian's full name"}
                            value={newGuardian.full_name}
                            onChange={(event) => handleCreateGuardianField('full_name', event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.createModal.email') || 'Email *'}</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder={t('secretary.guardians.createModal.emailPlaceholder') || 'guardian@example.com'}
                            value={newGuardian.email}
                            onChange={(event) => handleCreateGuardianField('email', event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.createModal.phoneNumber') || 'Phone Number *'}</label>
                        <input
                            type="tel"
                            className="form-input"
                            placeholder={t('secretary.guardians.createModal.phoneNumberPlaceholder') || '+1 (555) 000-0000'}
                            value={newGuardian.phone_number}
                            onChange={(event) => handleCreateGuardianField('phone_number', event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('secretary.guardians.createModal.password') || 'Password *'}</label>
                        <div className="sec-password-field">
                            <input
                                type={showGuardianPassword ? 'text' : 'password'}
                                className="form-input"
                                value={newGuardian.password}
                                onChange={(event) => handleCreateGuardianField('password', event.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                className="sec-password-toggle"
                                onClick={() => setShowGuardianPassword((prev) => !prev)}
                                aria-label={showGuardianPassword ? 'Hide password' : 'Show password'}
                                title={showGuardianPassword ? 'Hide password' : 'Show password'}
                            >
                                {showGuardianPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="sec-modal-actions">
                        <button type="button" className="btn-secondary" onClick={closeCreateModal}>
                            {t('common.cancel') || 'Cancel'}
                        </button>
                        <button type="submit" className="btn-primary" disabled={createSubmitting}>
                            {createSubmitting
                                ? (t('secretary.guardians.createModal.creating') || 'Creating...')
                                : (t('secretary.guardians.createModal.submit') || 'Create Guardian')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={Boolean(confirmAction)}
                title={confirmAction?.title || 'Confirm Action'}
                message={confirmAction?.message || ''}
                danger={Boolean(confirmAction?.danger)}
                confirmLabel={confirmAction?.confirmLabel || 'Confirm'}
                onConfirm={() => {
                    if (typeof confirmAction?.onConfirm === 'function') {
                        confirmAction.onConfirm();
                    }
                }}
                onCancel={closeConfirmModal}
            />
        </div>
    );
};

export default GuardianLinking;
