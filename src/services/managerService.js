import { api } from '../utils/api';

/**
 * Service for School Manager specialized administrative actions
 */
const managerService = {
    // Staff Evaluation
    getStaffEvaluations: async () => {
        return api.get('/manager/staff-evaluations/');
    },

    createStaffEvaluation: async (data) => {
        return api.post('/manager/staff-evaluations/create/', data);
    },

    getStaffEvaluationDetail: async (id) => {
        return api.get(`/manager/staff-evaluations/${id}/`);
    },

    // Secretary Management
    getSecretaries: async () => {
        return api.get('/secretary/');
    },

    createSecretary: async (data) => {
        return api.post('/secretary/create/', data);
    },

    getSecretaryDetail: async (id) => {
        return api.get(`/secretary/${id}/`);
    },

    updateSecretary: async (id, data) => {
        return api.patch(`/secretary/${id}/`, data);
    },

    deactivateSecretary: async (id) => {
        return api.post(`/secretary/${id}/deactivate/`);
    },

    // Teacher Management (Proxy to teacher service functionalities needed by manager)
    getTeachers: async () => {
        return api.get('/teacher/teachers/');
    },

    updateTeacher: async (id, data) => {
        return api.patch(`/teacher/teachers/${id}/`, data);
    },

    deactivateTeacher: async (id) => {
        return api.post(`/teacher/teachers/${id}/deactivate/`);
    },

    // Academic Management (Grades, Courses, etc.)
    getGrades: async () => {
        return api.get('/grades/');
    },

    createGrade: async (data) => {
        return api.post('/grades/create/', data);
    },

    updateGrade: async (id, data) => {
        return api.patch(`/grades/${id}/`, data);
    },

    deactivateGrade: async (id) => {
        return api.post(`/grades/${id}/deactivate/`);
    },

    getCourses: async (schoolId) => {
        return api.get(`/school/${schoolId}/courses/`);
    },

    createCourse: async (schoolId, data) => {
        return api.post(`/school/${schoolId}/courses/create/`, data);
    },

    deactivateCourse: async (schoolId, id) => {
        return api.post(`/school/${schoolId}/courses/${id}/deactivate/`);
    },

    assignTeacherToCourse: async (schoolId, courseId, teacherId) => {
        return api.post(`/school/${schoolId}/courses/${courseId}/assign-teacher/`, { teacher_id: teacherId });
    },

    // Dashboards & Reports
    getDashboardStats: async () => {
        return api.get('/statistics/dashboard/');
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
    },

    markMessageRead: async (messageId) => {
        return api.post(`/user-messages/${messageId}/read/`);
    }
};

export default managerService;
