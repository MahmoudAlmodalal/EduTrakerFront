import { api } from '../utils/api';

const buildQueryString = (filters = {}) => {
    const sanitized = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    return new URLSearchParams(sanitized).toString();
};

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
    getSchedule: async (date = new Date().toISOString().split('T')[0]) => {
        return api.get(`/teacher/schedule/?date=${date}`);
    },

    getCourseAllocations: async () => {
        // Use schedule endpoint to get active allocations
        const date = new Date().toISOString().split('T')[0];
        return api.get(`/teacher/schedule/?date=${date}`);
    },

    getStudents: async (filters = {}) => {
        // Teacher specific student list logic if needed,
        // otherwise rely on class-filtered lists
        const queryParams = buildQueryString(filters);
        // Teachers are StaffUsers, so they can access /manager/students/
        return api.get(`/manager/students/?${queryParams}`);
    },

    // Assignments
    getAssignments: async (filters = {}) => {
        const queryParams = buildQueryString(filters);
        return api.get(`/teacher/assignments/?${queryParams}`);
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

    // Attendance
    getAttendance: async (filters = {}) => {
        const queryParams = buildQueryString(filters);
        return api.get(`/teacher/attendance/?${queryParams}`);
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
        const queryParams = buildQueryString(filters);
        return api.get(`/teacher/marks/?${queryParams}`);
    },
    recordMark: async (data) => {
        return api.post('/teacher/marks/record/', data);
    },
    bulkImportMarks: async (data) => {
        // Since api.post uses JSON.stringify, we might need a custom approach for multipart/form-data
        // But for now, let's assume the API utility can handle or we'll adjust it if needed.
        // However, standard fetch with FormData shouldn't have Content-Type set manually.
        const formData = new FormData();
        formData.append('assignment_id', data.assignment_id);
        formData.append('file', data.file);

        const token = localStorage.getItem('accessToken');
        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${BASE_URL}/teacher/marks/bulk-import/`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: data, // FormData passed in
        });

        if (response.status === 204) return null;
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || result.message || 'Something went wrong');
        return result;
    },

    // Lesson Plans
    getLessonPlans: async (filters = {}) => {
        const queryParams = buildQueryString(filters);
        return api.get(`/teacher/lesson-plans/?${queryParams}`);
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
        const queryParams = buildQueryString(filters);
        return api.get(`/teacher/learning-materials/?${queryParams}`);
    },
    createLearningMaterial: async (data) => {
        return api.post('/teacher/learning-materials/', data);
    },
    deleteLearningMaterial: async (id) => {
        return api.delete(`/teacher/learning-materials/${id}/`);
    },

    // Analytics
    getKnowledgeGaps: async (allocationId, threshold = 50.0) => {
        return api.get(`/teacher/analytics/knowledge-gaps/?course_allocation_id=${allocationId}&threshold=${threshold}`);
    }
};

export default teacherService;
