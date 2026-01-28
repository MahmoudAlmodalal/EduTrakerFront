import { api } from '../utils/api';

/**
 * Service for handling reporting and statistics API calls
 */
const reportService = {
    /**
     * Get quick dashboard statistics based on user role
     */
    getDashboardStats: async () => {
        return api.get('/statistics/dashboard/');
    },

    /**
     * Get detailed comprehensive statistics for analytics
     */
    getComprehensiveStats: async () => {
        return api.get('/statistics/comprehensive/');
    },

    /**
     * Export reports (PDF/CSV)
     * @param {string} format - 'pdf' or 'csv'
     * @param {Object} filters - Optional filters
     */
    exportReport: async (format = 'pdf', filters = {}) => {
        const queryParams = new URLSearchParams({
            format,
            ...filters
        }).toString();

        // Use window.open or a direct link for downloads if it's a simple GET
        // Or fetch as blob if it needs to be authenticated via headers
        try {
            const response = await api.get(`/export/?${queryParams}`, {
                responseType: 'blob'
            });

            // Handle blob download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report-${new Date().toISOString()}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export report:', error);
            throw error;
        }
    }
};

export default reportService;
