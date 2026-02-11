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

    // Get student attendance
    getAttendance: async (studentId, config = {}) => {
        return requestWithContext(
            () => api.get(`/teacher/attendance/?student_id=${studentId}`, config),
            'load attendance'
        );
    },

    // Get marks/results
    getMarks: async (studentId, config = {}) => {
        return requestWithContext(
            () => api.get(`/teacher/marks/?student_id=${studentId}`, config),
            'load marks'
        );
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
