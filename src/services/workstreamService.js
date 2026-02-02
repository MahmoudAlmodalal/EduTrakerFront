import { api } from '../utils/api';

const workstreamService = {
    // Workstream Management (SuperAdmin)
    getWorkstreams: (params) => api.get('/workstream/', { params }),
    createWorkstream: (data) => api.post('/workstream/', data),
    updateWorkstream: (id, data) => api.patch(`/workstreams/${id}/update/`, data),
    deactivateWorkstream: (id) => api.post(`/workstreams/${id}/deactivate/`),
    getManagers: () => api.get('/users/?role=manager_workstream'),

    // Workstream Manager Pages
    getDashboardStatistics: () => api.get('/reports/statistics/dashboard/'),

    // Communication
    getMessages: (params) => api.get('/user-messages/', { params }),
    getNotifications: (params) => api.get('/notifications/', { params }),
    sendMessage: (data) => api.post('/user-messages/', data),
    markMessageRead: (id) => api.post(`/user-messages/${id}/read/`),
    markNotificationRead: (id) => api.post(`/notifications/${id}/mark-read/`),

    // User Settings
    getUserProfile: (id) => api.get(`/users/${id}/`),
    updateUserProfile: (id, data) => api.patch(`/users/${id}/`, data),
};

export default workstreamService;
