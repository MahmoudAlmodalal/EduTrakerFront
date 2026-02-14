import { api } from '../utils/api';

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
    getSchedule: async (studentId) => {
        return api.get(`/manager/students/${studentId}/schedule/`);
    },

    // Get assignments
    getAssignments: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return api.get(`/teacher/assignments/?${queryParams}`);
    },

    // Get marks/results
    getMarks: async (studentId) => {
        return api.get(`/teacher/marks/?student_id=${studentId}`);
    },

    // Get learning materials
    getLearningMaterials: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return api.get(`/teacher/learning-materials/?${queryParams}`);
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
    }
};

export default studentService;
