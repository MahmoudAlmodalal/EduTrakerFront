import { api } from '../utils/api';

const workstreamService = {
    // Workstream Management (SuperAdmin)
    getWorkstreams: (params) => api.get('/workstream/', { params }),
    createWorkstream: (data) => api.post('/workstream/', data),
    updateWorkstream: (id, data) => api.patch(`/workstreams/${id}/update/`, data),
    deactivateWorkstream: (id) => api.post(`/workstreams/${id}/deactivate/`),
    getManagers: (params = {}) => api.get('/users/?role=manager_workstream', { params }),

    // Workstream Manager Pages (statistics & trends)
    // Backend: see EduTraker/reports/urls.py -> 'statistics/dashboard/'
    getDashboardStatistics: () => api.get('/statistics/dashboard/'),

    /**
     * Enrollment trends for the dashboard.
     *
     * We reuse the comprehensive statistics endpoint (which already powers other
     * analytics) and adapt its `activity_chart` payload into the
     * `{ month, enrollment, graduates }` shape expected by the chart.
     */
    getEnrollmentTrends: async (period = '6months') => {
        const res = await api.get('/statistics/comprehensive/', {
            params: { period },
        });

        const activity = Array.isArray(res?.activity_chart) ? res.activity_chart : [];

        // Map generic activity points into a simple enrollment series
        const trends = activity.map((item) => ({
            month: item.label || item.month || item.date || 'N/A',
            enrollment: item.count || item.enrollment || 0,
            // We may not yet have graduates in backend activity; keep it defensive.
            graduates: item.graduates || 0,
        }));

        return trends;
    },

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
