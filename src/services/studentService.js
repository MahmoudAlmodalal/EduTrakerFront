import { api } from '../utils/api';

const studentService = {
    // Get dashboard statistics
    getDashboardStats: async () => {
        return api.get('/statistics/dashboard/');
    },

    // Get student profile
    getProfile: async (studentId) => {
        return api.get(`/manager/students/${studentId}/`);
    },

    updateProfile: async (studentId, data) => {
        return api.patch(`/manager/students/${studentId}/`, data);
    },

    // Get attendance history
    getAttendance: async (studentId) => {
        return api.get(`/student/attendance/?student_id=${studentId}`);
    },

    // Get assignments
    getAssignments: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        return api.get(`/teacher/assignments/?${queryParams}`);
    },

    // Get marks/results
    getMarks: async (studentId) => {
        return api.get(`/student/marks/?student_id=${studentId}`);
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
