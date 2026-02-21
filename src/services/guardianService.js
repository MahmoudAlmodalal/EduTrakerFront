import { api } from '../utils/api';

const requestWithContext = async (request, context) => {
    try {
        return await request();
    } catch (error) {
        const contextualError = new Error(error.message || `Failed to ${context}`);
        contextualError.response = error.response;
        contextualError.status = error.status;
        contextualError.data = error.data;
        throw contextualError;
    }
};

const extractPagedItems = (payload) => {
    if (Array.isArray(payload)) {
        return { items: payload, next: null, paginated: false };
    }

    if (Array.isArray(payload?.results)) {
        return { items: payload.results, next: payload.next || null, paginated: true };
    }

    return { items: [], next: null, paginated: false };
};

const fetchAllPages = async (endpoint, config = {}) => {
    let nextEndpoint = endpoint;
    const allItems = [];
    let pageCount = 0;
    const visitedEndpoints = new Set();

    while (nextEndpoint) {
        if (visitedEndpoints.has(nextEndpoint)) {
            break;
        }
        visitedEndpoints.add(nextEndpoint);

        // Guard against accidental infinite loops if backend returns invalid next URLs.
        if (pageCount > 50) {
            break;
        }
        pageCount += 1;

        const payload = await api.get(nextEndpoint, config);
        const { items, next, paginated } = extractPagedItems(payload);

        if (!paginated) {
            return Array.isArray(payload) ? payload : items;
        }

        allItems.push(...items);
        nextEndpoint = next;
    }

    return allItems;
};

const guardianService = {
    // Get dashboard statistics
    getDashboardStats: async (config = {}) => {
        return requestWithContext(
            () => api.get('/statistics/dashboard/', config),
            'load dashboard statistics'
        );
    },

    // Get linked students
    getLinkedStudents: async (guardianId, config = {}) => {
        return requestWithContext(
            () => api.get(`/guardian/guardians/${guardianId}/students/`, config),
            'load linked students'
        );
    },

    // Get guardian school info
    getSchoolInfo: async (guardianId, config = {}) => {
        return requestWithContext(
            () => api.get(`/guardian/guardians/${guardianId}/school-info/`, config),
            'load school info'
        );
    },

    // Get student attendance
    getStudentAttendance: async (studentId, config = {}) => {
        return requestWithContext(
            () => api.get(`/teacher/attendance/?student_id=${studentId}`, config),
            'load attendance'
        );
    },

    // Get marks/results
    getStudentMarks: async (studentId, config = {}) => {
        return requestWithContext(
            () => fetchAllPages(`/teacher/marks/?student_id=${studentId}`, config),
            'load marks'
        );
    },

    // Get published assessments visible to the selected student
    getStudentAssessments: async (studentId, config = {}) => {
        return requestWithContext(
            () => fetchAllPages(`/teacher/assignments/?student_id=${studentId}&ordering=-due_date`, config),
            'load published assessments'
        );
    },

    // Get student behavior notes
    getStudentBehavior: async (studentId, config = {}) => {
        return requestWithContext(
            () => fetchAllPages(`/teacher/behavior/?student_id=${studentId}&page_size=100`, config),
            'load behavior notes'
        );
    },

    // Backward compatibility aliases
    getAttendance: async (studentId, config = {}) => {
        return guardianService.getStudentAttendance(studentId, config);
    },

    getMarks: async (studentId, config = {}) => {
        return guardianService.getStudentMarks(studentId, config);
    },

    // Get messages
    getMessages: async (config = {}) => {
        return requestWithContext(
            () => api.get('/user-messages/', config),
            'load messages'
        );
    },

    // Get notifications
    getNotifications: async (config = {}) => {
        return requestWithContext(
            () => api.get('/notifications/', config),
            'load notifications'
        );
    },

    // Get guardian profile
    getProfile: async (guardianId, config = {}) => {
        return requestWithContext(
            () => api.get(`/guardian/guardians/${guardianId}/`, config),
            'load profile'
        );
    },

    // Update guardian profile
    updateProfile: async (guardianId, data, config = {}) => {
        return requestWithContext(
            () => api.patch(`/guardian/guardians/${guardianId}/`, data, config),
            'update profile'
        );
    }
};

export default guardianService;
