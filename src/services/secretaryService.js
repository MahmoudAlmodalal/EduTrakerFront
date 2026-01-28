import { api } from '../utils/api';

const secretaryService = {
    // Dashboard Stats
    getDashboardStats: async () => {
        return api.get('/statistics/dashboard/');
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
        return api.get(`/manager/enrollments/?${queryParams}`);
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
    getUnassignedStudents: async () => {
        return api.get('/manager/students/?assigned_to_class=false');
    },
    assignToClass: async (studentId, classId) => {
        return api.patch(`/manager/students/${studentId}/`, { class_room_id: classId });
    },

    // Guardians
    getGuardians: async (search = '') => {
        return api.get(`/guardian/guardians/?search=${search}`);
    },
    linkGuardianToStudent: async (guardianId, studentId, data) => {
        return api.post(`/guardian/guardians/${guardianId}/students/`, {
            student_id: studentId,
            relationship: data.relationship,
            access_level: data.access_level
        });
    },

    // Attendance
    getAttendance: async (date, classId) => {
        return api.get(`/teacher/attendance/?date=${date}&class_room_id=${classId}`);
    },
    recordAttendance: async (data) => {
        return api.post('/teacher/attendance/record/', data);
    },

    // Communication
    getMessages: async () => {
        return api.get('/user-messages/');
    },
    getNotifications: async () => {
        return api.get('/notifications/');
    },
    markNotificationRead: async (id) => {
        return api.post(`/notifications/${id}/mark-read/`);
    },
    sendMessage: async (data) => {
        return api.post('/user-messages/', data);
    }
};

export default secretaryService;
