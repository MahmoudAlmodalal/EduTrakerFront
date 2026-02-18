import { api } from '../utils/api';

const CACHE_TTL = 5 * 60 * 1000;
const inMemoryCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_LIST_TIMEOUT = 12000;
const RETRY_LIST_TIMEOUT = 20000;

const getCacheKey = (key, params = {}) => {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, currentKey) => {
            acc[currentKey] = params[currentKey];
            return acc;
        }, {});

    return `${key}:${JSON.stringify(sortedParams)}`;
};

const getCachedValue = (cacheKey) => {
    const cached = inMemoryCache.get(cacheKey);
    if (!cached) {
        return null;
    }

    if (Date.now() > cached.expiresAt) {
        inMemoryCache.delete(cacheKey);
        return null;
    }

    return cached.value;
};

const setCachedValue = (cacheKey, value) => {
    inMemoryCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + CACHE_TTL,
    });
};

const clearCacheByPrefix = (prefix) => {
    const keyPrefix = `${prefix}:`;

    for (const cacheKey of inMemoryCache.keys()) {
        if (cacheKey.startsWith(keyPrefix)) {
            inMemoryCache.delete(cacheKey);
        }
    }
};

const shouldRetryListRequest = (error) => {
    if (!error) {
        return false;
    }

    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.name === 'AbortError') {
        return false;
    }

    if (!error.response) {
        return true;
    }

    const statusCode = Number(error.response.status);
    return Number.isInteger(statusCode) && statusCode >= 500;
};

const resolveNextPage = (nextUrl) => {
    if (!nextUrl || typeof nextUrl !== 'string') {
        return null;
    }

    try {
        const parsedUrl = new URL(nextUrl, 'http://localhost');
        const pageValue = Number.parseInt(parsedUrl.searchParams.get('page') || '', 10);
        if (Number.isInteger(pageValue) && pageValue > 0) {
            return pageValue;
        }
    } catch {
        return null;
    }

    return null;
};

const secretaryService = {
    // Dashboard Stats
    getDashboardStats: async () => {
        return api.get('/statistics/dashboard/');
    },
    getSecretaryDashboardStats: async () => {
        return api.get('/secretary/dashboard-stats/');
    },

    getPendingTasks: async () => {
        return api.get('/secretary/tasks/pending/');
    },

    getUpcomingEvents: async () => {
        return api.get('/secretary/events/upcoming/');
    },

    // Secretary school context (school, classrooms, teachers, students, managers)
    getSecretaryContext: async () => {
        return api.get('/secretary/context/');
    },

    // Secretary Profile/Settings
    getProfile: async (id) => {
        return api.get(`/secretary/${id}/`);
    },
    updateProfile: async (id, data) => {
        return api.patch(`/secretary/${id}/`, data);
    },

    // Admissions & Students
    getApplications: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return api.get(`/manager/enrollments/${queryParams ? `?${queryParams}` : ''}`);
    },
    approveApplication: async (id) => {
        return api.post(`/manager/enrollments/${id}/activate/`);
    },
    rejectApplication: async (id) => {
        return api.post(`/manager/enrollments/${id}/deactivate/`);
    },
    createStudent: async (data) => {
        return api.post('/manager/students/create/', data);
    },
    getStudents: async (params = {}, config = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/manager/students/${queryParams ? `?${queryParams}` : ''}`, config);
    },
    getAllStudents: async (params = {}) => {
        const allStudents = [];
        let page = 1;

        while (page !== null) {
            const queryParams = new URLSearchParams({
                ...params,
                page_size: '100',
                page: String(page),
            }).toString();
            const payload = await api.get(`/manager/students/${queryParams ? `?${queryParams}` : ''}`);

            if (Array.isArray(payload?.results)) {
                allStudents.push(...payload.results);
                page = resolveNextPage(payload.next);
                continue;
            }

            if (Array.isArray(payload)) {
                allStudents.push(...payload);
            }

            break;
        }

        return allStudents;
    },
    getAllEnrollments: async (params = {}) => {
        const allEnrollments = [];
        let page = 1;

        while (page !== null) {
            const queryParams = new URLSearchParams({
                ...params,
                page_size: '100',
                page: String(page),
            }).toString();
            const payload = await api.get(`/manager/enrollments/${queryParams ? `?${queryParams}` : ''}`);

            if (Array.isArray(payload?.results)) {
                allEnrollments.push(...payload.results);
                page = resolveNextPage(payload.next);
                continue;
            }

            if (Array.isArray(payload)) {
                allEnrollments.push(...payload);
            }

            break;
        }

        return allEnrollments;
    },
    updateStudent: async (id, data) => {
        return api.patch(`/manager/students/${id}/`, data);
    },
    getUnassignedStudents: async () => {
        // Get all students - we'll filter on the frontend for those without active enrollment
        return api.get('/manager/students/');
    },
    assignToClass: async (data) => {
        // Create an enrollment: { student_id, class_room_id, academic_year_id }
        return api.post('/manager/enrollments/create/', data);
    },
    getStudentEnrollments: async (studentId, params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/manager/students/${studentId}/enrollments/${queryParams ? `?${queryParams}` : ''}`);
    },
    getStudentDocuments: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/secretary/student-documents/${queryParams ? `?${queryParams}` : ''}`);
    },
    uploadStudentDocument: async (data) => {
        return api.post('/secretary/student-documents/', data, {
            headers: data instanceof FormData
                ? { 'Content-Type': 'multipart/form-data' }
                : undefined
        });
    },

    // Grades & Classrooms
    getGrades: async (params = {}) => {
        const cacheKey = getCacheKey('grades', params);
        const cached = getCachedValue(cacheKey);
        if (cached) return cached;

        const queryParams = new URLSearchParams(params).toString();
        const data = await api.get(`/grades/${queryParams ? `?${queryParams}` : ''}`);
        setCachedValue(cacheKey, data);
        return data;
    },
    getClassrooms: async (schoolId, academicYearId, params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/school/${schoolId}/academic-year/${academicYearId}/classrooms/${queryParams ? `?${queryParams}` : ''}`);
    },
    getAcademicYears: async (params = {}) => {
        const cacheKey = getCacheKey('academic_years', params);
        const cached = getCachedValue(cacheKey);
        if (cached) return cached;

        const queryParams = new URLSearchParams(params).toString();
        const data = await api.get(`/academic-years/${queryParams ? `?${queryParams}` : ''}`);
        setCachedValue(cacheKey, data);
        return data;
    },

    // Guardians
    createGuardian: async (data) => {
        const payload = await api.post('/guardian/guardians/create/', data);
        clearCacheByPrefix('guardians');
        clearCacheByPrefix('guardian_summary');
        return payload;
    },
    deactivateGuardian: async (guardianId) => {
        const payload = await api.post(`/guardian/guardians/${guardianId}/deactivate/`);
        clearCacheByPrefix('guardians');
        clearCacheByPrefix('guardian_summary');
        return payload;
    },
    activateGuardian: async (guardianId) => {
        const payload = await api.post(`/guardian/guardians/${guardianId}/activate/`);
        clearCacheByPrefix('guardians');
        clearCacheByPrefix('guardian_summary');
        return payload;
    },
    getGuardianSummary: async ({ forceRefresh = false, signal } = {}) => {
        const cacheKey = getCacheKey('guardian_summary', {});
        const useInFlightCache = !signal;

        if (!forceRefresh) {
            const cached = getCachedValue(cacheKey);
            if (cached) {
                return cached;
            }
        }

        if (useInFlightCache) {
            const inFlight = inFlightRequests.get(cacheKey);
            if (inFlight) {
                return inFlight;
            }
        }

        const request = api.get('/guardian/guardians/summary/', {
            timeout: DEFAULT_LIST_TIMEOUT,
            ...(signal ? { signal } : {}),
        })
            .then((payload) => {
                setCachedValue(cacheKey, payload);
                return payload;
            })
            .finally(() => {
                if (useInFlightCache) {
                    inFlightRequests.delete(cacheKey);
                }
            });

        if (useInFlightCache) {
            inFlightRequests.set(cacheKey, request);
        }
        return request;
    },
    getGuardians: async (searchOrOptions = '') => {
        const options = typeof searchOrOptions === 'string'
            ? { search: searchOrOptions }
            : (searchOrOptions || {});

        const normalizedSearch = typeof options.search === 'string' ? options.search.trim() : '';
        const parsedSchoolId = Number.parseInt(options.schoolId, 10);
        const normalizedSchoolId = Number.isInteger(parsedSchoolId) && parsedSchoolId > 0
            ? parsedSchoolId
            : null;
        const includeInactive = Boolean(options.includeInactive);
        let isActive = null;

        if (typeof options.isActive === 'boolean') {
            isActive = options.isActive;
        } else if (typeof options.isActive === 'string') {
            const normalized = options.isActive.trim().toLowerCase();
            if (normalized === 'true' || normalized === '1') {
                isActive = true;
            } else if (normalized === 'false' || normalized === '0') {
                isActive = false;
            }
        }

        const parsedPage = Number.parseInt(options.page, 10);
        const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const parsedPageSize = Number.parseInt(options.pageSize, 10);
        const pageSize = Number.isInteger(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : undefined;
        const forceRefresh = Boolean(options.forceRefresh);

        const queryParams = new URLSearchParams();

        if (normalizedSearch) {
            queryParams.set('search', normalizedSearch);
        }

        if (normalizedSchoolId) {
            queryParams.set('school_id', String(normalizedSchoolId));
        }

        if (includeInactive) {
            queryParams.set('include_inactive', 'true');
        }

        if (isActive !== null) {
            queryParams.set('is_active', String(isActive));
        }

        if (page > 1) {
            queryParams.set('page', String(page));
        }

        if (pageSize) {
            queryParams.set('page_size', String(pageSize));
        }

        const cacheKey = getCacheKey('guardians', {
            search: normalizedSearch,
            school_id: normalizedSchoolId ?? '',
            include_inactive: includeInactive,
            is_active: isActive === null ? '' : String(isActive),
            page,
            page_size: pageSize ?? '',
        });

        if (!forceRefresh) {
            const cached = getCachedValue(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const queryString = queryParams.toString();
        const signal = options.signal;
        const useInFlightCache = !signal;
        // Do not reuse in-flight requests when a caller provides an AbortSignal.
        // Sharing abortable promises can propagate cancellations across remounts.
        if (useInFlightCache) {
            const inFlight = inFlightRequests.get(cacheKey);
            if (inFlight) {
                return inFlight;
            }
        }
        const endpoint = `/guardian/guardians/${queryString ? `?${queryString}` : ''}`;
        const fetchWithRetry = async () => {
            try {
                return await api.get(endpoint, {
                    timeout: DEFAULT_LIST_TIMEOUT,
                    ...(signal ? { signal } : {}),
                });
            } catch (error) {
                if (!shouldRetryListRequest(error) || signal?.aborted) {
                    throw error;
                }

                return api.get(endpoint, {
                    timeout: RETRY_LIST_TIMEOUT,
                    ...(signal ? { signal } : {}),
                });
            }
        };

        const request = fetchWithRetry()
            .then((payload) => {
                setCachedValue(cacheKey, payload);
                return payload;
            })
            .finally(() => {
                if (useInFlightCache) {
                    inFlightRequests.delete(cacheKey);
                }
            });

        if (useInFlightCache) {
            inFlightRequests.set(cacheKey, request);
        }
        return request;
    },
    getGuardianLinks: async (
        guardianId,
        { forceRefresh = false, signal, includeInactive = false } = {},
    ) => {
        const normalizedGuardianId = Number.parseInt(guardianId, 10);

        if (!Number.isInteger(normalizedGuardianId) || normalizedGuardianId <= 0) {
            return [];
        }

        const cacheKey = getCacheKey('guardian_links', {
            guardian_id: normalizedGuardianId,
            include_inactive: includeInactive ? 'true' : 'false',
        });

        if (!forceRefresh) {
            const cached = getCachedValue(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const inFlight = inFlightRequests.get(cacheKey);
        if (inFlight) {
            return inFlight;
        }

        const queryParams = new URLSearchParams();
        if (includeInactive) {
            queryParams.set('include_inactive', 'true');
        }
        const queryString = queryParams.toString();
        const endpoint = `/guardian/guardians/${normalizedGuardianId}/students/${queryString ? `?${queryString}` : ''}`;

        const request = api.get(endpoint, {
            timeout: 8000,
            ...(signal ? { signal } : {}),
        })
            .then((payload) => {
                setCachedValue(cacheKey, payload);
                return payload;
            })
            .finally(() => {
                inFlightRequests.delete(cacheKey);
            });

        inFlightRequests.set(cacheKey, request);
        return request;
    },
    linkGuardianToStudent: async (guardianId, studentId, data) => {
        const normalizedGuardianId = Number.parseInt(guardianId, 10);
        const normalizedStudentId = Number.parseInt(studentId, 10);

        if (!Number.isInteger(normalizedGuardianId) || normalizedGuardianId <= 0) {
            throw new Error('Invalid guardian identifier.');
        }
        if (!Number.isInteger(normalizedStudentId) || normalizedStudentId <= 0) {
            throw new Error('Invalid student identifier.');
        }

        const payload = await api.post(`/guardian/guardians/${normalizedGuardianId}/students/`, {
            student_id: normalizedStudentId,
            relationship_type: data.relationship_type,
            is_primary: Boolean(data.is_primary),
            can_pickup: data.can_pickup !== undefined ? Boolean(data.can_pickup) : true,
        });
        clearCacheByPrefix('guardians');
        if (Number.isInteger(normalizedGuardianId) && normalizedGuardianId > 0) {
            clearCacheByPrefix('guardian_links');
        }
        return payload;
    },
    deactivateGuardianLink: async (linkId) => {
        const payload = await api.post(`/guardian/guardian-links/${linkId}/deactivate/`);
        clearCacheByPrefix('guardian_links');
        clearCacheByPrefix('guardians');
        return payload;
    },
    activateGuardianLink: async (linkId) => {
        const payload = await api.post(`/guardian/guardian-links/${linkId}/activate/`);
        clearCacheByPrefix('guardian_links');
        clearCacheByPrefix('guardians');
        return payload;
    },

    // Attendance (view only for secretary - recording is teacher-only)
    getAttendance: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/teacher/attendance/${queryParams ? `?${queryParams}` : ''}`);
    },
    getAllAttendance: async (params = {}) => {
        const allAttendance = [];
        let page = 1;

        while (page !== null) {
            const queryParams = new URLSearchParams({
                ...params,
                page_size: '100',
                page: String(page),
            }).toString();
            const payload = await api.get(`/teacher/attendance/${queryParams ? `?${queryParams}` : ''}`);

            if (Array.isArray(payload?.results)) {
                allAttendance.push(...payload.results);
                page = resolveNextPage(payload.next);
                continue;
            }

            if (Array.isArray(payload)) {
                allAttendance.push(...payload);
            }

            break;
        }

        return allAttendance;
    },

    // Communication
    getMessages: async () => {
        return api.get('/user-messages/');
    },
    getMessageThread: async (threadId) => {
        return api.get(`/user-messages/threads/${threadId}/`);
    },
    getNotifications: async () => {
        return api.get('/notifications/');
    },
    markNotificationRead: async (id) => {
        return api.post(`/notifications/${id}/mark-read/`);
    },
    sendMessage: async (data) => {
        return api.post('/user-messages/', data);
    },
    searchMessageRecipients: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/user-messages/search/${queryParams ? `?${queryParams}` : ''}`);
    },
    markMessageRead: async (messageId) => {
        return api.post(`/user-messages/${messageId}/read/`);
    }
};

export default secretaryService;
