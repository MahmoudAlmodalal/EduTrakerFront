import { api } from '../utils/api';

const NOTIFICATION_REDIRECT_MAP = {
    announcement: (notification) => {
        const subjectId = notification?.related_object_id;
        return subjectId
            ? `/student/subjects/${subjectId}?tab=content`
            : '/student/subjects';
    },
    material_published: (notification) => {
        const materialId = notification?.related_object_id;
        return materialId
            ? `/student/subjects?tab=content&material=${materialId}`
            : '/student/subjects';
    },
    grade_posted: () => '/student/results',
    assignment_due: (notification) => {
        const assignmentId = notification?.related_object_id;
        return assignmentId
            ? `/student/subjects?tab=assignments&assignment=${assignmentId}`
            : '/student/subjects?tab=assignments';
    },
    default: () => '/student/dashboard'
};

const resolveNotificationRedirect = (notification = {}) => {
    const actionUrl = typeof notification?.action_url === 'string'
        ? notification.action_url.trim()
        : '';
    if (actionUrl.startsWith('/')) {
        return actionUrl;
    }

    const resolver = NOTIFICATION_REDIRECT_MAP[notification?.notification_type]
        || NOTIFICATION_REDIRECT_MAP.default;
    return resolver(notification);
};

const sanitizeParams = (params = {}) => Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const toLegacyNotificationParams = (params = {}) => {
    const allowedKeys = new Set(['is_read', 'notification_type']);
    return Object.fromEntries(
        Object.entries(params).filter(([key]) => allowedKeys.has(key))
    );
};

const notificationService = {
    /**
     * Fetch all notifications for the current user
     * @param {Object} params - Filter params (is_read, notification_type, page)
     * @returns {Promise<Object>} Paginated notifications
     */
    getNotifications: async (params = {}) => {
        const normalizedParams = sanitizeParams(params);

        try {
            return await api.get('/notifications/', { params: normalizedParams });
        } catch (error) {
            const status = error?.status || error?.response?.status;
            const hasNonLegacyParams = Object.keys(normalizedParams).some(
                (key) => !['is_read', 'notification_type'].includes(key)
            );

            // Backward compatibility: older backend validation rejected paginator params.
            if (status === 400 && hasNonLegacyParams) {
                return api.get('/notifications/', {
                    params: toLegacyNotificationParams(normalizedParams)
                });
            }

            throw error;
        }
    },

    /**
     * Get unread notifications count
     * @returns {Promise<Object>} { unread_count: number }
     */
    getUnreadCount: async () => {
        return await api.get('/notifications/unread-count/');
    },

    /**
     * Mark a single notification as read
     * @param {number} id - Notification ID
     * @returns {Promise<Object>} Updated notification
     */
    markAsRead: async (id) => {
        return await api.post(`/notifications/${id}/mark-read/`);
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<Object>} { message: string, count: number }
     */
    markAllAsRead: async () => {
        return await api.post('/notifications/mark-all-read/');
    },

    /**
     * Get notification details
     * @param {number} id - Notification ID
     * @returns {Promise<Object>} Notification detail
     */
    getNotificationDetail: async (id) => {
        return await api.get(`/notifications/${id}/`);
    }
};

export { NOTIFICATION_REDIRECT_MAP, resolveNotificationRedirect };
export default notificationService;
