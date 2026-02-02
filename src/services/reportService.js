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
     * @param {string} reportType - Type of report to export (e.g., 'student_performance', 'attendance', 'generic')
     * @param {Object} data - Optional data for generic reports
     */
    exportReport: async (format = 'pdf', reportType = 'generic', data = null) => {
        try {
            // Prepare the request body according to backend expectations
            const requestBody = {
                report_type: reportType,
                export_format: format
            };

            // Add data if provided (for generic reports)
            if (data) {
                requestBody.data = data;
            }

            // Make POST request with responseType blob to handle binary data
            const response = await api.post('/export/', requestBody, {
                responseType: 'blob'
            });

            // Handle blob download
            const blob = new Blob([response], {
                type: format === 'pdf' ? 'application/pdf' : 'text/csv'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const extension = format === 'pdf' ? 'pdf' : 'csv';
            link.setAttribute('download', `${reportType}_report_${timestamp}.${extension}`);

            document.body.appendChild(link);
            link.click();
            link.remove();

            // Clean up the URL object
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export report:', error);
            throw error;
        }
    }
};

export default reportService;
