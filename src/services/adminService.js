import { api } from '../utils/api';

/**
 * Service for Super Admin specialized administrative actions
 */
const adminService = {
    // Student Management
    getStudents: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/manager/students/?${queryParams}`);
    },

    // Teacher Management
    getTeachers: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return api.get(`/teacher/teachers/?${queryParams}`);
    },

    // School & Academic Management
    getSchools: async () => {
        return api.get('/school/');
    },

    getAcademicYears: async () => {
        return api.get('/school/academic-years/');
    },

    // System Stats (if different from dashboard)
    getSystemOverview: async () => {
        return api.get('/statistics/comprehensive/');
    }
};

export default adminService;
