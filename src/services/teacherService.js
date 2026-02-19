import { api, apiClient } from '../utils/api';
import { todayIsoDate } from '../utils/helpers';

const sanitizeParams = (filters = {}) => Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const todayDate = () => todayIsoDate();

const teacherService = {
    // Teacher Profile/Settings
    getProfile: async (id) => {
        return api.get(`/teacher/teachers/${id}/`);
    },
    getSchoolContext: async () => {
        return api.get('/teacher/profile/context/');
    },

    // Dashboard Stats
    getDashboardStats: async () => {
        return api.get('/statistics/dashboard/');
    },
    updateProfile: async (id, data) => {
        return api.patch(`/teacher/teachers/${id}/`, data);
    },

    // Schedule (ClassSchedule entries – day_of_week + real times)
    getSchedule: async (date = todayDate()) => {
        try {
            return await api.get('/teacher/schedule/', { params: { date } });
        } catch (error) {
            // Backward compatibility: some environments may not expose schedule endpoint yet.
            if ([403, 404, 405].includes(error?.status)) {
                return [];
            }
            throw error;
        }
    },
    createScheduleSlot: async (data) => {
        return api.post('/teacher/schedule/', data);
    },
    deleteScheduleSlot: async (id) => {
        return api.delete(`/teacher/schedule/${id}/`);
    },

    // All course allocations for this teacher (no date/day filter)
    getCourseAllocations: async () => {
        return api.get('/teacher/allocations/');
    },

    getStudents: async (filters = {}) => {
        return api.get('/manager/students/', { params: sanitizeParams(filters) });
    },

    // Assignments
    getAssignments: async (filters = {}) => {
        return api.get('/teacher/assignments/', { params: sanitizeParams(filters) });
    },
    createAssignment: async (data) => {
        return api.post('/teacher/assignments/', data, {
            headers: data instanceof FormData
                ? { 'Content-Type': 'multipart/form-data' }
                : undefined
        });
    },
    getAssignmentDetail: async (id) => {
        return api.get(`/teacher/assignments/${id}/`);
    },
    updateAssignment: async (id, data) => {
        return api.patch(`/teacher/assignments/${id}/`, data, {
            headers: data instanceof FormData
                ? { 'Content-Type': 'multipart/form-data' }
                : undefined
        });
    },
    deleteAssignment: async (id) => {
        return api.post(`/teacher/assignments/${id}/deactivate/`);
    },
    activateAssignment: async (id) => {
        return api.post(`/teacher/assignments/${id}/activate/`);
    },
    getAssignmentSubmissions: async (id) => {
        return api.get(`/teacher/assignments/${id}/submissions/`);
    },
    gradeAssignmentSubmission: async (assignmentId, submissionId, data) => {
        return api.post(`/teacher/assignments/${assignmentId}/submissions/${submissionId}/grade/`, data);
    },
    publishAssignmentGrades: async (assignmentId, is_grades_published) => {
        return api.patch(`/teacher/assignments/${assignmentId}/publish-grades/`, { is_grades_published });
    },
    getTeacherGrades: async () => {
        return api.get('/teacher/grades/');
    },
    bulkCreateAssignmentByGrade: async (data) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value);
            }
        });
        return api.post('/teacher/assignments/bulk-by-grade/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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
        const isFormData = data instanceof FormData;
        return api.post('/teacher/learning-materials/', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
    },
    updateLearningMaterial: async (id, data) => {
        const isFormData = data instanceof FormData;
        return api.patch(`/teacher/learning-materials/${id}/`, data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
    },
    publishLearningMaterial: async (id) => {
        return api.post(`/teacher/learning-materials/${id}/publish/`);
    },
    unpublishLearningMaterial: async (id) => {
        return api.delete(`/teacher/learning-materials/${id}/publish/`);
    },
    deleteLearningMaterial: async (id) => {
        return api.delete(`/teacher/learning-materials/${id}/`);
    },
    downloadMaterial: async (material) => {
        const blob = await apiClient.get(
            `/teacher/learning-materials/${material.id}/download/`,
            { responseType: 'blob' }
        );
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;

        const rawType = material?.file_type || '';
        const normalizedType = rawType.includes('/') ? rawType.split('/').pop() : rawType;
        const extension = normalizedType ? `.${normalizedType.replace(/^\./, '')}` : '';
        const title = (material?.title || 'material').trim();
        anchor.download = title.endsWith(extension) || !extension ? title : `${title}${extension}`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
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
    searchUsers: async ({ query, category = 'all' } = {}) => {
        return api.get('/user-messages/search/', {
            params: sanitizeParams({ search: query, category })
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
    },

    // Gradebook
    getGradebook: async (allocationIds) => {
        return api.get('/teacher/gradebook/', {
            params: { course_allocation_ids: allocationIds.join(',') }
        });
    },

    // Homeroom
    getHomeroomAttendanceSummary: async (date) => {
        return api.get('/teacher/homeroom/attendance-summary/', {
            params: sanitizeParams({ date })
        });
    }
};

export default teacherService;
