import { api, apiClient } from '../utils/api';

const sanitizeParams = (filters = {}) => Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const studentService = {
    // Get dashboard statistics
    getDashboardStats: async () => {
        try {
            return await api.get('/statistics/dashboard/');
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },

    // Map subjects from existing dashboard payload (no extra API call)
    getSubjects: (dashboardPayload = {}) => {
        const stats = dashboardPayload?.statistics || dashboardPayload;
        const coursesData = stats?.courses?.courses || [];

        return coursesData.map((course) => ({
            course_allocation_id: course.course_allocation_id,
            id: course.course_id,
            classroom_id: course.classroom_id,
            name: course.course_name,
            teacher: course.teacher_name,
            grade: course.grade_name || 'N/A',
            courseCode: course.course_code,
            classroom: course.classroom_name
        }));
    },

    // Get student profile
    getProfile: async (studentId) => {
        return api.get(`/manager/students/${studentId}/`);
    },

    updateProfile: async (studentId, data) => {
        return api.patch(`/manager/students/${studentId}/`, data);
    },

    // Get attendance history
    getAttendance: async (studentId = null, config = {}) => {
        const params = new URLSearchParams();
        if (studentId !== null && studentId !== undefined && studentId !== '') {
            params.set('student_id', studentId);
        }

        const query = params.toString();
        const endpoint = query ? `/teacher/attendance/?${query}` : '/teacher/attendance/';
        return api.get(endpoint, config);
    },

    // Get student schedule
    getSchedule: async (studentId, filters = {}) => {
        return api.get(`/student/students/${studentId}/schedule/`, { params: sanitizeParams(filters) });
    },

    // Get assignments
    getAssignments: async (filters = {}) => {
        return api.get('/student/assignments/', { params: sanitizeParams(filters) });
    },
    getAssignmentDetail: async (assignmentId) => {
        return api.get(`/student/assignments/${assignmentId}/`);
    },
    submitAssignment: async (assignmentId, file) => {
        const formData = new FormData();
        formData.append('submission_file', file);
        return api.post(`/student/assignments/${assignmentId}/submit/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    getAssignmentSubmission: async (assignmentId) => {
        return api.get(`/student/assignments/${assignmentId}/submission/`);
    },

    // Get marks/results
    getMarks: async (studentId) => {
        return api.get(`/teacher/marks/?student_id=${studentId}`);
    },

    // Get learning materials
    getLearningMaterials: async (filters = {}) => {
        return api.get('/teacher/learning-materials/', { params: sanitizeParams(filters) });
    },
    getLessonPlans: async (filters = {}) => {
        return api.get('/teacher/lesson-plans/', { params: sanitizeParams(filters) });
    },
    getTeacherInfo: async (allocationId) => {
        return api.get(`/teacher/allocations/${allocationId}/`);
    },
    downloadMaterial: async (material) => {
        const blob = await apiClient.get(
            `/teacher/learning-materials/${material.id}/download/`,
            { responseType: 'blob' }
        );

        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        const title = (material?.title || 'material').trim();
        const rawType = material?.file_type || '';
        const normalizedType = rawType.includes('/') ? rawType.split('/').pop() : rawType;
        const extension = normalizedType ? `.${normalizedType.replace(/^\./, '')}` : '';
        anchor.download = title.endsWith(extension) || !extension ? title : `${title}${extension}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
    },

    // Messages
    getMessages: async () => {
        return api.get('/user-messages/');
    },

    sendMessage: async (data) => {
        return api.post('/user-messages/', data);
    },

    getMessageThread: async (threadId) => {
        return api.get(`/user-messages/threads/${threadId}/`);
    },

    markMessageRead: async (messageId) => {
        return api.post(`/user-messages/${messageId}/read/`);
    },

    // Notifications
    getNotifications: async (params = {}) => {
        return api.get('/notifications/', { params });
    },

    getUnreadCount: async () => {
        return api.get('/notifications/unread-count/');
    },

    getUnreadNotificationCount: async () => {
        return api.get('/notifications/unread-count/');
    },

    markNotificationRead: async (id) => {
        return api.post(`/notifications/${id}/mark-read/`);
    },

    markAllNotificationsRead: async () => {
        return api.post('/notifications/mark-all-read/');
    }
};

export default studentService;
