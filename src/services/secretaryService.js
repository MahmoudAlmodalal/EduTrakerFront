import { api } from '../utils/api';

const secretaryService = {
    // Dashboard Stats
    getDashboardStats: async () => {
        return api.get('/statistics/dashboard/');
    },

    getPendingTasks: async () => {
        return api.get('/secretary/tasks/pending/');
    },

    getUpcomingEvents: async () => {
        return api.get('/secretary/events/upcoming/');
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
        return api.get(`/manager/enrollments/${queryParams ? `?${queryParams}` : ''}`);
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
    getStudents: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/manager/students/${queryParams ? `?${queryParams}` : ''}`);
    },
    updateStudent: async (id, data) => {
        return api.patch(`/manager/students/${id}/`, data);
    },
    getUnassignedStudents: async () => {
        // Get all students - we'll filter on the frontend for those without active enrollment
        return api.get('/manager/students/');
    },
    assignToClass: async (data) => {
        // Create an enrollment: { student_id, class_room_id, academic_year_id }
        return api.post('/manager/enrollments/create/', data);
    },

    // Grades & Classrooms
    getGrades: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/grades/${queryParams ? `?${queryParams}` : ''}`);
    },
    getClassrooms: async (schoolId, academicYearId, params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/school/${schoolId}/academic-year/${academicYearId}/classrooms/${queryParams ? `?${queryParams}` : ''}`);
    },
    getAcademicYears: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/academic-years/${queryParams ? `?${queryParams}` : ''}`);
    },

    // Guardians
    createGuardian: async (data) => {
        return api.post('/guardian/guardians/create/', data);
    },
    getGuardians: async (search = '') => {
        return api.get(`/guardian/guardians/?search=${search}`);
    },
    getGuardianLinks: async (guardianId) => {
        return api.get(`/guardian/guardians/${guardianId}/students/`);
    },
    linkGuardianToStudent: async (guardianId, studentId, data) => {
        return api.post(`/guardian/guardians/${guardianId}/students/`, {
            student_id: parseInt(studentId),
            relationship_type: data.relationship_type,
            is_primary: data.is_primary || false,
            can_pickup: data.can_pickup !== undefined ? data.can_pickup : true,
        });
    },

    // Attendance (view only for secretary - recording is teacher-only)
    getAttendance: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/teacher/attendance/${queryParams ? `?${queryParams}` : ''}`);
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

export default secretaryService;
