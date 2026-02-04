import { api } from '../utils/api';

const notificationService = {
    /**
     * Fetch all notifications for the current user
     * @param {Object} params - Filter params (is_read, notification_type, page)
     * @returns {Promise<Object>} Paginated notifications
     */
    getNotifications: async (params = {}) => {
        return await api.get('/notifications/', { params });
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

export default notificationService;
