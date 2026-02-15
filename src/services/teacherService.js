import { api } from '../utils/api';

const sanitizeParams = (filters = {}) => Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const todayDate = () => new Date().toISOString().split('T')[0];

const teacherService = {
    // Teacher Profile/Settings
    getProfile: async (id) => {
        return api.get(`/teacher/teachers/${id}/`);
    },

    // Dashboard Stats
    getDashboardStats: async () => {
        return api.get('/statistics/dashboard/');
    },
    updateProfile: async (id, data) => {
        return api.patch(`/teacher/teachers/${id}/`, data);
    },

    // Course Allocations / Classes
    getSchedule: async (date = todayDate()) => {
        return api.get('/teacher/schedule/', { params: { date } });
    },

    getCourseAllocations: async (date = todayDate()) => {
        return teacherService.getSchedule(date);
    },

    getStudents: async (filters = {}) => {
        return api.get('/manager/students/', { params: sanitizeParams(filters) });
    },

    // Assignments
    getAssignments: async (filters = {}) => {
        return api.get('/teacher/assignments/', { params: sanitizeParams(filters) });
    },
    createAssignment: async (data) => {
        return api.post('/teacher/assignments/', data);
    },
    getAssignmentDetail: async (id) => {
        return api.get(`/teacher/assignments/${id}/`);
    },
    updateAssignment: async (id, data) => {
        return api.patch(`/teacher/assignments/${id}/`, data);
    },
    deleteAssignment: async (id) => {
        return api.post(`/teacher/assignments/${id}/deactivate/`);
    },
    activateAssignment: async (id) => {
        return api.post(`/teacher/assignments/${id}/activate/`);
    },

    // Attendance
    getAttendance: async (filters = {}) => {
        return api.get('/teacher/attendance/', { params: sanitizeParams(filters) });
    },
    recordBulkAttendance: async (records = []) => {
        if (!Array.isArray(records) || records.length === 0) {
            return [];
        }

        try {
            return await api.post('/teacher/attendance/bulk-record/', { records });
        } catch (error) {
            // Fallback for environments that do not expose bulk endpoint yet.
            if ([404, 405].includes(error?.status)) {
                return Promise.all(records.map((record) => teacherService.recordAttendance(record)));
            }
            throw error;
        }
    },
    recordAttendance: async (data) => {
        return api.post('/teacher/attendance/record/', data);
    },

    // Marks / Grading
    getMarks: async (filters = {}) => {
        return api.get('/teacher/marks/', { params: sanitizeParams(filters) });
    },
    recordMark: async (data) => {
        return api.post('/teacher/marks/record/', data);
    },
    bulkImportMarks: async ({ assignment_id, file }) => {
        const formData = new FormData();
        formData.append('assignment_id', assignment_id);
        formData.append('file', file);
        return api.post('/teacher/marks/bulk-import/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Lesson Plans
    getLessonPlans: async (filters = {}) => {
        return api.get('/teacher/lesson-plans/', { params: sanitizeParams(filters) });
    },
    createLessonPlan: async (data) => {
        return api.post('/teacher/lesson-plans/', data);
    },
    getLessonPlanDetail: async (id) => {
        return api.get(`/teacher/lesson-plans/${id}/`);
    },
    updateLessonPlan: async (id, data) => {
        return api.patch(`/teacher/lesson-plans/${id}/`, data);
    },
    deleteLessonPlan: async (id) => {
        return api.delete(`/teacher/lesson-plans/${id}/`);
    },

    // Learning Materials
    getLearningMaterials: async (filters = {}) => {
        return api.get('/teacher/learning-materials/', { params: sanitizeParams(filters) });
    },
    createLearningMaterial: async (data) => {
        return api.post('/teacher/learning-materials/', data, {
            headers: data instanceof FormData
                ? { 'Content-Type': 'multipart/form-data' }
                : undefined
        });
    },
    deleteLearningMaterial: async (id) => {
        return api.delete(`/teacher/learning-materials/${id}/`);
    },

    // Communication
    sendMessage: async (data) => {
        return api.post('/user-messages/', data);
    },
    getMessages: async (params = {}) => {
        return api.get('/user-messages/', { params: sanitizeParams(params) });
    },
    getThread: async (threadId) => {
        return api.get(`/user-messages/threads/${threadId}/`);
    },
    markMessageRead: async (messageId) => {
        try {
            return await api.post(`/user-messages/${messageId}/read/`);
        } catch (error) {
            if ([404, 405].includes(error?.status)) {
                return api.get(`/user-messages/${messageId}/read/`);
            }
            throw error;
        }
    },
    searchUsers: async (search) => {
        return api.get('/user-messages/search/', {
            params: sanitizeParams({ search, q: search })
        });
    },

    // Analytics
    getKnowledgeGaps: async (allocationId, threshold = 50.0) => {
        return api.get('/teacher/analytics/knowledge-gaps/', {
            params: sanitizeParams({
                course_allocation_id: allocationId,
                threshold
            })
        });
    }
};

export default teacherService;
