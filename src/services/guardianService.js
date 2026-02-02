import { api } from '../utils/api';

const guardianService = {
    // Get dashboard statistics
    getDashboardStats: async () => {
        return api.get('/reports/statistics/dashboard/');
    },

    // Get linked students
    getLinkedStudents: async (guardianId) => {
        return api.get(`/guardian/guardians/${guardianId}/students/`);
    },

    // Get student attendance
    getAttendance: async (studentId) => {
        return api.get(`/teacher/attendance/?student_id=${studentId}`);
    },

    // Get marks/results
    getMarks: async (studentId) => {
        return api.get(`/teacher/marks/?student_id=${studentId}`);
    },

    // Get messages
    getMessages: async () => {
        return api.get('/user-messages/');
    },

    // Get notifications
    getNotifications: async () => {
        return api.get('/notifications/');
    },

    // Get guardian profile
    getProfile: async (guardianId) => {
        return api.get(`/guardian/guardians/${guardianId}/`);
    },

    // Update guardian profile
    updateProfile: async (guardianId, data) => {
        return api.patch(`/guardian/guardians/${guardianId}/`, data);
    }
};

export default guardianService;
