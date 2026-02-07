import { api } from '../utils/api';

/**
 * Service for School Manager specialized administrative actions.
 * All endpoints match the Django REST backend URL structure.
 * Standardized response handling: unwraps res.data consistently.
 */
const managerService = {
    // ============================================
    // Dashboard & Statistics
    // Backend: GET /api/statistics/dashboard/
    // ============================================
    getDashboardStats: async () => {
        const res = await api.get('/statistics/dashboard/');
        return res.data !== undefined ? res.data : res;
    },

    // Backend: GET /api/school-performance/?period=monthly
    getSchoolPerformance: async (period = 'monthly') => {
        const res = await api.get('/school-performance/', { params: { period } });
        return res.data !== undefined ? res.data : res;
    },

    // Backend: GET /api/notifications/alerts/
    getAlerts: async () => {
        const res = await api.get('/notifications/alerts/');
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Secretary Management
    // Backend: /api/secretary/
    // ============================================
    getSecretaries: async (params = {}) => {
        const res = await api.get('/secretary/', { params });
        return res.data !== undefined ? res.data : res;
    },

    createSecretary: async (data) => {
        const res = await api.post('/secretary/create/', data);
        return res.data !== undefined ? res.data : res;
    },

    getSecretaryDetail: async (id) => {
        const res = await api.get(`/secretary/${id}/`);
        return res.data !== undefined ? res.data : res;
    },

    updateSecretary: async (id, data) => {
        const res = await api.patch(`/secretary/${id}/`, data);
        return res.data !== undefined ? res.data : res;
    },

    deactivateSecretary: async (id) => {
        const res = await api.post(`/secretary/${id}/deactivate/`);
        return res.data !== undefined ? res.data : res;
    },

    activateSecretary: async (id) => {
        const res = await api.post(`/secretary/${id}/activate/`);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Teacher Management
    // Backend: /api/teacher/teachers/
    // ============================================
    getTeachers: async (params = {}) => {
        const res = await api.get('/teacher/teachers/', { params });
        return res.data !== undefined ? res.data : res;
    },

    createTeacher: async (data) => {
        const res = await api.post('/teacher/teachers/create/', data);
        return res.data !== undefined ? res.data : res;
    },

    getTeacherDetail: async (id) => {
        const res = await api.get(`/teacher/teachers/${id}/`);
        return res.data !== undefined ? res.data : res;
    },

    updateTeacher: async (id, data) => {
        const res = await api.patch(`/teacher/teachers/${id}/`, data);
        return res.data !== undefined ? res.data : res;
    },

    deactivateTeacher: async (id) => {
        const res = await api.post(`/teacher/teachers/${id}/deactivate/`);
        return res.data !== undefined ? res.data : res;
    },

    activateTeacher: async (id) => {
        const res = await api.post(`/teacher/teachers/${id}/activate/`);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Grade Management
    // Backend: /api/grades/
    // ============================================
    getGrades: async (params = {}) => {
        const res = await api.get('/grades/', { params });
        return res.data !== undefined ? res.data : res;
    },

    createGrade: async (data) => {
        const res = await api.post('/grades/create/', data);
        return res.data !== undefined ? res.data : res;
    },

    updateGrade: async (id, data) => {
        const res = await api.patch(`/grades/${id}/`, data);
        return res.data !== undefined ? res.data : res;
    },

    deactivateGrade: async (id) => {
        const res = await api.post(`/grades/${id}/deactivate/`);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Course Management (scoped to school)
    // Backend: /api/school/<schoolId>/courses/
    // ============================================
    getCourses: async (schoolId, params = {}) => {
        const res = await api.get(`/school/${schoolId}/courses/`, { params });
        return res.data !== undefined ? res.data : res;
    },

    createCourse: async (schoolId, data) => {
        const res = await api.post(`/school/${schoolId}/courses/create/`, data);
        return res.data !== undefined ? res.data : res;
    },

    updateCourse: async (schoolId, courseId, data) => {
        const res = await api.patch(`/school/${schoolId}/courses/${courseId}/`, data);
        return res.data !== undefined ? res.data : res;
    },

    deactivateCourse: async (schoolId, courseId) => {
        const res = await api.post(`/school/${schoolId}/courses/${courseId}/deactivate/`);
        return res.data !== undefined ? res.data : res;
    },

    // Backend: POST /api/school/<schoolId>/courses/<courseId>/assign-teacher/
    // Body: { teacher_id: <integer> }
    assignTeacherToCourse: async (schoolId, courseId, teacherId) => {
        const res = await api.post(`/school/${schoolId}/courses/${courseId}/assign-teacher/`, {
            teacher_id: parseInt(teacherId)
        });
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Classroom Management
    // Backend: /api/school/<schoolId>/academic-year/<academicYearId>/classrooms/
    // ============================================
    getClassrooms: async (schoolId, academicYearId, params = {}) => {
        const res = await api.get(`/school/${schoolId}/academic-year/${academicYearId}/classrooms/`, { params });
        return res.data !== undefined ? res.data : res;
    },

    createClassroom: async (schoolId, academicYearId, data) => {
        const res = await api.post(`/school/${schoolId}/academic-year/${academicYearId}/classrooms/create/`, data);
        return res.data !== undefined ? res.data : res;
    },

    updateClassroom: async (schoolId, academicYearId, classroomId, data) => {
        const res = await api.patch(`/school/${schoolId}/academic-year/${academicYearId}/classrooms/${classroomId}/`, data);
        return res.data !== undefined ? res.data : res;
    },

    deactivateClassroom: async (schoolId, academicYearId, classroomId) => {
        const res = await api.post(`/school/${schoolId}/academic-year/${academicYearId}/classrooms/${classroomId}/deactivate/`);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Department Management
    // Backend: /api/school/<schoolId>/departments/
    // ============================================
    getDepartments: async (schoolId, params = {}) => {
        const res = await api.get(`/school/${schoolId}/departments/`, { params });
        return res.data !== undefined ? res.data : res;
    },

    createDepartment: async (schoolId, data) => {
        const res = await api.post(`/school/${schoolId}/departments/create/`, data);
        return res.data !== undefined ? res.data : res;
    },

    updateDepartment: async (schoolId, deptId, data) => {
        const res = await api.patch(`/school/${schoolId}/departments/${deptId}/`, data);
        return res.data !== undefined ? res.data : res;
    },

    deactivateDepartment: async (schoolId, deptId) => {
        const res = await api.post(`/school/${schoolId}/departments/${deptId}/deactivate/`);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Profile / Settings
    // Backend: PATCH /api/profile/update/
    // ============================================
    getProfile: async () => {
        const res = await api.get('/profile/update/');
        return res.data !== undefined ? res.data : res;
    },

    updateProfile: async (data) => {
        const res = await api.patch('/profile/update/', data);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Academic Year Management
    // ============================================
    getAcademicYears: async (params = {}) => {
        const res = await api.get('/academic-years/', { params });
        return res.data !== undefined ? res.data : res;
    },

    createAcademicYear: async (data) => {
        const res = await api.post('/academic-years/create/', data);
        return res.data !== undefined ? res.data : res;
    },

    getAcademicYearDetail: async (id) => {
        const res = await api.get(`/academic-years/${id}/`);
        return res.data !== undefined ? res.data : res;
    },

    updateAcademicYear: async (id, data) => {
        const res = await api.put(`/academic-years/${id}/update/`, data);
        return res.data !== undefined ? res.data : res;
    },

    deactivateAcademicYear: async (id) => {
        const res = await api.post(`/academic-years/${id}/deactivate/`);
        return res.data !== undefined ? res.data : res;
    },

    activateAcademicYear: async (id) => {
        const res = await api.post(`/academic-years/${id}/activate/`);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Student Management
    // ============================================
    getStudents: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters).toString();
        const res = await api.get(`/manager/students/${queryParams ? `?${queryParams}` : ''}`);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Communication
    // ============================================
    getMessages: async (params = {}) => {
        const res = await api.get('/user-messages/', { params });
        return res.data !== undefined ? res.data : res;
    },

    sendMessage: async (data) => {
        const res = await api.post('/user-messages/', data);
        return res.data !== undefined ? res.data : res;
    },

    getNotifications: async (params = {}) => {
        const res = await api.get('/notifications/', { params });
        return res.data !== undefined ? res.data : res;
    },

    markNotificationRead: async (id) => {
        const res = await api.post(`/notifications/${id}/mark-read/`);
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Activity Logs
    // ============================================
    getActivityLogs: async () => {
        const res = await api.get('/activity-logs/');
        return res.data !== undefined ? res.data : res;
    },

    // ============================================
    // Staff Evaluations
    // ============================================
    getStaffEvaluations: async (params = {}) => {
        const res = await api.get('/manager/staff-evaluations/', { params });
        return res.data !== undefined ? res.data : res;
    },

    createStaffEvaluation: async (data) => {
        const res = await api.post('/manager/staff-evaluations/create/', data);
        return res.data !== undefined ? res.data : res;
    },
};

export default managerService;
